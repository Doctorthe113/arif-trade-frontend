#!/bin/bash

echo "Starting ATI Development Environment..."

# Start Docker MySQL
echo "Starting MySQL container..."
docker compose up -d

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
sleep 5

# Apply password fix
echo "Fixing admin password..."
docker compose exec -T mysql mysql -uroot ati_db < arif_trade_international/restAPI/sql/003_fix_admin_password.sql

# Start PHP server
echo "Starting PHP development server on localhost:8000..."
echo ""
echo "✓ Services started:"
echo "  - MySQL: localhost:3306 (user: root, no password)"
echo "  - PHP API: http://localhost:8000"
echo "  - Login: admin@ati.local / Admin@1234"
echo ""
echo "To stop services: docker compose down"
echo ""

php -S localhost:8000 -t arif_trade_international/restAPI
