# import_tasks

**Descrição:** Import a task list

## Descrição
- Imports a list of tasks to be added to the current playbook for subsequent execution.

## Opções
### `free-form`
- **Tipo:** N/A
- **Necessário:** não

Specifies the name of the imported file directly without any other option C(- import_tasks: file.yml).


### `file`
- **Tipo:** str
- **Necessário:** não

Specifies the name of the file that lists tasks to add to the current playbook.

## Ver também
- `ansible.builtin.import_playbook`
- `ansible.builtin.import_role`
- `ansible.builtin.include_role`
- `ansible.builtin.include_tasks`


## Exemplos de Uso

```yaml
- hosts: all
  tasks:
    - ansible.builtin.debug:
        msg: task1

    - name: Include task list in play
      ansible.builtin.import_tasks:
        file: stuff.yaml

    - ansible.builtin.debug:
        msg: task10

- hosts: all
  tasks:
    - ansible.builtin.debug:
        msg: task1

    - name: Apply conditional to all imported tasks
      ansible.builtin.import_tasks: stuff.yaml
      when: hostvar is defined
```

