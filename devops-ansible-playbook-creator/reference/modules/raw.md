# raw

**Descrição:** Executes a low-down and dirty command

## Descrição
- Executes a low-down and dirty SSH command, not going through the module subsystem.
- This is useful and should only be done in a few cases. A common case is installing C(python) on a system without python installed by default. Another is speaking to any devices such as routers that do not have any Python installed. In any other case, using the M(ansible.builtin.shell) or M(ansible.builtin.command) module is much more appropriate.
- Arguments given to C(raw) are run directly through the configured remote shell.
- Standard output, error output and return code are returned when available.
- There is no change handler support for this module.
- This module does not require python on the remote system, much like the M(ansible.builtin.script) module.
- This module is also supported for Windows targets.
- If the command returns non UTF-8 data, it must be encoded to avoid issues. One option is to pipe the output through C(base64).

## Opções
### `free_form`
- **Tipo:** N/A
- **Necessário:** True

The raw module takes a free form command to run.

### `executable`
- **Tipo:** N/A
- **Necessário:** não

Change the shell used to execute the command. Should be an absolute path to the executable.

## Ver também
- `ansible.builtin.command`
- `ansible.builtin.shell`
- `ansible.windows.win_command`
- `ansible.windows.win_shell`


## Exemplos de Uso

```yaml
- name: Bootstrap a host without Python installed
  ansible.builtin.raw: dnf install -y python3 python3-libdnf

- name: Run a command that uses non-posix shell-isms (in this example /bin/sh doesn't handle redirection and wildcards together but bash does)
  ansible.builtin.raw: cat < /tmp/*txt
  args:
    executable: /bin/bash

- name: Safely use templated variables. Always use quote filter to avoid injection issues.
  ansible.builtin.raw: "{{ package_mgr|quote }} {{ pkg_flags|quote }} install {{ python|quote }}"

- name: List user accounts on a Windows system
  ansible.builtin.raw: Get-WmiObject -Class Win32_UserAccount
```