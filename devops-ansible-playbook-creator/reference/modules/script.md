# script

**Descrição:** Runs a local script on a remote node after transferring it

## Descrição
- The M(ansible.builtin.script) module takes the script name followed by a list of space-delimited arguments.
- Either a free-form command or O(cmd) parameter is required, see the examples.
- The local script at the path will be transferred to the remote node and then executed.
- The given script will be processed through the shell environment on the remote node.
- This module does not require Python on the remote system, much like the M(ansible.builtin.raw) module.
- This module is also supported for Windows targets.

## Opções
### `free_form`
- **Tipo:** str
- **Necessário:** não

Path to the local script file followed by optional arguments.

### `cmd`
- **Tipo:** str
- **Necessário:** não

Path to the local script to run followed by optional arguments.

### `creates`
- **Tipo:** str
- **Necessário:** não

A filename on the remote node, when it already exists, this step will B(not) be run.

### `removes`
- **Tipo:** str
- **Necessário:** não

A filename on the remote node, when it does not exist, this step will B(not) be run.

### `chdir`
- **Tipo:** str
- **Necessário:** não

Change into this directory on the remote node before running the script.

### `executable`
- **Tipo:** str
- **Necessário:** não

Name or path of an executable to invoke the script with.

## Ver também
- `ansible.builtin.shell`
- `ansible.windows.win_shell`


## Exemplos de Uso

```yaml
- name: Run a script with arguments (free form)
  ansible.builtin.script: /some/local/script.sh --some-argument 1234

- name: Run a script with arguments (using 'cmd' parameter)
  ansible.builtin.script:
    cmd: /some/local/script.sh --some-argument 1234

- name: Run a script only if file.txt does not exist on the remote node
  ansible.builtin.script: /some/local/create_file.sh --some-argument 1234
  args:
    creates: /the/created/file.txt

- name: Run a script only if file.txt exists on the remote node
  ansible.builtin.script: /some/local/remove_file.sh --some-argument 1234
  args:
    removes: /the/removed/file.txt

- name: Run a script using an executable in a non-system path
  ansible.builtin.script: /some/local/script
  args:
    executable: /some/remote/executable

- name: Run a script using an executable in a system path
  ansible.builtin.script: /some/local/script.py
  args:
    executable: python3

- name: Run a Powershell script on a Windows host
  script: subdirectories/under/path/with/your/playbook/script.ps1
```