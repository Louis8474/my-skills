# fail

**Descrição:** Fail with custom message

## Descrição
- This module fails the progress with a custom message.
- It can be useful for bailing out when a certain condition is met using C(when).
- This module is also supported for Windows targets.

## Opções
### `msg`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `Failed as requested from task`

The customized message used for failing execution.

## Ver também
- `ansible.builtin.assert`
- `ansible.builtin.debug`
- `ansible.builtin.meta`


## Exemplos de Uso

```yaml
- name: Example using fail and when together
  ansible.builtin.fail:
    msg: The system may not be provisioned according to the CMDB status.
  when: cmdb_status != "to-be-staged"
```