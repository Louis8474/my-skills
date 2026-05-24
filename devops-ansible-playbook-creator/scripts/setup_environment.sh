#!/bin/bash
# Configura o ambiente virtual e instala dependências necessárias

set -e  # Sair em caso de erro

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_DIR/.venv"

echo "=== Configurando ambiente para ansible-playbook-creator ==="

# Verificar se Python está disponível
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale Python3 primeiro."
    exit 1
fi

echo "✅ Python3 encontrado: $(python3 --version)"

# Criar ambiente virtual se não existir
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Criando ambiente virtual em $VENV_DIR"
    python3 -m venv "$VENV_DIR"
else
    echo "✅ Ambiente virtual já existe"
fi

# Ativar ambiente virtual
echo "⚡ Ativando ambiente virtual"
source "$VENV_DIR/bin/activate"

# Atualizar pip
echo "🔄 Atualizando pip"
pip install --upgrade pip --quiet

# Instalar dependências necessárias
echo "📚 Instalando dependências"
pip install pyyaml --quiet

echo "✅ Dependências instaladas:"
pip list | grep -E "(yaml|PyYAML)"

echo ""
echo "Ambiente configurado com sucesso!"
echo ""
echo "Para usar o ambiente:"
echo "  source $VENV_DIR/bin/activate"
echo ""
echo "Para executar o processamento:"
echo "  python $SCRIPT_DIR/process_all.py"
echo ""
echo "Para desativar o ambiente:"
echo "  deactivate"
echo ""
echo "Para remover o ambiente virtual após uso:"
echo "  rm -rf $VENV_DIR"