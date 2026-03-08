#!/usr/bin/env bash

set -euo pipefail

scriptDirPath="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
composeFilePath="${scriptDirPath}/docker-compose.yml"
composeCmd=(docker compose -f "${composeFilePath}")
modeValue="${1:-all}"

cd "${scriptDirPath}"

if ! command -v docker >/dev/null 2>&1; then
	echo "Error: docker is not installed or not in PATH."
	exit 1
fi

if [[ ! -f "${composeFilePath}" ]]; then
	echo "Error: Docker Compose file not found at ${composeFilePath}."
	exit 1
fi

case "${modeValue}" in
	backend)
		echo "Stopping backend container..."
		"${composeCmd[@]}" stop backend || true
		echo "Removing backend container..."
		"${composeCmd[@]}" rm -f backend || true
		echo "✓ Backend container stopped and removed."
		;;
	all|down)
		echo "Stopping ATI development environment..."
		"${composeCmd[@]}" down --remove-orphans
		echo "✓ Backend and MySQL containers stopped."
		;;
	*)
		echo "Usage: ./stop-dev.sh [backend|all]"
		exit 1
		;;
esac