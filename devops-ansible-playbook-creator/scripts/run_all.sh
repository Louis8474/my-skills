#!/bin/bash
# Script principal para processar toda a documentação do Ansible
# Executa configuração, processamento e limpeza

set -e  # Sair em caso de erro

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_DIR/.venv"

echo "🚀 Iniciando processamento da documentação Ansible"
echo "📁 Diretório do projeto: $PROJECT_DIR"

# 1. Configurar ambiente
echo ""
echo "=== Etapa 1: Configuração do ambiente ==="
bash "$SCRIPT_DIR/setup_environment.sh"

# 2. Ativar ambiente virtual
echo ""
echo "=== Etapa 2: Ativação do ambiente virtual ==="
source "$VENV_DIR/bin/activate"
echo "✅ Ambiente virtual ativado"

# 3. Executar scripts de processamento (inclui geração do README)
echo ""
echo "=== Etapa 3: Processamento da documentação ==="
python "$SCRIPT_DIR/process_all.py"

# 4. Limpeza (opcional)
echo ""
echo "=== Etapa 4: Limpeza ==="
read -p "Deseja remover o ambiente virtual .venv? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🗑️  Removendo ambiente virtual..."
    rm -rf "$VENV_DIR"
    echo "✅ Ambiente virtual removido"
else
    echo "ℹ️  Ambiente virtual mantido em: $VENV_DIR"
    echo "   Para remover manualmente: rm -rf $VENV_DIR"
fi

echo ""
echo "🎉 Processamento concluído com sucesso!"
echo ""
echo "📚 Próximos passos:"
echo "  1. Revise a documentação gerada em reference/"
echo "  2. Teste a skill com: opencode run '<prompt ansible>'"