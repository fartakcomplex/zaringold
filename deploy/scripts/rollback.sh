#!/bin/bash
# Zaringold Deployment Rollback Script
# Usage: ./rollback.sh [revision]

set -euo pipefail

NAMESPACE="zaringold"
RELEASE_NAME="zaringold"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "================================================"
echo "  Zaringold Rollback - زرین گلد بازگشت"
echo "================================================"

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl not found"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "❌ helm not found"; exit 1; }

# Check current namespace
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo "❌ Namespace '$NAMESPACE' not found"
    exit 1
fi

# Show current state
echo ""
echo "📊 Current Deployment Status:"
echo "---"
helm status "$RELEASE_NAME" -n "$NAMESPACE" 2>/dev/null || echo "Helm release not found"
kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
echo ""

# Get revision history
echo "📜 Release History:"
helm history "$RELEASE_NAME" -n "$NAMESPACE" -o table

# Determine rollback target
if [ -n "${1:-}" ]; then
    REVISION="$1"
else
    # Get last successful revision
    REVISION=$(helm history "$RELEASE_NAME" -n "$NAMESPACE" -o json | \
        jq -r '[.[] | select(.status == "deployed" or .status == "superseded")][0].revision // empty' 2>/dev/null || echo "")
    
    if [ -z "$REVISION" ]; then
        echo ""
        echo "❌ No previous revision found for rollback"
        exit 1
    fi
fi

echo ""
echo "⚠️  WARNING: This will rollback to revision $REVISION"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

# Perform rollback
echo ""
echo "🔄 Rolling back to revision $REVISION..."
helm rollback "$RELEASE_NAME" "$REVISION" \
    -n "$NAMESPACE" \
    --wait \
    --timeout 5m

# Verify
echo ""
echo "✅ Rollback complete!"
echo ""
echo "📊 Updated Status:"
kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" -w --timeout=30s &
WATCH_PID=$!
sleep 15
kill $WATCH_PID 2>/dev/null || true

echo ""
echo "📜 Updated History:"
helm history "$RELEASE_NAME" -n "$NAMESPACE" -o table
