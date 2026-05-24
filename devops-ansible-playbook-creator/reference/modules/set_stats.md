# set_stats

**Descrição:** Define and display stats for the current ansible run

## Descrição
- This module allows setting/accumulating stats on the current ansible run, either per host or for all hosts in the run.
- This module is also supported for Windows targets.

## Opções
### `data`
- **Tipo:** dict
- **Necessário:** True

A dictionary of which each key represents a stat (or variable) you want to keep track of.

### `per_host`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Whether the stats are per host or for all hosts in the run.

### `aggregate`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Whether the provided value is aggregated to the existing stat V(true) or will replace it V(false).


## Exemplos de Uso

```yaml
- name: Aggregating packages_installed stat per host
  ansible.builtin.set_stats:
    data:
      packages_installed: 31
    per_host: yes

- name: Aggregating random stats for all hosts using complex arguments
  ansible.builtin.set_stats:
    data:
      one_stat: 11
      other_stat: "{{ local_var * 2 }}"
      another_stat: "{{ some_registered_var.results | map(attribute='ansible_facts.some_fact') | list }}"
    per_host: no

- name: Setting stats (not aggregating)
  ansible.builtin.set_stats:
    data:
      the_answer: 42
    aggregate: no
```