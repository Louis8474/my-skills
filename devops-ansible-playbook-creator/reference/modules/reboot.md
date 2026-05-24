# reboot

**Descrição:** Reboot a machine

## Descrição
- Reboot a machine, wait for it to go down, come back up, and respond to commands.
- For Windows targets, use the M(ansible.windows.win_reboot) module instead.

## Opções
### `pre_reboot_delay`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `0`

Seconds to wait before reboot. Passed as a parameter to the reboot command.

### `post_reboot_delay`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `0`

Seconds to wait after the reboot command was successful before attempting to validate the system rebooted successfully.

### `reboot_timeout`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `600`

Maximum seconds to wait for machine to reboot and respond to a test command.

### `connect_timeout`
- **Tipo:** int
- **Necessário:** não

Maximum seconds to wait for a successful connection to the managed hosts before trying again.

### `test_command`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `whoami`

Command to run on the rebooted host and expect success from to determine the machine is ready for further tasks.

### `msg`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `Reboot initiated by Ansible`

Message to display to users before reboot.

### `search_paths`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `['/sbin', '/bin', '/usr/sbin', '/usr/bin', '/usr/local/sbin']`

Paths to search on the remote machine for the C(shutdown) command.

### `boot_time_command`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `cat /proc/sys/kernel/random/boot_id`

Command to run that returns a unique string indicating the last time the system was booted.

### `reboot_command`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `[determined based on target OS]`

Command to run that reboots the system, including any parameters passed to the command.

## Ver também
- `ansible.windows.win_reboot`


## Exemplos de Uso

```yaml
- name: Unconditionally reboot the machine with all defaults
  ansible.builtin.reboot:

- name: Reboot a slow machine that might have lots of updates to apply
  ansible.builtin.reboot:
    reboot_timeout: 3600

- name: Reboot a machine with shutdown command in unusual place
  ansible.builtin.reboot:
    search_paths:
     - '/lib/molly-guard'

- name: Reboot machine using a custom reboot command
  ansible.builtin.reboot:
    reboot_command: launchctl reboot userspace
    boot_time_command: uptime | cut -d ' ' -f 5

- name: Reboot machine and send a message
  ansible.builtin.reboot:
    msg: "Rebooting machine in 5 seconds"
```

## Valores de Retorno

- **rebooted:** true if the machine was rebooted
  - Retornado: always
  - Tipo: bool
  - Exemplo: `True`
- **elapsed:** The number of seconds that elapsed waiting for the system to be rebooted.
  - Retornado: always
  - Tipo: int
  - Exemplo: `23`