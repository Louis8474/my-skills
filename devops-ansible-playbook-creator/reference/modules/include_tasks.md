# include_tasks

**Descrição:** Dynamically include a task list

## Descrição
- Includes a file with a list of tasks to be executed in the current playbook.

## Opções
### `file`
- **Tipo:** str
- **Necessário:** não

Specifies the name of the file that lists tasks to add to the current playbook.

### `apply`
- **Tipo:** str
- **Necessário:** não

Accepts a hash of task keywords (for example C(tags), C(become)) that will be applied to the tasks within the include.

### `free-form`
- **Tipo:** N/A
- **Necessário:** não

Specifies the name of the imported file directly without any other option C(- include_tasks: file.yml).


## Ver também
- `ansible.builtin.import_playbook`
- `ansible.builtin.import_role`
- `ansible.builtin.import_tasks`
- `ansible.builtin.include_role`


## Exemplos de Uso

```yaml
- hosts: all
  tasks:
    - ansible.builtin.debug:
        msg: task1

    - name: Include task list in play
      ansible.builtin.include_tasks:
        file: stuff.yaml

    - ansible.builtin.debug:
        msg: task10

- hosts: all
  tasks:
    - ansible.builtin.debug:
        msg: task1

    - name: Include task list in play only if the condition is true
      ansible.builtin.include_tasks: "{{ hostvar }}.yaml"
      when: hostvar is defined

- name: Apply tags to tasks within included file
  ansible.builtin.include_tasks:
    file: install.yml
    apply:
      tags:
        - install
  tags:
    - always

- name: Apply tags to tasks within included file when using free-form
  ansible.builtin.include_tasks: install.yml
  args:
    apply:
      tags:
        - install
  tags:
    - always
```

