# wait_for_connection

**Descrição:** Waits until remote system is reachable/usable

## Descrição
- Waits for a total of O(timeout) seconds.
- Retries the transport connection after a timeout of O(connect_timeout).
- Tests the transport connection every O(sleep) seconds.
- This module makes use of internal ansible transport (and configuration) and the M(ansible.builtin.ping)/M(ansible.windows.win_ping) modules to guarantee correct end-to-end functioning.
- This module is also supported for Windows targets.

## Opções
### `connect_timeout`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `5`

Maximum number of seconds to wait for a connection to happen before closing and retrying.

### `delay`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `0`

Number of seconds to wait before starting to poll.

### `sleep`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `1`

Number of seconds to sleep between checks.

### `timeout`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `600`

Maximum number of seconds to wait for.

## Ver também
- `ansible.builtin.wait_for`
- `ansible.windows.win_wait_for`
- `community.windows.win_wait_for_process`


## Exemplos de Uso

```yaml
- name: Wait 600 seconds for target connection to become reachable/usable
  ansible.builtin.wait_for_connection:

- name: Wait 300 seconds, but only start checking after 60 seconds
  ansible.builtin.wait_for_connection:
    delay: 60
    timeout: 300

# Wake desktops, wait for them to become ready and continue playbook
- hosts: all
  gather_facts: no
  tasks:
  - name: Send magic Wake-On-Lan packet to turn on individual systems
    community.general.wakeonlan:
      mac: '{{ mac }}'
      broadcast: 192.168.0.255
    delegate_to: localhost

  - name: Wait for system to become reachable
    ansible.builtin.wait_for_connection:

  - name: Gather facts for first time
    ansible.builtin.setup:

# Build a new VM, wait for it to become ready and continue playbook
- hosts: all
  gather_facts: no
  tasks:
  - name: Clone new VM, if missing
    community.vmware.vmware_guest:
      hostname: '{{ vcenter_ipaddress }}'
      name: '{{ inventory_hostname_short }}'
      template: Windows 2012R2
      customization:
        hostname: '{{ vm_shortname }}'
        runonce:
        - cmd.exe /c winrm.cmd quickconfig -quiet -force
    delegate_to: localhost

  - name: Wait for system to become reachable over WinRM, polling every 10 seconds
    ansible.builtin.wait_for_connection:
      timeout: 900
      sleep: 10

  - name: Gather facts for first time
    ansible.builtin.setup:
```

## Valores de Retorno

- **elapsed:** The number of seconds that elapsed waiting for the connection to appear.
  - Retornado: always
  - Tipo: float
  - Exemplo: `23.1`