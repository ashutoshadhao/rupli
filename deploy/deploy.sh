#!/usr/bin/env bash
# Ship the API to the Oracle VM: sync code, install deps, migrate + seed, restart.
set -euo pipefail
cd "$(dirname "$0")/.."
KEY=~/Downloads/ssh-key-2026-09-04.key
VM=ubuntu@137.23.49.189
SSH="ssh -i $KEY -o IdentitiesOnly=yes"

# anchored filters: ship the server code only, but keep app/package.json so the workspace lockfile resolves
rsync -az --delete --exclude node_modules --exclude '.env*' --exclude /.git --exclude /.superpowers --exclude /.claude --exclude /docs \
  --include /app/ --include /app/package.json --exclude '/app/*' -e "$SSH" ./ $VM:/tmp/rupli/
$SSH $VM 'set -e
  sudo rsync -a --delete --exclude node_modules /tmp/rupli/ /opt/rupli/
  sudo chown -R rupli-api:rupli-api /opt/rupli
  cd /opt/rupli && sudo -u rupli-api HOME=/opt/rupli npm ci --omit=dev -w api -w shared --include-workspace-root --no-audit --no-fund
  sudo -u rupli-api bash -c "set -a; . /etc/rupli/api.env; cd /opt/rupli/api && ../node_modules/.bin/tsx src/migrate.ts"
  sudo cp deploy/rupli-api.service /etc/systemd/system/rupli-api.service
  sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
  sudo systemctl daemon-reload
  sudo systemctl enable --now rupli-api
  sudo systemctl restart rupli-api
  sudo systemctl reload caddy
  sleep 2; curl -sf http://127.0.0.1:8787/health && echo " api up"'
