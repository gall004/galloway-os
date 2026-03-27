#!/usr/bin/env bash
# Execute an immediate zero-downtime rebuild and reboot of the stack
docker compose up -d --build
