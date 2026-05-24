# import_playbook

**Descrição:** Import a playbook

## Descrição
- Includes a file with a list of plays to be executed.
- Files with a list of plays can only be included at the top level.
- You cannot use this action inside a play.

## Opções
### `free-form`
- **Tipo:** N/A
- **Necessário:** não

The name of the imported playbook is specified directly without any other option.

## Ver também
- `ansible.builtin.import_role`
- `ansible.builtin.import_tasks`
- `ansible.builtin.include_role`
- `ansible.builtin.include_tasks`


## Exemplos de Uso

```yaml
- hosts: localhost
  tasks:
    - ansible.builtin.debug:
        msg: play1

- name: Include a play after another play
  ansible.builtin.import_playbook: otherplays.yaml

- name: Set variables on an imported playbook
  ansible.builtin.import_playbook: otherplays.yml
  vars:
    service: httpd

- name: Include a playbook from a collection
  ansible.builtin.import_playbook: my_namespace.my_collection.my_playbook

- name: This DOES NOT WORK
  hosts: all
  tasks:
    - ansible.builtin.debug:
        msg: task1

    - name: This fails because I'm inside a play already
      ansible.builtin.import_playbook: stuff.yaml
```

