---
name: devops-ansible-playbook-creator
description: Gera playbooks Ansible a partir de requisitos em linguagem natural, ajuda a escrever/expandir trechos, fornece snippets/templates, e explica playbooks existentes. Ative quando o usuário mencionar "ansible", "playbook", "ansible-playbook", "yaml de automação", "configuração de servidor", "infraestrutura como código".
license: MIT
compatibility: Requires Python >=3.10, Node >=18, and OpenCode >=0.9.0
---

# Overview
Assistência completa para criação e manutenção de playbooks Ansible.

## Capacidades
1. **Gerar playbooks** a partir de descrições em linguagem natural
2. **Ajudar a escrever/expandir** trechos específicos
3. **Fornecer snippets/templates** prontos para tarefas comuns
4. **Explicar playbooks** existentes

## Como Usar

### Para Criar Playbooks
Quando o usuário pedir para criar um playbook:
1. Analise os requisitos detalhadamente
2. Consulte a referência em `reference/` para módulos e sintaxe
3. Forneça YAML válido com explicações
4. Sugira melhorias e boas práticas

**Exemplo de prompt:**
```
Crie um playbook para instalar nginx, configurar virtual hosts e iniciar o serviço
```

**Resposta esperada:**
```yaml
- name: Configuração completa do Nginx
  hosts: webservers
  become: yes
  tasks:
    - name: Instalar Nginx
      apt:
        name: nginx
        state: present
        update_cache: yes
    
    - name: Criar diretório de virtual hosts
      file:
        path: /etc/nginx/sites-available
        state: directory
        mode: '0755'
    
    # ... mais tarefas
```

### Para Ajudar a Escrever Trechos
Quando o usuário precisar de ajuda com partes específicas:
1. Forneça o trecho solicitado com placeholders
2. Explique cada parte
3. Ofereça alternativas quando aplicável

**Exemplo:**
```
Como faço para copiar vários arquivos usando loop?
```

**Resposta:**
```yaml
- name: Copiar múltiplos arquivos
  copy:
    src: "{{ item.src }}"
    dest: "{{ item.dest }}"
    owner: root
    group: root
    mode: '0644'
  loop:
    - { src: 'files/config.conf', dest: '/etc/app/config.conf' }
    - { src: 'files/service.service', dest: '/etc/systemd/system/app.service' }
```

### Para Explicar Playbooks
Quando o usuário precisar entender um playbook existente:
1. Analise a estrutura e fluxo
2. Explique cada seção e tarefa
3. Identifique padrões e possíveis melhorias

## Referência

### Estrutura da Pasta
```
reference/
├── README.md               # Índice organizado
├── modules/                # Documentação de 73 módulos
│   ├── file.md
│   ├── copy.md
│   └── ...
├── docs/                   # Documentação principal convertida
│   ├── yaml_syntax.md
│   ├── playbook_intro.md
│   └── ...
├── topics/                 # Guias combinados por tópico
│   ├── variables.md
│   ├── conditionals_loops.md
│   └── ...
└── ansible_builtin/        # Arquivos fonte Python (referência técnica)
```

### Como Consultar a Referência
1. **Para módulos específicos**: Use `reference/modules/<nome_modulo>.md`
2. **Para conceitos gerais**: Consulte `reference/topics/`
3. **Para detalhes completos**: Use `reference/docs/`

## Templates e Exemplos

### Templates Disponíveis
- `templates/basic_playbook.yml.j2` - Playbook básico
- `templates/role_structure.yml.j2` - Estrutura de role

### Exemplos Prontos
- `examples/` - Playbooks de exemplo para diferentes cenários

## Módulos Mais Comuns

### Gestão de Arquivos
- `file` - Gerenciamento de arquivos e diretórios
- `copy` - Cópia de arquivos
- `template` - Templates Jinja2
- `assemble` - Montagem de arquivos

### Gestão de Serviços
- `service` - Serviços SysVinit
- `systemd_service` - Serviços systemd

### Gestão de Pacotes
- `apt` - Pacotes Debian/Ubuntu
- `yum` - Pacotes RHEL/CentOS
- `dnf` - Pacotes modernos RHEL
- `package` - Gerenciador genérico

### Comandos
- `command` - Comandos secos
- `shell` - Comandos com shell
- `script` - Execução de scripts

### Gestão de Usuários
- `user` - Usuários do sistema
- `group` - Grupos do sistema

## Sintaxe Básica

### Estrutura de um Playbook
```yaml
---
- name: Nome do play
  hosts: grupo_de_hosts
  become: yes  # Usar sudo
  vars:
    variavel: valor
  tasks:
    - name: Nome da tarefa
      modulo:
        parametro: valor
      notify: handler_name  # Opcional
  handlers:
    - name: handler_name
      modulo:
        parametro: valor
```

### Patterns de Inventário
```
webservers              # Grupo específico
webservers[0]           # Primeiro host do grupo
webservers:!database    # Grupo webservers exceto database
webservers:&staging     # Interseção de grupos
*.example.com           # Wildcard
192.168.1.*             # Range de IPs
```

### Variáveis Importantes
- `inventory_hostname` - Nome do host atual
- `group_names` - Grupos que o host pertence
- `ansible_facts` - Facts do sistema
- `hostvars` - Variáveis de outros hosts

## Casos de Uso Comuns

### 1. Provisionamento de Servidor
```yaml
- name: Provisionar servidor web
  hosts: webservers
  roles:
    - common
    - nginx
    - php
    - monitoring
```

### 2. Deploy de Aplicação
```yaml
- name: Deploy da aplicação
  hosts: app_servers
  tasks:
    - name: Parar serviço
      service:
        name: myapp
        state: stopped
    
    - name: Atualizar código
      git:
        repo: https://github.com/meuapp/repo.git
        dest: /opt/myapp
        version: main
    
    - name: Instalar dependências
      pip:
        requirements: /opt/myapp/requirements.txt
    
    - name: Iniciar serviço
      service:
        name: myapp
        state: started
```

### 3. Configuração de Banco de Dados
```yaml
- name: Configurar PostgreSQL
  hosts: databases
  become: yes
  vars:
    pg_version: 14
    pg_databases:
      - app_production
      - app_staging
  tasks:
    - name: Instalar PostgreSQL
      apt:
        name: postgresql-{{ pg_version }}
        state: present
    
    - name: Criar bancos de dados
      postgresql_db:
        name: "{{ item }}"
        state: present
      loop: "{{ pg_databases }}"
```

## Boas Práticas

1. **Use nomes descritivos** para tasks e plays
2. **Seja idempotente** - playbooks devem poder ser executados múltiplas vezes
3. **Use roles** para organizar código reutilizável
4. **Valide variáveis** com `assert` ou `fail`
5. **Use handlers** para serviços que precisam reiniciar
6. **Implemente tratamento de erros** com `block/rescue/always`
7. **Use tags** para execução seletiva
8. **Documente** com comentários e nomes claros

## Comandos Úteis

```bash
# Executar playbook
ansible-playbook playbook.yml

# Executar com inventário específico
ansible-playbook -i inventory/hosts playbook.yml

# Executar apenas tasks com tag específica
ansible-playbook --tags "config,deploy" playbook.yml

# Executar em modo dry-run (check)
ansible-playbook --check playbook.yml

# Listar hosts que seriam afetados
ansible-playbook --list-hosts playbook.yml

# Executar com limite de hosts
ansible-playbook --limit "webservers" playbook.yml
```

## Solução de Problemas Comuns

### Erros de Conexão
- Verifique SSH e credenciais
- Teste com `ansible all -m ping`
- Verifique `ansible.cfg` e inventário

### Erros de Sintaxe YAML
- Use `ansible-playbook --syntax-check playbook.yml`
- Verifique indentação (2 espaços)
- Evite tabs

### Tarefas Não Idempotentes
- Use módulos apropriados
- Verifique `changed_when` e `creates`
- Use `check_mode` para teste

---
*Esta skill fornece assistência completa para trabalhar com Ansible. Use a referência em `reference/` para informações detalhadas.*