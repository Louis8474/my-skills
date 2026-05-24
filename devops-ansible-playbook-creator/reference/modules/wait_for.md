# wait_for

**Descrição:** Waits for a condition before continuing

## Descrição
- You can wait for a set amount of time O(timeout), this is the default if nothing is specified or just O(timeout) is specified. This does not produce an error.
- Waiting for a port to become available is useful for when services are not immediately available after their init scripts return which is true of certain Java application servers.
- It is also useful when starting guests with the M(community.libvirt.virt) module and needing to pause until they are ready.
- This module can also be used to wait for a regex match a string to be present in a file.
- In Ansible 1.6 and later, this module can also be used to wait for a file to be available or absent on the filesystem.
- In Ansible 1.8 and later, this module can also be used to wait for active connections to be closed before continuing, useful if a node is being rotated out of a load balancer pool.
- For Windows targets, use the M(ansible.windows.win_wait_for) module instead.

## Opções
### `host`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `127.0.0.1`

A resolvable hostname or IP address to wait for.

### `timeout`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `300`

Maximum number of seconds to wait for, when used with another condition it will force an error.

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

### `port`
- **Tipo:** int
- **Necessário:** não

Port number to poll.

### `active_connection_states`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `['ESTABLISHED', 'FIN_WAIT1', 'FIN_WAIT2', 'SYN_RECV', 'SYN_SENT', 'TIME_WAIT']`

The list of TCP connection states which are counted as active connections.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `started`
- **Escolhas:** absent, drained, present, started, stopped

Either V(present), V(started), or V(stopped), V(absent), or V(drained).

### `path`
- **Tipo:** path
- **Necessário:** não

Path to a file on the filesystem that must exist before continuing.

### `search_regex`
- **Tipo:** str
- **Necessário:** não

Can be used to match a string in either a file or a socket connection.

### `exclude_hosts`
- **Tipo:** list
- **Necessário:** não

List of hosts or IPs to ignore when looking for active TCP connections for V(drained) state.

### `sleep`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `1`

Number of seconds to sleep between checks.

### `msg`
- **Tipo:** str
- **Necessário:** não

This overrides the normal error message from a failure to meet the required conditions.

## Ver também
- `ansible.builtin.wait_for_connection`
- `ansible.windows.win_wait_for`
- `community.windows.win_wait_for_process`


## Exemplos de Uso

```yaml
- name: Sleep for 300 seconds and continue with play
  ansible.builtin.wait_for:
    timeout: 300
  delegate_to: localhost

- name: Wait for port 8000 to become open on the host, don't start checking for 10 seconds
  ansible.builtin.wait_for:
    port: 8000
    delay: 10

- name: Waits for port 8000 of any IP to close active connections, don't start checking for 10 seconds
  ansible.builtin.wait_for:
    host: 0.0.0.0
    port: 8000
    delay: 10
    state: drained

- name: Wait for port 8000 of any IP to close active connections, ignoring connections for specified hosts
  ansible.builtin.wait_for:
    host: 0.0.0.0
    port: 8000
    state: drained
    exclude_hosts: 10.2.1.2,10.2.1.3

- name: Wait until the file /tmp/foo is present before continuing
  ansible.builtin.wait_for:
    path: /tmp/foo

- name: Wait until the string "completed" is in the file /tmp/foo before continuing
  ansible.builtin.wait_for:
    path: /tmp/foo
    search_regex: completed

- name: Wait until the string "tomcat up" is in syslog, use regex character set to avoid self match
  ansible.builtin.wait_for:
    path: /var/log/syslog
    search_regex: 'tomcat [u]p'

- name: Wait until regex pattern matches in the file /tmp/foo and print the matched group
  ansible.builtin.wait_for:
    path: /tmp/foo
    search_regex: completed (?P<task>\w+)
  register: waitfor
- ansible.builtin.debug:
    msg: Completed {{ waitfor['match_groupdict']['task'] }}

- name: Wait until the lock file is removed
  ansible.builtin.wait_for:
    path: /var/lock/file.lock
    state: absent

- name: Wait until the process is finished and pid was destroyed
  ansible.builtin.wait_for:
    path: /proc/3466/status
    state: absent

- name: Output customized message when failed
  ansible.builtin.wait_for:
    path: /tmp/foo
    state: present
    msg: Timeout to find file /tmp/foo

# Do not assume the inventory_hostname is resolvable and delay 10 seconds at start
- name: Wait 300 seconds for port 22 to become open and contain "OpenSSH"
  ansible.builtin.wait_for:
    port: 22
    host: '{{ (ansible_ssh_host|default(ansible_host))|default(inventory_hostname) }}'
    search_regex: OpenSSH
    delay: 10
    timeout: 300
  delegate_to: localhost

# Same as above but using config lookup for the target,
# most plugins use 'remote_addr', but ssh uses 'host'
- name: Wait 300 seconds for port 22 to become open and contain "OpenSSH"
  ansible.builtin.wait_for:
    port: 22
    host: "{{ lookup('config', 'host', plugin_name='ssh', plugin_type='connection') }}"
    search_regex: OpenSSH
    delay: 10
    timeout: 300
  delegate_to: localhost
```

## Valores de Retorno

- **elapsed:** The number of seconds that elapsed while waiting
  - Retornado: always
  - Tipo: int
  - Exemplo: `23`
- **match_groups:** Tuple containing all the subgroups of the match as returned by U(https://docs.python.org/3/library/re.html#re.Match.groups)
  - Retornado: always
  - Tipo: list
  - Exemplo: `['match 1', 'match 2']`
- **match_groupdict:** Dictionary containing all the named subgroups of the match, keyed by the subgroup name, as returned by U(https://docs.python.org/3/library/re.html#re.Match.groupdict)
  - Retornado: always
  - Tipo: dict
  - Exemplo: `{'group': 'match'}`