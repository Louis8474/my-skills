#!/bin/bash
# Script de limpeza para a skill ansible-playbook-creator
# Remove arquivos temporários e ambientes virtuais

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🧹 Limpando arquivos temporários..."

# Remover ambiente virtual se existir
if [ -d "$PROJECT_DIR/.venv" ]; then
    echo "Removendo ambiente virtual .venv"
    rm -rf "$PROJECT_DIR/.venv"
    echo "✅ Ambiente virtual removido"
else
    echo "ℹ️  Ambiente virtual não encontrado"
fi

# Remover caches Python
echo "Removendo caches __pycache__"
find "$PROJECT_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$PROJECT_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true

# Remover logs temporários
echo "Removendo arquivos de log temporários"
find "$PROJECT_DIR" -name "*.log" -type f -delete 2>/dev/null || true

# Remover arquivos .swp, .swo, etc. do vim
echo "Removendo arquivos de swap do vim"
find "$PROJECT_DIR" -name "*.swp" -type f -delete 2>/dev/null || true
find "$PROJECT_DIR" -name "*.swo" -type f -delete 2>/dev/null || true

# Verificar se há arquivos .gitignore
if [ ! -f "$PROJECT_DIR/.gitignore" ]; then
    echo "Criando .gitignore padrão"
    cat > "$PROJECT_DIR/.gitignore" << 'EOF'
# Ambiente virtual
.venv/
venv/
env/

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log

# Sistema
.DS_Store
Thumbs.db

# Backup
*.bak
*.backup
EOF
    echo "✅ .gitignore criado"
fi

echo ""
echo "🎉 Limpeza concluída!"
echo ""
echo "📊 Espaço economizado:"
du -sh "$PROJECT_DIR" 2>/dev/null || echo "Não foi possível calcular o espaço"
echo ""
echo "ℹ️  Os seguintes arquivos foram mantidos:"
echo "  - reference/ (documentação)"
echo "  - scripts/ (scripts de processamento)"
echo "  - templates/ (templates)"
echo "  - examples/ (exemplos)"
echo "  - evals/ (casos de teste)"
echo "  - SKILL.md (documentação principal)"
echo "  - README.md (índice)"
echo "  - .gitignore (ignorados pelo git)"