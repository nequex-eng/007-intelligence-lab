#!/bin/bash
# Production deployment is intentionally manual and must be explicitly authorized by the owner.
set -euo pipefail
cd "$(dirname "$0")"
PROJECT="${1:-007-intelligence-lab}"
export CLOUDFLARE_ACCOUNT_ID=3c76b79d615b6bc886fe564307682767
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN before deploying}"
echo "Syncing verified canon knowledge before deployment..."
npm run sync:knowledge
echo "Deploying project: $PROJECT"
npx -y wrangler@4 pages deploy public --project-name="$PROJECT" --commit-dirty=true
