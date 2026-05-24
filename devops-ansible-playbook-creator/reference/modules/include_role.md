# include_role

**Descrição:** Load and execute a role

## Descrição
- Dynamically loads and executes a specified role as a task.
- May be used only where Ansible tasks are allowed - inside C(pre_tasks), C(tasks), or C(post_tasks) play objects, or as a task inside a role.
- Task-level keywords, loops, and conditionals apply only to the C(include_role) statement itself.
- To apply keywords to the tasks within the role, pass them using the O(apply) option or use M(ansible.builtin.import_role) instead.
- Ignores some keywords, like C(until) and C(retries).
- This module is also supported for Windows targets.
- Does not work in handlers.

## Opções
### `apply`
- **Tipo:** N/A
- **Necessário:** não

Accepts a hash of task keywords (for example C(tags), C(become)) that will be applied to all tasks within the included role.

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

### `public`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

This option dictates whether the role's C(vars) and C(defaults) are exposed to the play. If set to V(true) the variables will be available to tasks following the C(include_role) task. This functionality differs from standard variable exposure for roles listed under the C(roles) header or M(ansible.builtin.import_role) as they are exposed to the play at playbook parsing time, and available to earlier roles and tasks as well.

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

### `rescuable`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

This toggle allows for errors from the include itself to either be a task failure, which is 'rescuable', or fatal syntax errors.

## Ver também
- `ansible.builtin.import_playbook`
- `ansible.builtin.import_role`
- `ansible.builtin.import_tasks`
- `ansible.builtin.include_tasks`


## Exemplos de Uso

```yaml
- ansible.builtin.include_role:
    name: myrole

- name: Run tasks/other.yaml instead of 'main'
  ansible.builtin.include_role:
    name: myrole
    tasks_from: other

- name: Pass variables to role
  ansible.builtin.include_role:
    name: myrole
  vars:
    rolevar1: value from task

- name: Use role in loop
  ansible.builtin.include_role:
    name: '{{ roleinputvar }}'
  loop:
    - '{{ roleinput1 }}'
    - '{{ roleinput2 }}'
  loop_control:
    loop_var: roleinputvar

- name: Conditional role
  ansible.builtin.include_role:
    name: myrole
  when: not idontwanttorun

- name: Apply tags to tasks within included file
  ansible.builtin.include_role:
    name: install
    apply:
      tags:
        - install
  tags:
    - always
```

