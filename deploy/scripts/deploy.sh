#!/usr/bin/env bash
# =============================================================================
# ZarinGold - Deployment Script
# Deploys the gold trading platform to Kubernetes using Helm or Kustomize
# =============================================================================
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NAMESPACE="${NAMESPACE:-zaringold}"
ENVIRONMENT="${ENVIRONMENT:-production}"
RELEASE_NAME="${RELEASE_NAME:-zaringold}"
CHART_PATH="$PROJECT_ROOT/deploy/helm/zaringold"
VALUES_FILE="${VALUES_FILE:-}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║     🥇  ZarinGold (زرین گلد) - Deployment Script             ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace:   $NAMESPACE"
    log_info "Release:     $RELEASE_NAME"
    echo ""
}

print_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy       Deploy or upgrade the application"
    echo "  install      Fresh install the application"
    echo "  uninstall    Remove the application"
    echo "  rollback     Rollback to previous release"
    echo "  status       Show deployment status"
    echo "  logs         Tail application logs"
    echo "  secrets      Generate/update secrets"
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT     Environment (production|staging) [default: production]"
    echo "  -n, --namespace NAMESPACE  Kubernetes namespace [default: zaringold]"
    echo "  -r, --release NAME         Helm release name [default: zaringold]"
    echo "  -f, --values FILE          Custom values file"
    echo "  --helm                     Use Helm (default)"
    echo "  --kustomize                Use Kustomize instead of Helm"
    echo "  --dry-run                  Show what would be deployed"
    echo "  --wait                     Wait for rollout to complete"
    echo "  --timeout SECONDS          Wait timeout in seconds [default: 300]"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy --env production --wait"
    echo "  $0 deploy --env staging --kustomize"
    echo "  $0 status --env production"
    echo "  $0 logs -f --tail 100"
    echo ""
}

# =============================================================================
# Prerequisite Checks
# =============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing=()

    # Check kubectl
    if ! command -v kubectl &>/dev/null; then
        missing+=("kubectl")
    else
        local k8s_version
        k8s_version=$(kubectl version --client --short 2>/dev/null || kubectl version --client 2>/dev/null)
        log_success "kubectl: $k8s_version"
    fi

    # Check helm
    if [[ "${USE_KUSTOMIZE:-false}" != "true" ]]; then
        if ! command -v helm &>/dev/null; then
            missing+=("helm")
        else
            local helm_version
            helm_version=$(helm version --short 2>/dev/null)
            log_success "helm: $helm_version"
        fi
    fi

    # Check kustomize (if using kustomize)
    if [[ "${USE_KUSTOMIZE:-false}" == "true" ]]; then
        if command -v kustomize &>/dev/null; then
            local kustomize_version
            kustomize_version=$(kustomize version --short 2>/dev/null)
            log_success "kustomize: $kustomize_version"
        elif kubectl kustomize version --short &>/dev/null; then
            log_success "kubectl kustomize: available"
        else
            missing+=("kustomize")
        fi
    fi

    # Check cluster access
    if command -v kubectl &>/dev/null; then
        if ! kubectl cluster-info &>/dev/null; then
            log_error "Cannot connect to Kubernetes cluster"
            exit 1
        fi
        log_success "Kubernetes cluster: accessible"
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing prerequisites: ${missing[*]}"
        log_error "Please install them before proceeding"
        exit 1
    fi

    echo ""
}

# =============================================================================
# Namespace Management
# =============================================================================

ensure_namespace() {
    log_info "Ensuring namespace '$NAMESPACE' exists..."

    if kubectl get namespace "$NAMESPACE" &>/dev/null; then
        log_success "Namespace '$NAMESPACE' already exists"
    else
        kubectl create namespace "$NAMESPACE"
        kubectl label namespace "$NAMESPACE" \
            app.kubernetes.io/name=zaringold \
            app.kubernetes.io/part-of=zaringold \
            app.kubernetes.io/environment="$ENVIRONMENT" \
            team=platform \
            --overwrite
        log_success "Namespace '$NAMESPACE' created"
    fi
}

# =============================================================================
# Secrets Management
# =============================================================================

create_secrets() {
    local secrets_file="$PROJECT_ROOT/deploy/kubernetes/overlays/$ENVIRONMENT/.env.secrets"

    if [[ -f "$secrets_file" ]]; then
        log_info "Applying secrets from $secrets_file"
        kubectl create secret generic zaringold-secrets \
            --namespace "$NAMESPACE" \
            --from-env-file="$secrets_file" \
            --dry-run=client -o yaml | kubectl apply -f -
        log_success "Secrets applied"
    else
        log_warn "No secrets file found at $secrets_file"
        log_warn "Please create .env.secrets with required environment variables"
    fi
}

# =============================================================================
# Helm Deployment
# =============================================================================

helm_deploy() {
    log_info "Deploying with Helm..."

    local helm_args=(
        upgrade
        --install
        "$RELEASE_NAME"
        "$CHART_PATH"
        --namespace "$NAMESPACE"
        --timeout "${WAIT_TIMEOUT}s"
    )

    # Add environment-specific values
    local env_values="$PROJECT_ROOT/deploy/helm/zaringold/values-${ENVIRONMENT}.yaml"
    if [[ -f "$env_values" ]]; then
        helm_args+=(-f "$env_values")
        log_info "Using values file: $env_values"
    fi

    # Add custom values file
    if [[ -n "$VALUES_FILE" && -f "$VALUES_FILE" ]]; then
        helm_args+=(-f "$VALUES_FILE")
        log_info "Using custom values file: $VALUES_FILE"
    fi

    # Set common values
    helm_args+=(
        --set global.namespaceOverride="$NAMESPACE"
        --set namespace="$NAMESPACE"
    )

    # Dry run
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        helm_args+=(--dry-run --debug)
        log_info "Performing dry run..."
    fi

    # Wait
    if [[ "${WAIT:-false}" == "true" ]]; then
        helm_args+=(--wait)
    fi

    log_info "Running: helm ${helm_args[*]}"
    echo ""

    if helm "${helm_args[@]}"; then
        log_success "Helm deployment completed successfully!"
        echo ""
    else
        log_error "Helm deployment failed!"
        exit 1
    fi
}

helm_install() {
    log_info "Fresh installing with Helm..."

    # Check if release already exists
    if helm status "$RELEASE_NAME" -n "$NAMESPACE" &>/dev/null; then
        log_warn "Release '$RELEASE_NAME' already exists in namespace '$NAMESPACE'"
        log_info "Use 'deploy' command to upgrade, or 'uninstall' first"
        exit 1
    fi

    DRY_RUN="${DRY_RUN:-false}" helm_deploy
}

helm_uninstall() {
    log_warn "Uninstalling ZarinGold (release: $RELEASE_NAME)..."

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE" --dry-run
    else
        if helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE"; then
            log_success "Release '$RELEASE_NAME' uninstalled successfully"
        else
            log_error "Failed to uninstall release '$RELEASE_NAME'"
            exit 1
        fi
    fi
}

helm_rollback() {
    log_info "Rolling back release '$RELEASE_NAME'..."

    local revision="${1:-1}"
    if helm rollback "$RELEASE_NAME" "$revision" --namespace "$NAMESPACE"; then
        log_success "Rolled back to revision $revision"
    else
        log_error "Rollback failed!"
        exit 1
    fi
}

# =============================================================================
# Kustomize Deployment
# =============================================================================

kustomize_deploy() {
    log_info "Deploying with Kustomize..."

    local kustomize_dir="$PROJECT_ROOT/deploy/kubernetes/overlays/$ENVIRONMENT"

    if [[ ! -d "$kustomize_dir" ]]; then
        log_error "Kustomize directory not found: $kustomize_dir"
        exit 1
    fi

    local kustomize_cmd="kubectl apply"
    local kustomize_args=(-k "$kustomize_dir" --namespace "$NAMESPACE")

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        kustomize_args+=(--dry-run=client)
        log_info "Performing dry run..."
    fi

    log_info "Applying kustomize overlays from: $kustomize_dir"
    echo ""

    if $kustomize_cmd "${kustomize_args[@]}"; then
        log_success "Kustomize deployment applied successfully!"
        echo ""
    else
        log_error "Kustomize deployment failed!"
        exit 1
    fi
}

# =============================================================================
# Status & Monitoring
# =============================================================================

show_status() {
    log_info "Deployment Status"
    echo ""

    echo "━━━ Pods ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl -n "$NAMESPACE" get pods \
        -l app.kubernetes.io/name=zaringold \
        -o wide 2>/dev/null || \
        kubectl -n "$NAMESPACE" get pods --no-headers
    echo ""

    echo "━━━ Services ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl -n "$NAMESPACE" get svc | grep -E "nextjs|chat|price"
    echo ""

    echo "━━━ HPA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl -n "$NAMESPACE" get hpa 2>/dev/null || log_warn "No HPA resources found"
    echo ""

    echo "━━━ Ingress ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl -n "$NAMESPACE" get ingress 2>/dev/null || log_warn "No Ingress resources found"
    echo ""

    echo "━━━ PDB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl -n "$NAMESPACE" get pdb 2>/dev/null || log_warn "No PDB resources found"
    echo ""

    # If using Helm, show release info
    if [[ "${USE_KUSTOMIZE:-false}" != "true" ]] && command -v helm &>/dev/null; then
        echo "━━━ Helm Release ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        helm status "$RELEASE_NAME" -n "$NAMESPACE" 2>/dev/null || log_warn "Helm release not found"
        echo ""
    fi
}

wait_for_rollout() {
    log_info "Waiting for deployments to roll out (timeout: ${WAIT_TIMEOUT}s)..."

    local deployments=("nextjs-app" "chat-service" "price-service")
    local all_ok=true

    for deploy in "${deployments[@]}"; do
        if kubectl -n "$NAMESPACE" rollout status deployment/"$deploy" --timeout="${WAIT_TIMEOUT}s"; then
            log_success "Deployment '$deploy' is ready"
        else
            log_error "Deployment '$deploy' rollout failed or timed out"
            all_ok=false
        fi
    done

    if [[ "$all_ok" == "true" ]]; then
        echo ""
        log_success "All deployments are ready! 🚀"
    else
        echo ""
        log_error "Some deployments are not ready. Check logs for details."
        exit 1
    fi
}

show_logs() {
    local deployment="${1:-nextjs-app}"
    local tail="${2:-100}"

    log_info "Tailing logs for $deployment (last $tail lines)..."
    kubectl -n "$NAMESPACE" logs -f "deployment/$deployment" --tail="$tail"
}

# =============================================================================
# Main
# =============================================================================

main() {
    local command="${1:-}"
    shift || true

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -e|--env)
                ENVIRONMENT="$2"; shift 2 ;;
            -n|--namespace)
                NAMESPACE="$2"; shift 2 ;;
            -r|--release)
                RELEASE_NAME="$2"; shift 2 ;;
            -f|--values)
                VALUES_FILE="$2"; shift 2 ;;
            --helm)
                USE_KUSTOMIZE="false"; shift ;;
            --kustomize)
                USE_KUSTOMIZE="true"; shift ;;
            --dry-run)
                DRY_RUN="true"; shift ;;
            --wait)
                WAIT="true"; shift ;;
            --timeout)
                WAIT_TIMEOUT="$2"; shift 2 ;;
            -h|--help)
                print_usage; exit 0 ;;
            *)
                log_error "Unknown option: $1"
                print_usage; exit 1 ;;
        esac
    done

    # Adjust namespace for staging
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        NAMESPACE="${NAMESPACE:-zaringold-staging}"
    fi

    case "$command" in
        deploy)
            print_banner
            check_prerequisites
            ensure_namespace
            create_secrets
            if [[ "${USE_KUSTOMIZE:-false}" == "true" ]]; then
                kustomize_deploy
            else
                helm_deploy
            fi
            if [[ "${WAIT:-false}" == "true" ]]; then
                wait_for_rollout
            fi
            show_status
            ;;
        install)
            print_banner
            check_prerequisites
            ensure_namespace
            create_secrets
            helm_install
            if [[ "${WAIT:-false}" == "true" ]]; then
                wait_for_rollout
            fi
            ;;
        uninstall)
            print_banner
            check_prerequisites
            helm_uninstall
            ;;
        rollback)
            print_banner
            check_prerequisites
            helm_rollback "${1:-1}"
            ;;
        status)
            print_banner
            check_prerequisites
            show_status
            ;;
        logs)
            check_prerequisites
            show_logs "${1:-nextjs-app}" "${2:-100}"
            ;;
        secrets)
            print_banner
            check_prerequisites
            ensure_namespace
            create_secrets
            ;;
        *)
            print_usage
            exit 1
            ;;
    esac
}

main "$@"
