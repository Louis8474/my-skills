# cron

**Descrição:** Manage cron.d and crontab entries

## Descrição
- Use this module to manage crontab and environment variables entries. This module allows you to create environment variables and named crontab entries, update, or delete them.
- When crontab jobs are managed: the module includes one line with the description of the crontab entry C("#Ansible: <name>") corresponding to the O(name) passed to the module, which is used by future ansible/module calls to find/check the state. The O(name) parameter should be unique, and changing the O(name) value will result in a new cron task being created (or a different one being removed).
- When environment variables are managed, no comment line is added, but, when the module needs to find/check the state, it uses the O(name) parameter to find the environment variable definition line.
- When using symbols such as C(%), they must be properly escaped.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True

Description of a crontab entry or, if O(env) is set, the name of environment variable.

### `user`
- **Tipo:** str
- **Necessário:** não

The specific user whose crontab should be modified.

### `job`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** value

The command to execute or, if O(env) is set, the value of environment variable.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

Whether to ensure the job or environment variable is present or absent.

### `cron_file`
- **Tipo:** path
- **Necessário:** não

If specified, uses this file instead of an individual user's crontab. The assumption is that this file is exclusively managed by the module, do not use if the file contains multiple entries, NEVER use for /etc/crontab.

### `backup`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If set, create a backup of the crontab before it is modified. The location of the backup is returned in the RV(ignore:backup_file) variable by this module.

### `minute`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `*`

Minute when the job should run (V(0-59), V(*), V(*/2), and so on).

### `hour`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `*`

Hour when the job should run (V(0-23), V(*), V(*/2), and so on).

### `day`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `*`
- **Aliases:** dom

Day of the month the job should run (V(1-31), V(*), V(*/2), and so on).

### `month`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `*`

Month of the year the job should run (V(JAN-DEC) or V(1-12), V(*), V(*/2), and so on).

### `weekday`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `*`
- **Aliases:** dow

Day of the week that the job should run (V(SUN-SAT) or V(0-6), V(*), and so on).

### `special_time`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** annually, daily, hourly, monthly, reboot, weekly, yearly

Special time specification nickname.

### `disabled`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If the job should be disabled (commented out) in the crontab.

### `env`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If set, manages a crontab's environment variable.

### `insertafter`
- **Tipo:** str
- **Necessário:** não

Used with O(state=present) and O(env).

### `insertbefore`
- **Tipo:** str
- **Necessário:** não

Used with O(state=present) and O(env).


## Exemplos de Uso

```yaml
- name: Ensure a job that runs at 2 and 5 exists. Creates an entry like "0 5,2 * * ls -alh > /dev/null"
  ansible.builtin.cron:
    name: "check dirs"
    minute: "0"
    hour: "5,2"
    job: "ls -alh > /dev/null"

- name: 'Ensure an old job is no longer present. Removes any job that is prefixed by "#Ansible: an old job" from the crontab'
  ansible.builtin.cron:
    name: "an old job"
    state: absent

- name: Creates an entry like "@reboot /some/job.sh"
  ansible.builtin.cron:
    name: "a job for reboot"
    special_time: reboot
    job: "/some/job.sh"

- name: Creates an entry like "PATH=/opt/bin" on top of crontab
  ansible.builtin.cron:
    name: PATH
    env: yes
    job: /opt/bin

- name: Creates an entry like "APP_HOME=/srv/app" and insert it after PATH declaration
  ansible.builtin.cron:
    name: APP_HOME
    env: yes
    job: /srv/app
    insertafter: PATH

- name: Creates a cron file under /etc/cron.d
  ansible.builtin.cron:
    name: yum autoupdate
    weekday: "2"
    minute: "0"
    hour: "12"
    user: root
    job: "YUMINTERACTIVE=0 /usr/sbin/yum-autoupdate"
    cron_file: ansible_yum-autoupdate

- name: Removes a cron file from under /etc/cron.d
  ansible.builtin.cron:
    name: "yum autoupdate"
    cron_file: ansible_yum-autoupdate
    state: absent

- name: Removes "APP_HOME" environment variable from crontab
  ansible.builtin.cron:
    name: APP_HOME
    env: yes
    state: absent
```

