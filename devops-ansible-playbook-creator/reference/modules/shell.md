# shell

**Descrição:** Execute shell commands on targets

## Descrição
- The M(ansible.builtin.shell) module takes the command name followed by a list of space-delimited arguments.
- Either a free form command or O(cmd) parameter is required, see the examples.
- It is almost exactly like the M(ansible.builtin.command) module but runs the command through a shell (C(/bin/sh)) on the remote node.
- For Windows targets, use the M(ansible.windows.win_shell) module instead.

## Opções
### `free_form`
- **Tipo:** str
- **Necessário:** não

The shell module takes a free form command to run, as a string.

### `cmd`
- **Tipo:** str
- **Necessário:** não

The command to run followed by optional arguments.

### `creates`
- **Tipo:** path
- **Necessário:** não

A filename, when it already exists, this step will B(not) be run.

### `removes`
- **Tipo:** path
- **Necessário:** não

A filename, when it does not exist, this step will B(not) be run.

### `chdir`
- **Tipo:** path
- **Necessário:** não

Change into this directory before running the command.

### `executable`
- **Tipo:** path
- **Necessário:** não

Change the shell used to execute the command.

### `stdin`
- **Tipo:** str
- **Necessário:** não

Set the stdin of the command directly to the specified value.

### `stdin_add_newline`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Whether to append a newline to stdin data.

## Ver também
- `ansible.builtin.command`
- `ansible.builtin.raw`
- `ansible.builtin.script`
- `ansible.windows.win_shell`


## Exemplos de Uso

```yaml
- name: Execute the command in remote shell; stdout goes to the specified file on the remote
  ansible.builtin.shell: somescript.sh >> somelog.txt

- name: Change the working directory to somedir/ before executing the command
  ansible.builtin.shell: somescript.sh >> somelog.txt
  args:
    chdir: somedir/

# You can also use the 'args' form to provide the options.
- name: This command will change the working directory to somedir/ and will only run when somedir/somelog.txt doesn't exist
  ansible.builtin.shell: somescript.sh >> somelog.txt
  args:
    chdir: somedir/
    creates: somelog.txt

# You can also use the 'cmd' parameter instead of free form format.
- name: This command will change the working directory to somedir/
  ansible.builtin.shell:
    cmd: ls -l | grep log
    chdir: somedir/

- name: Run a command that uses non-posix shell-isms (in this example /bin/sh doesn't handle redirection and wildcards together but bash does)
  ansible.builtin.shell: cat < /tmp/*txt
  args:
    executable: /bin/bash

- name: Run a command using a templated variable (always use quote filter to avoid injection)
  ansible.builtin.shell: cat {{ myfile|quote }}

# You can use shell to run other executables to perform actions inline
- name: Run expect to wait for a successful PXE boot via out-of-band CIMC
  ansible.builtin.shell: |
    set timeout 300
    spawn ssh admin@{{ cimc_host }}

    expect "password:"
    send "{{ cimc_password }}\n"

    expect "\n{{ cimc_name }}"
    send "connect host\n"

    expect "pxeboot.n12"
    send "\n"

    exit 0
  args:
    executable: /usr/bin/expect
  delegate_to: localhost
```

## Valores de Retorno

- **msg:** changed
  - Retornado: always
  - Tipo: bool
  - Exemplo: `True`
- **start:** The command execution start time.
  - Retornado: always
  - Tipo: str
  - Exemplo: `2016-02-25 09:18:26.429568`
- **end:** The command execution end time.
  - Retornado: always
  - Tipo: str
  - Exemplo: `2016-02-25 09:18:26.755339`
- **delta:** The command execution delta time.
  - Retornado: always
  - Tipo: str
  - Exemplo: `0:00:00.325771`
- **stdout:** The command standard output.
  - Retornado: always
  - Tipo: str
  - Exemplo: `Clustering node rabbit@slave1 with rabbit@master …`
- **stderr:** The command standard error.
  - Retornado: always
  - Tipo: str
  - Exemplo: `ls: cannot access foo: No such file or directory`
- **cmd:** The command executed by the task.
  - Retornado: always
  - Tipo: str
  - Exemplo: `rabbitmqctl join_cluster rabbit@master`
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