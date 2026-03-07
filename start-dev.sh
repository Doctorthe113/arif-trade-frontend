#!/usr/bin/env bash

set -euo pipefail

scriptDirPath="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
apiDirPath="${scriptDirPath}/arif_trade_international/restAPI"
apiRouterPath="${apiDirPath}/dev-router.php"
mysqlServiceName="mysql"
mysqlDatabaseName="ati_db"
phpHostValue="127.0.0.1"
phpPortValue="8000"
adminEmailValue="admin@ati.local"
adminPasswordValue="Admin@1234"

cd "${scriptDirPath}"

echo "Starting ATI development environment..."

if ! command -v docker >/dev/null 2>&1; then
	echo "Error: docker is not installed or not in PATH."
	exit 1
fi

if ! docker info >/dev/null 2>&1; then
	echo "Error: docker daemon is not running. Start Docker first."
	exit 1
fi

if ! command -v php >/dev/null 2>&1; then
	echo "Error: php is not installed or not in PATH."
	exit 1
fi

echo "Starting MySQL container with Docker Compose..."
docker compose up -d "${mysqlServiceName}"

echo "Waiting for MySQL to accept connections..."
for attemptIndex in {1..60}; do
	if docker compose exec -T "${mysqlServiceName}" mysqladmin ping -uroot --silent >/dev/null 2>&1; then
		echo "MySQL is ready."
		break
	fi

	if [[ "${attemptIndex}" == "60" ]]; then
		echo "Error: MySQL did not become ready in time."
		exit 1
	fi

	sleep 2
done

echo "Ensuring seeded admin account is usable..."
adminPasswordHashValue="$(php -r 'echo password_hash("Admin@1234", PASSWORD_BCRYPT, ["cost" => 12]);')"

docker compose exec -T "${mysqlServiceName}" mysql -uroot "${mysqlDatabaseName}" <<SQL
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES ('System Admin', '${adminEmailValue}', '${adminPasswordHashValue}', 'superadmin', 1)
ON DUPLICATE KEY UPDATE
	name = VALUES(name),
	password_hash = VALUES(password_hash),
	role = VALUES(role),
	is_active = VALUES(is_active);
SQL

echo ""
echo "✓ Services ready:"
echo "  - MySQL: 127.0.0.1:3306 (user: root, no password)"
echo "  - PHP API: http://${phpHostValue}:${phpPortValue}"
echo "  - API Health: http://${phpHostValue}:${phpPortValue}/health"
echo "  - API Spec: http://${phpHostValue}:${phpPortValue}/spec"
echo "  - Login: ${adminEmailValue} / ${adminPasswordValue}"
echo ""
echo "Frontend .env value: PUBLIC_API_BASE_URL=http://${phpHostValue}:${phpPortValue}"
echo "Stop MySQL later with: docker compose down"
echo ""
echo "Starting PHP development server..."

ATI_ENV=development php -S "${phpHostValue}:${phpPortValue}" -t "${apiDirPath}" "${apiRouterPath}"
