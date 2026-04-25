#!/bin/bash
# Zaringold Health Check Script
# Usage: ./health-check.sh [--watch]

set -euo pipefail

NAMESPACE="zaringold"
BASE_URL="${ZARINGOLD_URL:-https://zaringold.ir}"
WATCH_MODE=false

if [[ "${1:-}" == "--watch" ]]; then
    WATCH_MODE=true
fi

check_health() {
    echo "================================================"
    echo "  Zaringold Health Check - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "================================================"
    echo ""

    FAILED=0

    # 1. Kubernetes resources
    echo "📋 Kubernetes Resources:"
    echo "---"
    
    # Pods
    POD_COUNT=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l || echo "0")
    POD_READY=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | grep -c "Running" || echo "0")
    echo "  Pods: $POD_READY/$POD_COUNT ready"
    
    # HPA
    HPA_INFO=$(kubectl get hpa -n "$NAMESPACE" -o wide --no-headers 2>/dev/null | head -3 || echo "No HPA found")
    echo "  HPA: $HPA_INFO"
    
    # PVC
    PVC_INFO=$(kubectl get pvc -n "$NAMESPACE" --no-headers 2>/dev/null | head -3 || echo "No PVC found")
    echo "  PVC: $PVC_INFO"
    echo ""

    # 2. API Health Checks
    echo "🏥 API Health Checks:"
    echo "---"
    
    endpoints=(
        "/api/health/live:Liveness"
        "/api/health/ready:Readiness"
        "/api/metrics:Metrics"
        "/api/site-settings:Site Config"
    )

    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r path name <<< "$endpoint_info"
        STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${BASE_URL}${path}" --max-time 5 2>/dev/null || echo "TIMEOUT")
        
        if [ "$STATUS" = "200" ]; then
            echo "  ✅ $name: $STATUS"
        elif [ "$STATUS" = "TIMEOUT" ]; then
            echo "  ❌ $name: TIMEOUT"
            FAILED=1
        else
            echo "  ⚠️  $name: $STATUS"
            if [ "$STATUS" != "401" ] && [ "$STATUS" != "403" ]; then
                FAILED=1
            fi
        fi
    done
    echo ""

    # 3. Resource Usage
    echo "📊 Resource Usage:"
    echo "---"
    
    if command -v kubectl >/dev/null 2>&1; then
        kubectl top pods -n "$NAMESPACE" --no-headers 2>/dev/null | \
            awk '{printf "  %-50s CPU: %-10s Memory: %s\n", $1, $2, $3}' | head -10 || \
            echo "  (metrics-server not available)"
    fi
    echo ""

    # 4. Redis
    echo "🔴 Redis Status:"
    echo "---"
    REDIS_POD=$(kubectl get pods -n "$NAMESPACE" -l app=redis --no-headers 2>/dev/null | head -1 | awk '{print $1}')
    if [ -n "$REDIS_POD" ]; then
        REDIS_PING=$(kubectl exec "$REDIS_POD" -n "$NAMESPACE" -- redis-cli ping 2>/dev/null || echo "ERROR")
        echo "  Status: $REDIS_PING"
        REDIS_INFO=$(kubectl exec "$REDIS_POD" -n "$NAMESPACE" -- redis-cli info memory 2>/dev/null | grep used_memory_human | head -1 || echo "N/A")
        echo "  Memory: $REDIS_INFO"
    else
        echo "  (Redis pod not found)"
    fi
    echo ""

    # Summary
    if [ "$FAILED" -eq 0 ]; then
        echo "✅ All health checks passed!"
    else
        echo "❌ Some health checks FAILED"
    fi

    return $FAILED
}

if [ "$WATCH_MODE" = true ]; then
    while true; do
        clear
        check_health || true
        echo ""
        echo "Refreshing in 30 seconds... (Ctrl+C to stop)"
        sleep 30
    done
else
    check_health
fi
