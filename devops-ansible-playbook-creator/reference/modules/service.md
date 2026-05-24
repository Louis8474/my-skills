# service

**Descrição:** Manage services

## Descrição
- Controls services on remote hosts. Supported init systems include BSD init, OpenRC, SysV, Solaris SMF, systemd, upstart.
- This module acts as a proxy to the underlying service manager module. While all arguments will be passed to the underlying module, not all modules support the same arguments. This documentation only covers the minimum intersection of module arguments that all service manager modules support.
- This module is a proxy for multiple more specific service manager modules (such as M(ansible.builtin.systemd) and M(ansible.builtin.sysvinit)). This allows management of a heterogeneous environment of machines without creating a specific task for each service manager. The module to be executed is determined by the O(use) option, which defaults to the service manager discovered by M(ansible.builtin.setup).  If M(ansible.builtin.setup) was not yet run, this module may run it.
- For Windows targets, use the M(ansible.windows.win_service) module instead.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True

Name of the service.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** reloaded, restarted, started, stopped

V(started)/V(stopped) are idempotent actions that will not run commands unless necessary.

### `sleep`
- **Tipo:** int
- **Necessário:** não

If the service is being V(restarted) then sleep this many seconds between the stop and start command.

### `pattern`
- **Tipo:** str
- **Necessário:** não

If the service does not respond to the status command, name a substring to look for as would be found in the output of the C(ps) command as a stand-in for a status result.

### `enabled`
- **Tipo:** bool
- **Necessário:** não

Whether the service should start on boot.

### `runlevel`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `default`

For OpenRC init scripts (e.g. Gentoo) only.

### `arguments`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** ``
- **Aliases:** args

Additional arguments provided on the command line.

### `use`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `auto`

The service module actually uses system specific modules, normally through auto detection, this setting can force a specific module.

## Ver também
- `ansible.windows.win_service`


## Exemplos de Uso

```yaml
- name: Start service httpd, if not started
  ansible.builtin.service:
    name: httpd
    state: started

- name: Stop service httpd, if started
  ansible.builtin.service:
    name: httpd
    state: stopped

- name: Restart service httpd, in all cases
  ansible.builtin.service:
    name: httpd
    state: restarted

- name: Reload service httpd, in all cases
  ansible.builtin.service:
    name: httpd
    state: reloaded

- name: Enable service httpd, and not touch the state
  ansible.builtin.service:
    name: httpd
    enabled: yes

- name: Start service foo, based on running process /usr/bin/foo
  ansible.builtin.service:
    name: foo
    pattern: /usr/bin/foo
    state: started

- name: Restart network service for interface eth0
  ansible.builtin.service:
    name: network
    state: restarted
    args: eth0
```

