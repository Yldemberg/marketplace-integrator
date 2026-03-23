#!/bin/bash
# Script para configurar o banco de dados no Railway
# Execute após adicionar o plugin PostgreSQL no Railway:
# DATABASE_URL=postgresql://... bash scripts/railway-db-setup.sh

if [ -z "$DATABASE_URL" ]; then
  echo "Erro: DATABASE_URL não definido"
  echo "Uso: DATABASE_URL=postgresql://... bash scripts/railway-db-setup.sh"
  exit 1
fi

echo "Instalando dependências..."
pnpm install

echo "Criando tabelas no banco Railway..."
pnpm --filter @workspace/db run push-force

echo "Pronto! Banco de dados configurado."
