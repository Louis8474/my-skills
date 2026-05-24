# assert

**Descrição:** Asserts given expressions are true

## Descrição
- This module asserts that given expressions are true with an optional custom message.
- This module is also supported for Windows targets.

## Opções
### `that`
- **Tipo:** list
- **Necessário:** True

A list of string expressions of the same form that can be passed to the C(when) statement.

### `fail_msg`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** msg

The customized message used for a failing assertion.

### `success_msg`
- **Tipo:** str
- **Necessário:** não

The customized message used for a successful assertion.

### `quiet`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Set this to V(true) to avoid verbose output.

## Ver também
- `ansible.builtin.debug`
- `ansible.builtin.fail`
- `ansible.builtin.meta`


## Exemplos de Uso

```yaml
- name: A single condition can be supplied as string instead of list
  ansible.builtin.assert:
    that: "ansible_os_family != 'RedHat'"

- name: Use yaml multiline strings to ease escaping
  ansible.builtin.assert:
    that:
      - "'foo' in some_command_result.stdout"
      - number_of_the_counting == 3
      - >
        "reject" not in some_command_result.stderr

- name: After version 2.7 both O(msg) and O(fail_msg) can customize failing assertion message
  ansible.builtin.assert:
    that:
      - my_param <= 100
      - my_param >= 0
    fail_msg: "'my_param' must be between 0 and 100"
    success_msg: "'my_param' is between 0 and 100"

- name: Please use O(msg) when ansible version is smaller than 2.7
  ansible.builtin.assert:
    that:
      - my_param <= 100
      - my_param >= 0
    msg: "'my_param' must be between 0 and 100"

- name: Use quiet to avoid verbose output
  ansible.builtin.assert:
    that:
      - my_param <= 100
      - my_param >= 0
    quiet: true
```