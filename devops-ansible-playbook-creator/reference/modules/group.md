# group

**Descrição:** Add or remove groups

## Descrição
- Manage presence of groups on a host.
- For Windows targets, use the M(ansible.windows.win_group) module instead.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True

Name of the group to manage.

### `gid`
- **Tipo:** int
- **Necessário:** não

Optional I(GID) to set for the group.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

Whether the group should be present or not on the remote host.

### `force`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Whether to delete a group even if it is the primary group of a user.

### `system`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If V(yes), indicates that the group created is a system group.

### `local`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Forces the use of "local" command alternatives on platforms that implement it.

### `non_unique`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

This option allows to change the group ID to a non-unique value. Requires O(gid).

### `gid_min`
- **Tipo:** int
- **Necessário:** não

Sets the GID_MIN value for group creation.

### `gid_max`
- **Tipo:** int
- **Necessário:** não

Sets the GID_MAX value for group creation.

## Ver também
- `ansible.builtin.user`
- `ansible.windows.win_group`


## Exemplos de Uso

```yaml
- name: Ensure group "somegroup" exists
  ansible.builtin.group:
    name: somegroup
    state: present

- name: Ensure group "docker" exists with correct gid
  ansible.builtin.group:
    name: docker
    state: present
    gid: 1750
```

## Valores de Retorno

- **gid:** Group ID of the group.
  - Retornado: When O(state) is C(present)
  - Tipo: int
  - Exemplo: `1001`
- **name:** Group name.
  - Retornado: always
  - Tipo: str
  - Exemplo: `users`
- **state:** Whether the group is present or not.
  - Retornado: always
  - Tipo: str
  - Exemplo: `absent`
- **system:** Whether the group is a system group or not.
  - Retornado: When O(state) is C(present)
  - Tipo: bool
  - Exemplo: `False`