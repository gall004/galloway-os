#!/usr/bin/env bash
# Execute an immediate zero-downtime rebuild and reboot of the stack
set -e
git pull origin main --rebase
docker compose build --no-cache
docker compose up -d
