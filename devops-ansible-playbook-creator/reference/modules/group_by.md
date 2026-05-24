# group_by

**Descrição:** Create Ansible groups based on facts

## Descrição
- Use facts to create ad-hoc groups that can be used later in a playbook.
- This module is also supported for Windows targets.

## Opções
### `key`
- **Tipo:** str
- **Necessário:** True

The variables whose values will be used as groups.

### `parents`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `all`

The list of the parent groups.

## Ver também
- `ansible.builtin.add_host`


## Exemplos de Uso

```yaml
- name: Create groups based on the machine architecture
  ansible.builtin.group_by:
    key: machine_{{ ansible_machine }}

- name: Create groups like 'virt_kvm_host'
  ansible.builtin.group_by:
    key: virt_{{ ansible_virtualization_type }}_{{ ansible_virtualization_role }}

- name: Create nested groups
  ansible.builtin.group_by:
    key: el{{ ansible_distribution_major_version }}-{{ ansible_architecture }}
    parents:
      - el{{ ansible_distribution_major_version }}

- name: Add all active hosts to a static group
  ansible.builtin.group_by:
    key: done
```