# sysvinit

**Descrição:** Manage SysV services.

## Descrição
- Controls services on target hosts that use the SysV init system.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True
- **Aliases:** service

Name of the service.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** started, stopped, restarted, reloaded

V(started)/V(stopped) are idempotent actions that will not run commands unless necessary. Not all init scripts support V(restarted) nor V(reloaded) natively, so these will both trigger a stop and start as needed.

### `enabled`
- **Tipo:** bool
- **Necessário:** não

Whether the service should start on boot. At least one of O(state) and O(enabled) are required.

### `sleep`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `1`

If the service is being V(restarted) or V(reloaded) then sleep this many seconds between the stop and start command. This helps to workaround badly behaving services.

### `pattern`
- **Tipo:** str
- **Necessário:** não

A substring to look for as would be found in the output of the I(ps) command as a stand-in for a status result.

### `runlevels`
- **Tipo:** list
- **Necessário:** não

The runlevels this script should be enabled/disabled from.

### `arguments`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** args

Additional arguments provided on the command line that some init scripts accept.

### `daemonize`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Have the module daemonize as the service itself might not do so properly.


## Exemplos de Uso

```yaml
- name: Make sure apache2 is started
  ansible.builtin.sysvinit:
      name: apache2
      state: started
      enabled: yes

- name: Sleep for 5 seconds between stop and start command of badly behaving service
  ansible.builtin.sysvinit:
      name: apache2
      state: restarted
      sleep: 5

- name: Make sure apache2 is started on runlevels 3 and 5
  ansible.builtin.sysvinit:
      name: apache2
      state: started
      enabled: yes
      runlevels:
        - 3
        - 5
```

## Valores de Retorno

- **results:** results from actions taken
  - Retornado: always
  - Tipo: complex