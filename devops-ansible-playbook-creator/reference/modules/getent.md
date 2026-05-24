# getent

**Descrição:** A wrapper to the unix getent utility

## Descrição
- Runs getent against one of its various databases and returns information into the host's facts, in a C(getent_<database>) prefixed variable.

## Opções
### `database`
- **Tipo:** str
- **Necessário:** True

The name of a getent database supported by the target system (passwd, group, hosts, etc).

### `key`
- **Tipo:** str
- **Necessário:** não

Key from which to return values from the specified database, otherwise the full contents are returned.

### `service`
- **Tipo:** str
- **Necessário:** não

Override all databases with the specified service

### `split`
- **Tipo:** str
- **Necessário:** não

Character used to split the database values into lists/arrays such as V(:) or V(\\t), otherwise it will try to pick one depending on the database.

### `fail_key`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

If a supplied key is missing this will make the task fail if V(true).


## Exemplos de Uso

```yaml
- name: Get root user info
  ansible.builtin.getent:
    database: passwd
    key: root
- ansible.builtin.debug:
    var: ansible_facts.getent_passwd

- name: Get all groups
  ansible.builtin.getent:
    database: group
    split: ':'
- ansible.builtin.debug:
    var: ansible_facts.getent_group

- name: Get all hosts, split by tab
  ansible.builtin.getent:
    database: hosts
- ansible.builtin.debug:
    var: ansible_facts.getent_hosts

- name: Get http service info, no error if missing
  ansible.builtin.getent:
    database: services
    key: http
    fail_key: False
- ansible.builtin.debug:
    var: ansible_facts.getent_services

- name: Get user password hash (requires sudo/root)
  ansible.builtin.getent:
    database: shadow
    key: www-data
    split: ':'
- ansible.builtin.debug:
    var: ansible_facts.getent_shadow
```

## Valores de Retorno

- **ansible_facts:** Facts to add to ansible_facts.
  - Retornado: always
  - Tipo: dict