#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DEPLOYMENT_TYPE="${1:-staging}"
REGISTRY="${REGISTRY:-ghcr.io}"
RAW_IMAGE_NAME="${IMAGE_NAME:-$GITHUB_REPOSITORY}"
IMAGE_NAME="$(echo "${RAW_IMAGE_NAME}" | tr '[:upper:]' '[:lower:]')"
PROJECT_DIR="/opt/scenehive"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/opt/scenehive_backups"
DEPLOY_ENV_FILE=".deploy.env"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://localhost:8081/actuator/health/liveness}"
HEALTHCHECK_INITIAL_DELAY_SECONDS="${HEALTHCHECK_INITIAL_DELAY_SECONDS:-0}"
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-60}"
HEALTHCHECK_SLEEP_SECONDS="${HEALTHCHECK_SLEEP_SECONDS:-3}"
HEALTHCHECK_CURL_TIMEOUT_SECONDS="${HEALTHCHECK_CURL_TIMEOUT_SECONDS:-2}"
HEALTHCHECK_LOG_EVERY_ATTEMPTS="${HEALTHCHECK_LOG_EVERY_ATTEMPTS:-5}"
FRONTEND_WARMUP_ENABLED="${FRONTEND_WARMUP_ENABLED:-true}"
FRONTEND_WARMUP_URLS="${FRONTEND_WARMUP_URLS:-http://localhost:3000/home}"
FRONTEND_WARMUP_ATTEMPTS="${FRONTEND_WARMUP_ATTEMPTS:-5}"
FRONTEND_WARMUP_SLEEP_SECONDS="${FRONTEND_WARMUP_SLEEP_SECONDS:-2}"
FRONTEND_WARMUP_TIMEOUT_SECONDS="${FRONTEND_WARMUP_TIMEOUT_SECONDS:-8}"
STATEFUL_SERVICES="${STATEFUL_SERVICES:-db redis}"
APP_SERVICES="${APP_SERVICES:-backend frontend}"
SSH_CONNECT_TIMEOUT_SECONDS="${SSH_CONNECT_TIMEOUT_SECONDS:-20}"
SSH_RETRY_ATTEMPTS="${SSH_RETRY_ATTEMPTS:-3}"
SSH_RETRY_SLEEP_SECONDS="${SSH_RETRY_SLEEP_SECONDS:-5}"

# Full image paths
BACKEND_IMAGE="${REGISTRY}/${IMAGE_NAME}-backend"
FRONTEND_IMAGE="${REGISTRY}/${IMAGE_NAME}-frontend"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

normalize_app_services() {
    local normalized=""

    for service in ${APP_SERVICES}; do
        case "${service}" in
            backend|frontend)
                if [ -n "${normalized}" ]; then
                    normalized="${normalized} ${service}"
                else
                    normalized="${service}"
                fi
                ;;
            *)
                log_error "Unsupported APP_SERVICES entry: ${service}"
                exit 1
                ;;
        esac
    done

    if [ -z "${normalized}" ]; then
        log_error "APP_SERVICES must include at least one service: backend or frontend"
        exit 1
    fi

    APP_SERVICES="${normalized}"
}

service_selected() {
    local target="$1"
    case " ${APP_SERVICES} " in
        *" ${target} "*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Check required environment variables
check_env() {
    if [ -z "$HOST" ] || [ -z "$USER" ]; then
        log_error "HOST and USER environment variables are required"
        exit 1
    fi
}

retry_transport() {
    local label="$1"
    local attempt=1
    local exit_code=0

    shift

    while true; do
        if "$@"; then
            return 0
        fi

        exit_code=$?

        if [ "${exit_code}" -ne 255 ] || [ "${attempt}" -ge "${SSH_RETRY_ATTEMPTS}" ]; then
            return "${exit_code}"
        fi

        log_warn "${label} connection failed (attempt ${attempt}/${SSH_RETRY_ATTEMPTS}, exit ${exit_code}). Retrying in ${SSH_RETRY_SLEEP_SECONDS}s..."
        sleep "${SSH_RETRY_SLEEP_SECONDS}"
        attempt=$((attempt + 1))
    done
}

# SSH command helper
ssh_cmd() {
    retry_transport "SSH" ssh \
        -o StrictHostKeyChecking=no \
        -o ConnectTimeout="${SSH_CONNECT_TIMEOUT_SECONDS}" \
        -o ConnectionAttempts=1 \
        -o ServerAliveInterval=15 \
        -o ServerAliveCountMax=2 \
        -p "${PORT:-22}" \
        "${USER}@${HOST}" "$@"
}

# Copy files to server
scp_copy() {
    retry_transport "SCP" scp \
        -o StrictHostKeyChecking=no \
        -o ConnectTimeout="${SSH_CONNECT_TIMEOUT_SECONDS}" \
        -o ConnectionAttempts=1 \
        -P "${PORT:-22}" \
        "$@"
}

ensure_project_dir() {
    ssh_cmd "sudo mkdir -p ${PROJECT_DIR} ${BACKUP_DIR} && sudo chown ${USER}:${USER} ${PROJECT_DIR} ${BACKUP_DIR}"
}

write_remote_file() {
    local content="$1"
    local destination="$2"
    local tmp_file
    tmp_file=$(mktemp)
    printf '%s' "$content" > "$tmp_file"
    scp_copy "$tmp_file" "${USER}@${HOST}:${destination}"
    rm -f "$tmp_file"
}

write_runtime_env() {
    local new_backend_tag="$1"
    local new_frontend_tag="$2"
    local backend_tag
    local frontend_tag

    if service_selected backend; then
        backend_tag="${new_backend_tag}"
    else
        backend_tag="$(read_existing_service_tag BACKEND_IMAGE_TAG scenehive-backend "${BACKEND_IMAGE}" "${new_backend_tag}")"
    fi

    if service_selected frontend; then
        frontend_tag="${new_frontend_tag}"
    else
        frontend_tag="$(read_existing_service_tag FRONTEND_IMAGE_TAG scenehive-frontend "${FRONTEND_IMAGE}" "${new_frontend_tag}")"
    fi

    cat <<EOF | ssh_cmd "cat > ${PROJECT_DIR}/${DEPLOY_ENV_FILE}"
IMAGE_NAME=${IMAGE_NAME}
BACKEND_IMAGE_TAG=${backend_tag}
FRONTEND_IMAGE_TAG=${frontend_tag}
EOF
}

read_runtime_tag() {
    local key="$1"
    local fallback="$2"
    local value

    value="$(ssh_cmd "cd ${PROJECT_DIR} && if [ -f ${DEPLOY_ENV_FILE} ]; then sed -n 's/^${key}=//p' ${DEPLOY_ENV_FILE} | tail -1; fi" || true)"

    if [ -n "${value}" ]; then
        printf '%s' "${value}"
        return
    fi

    printf '%s' "${fallback}"
}

read_running_image_tag() {
    local container="$1"
    local image="$2"
    local fallback="$3"
    local image_ref

    image_ref="$(ssh_cmd "docker inspect -f '{{.Config.Image}}' ${container} 2>/dev/null || true" || true)"

    case "${image_ref}" in
        "${image}:"*)
            printf '%s' "${image_ref#"${image}:"}"
            return
            ;;
    esac

    printf '%s' "${fallback}"
}

read_existing_service_tag() {
    local key="$1"
    local container="$2"
    local image="$3"
    local fallback="$4"
    local value

    value="$(read_runtime_tag "${key}" "")"
    if [ -n "${value}" ]; then
        printf '%s' "${value}"
        return
    fi

    read_running_image_tag "${container}" "${image}" "${fallback}"
}

write_app_env() {
    if [ -n "${ENV_FILE_CONTENT:-}" ]; then
        log_info "Uploading runtime .env from GitHub secret..."
        write_remote_file "${ENV_FILE_CONTENT}" "${PROJECT_DIR}/.env"
        return
    fi

    if ssh_cmd "[ -f ${PROJECT_DIR}/.env ]"; then
        log_warn "No ENV_FILE_CONTENT provided. Reusing existing ${PROJECT_DIR}/.env"
        return
    fi

    log_error "No ENV_FILE_CONTENT provided and remote .env does not exist"
    exit 1
}

# Backup current deployment
backup_deployment() {
    log_info "Creating backup..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ssh_cmd "set -e
mkdir -p '${BACKUP_DIR}/${TIMESTAMP}'
if [ -f '${PROJECT_DIR}/docker-compose.yml' ]; then cp '${PROJECT_DIR}/docker-compose.yml' '${BACKUP_DIR}/${TIMESTAMP}/docker-compose.yml'; fi
if [ -f '${PROJECT_DIR}/.env' ]; then cp '${PROJECT_DIR}/.env' '${BACKUP_DIR}/${TIMESTAMP}/.env'; fi
if [ -f '${PROJECT_DIR}/${DEPLOY_ENV_FILE}' ]; then cp '${PROJECT_DIR}/${DEPLOY_ENV_FILE}' '${BACKUP_DIR}/${TIMESTAMP}/${DEPLOY_ENV_FILE}'; fi"
    log_info "Backup created: ${BACKUP_DIR}/${TIMESTAMP}"
}

# Login to GHCR
ghcr_login() {
    if [ -z "${REGISTRY_USERNAME:-}" ] || [ -z "${REGISTRY_PASSWORD:-}" ]; then
        log_warn "Skipping registry login. Assuming public images in ${REGISTRY}"
        return
    fi

    log_info "Logging into GHCR..."
    local password_file="/tmp/scenehive_registry_password"
    write_remote_file "${REGISTRY_PASSWORD}" "${password_file}"
    ssh_cmd "cat ${password_file} | docker login ${REGISTRY} -u '${REGISTRY_USERNAME}' --password-stdin && rm -f ${password_file}"
}

compose_cmd() {
    local command="$1"
    ssh_cmd "cd ${PROJECT_DIR} && docker compose --env-file .env --env-file ${DEPLOY_ENV_FILE} ${command}"
}

ensure_stateful_services() {
    if ! service_selected backend; then
        log_info "Skipping stateful service check because backend is not being deployed."
        return
    fi

    log_info "Ensuring stateful services are running: ${STATEFUL_SERVICES}"
    compose_cmd "up -d ${STATEFUL_SERVICES}"
}

recreate_app_services() {
    log_info "Recreating application services: ${APP_SERVICES}"
    compose_cmd "up -d --no-deps --force-recreate ${APP_SERVICES}"
}

pull_app_services() {
    log_info "Pulling application images: ${APP_SERVICES}"
    compose_cmd "pull ${APP_SERVICES}"
}

wait_for_health() {
    local attempt=1
    local log_every="${HEALTHCHECK_LOG_EVERY_ATTEMPTS}"

    if [ "$log_every" -lt 1 ]; then
        log_every=1
    fi

    log_info "Waiting for backend health: ${HEALTHCHECK_URL}"
    if [ "$HEALTHCHECK_INITIAL_DELAY_SECONDS" -gt 0 ]; then
        log_info "Giving services ${HEALTHCHECK_INITIAL_DELAY_SECONDS}s warm-up time before health checks..."
        sleep "${HEALTHCHECK_INITIAL_DELAY_SECONDS}"
    fi

    while [ "$attempt" -le "$HEALTHCHECK_ATTEMPTS" ]; do
        if ssh_cmd "curl -sf --max-time ${HEALTHCHECK_CURL_TIMEOUT_SECONDS} ${HEALTHCHECK_URL}" >/dev/null 2>&1; then
            log_info "Health check passed on attempt ${attempt}/${HEALTHCHECK_ATTEMPTS}"
            return 0
        fi

        if [ "$attempt" -eq 1 ] || [ $((attempt % log_every)) -eq 0 ] || [ "$attempt" -eq "$HEALTHCHECK_ATTEMPTS" ]; then
            log_info "Health check not ready (${attempt}/${HEALTHCHECK_ATTEMPTS}). Retrying every ${HEALTHCHECK_SLEEP_SECONDS}s..."
        fi

        sleep "${HEALTHCHECK_SLEEP_SECONDS}"
        attempt=$((attempt + 1))
    done

    log_error "Health check failed after ${HEALTHCHECK_ATTEMPTS} attempts"
    log_info "Recent backend logs:"
    ssh_cmd "cd ${PROJECT_DIR} && docker compose --env-file .env --env-file ${DEPLOY_ENV_FILE} logs --tail=200 backend" || true
    return 1
}

warmup_frontend() {
    if ! service_selected frontend; then
        log_info "Skipping frontend warm-up because frontend is not being deployed."
        return
    fi

    if [ "${FRONTEND_WARMUP_ENABLED}" != "true" ]; then
        log_info "Frontend warm-up disabled."
        return
    fi

    log_info "Starting frontend warm-up in background: ${FRONTEND_WARMUP_URLS}"
    ssh_cmd "nohup sh -c 'for url in ${FRONTEND_WARMUP_URLS}; do attempt=1; while [ \"\$attempt\" -le ${FRONTEND_WARMUP_ATTEMPTS} ]; do if curl -fsS --max-time ${FRONTEND_WARMUP_TIMEOUT_SECONDS} \"\$url\" >/dev/null 2>&1; then echo \"[INFO] warmed \$url on attempt \$attempt\"; break; fi; attempt=\$((attempt + 1)); sleep ${FRONTEND_WARMUP_SLEEP_SECONDS}; done; done' >/tmp/scenehive_frontend_warmup.log 2>&1 &"
}

# Deploy staging
deploy_staging() {
    local SHA="${SHA:-staging}"

    log_info "Deploying STAGING (${SHA})..."

    ensure_project_dir

    # Backup before deploy (enables rollback on failure)
    backup_deployment

    # Copy docker-compose.prod.yml
    scp_copy docker-compose.prod.yml "${USER}@${HOST}:${PROJECT_DIR}/docker-compose.yml"

    # Create or update env files
    write_app_env
    write_runtime_env "${SHA}" "${SHA}"

    # Login to GHCR
    ghcr_login

    # Pull images
    pull_app_services

    # Keep stateful services warm and recreate only application containers.
    ensure_stateful_services
    recreate_app_services

    # Health check
    if ! service_selected backend; then
        log_info "Skipping backend health check because backend is not being deployed."
        warmup_frontend
        log_info "✅ Staging deployment completed successfully!"
    elif wait_for_health; then
        warmup_frontend
        log_info "✅ Staging deployment completed successfully!"
    else
        log_error "Health check failed! Rolling back..."
        rollback
        exit 1
    fi
}

# Deploy production
deploy_production() {
    local TAG="${TAG:-latest}"
    
    log_info "Deploying PRODUCTION (${TAG})..."
    
    # Create backup first
    backup_deployment
    
    ensure_project_dir
    
    # Copy docker-compose.prod.yml
    scp_copy docker-compose.prod.yml "${USER}@${HOST}:${PROJECT_DIR}/docker-compose.yml"
    
    # Create or update env files
    write_app_env
    write_runtime_env "${TAG}" "${TAG}"
    
    # Login to GHCR
    ghcr_login
    
    # Pull images with specific tag
    pull_app_services
    
    # Keep stateful services warm and recreate only application containers.
    ensure_stateful_services
    recreate_app_services
    
    # Health check
    if ! service_selected backend; then
        log_info "Skipping backend health check because backend is not being deployed."
        warmup_frontend
        log_info "✅ Production deployment completed successfully!"
    elif wait_for_health; then
        warmup_frontend
        log_info "✅ Production deployment completed successfully!"
    else
        log_error "Health check failed! Rolling back..."
        rollback
        exit 1
    fi
}

# Rollback to previous version
rollback() {
    log_warn "Rolling back to previous backup..."
    
    # Find latest backup
    local LATEST_BACKUP
    LATEST_BACKUP=$(ssh_cmd "ls -1dt ${BACKUP_DIR}/* 2>/dev/null | head -1")
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found!"
        exit 1
    fi
    
    # Restore backup
    ssh_cmd "[ -f ${LATEST_BACKUP}/docker-compose.yml ] && cp ${LATEST_BACKUP}/docker-compose.yml ${PROJECT_DIR}/docker-compose.yml || true"
    ssh_cmd "[ -f ${LATEST_BACKUP}/.env ] && cp ${LATEST_BACKUP}/.env ${PROJECT_DIR}/.env || true"
    ssh_cmd "[ -f ${LATEST_BACKUP}/${DEPLOY_ENV_FILE} ] && cp ${LATEST_BACKUP}/${DEPLOY_ENV_FILE} ${PROJECT_DIR}/${DEPLOY_ENV_FILE} || true"
    
    # Keep DB/Redis warm during rollback and recreate only application containers.
    ensure_stateful_services
    recreate_app_services
    
    log_info "✅ Rollback completed!"
}

# Main execution
main() {
    log_info "Starting deployment: ${DEPLOYMENT_TYPE}"
    
    check_env
    normalize_app_services
    log_info "Deployment application services: ${APP_SERVICES}"
    
    case $DEPLOYMENT_TYPE in
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
        rollback)
            rollback
            ;;
        *)
            log_error "Unknown deployment type: ${DEPLOYMENT_TYPE}"
            echo "Usage: $0 {staging|production|rollback}"
            exit 1
            ;;
    esac
}

main
