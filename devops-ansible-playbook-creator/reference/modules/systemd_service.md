# systemd_service

**Descrição:** Manage systemd units

## Descrição
- Controls systemd units (services, timers, and so on) on remote hosts.
- M(ansible.builtin.systemd) is renamed to M(ansible.builtin.systemd_service) to better reflect the scope of the module. M(ansible.builtin.systemd) is kept as an alias for backward compatibility.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** service, unit

Name of the unit. This parameter takes the name of exactly one unit to work with.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** reloaded, restarted, started, stopped

V(started)/V(stopped) are idempotent actions that will not run commands unless necessary. V(restarted) will always bounce the unit. V(reloaded) will always reload and if the service is not running at the moment of the reload, it is started.

### `enabled`
- **Tipo:** bool
- **Necessário:** não

Whether the unit should start on boot. At least one of O(state) or O(enabled) are required.

### `force`
- **Tipo:** bool
- **Necessário:** não

Whether to override existing symlinks.

### `masked`
- **Tipo:** bool
- **Necessário:** não

Whether the unit should be masked or not. A masked unit is impossible to start.

### `daemon_reload`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`
- **Aliases:** daemon-reload

Run C(daemon-reload) before doing any other operations, to make sure systemd has read any changes.

### `daemon_reexec`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`
- **Aliases:** daemon-reexec

Run daemon_reexec command before doing any other operations, the systemd manager will serialize the manager state.

### `scope`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `system`
- **Escolhas:** system, user, global

Run C(systemctl) within a given service manager scope, either as the default system scope V(system), the current user's scope V(user), or the scope of all users V(global).

### `no_block`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Do not synchronously wait for the requested operation to finish. Enqueued job will continue without Ansible blocking on its completion.


## Exemplos de Uso

```yaml
- name: Make sure a service unit is running
  ansible.builtin.systemd_service:
    state: started
    name: httpd

- name: Stop service cron on debian, if running
  ansible.builtin.systemd_service:
    name: cron
    state: stopped

- name: Restart service cron on centos, in all cases, also issue daemon-reload to pick up config changes
  ansible.builtin.systemd_service:
    state: restarted
    daemon_reload: true
    name: crond

- name: Reload service httpd, in all cases
  ansible.builtin.systemd_service:
    name: httpd.service
    state: reloaded

- name: Enable service httpd and ensure it is not masked
  ansible.builtin.systemd_service:
    name: httpd
    enabled: true
    masked: no

- name: Enable a timer unit for dnf-automatic
  ansible.builtin.systemd_service:
    name: dnf-automatic.timer
    state: started
    enabled: true

- name: Just force systemd to reread configs (2.4 and above)
  ansible.builtin.systemd_service:
    daemon_reload: true

- name: Just force systemd to re-execute itself (2.8 and above)
  ansible.builtin.systemd_service:
    daemon_reexec: true

- name: Run a user service when XDG_RUNTIME_DIR is not set on remote login
  ansible.builtin.systemd_service:
    name: myservice
    state: started
    scope: user
  environment:
    XDG_RUNTIME_DIR: "/run/user/{{ myuid }}"
```

## Valores de Retorno

- **status:** A dictionary with the key=value pairs returned from C(systemctl show).
  - Retornado: success
  - Tipo: dict
  - Exemplo: `{'ActiveEnterTimestamp': 'Sun 2016-05-15 18:28:49 EDT', 'ActiveEnterTimestampMonotonic': '8135942', 'ActiveExitTimestampMonotonic': '0', 'ActiveState': 'active', 'After': 'auditd.service systemd-user-sessions.service time-sync.target systemd-journald.socket basic.target system.slice', 'AllowIsolate': 'no', 'Before': 'shutdown.target multi-user.target', 'BlockIOAccounting': 'no', 'BlockIOWeight': '1000', 'CPUAccounting': 'no', 'CPUSchedulingPolicy': '0', 'CPUSchedulingPriority': '0', 'CPUSchedulingResetOnFork': 'no', 'CPUShares': '1024', 'CanIsolate': 'no', 'CanReload': 'yes', 'CanStart': 'yes', 'CanStop': 'yes', 'CapabilityBoundingSet': '18446744073709551615', 'ConditionResult': 'yes', 'ConditionTimestamp': 'Sun 2016-05-15 18:28:49 EDT', 'ConditionTimestampMonotonic': '7902742', 'Conflicts': 'shutdown.target', 'ControlGroup': '/system.slice/crond.service', 'ControlPID': '0', 'DefaultDependencies': 'yes', 'Delegate': 'no', 'Description': 'Command Scheduler', 'DevicePolicy': 'auto', 'EnvironmentFile': '/etc/sysconfig/crond (ignore_errors=no)', 'ExecMainCode': '0', 'ExecMainExitTimestampMonotonic': '0', 'ExecMainPID': '595', 'ExecMainStartTimestamp': 'Sun 2016-05-15 18:28:49 EDT', 'ExecMainStartTimestampMonotonic': '8134990', 'ExecMainStatus': '0', 'ExecReload': '{ path=/bin/kill ; argv[]=/bin/kill -HUP $MAINPID ; ignore_errors=no ; start_time=[n/a] ; stop_time=[n/a] ; pid=0 ; code=(null) ; status=0/0 }', 'ExecStart': '{ path=/usr/sbin/crond ; argv[]=/usr/sbin/crond -n $CRONDARGS ; ignore_errors=no ; start_time=[n/a] ; stop_time=[n/a] ; pid=0 ; code=(null) ; status=0/0 }', 'FragmentPath': '/usr/lib/systemd/system/crond.service', 'GuessMainPID': 'yes', 'IOScheduling': '0', 'Id': 'crond.service', 'IgnoreOnIsolate': 'no', 'IgnoreOnSnapshot': 'no', 'IgnoreSIGPIPE': 'yes', 'InactiveEnterTimestampMonotonic': '0', 'InactiveExitTimestamp': 'Sun 2016-05-15 18:28:49 EDT', 'InactiveExitTimestampMonotonic': '8135942', 'JobTimeoutUSec': '0', 'KillMode': 'process', 'KillSignal': '15', 'LimitAS': '18446744073709551615', 'LimitCORE': '18446744073709551615', 'LimitCPU': '18446744073709551615', 'LimitDATA': '18446744073709551615', 'LimitFSIZE': '18446744073709551615', 'LimitLOCKS': '18446744073709551615', 'LimitMEMLOCK': '65536', 'LimitMSGQUEUE': '819200', 'LimitNICE': '0', 'LimitNOFILE': '4096', 'LimitNPROC': '3902', 'LimitRSS': '18446744073709551615', 'LimitRTPRIO': '0', 'LimitRTTIME': '18446744073709551615', 'LimitSIGPENDING': '3902', 'LimitSTACK': '18446744073709551615', 'LoadState': 'loaded', 'MainPID': '595', 'MemoryAccounting': 'no', 'MemoryLimit': '18446744073709551615', 'MountFlags': '0', 'Names': 'crond.service', 'NeedDaemonReload': 'no', 'Nice': '0', 'NoNewPrivileges': 'no', 'NonBlocking': 'no', 'NotifyAccess': 'none', 'OOMScoreAdjust': '0', 'OnFailureIsolate': 'no', 'PermissionsStartOnly': 'no', 'PrivateNetwork': 'no', 'PrivateTmp': 'no', 'RefuseManualStart': 'no', 'RefuseManualStop': 'no', 'RemainAfterExit': 'no', 'Requires': 'basic.target', 'Restart': 'no', 'RestartUSec': '100ms', 'Result': 'success', 'RootDirectoryStartOnly': 'no', 'SameProcessGroup': 'no', 'SecureBits': '0', 'SendSIGHUP': 'no', 'SendSIGKILL': 'yes', 'Slice': 'system.slice', 'StandardError': 'inherit', 'StandardInput': 'null', 'StandardOutput': 'journal', 'StartLimitAction': 'none', 'StartLimitBurst': '5', 'StartLimitInterval': '10000000', 'StatusErrno': '0', 'StopWhenUnneeded': 'no', 'SubState': 'running', 'SyslogLevelPrefix': 'yes', 'SyslogPriority': '30', 'TTYReset': 'no', 'TTYVHangup': 'no', 'TTYVTDisallocate': 'no', 'TimeoutStartUSec': '1min 30s', 'TimeoutStopUSec': '1min 30s', 'TimerSlackNSec': '50000', 'Transient': 'no', 'Type': 'simple', 'UMask': '0022', 'UnitFileState': 'enabled', 'WantedBy': 'multi-user.target', 'Wants': 'system.slice', 'WatchdogTimestampMonotonic': '0', 'WatchdogUSec': '0'}`