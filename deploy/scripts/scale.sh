#!/bin/bash
# Zaringold Scale Script
# Usage: ./scale.sh [deployment] [replicas]
# Examples:
#   ./scale.sh zaringold 20
#   ./scale.sh chat-service 10
#   ./scale.sh --status

set -euo pipefail

NAMESPACE="zaringold"

show_status() {
    echo "================================================"
    echo "  Zaringold Scaling Status"
    echo "================================================"
    echo ""
    
    echo "📊 Current Replica Counts:"
    echo "---"
    kubectl get deployments -n "$NAMESPACE" -o wide --no-headers 2>/dev/null | \
        awk '{printf "  %-30s Ready: %-5s Current: %-5s Available: %-5s\n", $1, $2, $3, $5}'
    
    echo ""
    echo "📈 HPA Status:"
    echo "---"
    kubectl get hpa -n "$NAMESPACE" -o wide 2>/dev/null || echo "  No HPA configured"
    
    echo ""
    echo "📏 Resource Limits:"
    echo "---"
    kubectl get deployments -n "$NAMESPACE" -o json 2>/dev/null | \
        jq -r '.items[] | "\(.metadata.name):\n  CPU Request: \(.spec.template.spec.containers[0].resources.requests.cpu // "none")\n  CPU Limit: \(.spec.template.spec.containers[0].resources.limits.cpu // "none")\n  Mem Request: \(.spec.template.spec.containers[0].resources.requests.memory // "none")\n  Mem Limit: \(.spec.template.spec.containers[0].resources.limits.memory // "none")"' 2>/dev/null || \
        echo "  Unable to read resource limits"
}

scale_deployment() {
    local deployment="$1"
    local replicas="$2"
    
    echo "🔄 Scaling $deployment to $replicas replicas..."
    
    # Check if deployment exists
    if ! kubectl get deployment "$deployment" -n "$NAMESPACE" >/dev/null 2>&1; then
        echo "❌ Deployment '$deployment' not found in namespace '$NAMESPACE'"
        echo ""
        echo "Available deployments:"
        kubectl get deployments -n "$NAMESPACE" --no-headers | awk '{print "  - " $1}'
        exit 1
    fi
    
    # Perform scale
    kubectl scale deployment "$deployment" --replicas="$replicas" -n "$NAMESPACE"
    
    # Wait for rollout
    echo "⏳ Waiting for rollout..."
    kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout=120s
    
    # Show new status
    echo ""
    echo "✅ Scale complete!"
    kubectl get deployment "$deployment" -n "$NAMESPACE" -o wide
}

# Main
case "${1:-}" in
    --status|-s)
        show_status
        ;;
    --help|-h|"")
        echo "Usage: $0 [deployment] [replicas]"
        echo "       $0 --status"
        echo ""
        echo "Examples:"
        echo "  $0 zaringold 20          # Scale main app to 20 pods"
        echo "  $0 chat-service 10       # Scale chat to 10 pods"
        echo "  $0 event-worker 5        # Scale event worker to 5 pods"
        echo "  $0 --status              # Show current status"
        ;;
    *)
        if [ -z "${2:-}" ]; then
            echo "❌ Error: replica count required"
            echo "Usage: $0 $1 <number>"
            exit 1
        fi
        scale_deployment "$1" "$2"
        ;;
esac
