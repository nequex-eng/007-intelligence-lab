#!/bin/bash
# Deploy 007 Intelligence Lab Pages project. Usage: bash deploy.sh [project-name]
# Gets the Cloudflare API surrogate from the local credential store
# (never the real key) and hands it to wrangler.
set -e
cd "$(dirname "$0")"
PROJECT="${1:-007-intelligence-lab}"
export CLOUDFLARE_ACCOUNT_ID=3c76b79d615b6bc886fe564307682767
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN before deploying}"
npx -y wrangler@4 pages deploy public --project-name="$PROJECT" --commit-dirty=true
