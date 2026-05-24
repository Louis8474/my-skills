#!/bin/bash
set -euo pipefail

# Script: update-references.sh
# Description: Baixa a documentação mais recente em inglês do repositório anomalyco/opencode
# Uso: ./scripts/update-references.sh

REPO_URL="https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/web/src/content/docs"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$SKILL_DIR/references/opencode"
BRANCH="dev"

# Lista de arquivos MDX principais (inglês)
MDX_FILES=(
  "index.mdx"
  "acp.mdx"
  "agents.mdx"
  "cli.mdx"
  "commands.mdx"
  "config.mdx"
  "custom-tools.mdx"
  "ecosystem.mdx"
  "enterprise.mdx"
  "formatters.mdx"
  "github.mdx"
  "gitlab.mdx"
  "go.mdx"
  "ide.mdx"
  "keybinds.mdx"
  "lsp.mdx"
  "mcp-servers.mdx"
  "models.mdx"
  "modes.mdx"
  "network.mdx"
  "permissions.mdx"
  "plugins.mdx"
  "providers.mdx"
  "rules.mdx"
  "sdk.mdx"
  "server.mdx"
  "share.mdx"
  "skills.mdx"
  "themes.mdx"
  "tools.mdx"
  "troubleshooting.mdx"
  "tui.mdx"
  "web.mdx"
  "windows-wsl.mdx"
  "zen.mdx"
)

echo "📚 Atualizando referências do OpenCode (inglês)..."
echo "📍 Repositório: anomalyco/opencode (branch: $BRANCH)"
echo "📁 Destino: $TARGET_DIR"
echo ""

# Verifica dependências
if ! command -v curl &> /dev/null; then
  echo "❌ Erro: curl não encontrado. Instale curl para continuar."
  exit 1
fi

# Cria diretório de destino se não existir
mkdir -p "$TARGET_DIR"

SUCCESS_COUNT=0
FAIL_COUNT=0
FAIL_LIST=()

# Função para baixar um arquivo
download_file() {
  local file="$1"
  local url="$REPO_URL/$file"
  local output="$TARGET_DIR/$file"
  
  if curl -fsSL --max-time 10 "$url" -o "$output" 2>/dev/null; then
    echo "✅ $file"
    return 0
  else
    echo "❌ $file (não encontrado ou erro de rede)"
    return 1
  fi
}

export -f download_file
export REPO_URL TARGET_DIR

# Baixa arquivos em paralelo (máximo 4 conexões simultâneas)
echo "${MDX_FILES[@]}" | tr ' ' '\n' | xargs -P 4 -I {} bash -c 'download_file "$@"' _ {} | while read -r line; do
  echo "$line"
done

# Conta sucessos e falhas
for file in "${MDX_FILES[@]}"; do
  if [[ -f "$TARGET_DIR/$file" ]]; then
    ((SUCCESS_COUNT++))
  else
    ((FAIL_COUNT++))
    FAIL_LIST+=("$file")
  fi
done

echo ""
echo "================================"
echo "📊 Resumo da atualização:"
echo "   ✅ Sucesso: $SUCCESS_COUNT arquivos"
echo "   ❌ Falhas: $FAIL_COUNT arquivos"

if [[ $FAIL_COUNT -gt 0 ]]; then
  echo ""
  echo "   Arquivos com falha:"
  for f in "${FAIL_LIST[@]}"; do
    echo "   - $f"
  done
fi

echo ""
echo "💡 Dica: Use 'ls -la $TARGET_DIR' para ver os arquivos baixados."
echo "🔄 Para atualizar novamente, execute: ./scripts/update-references.sh"
