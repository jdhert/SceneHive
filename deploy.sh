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
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://localhost:8081/actuator/health}"
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-24}"
HEALTHCHECK_SLEEP_SECONDS="${HEALTHCHECK_SLEEP_SECONDS:-5}"

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

# Check required environment variables
check_env() {
    if [ -z "$HOST" ] || [ -z "$USER" ]; then
        log_error "HOST and USER environment variables are required"
        exit 1
    fi
}

# SSH command helper
ssh_cmd() {
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "${PORT:-22}" "${USER}@${HOST}" "$@"
}

# Copy files to server
scp_copy() {
    scp -o StrictHostKeyChecking=no -P "${PORT:-22}" "$@"
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
    local backend_tag="$1"
    local frontend_tag="$2"

    cat <<EOF | ssh_cmd "cat > ${PROJECT_DIR}/${DEPLOY_ENV_FILE}"
IMAGE_NAME=${IMAGE_NAME}
BACKEND_IMAGE_TAG=${backend_tag}
FRONTEND_IMAGE_TAG=${frontend_tag}
EOF
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
    ssh_cmd "mkdir -p ${BACKUP_DIR}/${TIMESTAMP}"
    ssh_cmd "[ -f ${PROJECT_DIR}/docker-compose.yml ] && cp ${PROJECT_DIR}/docker-compose.yml ${BACKUP_DIR}/${TIMESTAMP}/docker-compose.yml || true"
    ssh_cmd "[ -f ${PROJECT_DIR}/.env ] && cp ${PROJECT_DIR}/.env ${BACKUP_DIR}/${TIMESTAMP}/.env || true"
    ssh_cmd "[ -f ${PROJECT_DIR}/${DEPLOY_ENV_FILE} ] && cp ${PROJECT_DIR}/${DEPLOY_ENV_FILE} ${BACKUP_DIR}/${TIMESTAMP}/${DEPLOY_ENV_FILE} || true"
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

wait_for_health() {
    local attempt=1

    log_info "Waiting for services to become healthy..."
    while [ "$attempt" -le "$HEALTHCHECK_ATTEMPTS" ]; do
        if ssh_cmd "curl -sf ${HEALTHCHECK_URL}" >/dev/null 2>&1; then
            log_info "Health check passed on attempt ${attempt}/${HEALTHCHECK_ATTEMPTS}"
            return 0
        fi

        log_info "Health check attempt ${attempt}/${HEALTHCHECK_ATTEMPTS} failed. Retrying in ${HEALTHCHECK_SLEEP_SECONDS}s..."
        sleep "${HEALTHCHECK_SLEEP_SECONDS}"
        attempt=$((attempt + 1))
    done

    log_error "Health check failed after ${HEALTHCHECK_ATTEMPTS} attempts"
    log_info "Recent backend logs:"
    ssh_cmd "cd ${PROJECT_DIR} && docker compose --env-file .env --env-file ${DEPLOY_ENV_FILE} logs --tail=200 backend" || true
    return 1
}

# Deploy staging
deploy_staging() {
    local SHA="${SHA:-staging}"
    
    log_info "Deploying STAGING (${SHA})..."
    
    ensure_project_dir
    
    # Copy docker-compose.prod.yml
    scp_copy docker-compose.prod.yml "${USER}@${HOST}:${PROJECT_DIR}/docker-compose.yml"
    
    # Create or update env files
    write_app_env
    write_runtime_env "${SHA}" "${SHA}"
    
    # Login to GHCR
    ghcr_login
    
    # Pull images
    log_info "Pulling images..."
    compose_cmd "pull backend frontend"
    
    # Stop old containers
    log_info "Stopping old containers..."
    compose_cmd "down" || true
    
    # Start services
    log_info "Starting services..."
    compose_cmd "up -d"
    
    # Health check
    if wait_for_health; then
        log_info "✅ Staging deployment completed successfully!"
    else
        log_error "Health check failed!"
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
    log_info "Pulling images..."
    compose_cmd "pull backend frontend"
    
    # Stop old containers
    log_info "Stopping old containers..."
    compose_cmd "down"
    
    # Start services
    log_info "Starting services..."
    compose_cmd "up -d"
    
    # Health check
    if wait_for_health; then
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
    
    # Restart services
    compose_cmd "down"
    compose_cmd "up -d"
    
    log_info "✅ Rollback completed!"
}

# Main execution
main() {
    log_info "Starting deployment: ${DEPLOYMENT_TYPE}"
    
    check_env
    
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
