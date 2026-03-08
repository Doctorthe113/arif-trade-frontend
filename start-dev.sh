#!/usr/bin/env bash

set -euo pipefail

scriptDirPath="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
composeFilePath="${scriptDirPath}/docker-compose.yml"
apiDirPath="${scriptDirPath}/arif_trade_international/restAPI"
sqlInitDirPath="${apiDirPath}/sql"
schemaSqlPath="${sqlInitDirPath}/001_schema.sql"
seedSqlPath="${sqlInitDirPath}/002_seed.sql"
mysqlServiceName="mysql"
backendServiceName="backend"
mysqlDatabaseName="ati_db"
apiHostValue="127.0.0.1"
apiPortValue="8000"
adminEmailValue="admin@ati.local"
adminPasswordValue="Admin@1234"

composeCmd=(docker compose -f "${composeFilePath}")

start_services() {
	"${composeCmd[@]}" up -d --build "${mysqlServiceName}" "${backendServiceName}"
}

reset_broken_mysql_bootstrap_if_needed() {
	local mysqlLogsValue

	mysqlLogsValue="$("${composeCmd[@]}" logs --tail=120 "${mysqlServiceName}" 2>/dev/null || true)"

	if ! grep -Eq "mysql\.plugin.*doesn't exist|designated data directory .* unusable|unknown variable 'default-authentication-plugin'" <<<"${mysqlLogsValue}"; then
		return 1
	fi

	echo "Detected broken MySQL bootstrap state. Resetting dev containers and MySQL volume once..."
	"${composeCmd[@]}" down -v --remove-orphans || true
	start_services
}

cd "${scriptDirPath}"

echo "Starting ATI development environment..."

if ! command -v docker >/dev/null 2>&1; then
	echo "Error: docker is not installed or not in PATH."
	exit 1
fi

if [[ ! -f "${composeFilePath}" ]]; then
	echo "Error: Docker Compose file not found at ${composeFilePath}."
	exit 1
fi

if ! docker info >/dev/null 2>&1; then
	echo "Error: docker daemon is not running. Start Docker first."
	exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
	echo "Error: curl is not installed or not in PATH."
	exit 1
fi

echo "Starting backend and MySQL containers with Docker Compose..."

if ! start_services; then
	if ! reset_broken_mysql_bootstrap_if_needed; then
		echo "Error: Docker Compose could not start the development services."
		echo "Recent MySQL logs:"
		"${composeCmd[@]}" logs --tail=120 "${mysqlServiceName}" || true
		exit 1
	fi
fi

echo "Waiting for MySQL to accept connections..."
for attemptIndex in {1..60}; do
	if ! "${composeCmd[@]}" ps --status running --services | grep -qx "${mysqlServiceName}"; then
		echo "Error: MySQL container is not running. Recent logs:"
		"${composeCmd[@]}" logs --tail=60 "${mysqlServiceName}" || true
		exit 1
	fi

	if "${composeCmd[@]}" exec -T "${mysqlServiceName}" mysqladmin ping -uroot --silent >/dev/null 2>&1; then
		echo "MySQL is ready."
		break
	fi

	if [[ "${attemptIndex}" == "60" ]]; then
		echo "Error: MySQL did not become ready in time."
		echo "Recent MySQL logs:"
		"${composeCmd[@]}" logs --tail=60 "${mysqlServiceName}" || true
		exit 1
	fi

	sleep 2
done

echo "Ensuring database schema exists..."
usersTableExistsValue="$({
	"${composeCmd[@]}" exec -T "${mysqlServiceName}" mysql -uroot -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${mysqlDatabaseName}' AND table_name='users';" 2>/dev/null || true
} | tr -d '[:space:]')"

if [[ "${usersTableExistsValue}" != "1" ]]; then
	echo "Initializing database schema and seed data..."
	"${composeCmd[@]}" exec -T "${mysqlServiceName}" mysql -uroot < "${schemaSqlPath}"
	"${composeCmd[@]}" exec -T "${mysqlServiceName}" mysql -uroot < "${seedSqlPath}"
fi

echo "Waiting for Apache backend to accept requests..."
for attemptIndex in {1..60}; do
	if ! "${composeCmd[@]}" ps --status running --services | grep -qx "${backendServiceName}"; then
		echo "Error: Backend container is not running. Recent logs:"
		"${composeCmd[@]}" logs --tail=60 "${backendServiceName}" || true
		exit 1
	fi

	if curl --fail --silent "http://${apiHostValue}:${apiPortValue}/health" >/dev/null 2>&1; then
		echo "Apache backend is ready."
		break
	fi

	if [[ "${attemptIndex}" == "60" ]]; then
		echo "Error: Backend did not become ready in time."
		echo "Recent backend logs:"
		"${composeCmd[@]}" logs --tail=60 "${backendServiceName}" || true
		exit 1
	fi

	sleep 2
done

echo "Ensuring seeded admin account is usable..."
adminPasswordHashValue="$("${composeCmd[@]}" exec -T "${backendServiceName}" php -r 'echo password_hash("Admin@1234", PASSWORD_BCRYPT, ["cost" => 12]);')"

"${composeCmd[@]}" exec -T "${mysqlServiceName}" mysql -uroot "${mysqlDatabaseName}" <<SQL
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
echo "  - Apache API: http://${apiHostValue}:${apiPortValue}"
echo "  - API Health: http://${apiHostValue}:${apiPortValue}/health"
echo "  - API Spec: http://${apiHostValue}:${apiPortValue}/spec"
echo "  - Login: ${adminEmailValue} / ${adminPasswordValue}"
echo ""
echo "Frontend .env value: PUBLIC_API_BASE_URL=http://${apiHostValue}:${apiPortValue}"
echo "Stop backend only with: ./stop-dev.sh backend"
echo "Stop everything with: ./stop-dev.sh"

