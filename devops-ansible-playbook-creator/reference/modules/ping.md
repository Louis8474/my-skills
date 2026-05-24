# ping

**Descrição:** Try to connect to host, verify a usable python and return V(pong) on success

## Descrição
- A trivial test module, this module always returns V(pong) on successful contact. It does not make sense in playbooks, but it is useful from C(/usr/bin/ansible) to verify the ability to login and that a usable Python is configured.
- This is NOT ICMP ping, this is just a trivial test module that requires Python on the remote-node.
- For Windows targets, use the M(ansible.windows.win_ping) module instead.
- For Network targets, use the M(ansible.netcommon.net_ping) module instead.

## Opções
### `data`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `pong`

Data to return for the RV(ping) return value.

## Ver também
- `ansible.netcommon.net_ping`
- `ansible.windows.win_ping`


## Exemplos de Uso

```yaml
# Test we can logon to 'webservers' and execute python with json lib.
# ansible webservers -m ansible.builtin.ping

- name: Example from an Ansible Playbook
  ansible.builtin.ping:

- name: Induce an exception to see what happens
  ansible.builtin.ping:
    data: crash
```

## Valores de Retorno

- **ping:** Value provided with the O(data) parameter.
  - Retornado: success
  - Tipo: str
  - Exemplo: `pong`