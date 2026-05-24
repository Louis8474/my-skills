# command

**Descrição:** Execute commands on targets

## Descrição
- The M(ansible.builtin.command) module takes the command name followed by a list of space-delimited arguments.
- The given command will be executed on all selected nodes.
- The command(s) will not be processed through the shell, so operations like C("*"), C("<"), C(">"), C("|"), C(";") and C("&") will not work. Also, environment variables are resolved via Python, not shell, see O(expand_argument_vars) and are left unchanged if not matched. Use the M(ansible.builtin.shell) module if you need these features.
- To create C(command) tasks that are easier to read than the ones using space-delimited arguments, pass parameters using the C(args) L(task keyword,https://docs.ansible.com/ansible/latest/reference_appendices/playbooks_keywords.html#task) or use O(cmd) parameter.
- Either a free form command or O(cmd) parameter is required, see the examples.
- For Windows targets, use the M(ansible.windows.win_command) module instead.

## Opções
### `expand_argument_vars`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Expands the arguments that are variables, for example C($HOME) will be expanded before being passed to the command to run.

### `free_form`
- **Tipo:** N/A
- **Necessário:** não

The command module takes a free form string as a command to run.

### `cmd`
- **Tipo:** str
- **Necessário:** não

The command to run.

### `argv`
- **Tipo:** list
- **Necessário:** não

Passes the command as a list rather than a string.

### `creates`
- **Tipo:** path
- **Necessário:** não

A filename or (since 2.0) glob pattern. If a matching file already exists, this step B(will not) be run.

### `removes`
- **Tipo:** path
- **Necessário:** não

A filename or (since 2.0) glob pattern. If a matching file exists, this step B(will) be run.

### `chdir`
- **Tipo:** path
- **Necessário:** não

Change into this directory before running the command.

### `stdin`
- **Tipo:** str
- **Necessário:** não

Set the stdin of the command directly to the specified value.

### `stdin_add_newline`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

If set to V(true), append a newline to stdin data.

### `strip_empty_ends`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Strip empty lines from the end of stdout/stderr in result.

## Ver também
- `ansible.builtin.raw`
- `ansible.builtin.script`
- `ansible.builtin.shell`
- `ansible.windows.win_command`


## Exemplos de Uso

```yaml
- name: Return motd to registered var
  ansible.builtin.command: cat /etc/motd
  register: mymotd

# free-form (string) arguments, all arguments on one line
- name: Run command if /path/to/database does not exist (without 'args')
  ansible.builtin.command: /usr/bin/make_database.sh db_user db_name creates=/path/to/database

# free-form (string) arguments, some arguments on separate lines with the 'args' keyword
# 'args' is a task keyword, passed at the same level as the module
- name: Run command if /path/to/database does not exist (with 'args' keyword)
  ansible.builtin.command: /usr/bin/make_database.sh db_user db_name
  args:
    creates: /path/to/database

# 'cmd' is module parameter
- name: Run command if /path/to/database does not exist (with 'cmd' parameter)
  ansible.builtin.command:
    cmd: /usr/bin/make_database.sh db_user db_name
    creates: /path/to/database

- name: Change the working directory to somedir/ and run the command as db_owner if /path/to/database does not exist
  ansible.builtin.command: /usr/bin/make_database.sh db_user db_name
  become: yes
  become_user: db_owner
  args:
    chdir: somedir/
    creates: /path/to/database

# argv (list) arguments, each argument on a separate line, 'args' keyword not necessary
# 'argv' is a parameter, indented one level from the module
- name: Use 'argv' to send a command as a list - leave 'command' empty
  ansible.builtin.command:
    argv:
      - /usr/bin/make_database.sh
      - Username with whitespace
      - dbname with whitespace
    creates: /path/to/database

- name: Run command using argv with mixed argument formats
  ansible.builtin.command:
    argv:
      - /path/to/binary
      - -v
      - --debug
      - --longopt
      - value for longopt
      - --other-longopt=value for other longopt
      - positional

- name: Safely use templated variable to run command. Always use the quote filter to avoid injection issues
  ansible.builtin.command: cat {{ myfile|quote }}
  register: myoutput
```

## Valores de Retorno

- **msg:** changed
  - Retornado: always
  - Tipo: bool
  - Exemplo: `True`
- **start:** The command execution start time.
  - Retornado: always
  - Tipo: str
  - Exemplo: `2017-09-29 22:03:48.083128`
- **end:** The command execution end time.
  - Retornado: always
  - Tipo: str
  - Exemplo: `2017-09-29 22:03:48.084657`
- **delta:** The command execution delta time.
  - Retornado: always
  - Tipo: str
  - Exemplo: `0:00:00.001529`
- **stdout:** The command standard output.
  - Retornado: always
  - Tipo: str
  - Exemplo: `Clustering node rabbit@slave1 with rabbit@master …`
- **stderr:** The command standard error.
  - Retornado: always
  - Tipo: str
  - Exemplo: `ls cannot access foo: No such file or directory`
- **cmd:** The command executed by the task.
  - Retornado: always
  - Tipo: list
  - Exemplo: `['echo', 'hello']`
- **rc:** The command return code (0 means success).
  - Retornado: always
  - Tipo: int
  - Exemplo: `0`
- **stdout_lines:** The command standard output split in lines.
  - Retornado: always
  - Tipo: list
  - Exemplo: `["u'Clustering node rabbit@slave1 with rabbit@master …'"]`
- **stderr_lines:** The command standard error split in lines.
  - Retornado: always
  - Tipo: list
  - Exemplo: `[{"u'ls cannot access foo": "No such file or directory'"}, "u'ls …'"]`