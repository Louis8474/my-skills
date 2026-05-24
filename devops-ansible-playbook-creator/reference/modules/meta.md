# meta

**Descrição:** Execute Ansible 'actions'

## Descrição
- Meta tasks are a special kind of task which can influence Ansible internal execution or state.
- Meta tasks can be used anywhere within your playbook.
- This module is also supported for Windows targets.

## Opções
### `free_form`
- **Tipo:** N/A
- **Necessário:** True
- **Escolhas:** clear_facts, clear_host_errors, end_host, end_play, flush_handlers, noop, refresh_inventory, reset_connection, end_batch, end_role

This module takes a free form command, as a string. There is not an actual option named "free form".  See the examples!

## Ver também
- `ansible.builtin.assert`
- `ansible.builtin.fail`


## Exemplos de Uso

```yaml
# Example showing flushing handlers on demand, not at end of play
- ansible.builtin.template:
    src: new.j2
    dest: /etc/config.txt
  notify: myhandler

- name: Force all notified handlers to run at this point, not waiting for normal sync points
  ansible.builtin.meta: flush_handlers

# Example showing how to refresh inventory during play
- name: Reload inventory, useful with dynamic inventories when play makes changes to the existing hosts
  cloud_guest:            # this is fake module
    name: newhost
    state: present

- name: Refresh inventory to ensure new instances exist in inventory
  ansible.builtin.meta: refresh_inventory

# Example showing how to clear all existing facts of targeted hosts
- name: Clear gathered facts from all currently targeted hosts
  ansible.builtin.meta: clear_facts

# Example showing how to continue using a failed target, for the next play
- name: Bring host back to play after failure
  ansible.builtin.copy:
    src: file
    dest: /etc/file
  remote_user: imightnothavepermission

- ansible.builtin.meta: clear_host_errors

# Example showing how to reset an existing connection
- ansible.builtin.user:
    name: '{{ ansible_user }}'
    groups: input

- name: Reset ssh connection to allow user changes to affect 'current login user'
  ansible.builtin.meta: reset_connection

# Example showing how to end the play for specific targets
- name: End the play for hosts that run CentOS 6
  ansible.builtin.meta: end_host
  when:
  - ansible_distribution == 'CentOS'
  - ansible_distribution_major_version == '6'
```