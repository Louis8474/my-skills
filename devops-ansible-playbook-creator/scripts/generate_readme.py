#!/usr/bin/env python3
"""
Gera o README.md para a pasta reference/
"""

from pathlib import Path


def main():
    base_dir = Path(__file__).parent.parent
    reference_dir = base_dir / "reference"

    # Listar arquivos gerados
    modules_dir = reference_dir / "modules"
    docs_dir = reference_dir / "docs"
    topics_dir = reference_dir / "topics"

    # Contar arquivos
    modules_count = len(list(modules_dir.glob("*.md"))) if modules_dir.exists() else 0
    docs_count = len(list(docs_dir.glob("*.md"))) if docs_dir.exists() else 0
    topics_count = len(list(topics_dir.glob("*.md"))) if topics_dir.exists() else 0

    # Listar alguns módulos principais
    main_modules = [
        "file",
        "copy",
        "template",
        "service",
        "package",
        "command",
        "shell",
        "user",
        "group",
        "apt",
        "yum",
        "dnf",
    ]
    modules_list = []
    for m in main_modules:
        if (modules_dir / f"{m}.md").exists():
            modules_list.append(f"- `{m}.md`")

    readme_content = f"""# Referência Ansible - Documentação Simplificada

Esta pasta contém a documentação simplificada do Ansible para uso com a skill ansible-playbook-creator.

## Estrutura

### 📦 Módulos (`modules/`)
Documentação completa dos módulos Ansible extraída dos arquivos fonte Python.
Total: **{modules_count} módulos**

Principais módulos:
{chr(10).join(modules_list)}

### 📚 Documentação Principal (`docs/`)
Conversão dos 20 arquivos RST mais importantes.
Total: **{docs_count} arquivos**

### 📋 Tópicos (`topics/`)
Guias combinados por tópico para estudo rápido.
Total: **{topics_count} tópicos**

## Como Usar

1. **Para módulos específicos**: Navegue em `modules/` e busque pelo nome do módulo
2. **Para conceitos gerais**: Consulte `topics/` para guias organizados
3. **Para detalhes completos**: Use `docs/` para a documentação original

## Módulos Mais Comuns

### Gestão de Arquivos
- `file.md` - Gerenciamento de arquivos e diretórios
- `copy.md` - Cópia de arquivos para hosts remotos
- `template.md` - Processamento de templates Jinja2
- `assemble.md` - Montagem de arquivos
- `blockinfile.md` - Inserção de blocos de texto
- `lineinfile.md` - Gerenciamento de linhas específicas
- `replace.md` - Substituição de texto

### Gestão de Serviços
- `service.md` - Serviços SysVinit
- `systemd_service.md` - Serviços systemd
- `sysvinit.md` - Serviços SysVinit (alternativo)

### Gestão de Pacotes
- `apt.md` - Pacotes Debian/Ubuntu
- `yum.md` - Pacotes RHEL/CentOS 7
- `dnf.md` - Pacotes RHEL/CentOS 8+
- `package.md` - Gerenciador de pacotes genérico
- `pip.md` - Pacotes Python

### Comandos e Scripts
- `command.md` - Comandos secos
- `shell.md` - Comandos com shell
- `script.md` - Execução de scripts locais
- `raw.md` - Comandos raw SSH

### Gestão de Usuários e Grupos
- `user.md` - Usuários do sistema
- `group.md` - Grupos do sistema

### Rede e Configuração
- `hostname.md` - Configuração de hostname
- `iptables.md` - Regras de firewall
- `known_hosts.md` - Gerenciamento de known hosts

### Coleta de Informações
- `setup.md` - Coleta de facts do sistema
- `gather_facts.md` - Alternativa para coleta de facts
- `stat.md` - Informações sobre arquivos
- `getent.md` - Consulta banco de dados do sistema
- `package_facts.md` - Facts sobre pacotes instalados

### Outros Comuns
- `debug.md` - Saída de depuração
- `assert.md` - Validações
- `fail.md` - Falhas controladas
- `pause.md` - Pausas na execução
- `wait_for.md` - Espera por condições
- `wait_for_connection.md` - Espera por conectividade

## Índice por Categoria

### Infraestrutura como Código
1. **Provisionamento**: `file`, `copy`, `template`, `package`, `service`
2. **Configuração**: `lineinfile`, `blockinfile`, `replace`, `template`
3. **Deploy**: `git`, `unarchive`, `copy`, `template`
4. **Monitoramento**: `setup`, `stat`, `wait_for`, `uri`

### Padrões Comuns de Uso

#### Gestão de Configurações
```yaml
- name: Configurar arquivo
  template:
    src: config.j2
    dest: /etc/app/config
    owner: root
    group: root
    mode: '0644'
  notify: Restart app
```

#### Gestão de Serviços
```yaml
- name: Gerenciar serviço
  service:
    name: myapp
    state: started
    enabled: yes
```

#### Execução Condicional
```yaml
- name: Tarefa condicional
  command: /usr/bin/fancy-command
  when: ansible_os_family == "Debian"
  changed_when: false
```

## Tópicos Disponíveis

1. `variables.md` - Variáveis, facts e precedência
2. `conditionals_loops.md` - Condicionais, loops e blocos
3. `inventory_patterns.md` - Inventário e patterns
4. `templates_filters.md` - Templates Jinja2 e filtros
5. `playbook_structure.md` - Estrutura de playbooks
6. `error_handling.md` - Tratamento de erros
7. `reuse_roles.md` - Reutilização e roles

## Dicas Rápidas

### Para Iniciantes
1. Comece com `playbook_structure.md` para entender a estrutura básica
2. Estude `variables.md` para entender dados e facts
3. Pratique com `modules/file.md`, `modules/copy.md`, `modules/template.md`

### Para Usuários Intermediários
1. Domine `conditionals_loops.md` para lógica complexa
2. Aprenda `templates_filters.md` para manipulação de dados
3. Estude `inventory_patterns.md` para ambientes complexos

### Para Avançados
1. Entenda `error_handling.md` para playbooks robustos
2. Domine `reuse_roles.md` para código reutilizável
3. Use `docs/` para referência completa

---
*Documentação gerada automaticamente a partir dos fontes oficiais do Ansible*
"""

    # Salvar README
    readme_file = reference_dir / "README.md"
    with open(readme_file, "w", encoding="utf-8") as f:
        f.write(readme_content)

    print(f"✅ README.md criado em: {readme_file}")


if __name__ == "__main__":
    main()
