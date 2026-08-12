#!/usr/bin/env bash
# Update the production server: pull latest code on the GCP VM and restart the ews service.
#
# The deployment target is read from .env.gcp at the repo root (gitignored):
# copy .env.gcp.example to .env.gcp and fill in your values.
#
# Usage:
#   ./update.sh [branch]     # default branch: main (or BRANCH from .env.gcp)
#
# WARNING: this discards any uncommitted changes made directly on the server
# (it resets the repo to origin/<branch>). Discarded changes are printed first.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.gcp"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$ENV_FILE"
  set +a
fi

PROJECT="${PROJECT:?not set. Copy .env.gcp.example to .env.gcp at the repo root and fill it in}"
INSTANCE="${INSTANCE:?not set. Copy .env.gcp.example to .env.gcp at the repo root and fill it in}"
ZONE="${ZONE:?not set. Copy .env.gcp.example to .env.gcp at the repo root and fill it in}"
BRANCH="${1:-${BRANCH:-main}}"
REPO_DIR="${REPO_DIR:-/opt/dot-country-embedder}"
SERVICE="${SERVICE:-ews}"

# Remote payload. Quoted heredoc: nothing below expands locally; config is injected via the export lines.
REMOTE_SCRIPT="$(cat <<'EOS'
set -euo pipefail

OWNER="$(stat -c %U "$REPO_DIR")"
echo "==> Repo: $REPO_DIR (owner: $OWNER), branch: $BRANCH"

echo "==> Currently deployed:"
sudo -u "$OWNER" git -C "$REPO_DIR" log -1 --oneline

if [ -n "$(sudo -u "$OWNER" git -C "$REPO_DIR" status --porcelain)" ]; then
  echo "==> WARNING: discarding local changes made directly on the server:"
  sudo -u "$OWNER" git -C "$REPO_DIR" status --short
  sudo -u "$OWNER" git -C "$REPO_DIR" diff --stat
fi

echo "==> Updating to origin/$BRANCH"
sudo -u "$OWNER" git -C "$REPO_DIR" fetch origin "$BRANCH"
sudo -u "$OWNER" git -C "$REPO_DIR" checkout -f -B "$BRANCH" "origin/$BRANCH"
echo "==> Now deployed:"
sudo -u "$OWNER" git -C "$REPO_DIR" log -1 --oneline

for dir in common server; do
  echo "==> Installing dependencies in $dir"
  # Load nvm the same way run.sh does; fall back to system node/yarn (systemd runs plain npx)
  sudo -u "$OWNER" -H bash -c '
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 && nvm use 22 >/dev/null 2>&1 || true
    command -v yarn >/dev/null 2>&1 && YARN=yarn || YARN="npx -y yarn"
    cd "$1"
    $YARN install --frozen-lockfile || { echo "frozen-lockfile failed, retrying plain install"; $YARN install; }
  ' bash "$REPO_DIR/$dir"
done

echo "==> Restarting $SERVICE"
sudo systemctl restart "$SERVICE"

echo "==> Waiting for health check on http://localhost/health"
for _ in $(seq 1 15); do
  sleep 2
  if curl -fsS -m 3 http://localhost/health >/dev/null 2>&1; then
    echo "==> Health check OK"
    sudo systemctl status "$SERVICE" --no-pager | head -10
    exit 0
  fi
done

echo "==> HEALTH CHECK FAILED, recent logs:"
sudo journalctl -u "$SERVICE" -n 50 --no-pager
exit 1
EOS
)"

REMOTE_PAYLOAD="export REPO_DIR='$REPO_DIR' BRANCH='$BRANCH' SERVICE='$SERVICE'
$REMOTE_SCRIPT"

echo "==> Deploying branch '$BRANCH' to $INSTANCE ($PROJECT, $ZONE)"
gcloud compute ssh "$INSTANCE" --project "$PROJECT" --zone "$ZONE" --command "$REMOTE_PAYLOAD"
echo "==> Done"
