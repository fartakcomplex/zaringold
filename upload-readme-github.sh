#!/bin/bash
# Upload README.md and banner image to GitHub ZarinGold repo
# 
# USAGE: 
#   1. Create a GitHub Personal Access Token at: https://github.com/settings/tokens
#      - Select "repo" scope for full repository access
#   2. Export your token: export GITHUB_TOKEN="your_token_here"
#   3. Run this script: bash upload-readme-github.sh

REPO_OWNER="fartakcomplex"
REPO_NAME="zaringold"
GITHUB_API="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/contents"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Error: GITHUB_TOKEN not set!"
  echo ""
  echo "Please set your GitHub token:"
  echo "  export GITHUB_TOKEN='your_personal_access_token'"
  echo ""
  echo "Create one at: https://github.com/settings/tokens/new"
  echo "Select 'repo' scope for full repository access."
  exit 1
fi

echo "🚀 Uploading README.md and banner to GitHub..."

# Upload README.md
echo "📝 Uploading README.md..."
README_CONTENT=$(cat /home/z/my-project/zaringold-proposal-readme.md | base64 -w 0)

# Check if README.md already exists
README_SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "$GITHUB_API/README.md" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null)

if [ -n "$README_SHA" ]; then
  # Update existing README
  PAYLOAD=$(python3 -c "
import json
print(json.dumps({
    'message': 'docs: Add ZarinGold project proposal README',
    'content': '$README_CONTENT',
    'sha': '$README_SHA'
}))")
else
  # Create new README
  PAYLOAD=$(python3 -c "
import json
print(json.dumps({
    'message': 'docs: Add ZarinGold project proposal README',
    'content': '$README_CONTENT'
}))")
fi

RESPONSE=$(curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$GITHUB_API/README.md")

if echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'content' in d else 1)" 2>/dev/null; then
  echo "✅ README.md uploaded successfully!"
else
  echo "❌ Failed to upload README.md"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
fi

# Upload banner image
echo "🖼️ Uploading zaringold-banner.png..."
BANNER_CONTENT=$(cat /home/z/my-project/zaringold-banner.png | base64 -w 0)

# Check if banner already exists
BANNER_SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "$GITHUB_API/zaringold-banner.png" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null)

if [ -n "$BANNER_SHA" ]; then
  BANNER_PAYLOAD=$(python3 -c "
import json
print(json.dumps({
    'message': 'docs: Add ZarinGold project banner',
    'content': '$BANNER_CONTENT',
    'sha': '$BANNER_SHA'
}))")
else
  BANNER_PAYLOAD=$(python3 -c "
import json
print(json.dumps({
    'message': 'docs: Add ZarinGold project banner',
    'content': '$BANNER_CONTENT'
}))")
fi

RESPONSE=$(curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BANNER_PAYLOAD" \
  "$GITHUB_API/zaringold-banner.png")

if echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'content' in d else 1)" 2>/dev/null; then
  echo "✅ zaringold-banner.png uploaded successfully!"
else
  echo "❌ Failed to upload banner"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "🎉 Done! Check your repo at: https://github.com/$REPO_OWNER/$REPO_NAME"
