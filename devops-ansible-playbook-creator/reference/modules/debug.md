# debug

**Descrição:** Print statements during execution

## Descrição
- This module prints statements during execution and can be useful for debugging variables or expressions without necessarily halting the playbook.
- Useful for debugging together with the C(when:) directive.
- This module is also supported for Windows targets.

## Opções
### `msg`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `Hello world!`

The customized message that is printed. If omitted, prints a generic message.

### `var`
- **Tipo:** str
- **Necessário:** não

A variable name to debug.

### `verbosity`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `0`

A number that controls when the debug is run, if you set to 3 it will only run debug when -vvv or above.

## Ver também
- `ansible.builtin.assert`
- `ansible.builtin.fail`


## Exemplos de Uso

```yaml
- name: Print the gateway for each host when defined
  ansible.builtin.debug:
    msg: System {{ inventory_hostname }} has gateway {{ ansible_default_ipv4.gateway }}
  when: ansible_default_ipv4.gateway is defined

- name: Get uptime information
  ansible.builtin.shell: /usr/bin/uptime
  register: result

- name: Print return information from the previous task
  ansible.builtin.debug:
    var: result
    verbosity: 2

- name: Display all variables/facts known for a host
  ansible.builtin.debug:
    var: hostvars[inventory_hostname]
    verbosity: 4

- name: Prints two lines of messages, but only if there is an environment value set
  ansible.builtin.debug:
    msg:
    - "Provisioning based on YOUR_KEY which is: {{ lookup('ansible.builtin.env', 'YOUR_KEY') }}"
    - "These servers were built using the password of '{{ password_used }}'. Please retain this for later use."
```