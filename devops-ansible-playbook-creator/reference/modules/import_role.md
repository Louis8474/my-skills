# import_role

**Descrição:** Import a role into a play

## Descrição
- Much like the C(roles:) keyword, this task loads a role, but it allows you to control when the role tasks run in between other tasks of the play.
- Most keywords, loops and conditionals will only be applied to the imported tasks, not to this statement itself. If you want the opposite behavior, use M(ansible.builtin.include_role) instead.
- Does not work in handlers.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True

The name of the role to be executed.

### `tasks_from`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `main`

File to load from a role's C(tasks/) directory.

### `vars_from`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `main`

File to load from a role's C(vars/) directory.

### `defaults_from`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `main`

File to load from a role's C(defaults/) directory.

### `allow_duplicates`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Overrides the role's metadata setting to allow using a role more than once with the same parameters.

### `handlers_from`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `main`

File to load from a role's C(handlers/) directory.

### `rolespec_validate`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Perform role argument spec validation if an argument spec is defined.

### `public`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

This option dictates whether the role's C(vars) and C(defaults) are exposed to the play.

## Ver também
- `ansible.builtin.import_playbook`
- `ansible.builtin.import_tasks`
- `ansible.builtin.include_role`
- `ansible.builtin.include_tasks`


## Exemplos de Uso

```yaml
- hosts: all
  tasks:
    - ansible.builtin.import_role:
        name: myrole

    - name: Run tasks/other.yaml instead of 'main'
      ansible.builtin.import_role:
        name: myrole
        tasks_from: other

    - name: Pass variables to role
      ansible.builtin.import_role:
        name: myrole
      vars:
        rolevar1: value from task

    - name: Apply condition to each task in role
      ansible.builtin.import_role:
        name: myrole
      when: not idontwanttorun
```

