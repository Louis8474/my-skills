# Ansible Playbook Creator - Skill para OpenCode

Skill completa para criação e manutenção de playbooks Ansible.

## 🚀 Capacidades

1. **Gerar playbooks** a partir de descrições em linguagem natural
2. **Ajudar a escrever/expandir** trechos específicos
3. **Fornecer snippets/templates** prontos para tarefas comuns
4. **Explicar playbooks** existentes

## 📁 Estrutura da Skill

```
ansible-playbook-creator/
├── SKILL.md                    # Documentação principal da skill
├── reference/                  # Documentação simplificada
│   ├── README.md              # Índice organizado
│   ├── modules/               # 68 módulos em Markdown
│   ├── docs/                  # 20 documentos principais convertidos
│   ├── topics/                # 7 tópicos combinados
│   └── ansible_builtin/       # Arquivos fonte Python (referência técnica)
├── templates/                 # Templates de playbooks
│   └── basic_playbook.yml.j2
├── examples/                  # Exemplos prontos
│   └── complex_playbook.yml
├── evals/                     # Casos de teste
│   └── evals.json
└── scripts/                   # Scripts de processamento
    ├── extract_modules.py
    ├── convert_rst.py
    ├── create_topic_files.py
    ├── generate_readme.py
    ├── process_all.py
    ├── setup_environment.sh
    └── run_all.sh
```

## 🛠️ Como Usar

### Para o Usuário Final
1. Copie a pasta `ansible-playbook-creator` para `~/.config/opencode/skills/`
2. A skill será ativada automaticamente quando você mencionar:
   - "ansible"
   - "playbook"
   - "ansible-playbook"
   - "yaml de automação"
   - "configuração de servidor"
   - "infraestrutura como código"

### Para Reprocessar a Documentação
Se precisar atualizar a documentação:

```bash
cd ~/.config/opencode/skills/ansible-playbook-creator

# Instalar dependências (opcional, PyYAML já deve estar instalado)
python3 -m pip install pyyaml --user

# Executar processamento completo
python3 scripts/process_all.py

# Ou executar etapas individualmente
python3 scripts/extract_modules.py
python3 scripts/convert_rst.py
python3 scripts/create_topic_files.py
python3 scripts/generate_readme.py
```

## 📚 Documentação Incluída

### Módulos (68 arquivos)
- **Arquivos**: file, copy, template, assemble, blockinfile, lineinfile, replace
- **Serviços**: service, systemd_service, sysvinit
- **Pacotes**: apt, yum, dnf, package, pip
- **Comandos**: command, shell, script, raw
- **Usuários**: user, group
- **Informações**: setup, gather_facts, stat, getent, package_facts
- **E muitos outros...**

### Tópicos (7 guias combinados)
1. **variables.md** - Variáveis, facts e precedência
2. **conditionals_loops.md** - Condicionais, loops e blocos
3. **inventory_patterns.md** - Inventário e patterns
4. **templates_filters.md** - Templates Jinja2 e filtros
5. **playbook_structure.md** - Estrutura de playbooks
6. **error_handling.md** - Tratamento de erros
7. **reuse_roles.md** - Reutilização e roles

### Documentação Principal (20 arquivos)
- YAML Syntax
- Playbooks Introduction
- Playbooks Advanced Syntax
- Variables
- General Precedence
- Conditionals
- Loops
- Blocks
- Inventory
- Patterns
- Templating
- Filters
- Lookups
- Roles
- Reuse
- Error Handling
- Handlers
- Tags
- Strategies
- Special Variables

## 📝 Templates e Exemplos

### Template Básico
`templates/basic_playbook.yml.j2` - Template Jinja2 para playbooks completos com:
- Configuração do sistema
- Instalação de dependências
- Deploy de aplicação
- Configuração de serviços
- Tratamento de erros

### Exemplo Complexo
`examples/complex_playbook.yml` - Playbook completo para servidor web com:
- Nginx
- PHP-FPM
- MySQL
- Configuração SSL
- Backup automático
- Monitoramento

## 🧪 Casos de Teste

`evals/evals.json` contém 5 casos de teste:
1. **playbook_nginx** - Criação de playbook para Nginx
2. **loop_copy_files** - Uso de loops para cópia de arquivos
3. **explain_playbook** - Explicação de playbook existente
4. **error_handling** - Tratamento de erros com block/rescue
5. **role_structure** - Estrutura de roles

## 🔄 Reprocessamento

Para atualizar a documentação com versões mais recentes do Ansible:

1. Atualize os arquivos em `reference/ansible_builtin/` com a nova versão
2. Execute: `python3 scripts/process_all.py`
3. Os arquivos Markdown serão regenerados automaticamente

## 🧹 Limpeza

Se precisar remover arquivos temporários:

```bash
# Remover ambiente virtual (se criado)
rm -rf .venv

# Os scripts em scripts/ são necessários e devem ser mantidos
```

## 📖 Como Consultar a Referência

1. **Para módulos específicos**: `reference/modules/<nome_modulo>.md`
2. **Para conceitos gerais**: `reference/topics/`
3. **Para detalhes completos**: `reference/docs/`

## 🤝 Contribuindo

Para melhorar a documentação:
1. Edite os scripts em `scripts/`
2. Execute `python3 scripts/process_all.py`
3. Os arquivos serão atualizados automaticamente

---
*Skill gerada automaticamente em 20/03/2026*