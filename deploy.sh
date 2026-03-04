#!/bin/bash

set -e

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

# Backup current deployment
backup_deployment() {
    log_info "Creating backup..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ssh_cmd "mkdir -p ${BACKUP_DIR}"
    ssh_cmd "cp -r ${PROJECT_DIR}/docker-compose.yml ${BACKUP_DIR}/docker-compose.yml.\${TIMESTAMP}"
    ssh_cmd "cp -r ${PROJECT_DIR}/.env ${BACKUP_DIR}/.env.\${TIMESTAMP}" || true
    log_info "Backup created: ${BACKUP_DIR}/docker-compose.yml.${TIMESTAMP}"
}

# Login to GHCR
ghcr_login() {
    log_info "Logging into GHCR..."
    # Use GITHUB_TOKEN for GHCR login
    echo "$GITHUB_TOKEN" | ssh_cmd "echo \$GITHUB_TOKEN | docker login ${REGISTRY} -u github --password-stdin"
}

# Deploy staging
deploy_staging() {
    local SHA="${SHA:-staging}"
    
    log_info "Deploying STAGING (${SHA})..."
    
    # Create project directory if not exists
    ssh_cmd "mkdir -p ${PROJECT_DIR}"
    
    # Copy docker-compose.prod.yml
    scp_copy docker-compose.prod.yml "${USER}@${HOST}:${PROJECT_DIR}/docker-compose.yml"
    
    # Create or update .env file
    scp_copy .env.staging.example "${USER}@${HOST}:${PROJECT_DIR}/.env"
    
    # Login to GHCR
    ghcr_login
    
    # Pull and retag images
    log_info "Pulling and retagging images..."
    ssh_cmd "docker pull ${BACKEND_IMAGE}:${SHA}"
    ssh_cmd "docker tag ${BACKEND_IMAGE}:${SHA} ${BACKEND_IMAGE}:latest"
    ssh_cmd "docker pull ${FRONTEND_IMAGE}:${SHA}"
    ssh_cmd "docker tag ${FRONTEND_IMAGE}:${SHA} ${FRONTEND_IMAGE}:latest"
    
    # Update compose file with correct image tags
    ssh_cmd "cd ${PROJECT_DIR} && \
        sed -i 's|image: ghcr.io/.*scenehive-backend:|image: ${BACKEND_IMAGE}:latest|' docker-compose.yml && \
        sed -i 's|image: ghcr.io/.*scenehive-frontend:|image: ${FRONTEND_IMAGE}:latest|' docker-compose.yml"
    
    # Stop old containers
    log_info "Stopping old containers..."
    ssh_cmd "cd ${PROJECT_DIR} && docker compose down" || true
    
    # Start services
    log_info "Starting services..."
    ssh_cmd "cd ${PROJECT_DIR} && docker compose up -d"
    
    # Wait for health check
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    if ssh_cmd "curl -sf http://localhost:8081/actuator/health"; then
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
    
    # Create project directory if not exists
    ssh_cmd "mkdir -p ${PROJECT_DIR}"
    
    # Copy docker-compose.prod.yml
    scp_copy docker-compose.prod.yml "${USER}@${HOST}:${PROJECT_DIR}/docker-compose.yml"
    
    # Create or update .env file
    scp_copy .env.production.example "${USER}@${HOST}:${PROJECT_DIR}/.env"
    
    # Login to GHCR
    ghcr_login
    
    # Pull images with specific tag
    log_info "Pulling images..."
    ssh_cmd "docker pull ${BACKEND_IMAGE}:${TAG}"
    ssh_cmd "docker pull ${FRONTEND_IMAGE}:${TAG}"
    
    # Update compose file with correct image tags
    ssh_cmd "cd ${PROJECT_DIR} && \
        sed -i 's|image: ghcr.io/.*scenehive-backend:|image: ${BACKEND_IMAGE}:${TAG}|' docker-compose.yml && \
        sed -i 's|image: ghcr.io/.*scenehive-frontend:|image: ${FRONTEND_IMAGE}:${TAG}|' docker-compose.yml"
    
    # Stop old containers
    log_info "Stopping old containers..."
    ssh_cmd "cd ${PROJECT_DIR} && docker compose down"
    
    # Start services
    log_info "Starting services..."
    ssh_cmd "cd ${PROJECT_DIR} && docker compose up -d"
    
    # Wait for health check
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    if ssh_cmd "curl -sf http://localhost:8081/actuator/health"; then
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
    local LATEST_BACKUP=$(ssh_cmd "ls -t ${BACKUP_DIR}/docker-compose.yml.* 2>/dev/null | head -1")
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found!"
        exit 1
    fi
    
    # Restore backup
    ssh_cmd "cp ${LATEST_BACKUP} ${PROJECT_DIR}/docker-compose.yml"
    ssh_cmd "cp ${BACKUP_DIR}/.env.* \$(echo ${LATEST_BACKUP} | rev | cut -d'.' -f1 | rev) ${PROJECT_DIR}/.env" || true
    
    # Restart services
    ssh_cmd "cd ${PROJECT_DIR} && docker compose down && docker compose up -d"
    
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
