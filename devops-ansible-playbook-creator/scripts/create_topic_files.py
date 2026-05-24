#!/usr/bin/env python3
"""
Cria arquivos combinados por tópico a partir dos documentos convertidos.
"""

from pathlib import Path

TOPIC_MAPPING = {
    "variables.md": [
        "playbooks_variables.md",
        "special_variables.md",
        "general_precedence.md",
    ],
    "conditionals_loops.md": [
        "playbooks_conditionals.md",
        "playbooks_loops.md",
        "playbooks_blocks.md",
    ],
    "inventory_patterns.md": ["intro_inventory.md", "intro_patterns.md"],
    "templates_filters.md": [
        "playbooks_templating.md",
        "playbooks_filters.md",
        "playbooks_lookups.md",
    ],
    "playbook_structure.md": [
        "playbooks_intro.md",
        "playbooks_advanced_syntax.md",
        "YAMLSyntax.md",
    ],
    "error_handling.md": [
        "playbooks_error_handling.md",
        "playbooks_handlers.md",
        "playbooks_tags.md",
    ],
    "reuse_roles.md": [
        "playbooks_reuse_roles.md",
        "playbooks_reuse.md",
        "playbooks_strategies.md",
    ],
}


def main():
    base_dir = Path(__file__).parent.parent
    docs_dir = base_dir / "reference" / "docs"
    topics_dir = base_dir / "reference" / "topics"
    topics_dir.mkdir(parents=True, exist_ok=True)

    created = 0
    for topic_name, source_files in TOPIC_MAPPING.items():
        print(f"Criando tópico: {topic_name}")

        content_parts = []
        missing_files = []

        for source_file in source_files:
            source_path = docs_dir / source_file
            if source_path.exists():
                with open(source_path, "r", encoding="utf-8") as f:
                    content = f.read()
                # Adicionar cabeçalho com nome do arquivo original
                header = f"## {source_file.replace('.md', '')}\n\n"
                content_parts.append(header + content)
            else:
                missing_files.append(source_file)

        if missing_files:
            print(f"  Arquivos não encontrados: {', '.join(missing_files)}")
            if not content_parts:
                continue

        # Combinar conteúdo com separador
        separator = "\n\n---\n\n"
        topic_content = separator.join(content_parts)

        # Adicionar cabeçalho do tópico
        topic_header = (
            f"# {topic_name.replace('.md', '').replace('_', ' ').title()}\n\n"
        )
        final_content = topic_header + topic_content

        # Salvar
        topic_file = topics_dir / topic_name
        try:
            with open(topic_file, "w", encoding="utf-8") as f:
                f.write(final_content)
            created += 1
        except Exception as e:
            print(f"  Erro ao salvar tópico: {e}")

    print(f"\nTotal de tópicos criados: {created}")
    print(f"Arquivos de tópicos criados em: {topics_dir}")


if __name__ == "__main__":
    main()
