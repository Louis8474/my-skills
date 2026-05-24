#!/usr/bin/env python3
"""
Extrai DOCUMENTATION, EXAMPLES e RETURN dos módulos Python Ansible
e gera arquivos Markdown organizados.
"""

import os
import re
import yaml
from pathlib import Path


def extract_docstrings(filepath):
    """Extrai strings de documentação de um arquivo Python."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Padrões para extrair strings de documentação
    patterns = {
        "DOCUMENTATION": r'DOCUMENTATION\s*=\s*r?"""(.*?)"""',
        "EXAMPLES": r'EXAMPLES\s*=\s*r?"""(.*?)"""',
        "RETURN": r'RETURN\s*=\s*r?"""(.*?)"""',
    }

    result = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, content, re.DOTALL)
        if match:
            result[key] = match.group(1).strip()

    return result


def yaml_to_markdown(yaml_content, section_type):
    """Converte conteúdo YAML para Markdown formatado."""
    try:
        data = yaml.safe_load(yaml_content)
    except yaml.YAMLError:
        return f"```yaml\n{yaml_content}\n```"

    if section_type == "DOCUMENTATION":
        return format_documentation(data)
    elif section_type == "EXAMPLES":
        return format_examples(yaml_content)
    elif section_type == "RETURN":
        return format_return(data)
    return ""


def format_documentation(doc):
    """Formata a documentação do módulo."""
    if not doc:
        return ""

    lines = []
    module_name = doc.get("module", "Módulo")
    lines.append(f"# {module_name}")
    lines.append(f"\n**Descrição:** {doc.get('short_description', '')}\n")

    if "description" in doc:
        lines.append("## Descrição")
        for desc in doc["description"]:
            lines.append(f"- {desc}")
        lines.append("")

    if "options" in doc:
        lines.append("## Opções")
        for opt_name, opt_data in doc["options"].items():
            lines.append(f"### `{opt_name}`")
            lines.append(f"- **Tipo:** {opt_data.get('type', 'N/A')}")
            lines.append(f"- **Necessário:** {opt_data.get('required', 'não')}")
            if "default" in opt_data:
                lines.append(f"- **Padrão:** `{opt_data['default']}`")
            if "choices" in opt_data:
                lines.append(
                    f"- **Escolhas:** {', '.join(str(c) for c in opt_data['choices'])}"
                )
            if "aliases" in opt_data:
                lines.append(f"- **Aliases:** {', '.join(opt_data['aliases'])}")
            lines.append(f"\n{opt_data.get('description', [''])[0]}\n")

    if "seealso" in doc:
        lines.append("## Ver também")
        for see in doc["seealso"]:
            if "module" in see:
                lines.append(f"- `{see['module']}`")
        lines.append("")

    return "\n".join(lines)


def format_examples(examples_yaml):
    """Formata exemplos de uso."""
    return f"## Exemplos de Uso\n\n```yaml\n{examples_yaml}\n```"


def format_return(return_data):
    """Formata valores de retorno."""
    if not return_data:
        return ""

    lines = ["## Valores de Retorno\n"]
    for ret_name, ret_data in return_data.items():
        lines.append(f"- **{ret_name}:** {ret_data.get('description', '')}")
        lines.append(f"  - Retornado: {ret_data.get('returned', 'N/A')}")
        lines.append(f"  - Tipo: {ret_data.get('type', 'N/A')}")
        if "sample" in ret_data:
            lines.append(f"  - Exemplo: `{ret_data['sample']}`")

    return "\n".join(lines)


def main():
    # Configuração de caminhos
    base_dir = Path(__file__).parent.parent
    builtin_dir = base_dir / "reference" / "ansible_builtin"
    modules_dir = base_dir / "reference" / "modules"
    modules_dir.mkdir(parents=True, exist_ok=True)

    # Processar cada módulo Python
    processed = 0
    for py_file in builtin_dir.glob("*.py"):
        if py_file.name.startswith("_"):
            continue  # Pular arquivos internos

        module_name = py_file.stem
        print(f"Processando: {module_name}")

        # Extrair documentação
        docstrings = extract_docstrings(py_file)

        if not docstrings:
            print(f"  Nenhuma documentação encontrada em {py_file.name}")
            continue

        # Gerar Markdown
        markdown_parts = []

        if "DOCUMENTATION" in docstrings:
            markdown_parts.append(
                yaml_to_markdown(docstrings["DOCUMENTATION"], "DOCUMENTATION")
            )

        if "EXAMPLES" in docstrings:
            markdown_parts.append(yaml_to_markdown(docstrings["EXAMPLES"], "EXAMPLES"))

        if "RETURN" in docstrings:
            markdown_parts.append(yaml_to_markdown(docstrings["RETURN"], "RETURN"))

        # Salvar arquivo
        md_content = "\n\n".join(markdown_parts)
        md_file = modules_dir / f"{module_name}.md"

        with open(md_file, "w", encoding="utf-8") as f:
            f.write(md_content)

        processed += 1

    print(f"\nTotal de módulos processados: {processed}")
    print(f"Documentação extraída para: {modules_dir}")


if __name__ == "__main__":
    main()
