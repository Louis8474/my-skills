# gather_facts

**Descrição:** Gathers facts about remote hosts

## Descrição
- This module takes care of executing the R(configured facts modules,FACTS_MODULES), the default is to use the M(ansible.builtin.setup) module.
- This module is automatically called by playbooks to gather useful variables about remote hosts that can be used in playbooks.
- It can also be executed directly by C(/usr/bin/ansible) to check what variables are available to a host.
- Ansible provides many I(facts) about the system, automatically.

## Opções
### `parallel`
- **Tipo:** bool
- **Necessário:** não

A toggle that controls if the fact modules are executed in parallel or serially and in order. This can guarantee the merge order of module facts at the expense of performance.


## Exemplos de Uso

```yaml
# Display facts from all hosts and store them indexed by hostname at /tmp/facts.
# ansible all -m ansible.builtin.gather_facts --tree /tmp/facts
```

