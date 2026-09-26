#!/bin/sh
set -e

echo "Executando migrations do banco de dados..."
node ./node_modules/typeorm/cli.js -d dist/config/database.js migration:run

echo "Iniciando o servidor..."
exec node dist/server.js
