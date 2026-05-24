#!/usr/bin/env python3
"""
Script principal para processar toda a documentação do Ansible.
Executa a extração dos módulos, conversão de RST e criação de tópicos.
"""

import sys
import subprocess
from pathlib import Path


def run_script(script_path, description):
    """Executa um script Python."""
    print(f"\n{'=' * 60}")
    print(f"Executando: {description}")
    print(f"Script: {script_path}")
    print("=" * 60)

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            check=True,
        )
        print(result.stdout)
        if result.stderr:
            print("Avisos/Erros:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar script: {e}")
        print("Saída padrão:", e.stdout)
        print("Saída de erro:", e.stderr)
        return False


def main():
    base_dir = Path(__file__).parent
    scripts_dir = base_dir

    # Verificar se os scripts existem
    scripts = [
        ("extract_modules.py", "Extração de módulos Python"),
        ("create_topic_files.py", "Criação de arquivos por tópico"),
        ("generate_readme.py", "Geração do README.md de índice"),
    ]

    success_count = 0
    for script_name, description in scripts:
        script_path = scripts_dir / script_name
        if not script_path.exists():
            print(f"Script não encontrado: {script_path}")
            continue

        if run_script(script_path, description):
            success_count += 1

    print(f"\n{'=' * 60}")
    print(f"Resumo: {success_count}/{len(scripts)} scripts executados com sucesso")

    if success_count == len(scripts):
        print("\n✅ Processamento concluído!")
        print("\nPróximos passos:")
        print("1. Revisar documentação em reference/")
        print("2. Testar a skill com opencode run '<prompt>'")
    else:
        print("\n⚠️  Alguns scripts falharam. Verifique os erros acima.")


if __name__ == "__main__":
    main()
