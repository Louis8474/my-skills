# add_host

**Descrição:** Add a host (and alternatively a group) to the ansible-playbook in-memory inventory

## Descrição
- Use variables to create new hosts and groups in inventory for use in later plays of the same playbook.
- Takes variables so you can define the new hosts more fully.
- This module is also supported for Windows targets.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True
- **Aliases:** host, hostname

The hostname/ip of the host to add to the inventory, can include a colon and a port number.

### `groups`
- **Tipo:** list
- **Necessário:** não
- **Aliases:** group, groupname

The groups to add the hostname to.

## Ver também
- `ansible.builtin.group_by`


## Exemplos de Uso

```yaml
- name: Add host to group 'just_created' with variable foo=42
  ansible.builtin.add_host:
    name: '{{ ip_from_ec2 }}'
    groups: just_created
    foo: 42

- name: Add host to multiple groups
  ansible.builtin.add_host:
    hostname: '{{ new_ip }}'
    groups:
    - group1
    - group2

- name: Add a host with a non-standard port local to your machines
  ansible.builtin.add_host:
    name: '{{ new_ip }}:{{ new_port }}'

- name: Add a host alias that we reach through a tunnel (Ansible 1.9 and older)
  ansible.builtin.add_host:
    hostname: '{{ new_ip }}'
    ansible_ssh_host: '{{ inventory_hostname }}'
    ansible_ssh_port: '{{ new_port }}'

- name: Add a host alias that we reach through a tunnel (Ansible 2.0 and newer)
  ansible.builtin.add_host:
    hostname: '{{ new_ip }}'
    ansible_host: '{{ inventory_hostname }}'
    ansible_port: '{{ new_port }}'

- name: Ensure inventory vars are set to the same value as the inventory_hostname has (close to pre Ansible 2.4 behaviour)
  ansible.builtin.add_host:
    hostname: charlie
    inventory_dir: '{{ inventory_dir }}'

- name: Add all hosts running this playbook to the done group
  ansible.builtin.add_host:
    name: '{{ item }}'
    groups: done
  loop: "{{ ansible_play_hosts }}"
```