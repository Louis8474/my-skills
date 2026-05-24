# slurp

**Descrição:** Slurps a file from remote nodes

## Descrição
- This module works like M(ansible.builtin.fetch). It is used for fetching a base64- encoded blob containing the data in a remote file.
- This module is also supported for Windows targets.

## Opções
### `src`
- **Tipo:** path
- **Necessário:** True
- **Aliases:** path

The file on the remote system to fetch. This I(must) be a file, not a directory.

### `armor`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

To safely deliver the data requested, armor it by base64 encoding it.

## Ver também
- `ansible.builtin.fetch`


## Exemplos de Uso

```yaml
- name: Find out what the remote machine's mounts are
  ansible.builtin.slurp:
    src: /proc/mounts
  register: mounts

- name: Print returned information
  ansible.builtin.debug:
    msg: "{{ mounts['content'] | b64decode }}"

- name: Find out what the remote machine's mounts are, no armor
  ansible.builtin.slurp:
    src: /proc/mounts
    armor: false
  register: mounts

- name: Print returned information
  ansible.builtin.debug:
    msg: "{{ mounts['content'] }}"

# From the commandline, find the pid of the remote machine's sshd
# $ ansible host -m ansible.builtin.slurp -a 'src=/var/run/sshd.pid'
# host | SUCCESS => {
#     "changed": false,
#     "content": "MjE3OQo=",
#     "encoding": "base64",
#     "source": "/var/run/sshd.pid"
# }
# $ echo MjE3OQo= | base64 -d
# 2179
```

## Valores de Retorno

- **content:** Encoded file content
  - Retornado: success
  - Tipo: str
  - Exemplo: `MjE3OQo=`
- **encoding:** Current encoding of the file content, it can be C(base64) or C(UTF-8) depending on the value of the O(armor) option.
  - Retornado: success
  - Tipo: str
  - Exemplo: `base64`
- **source:** Actual path of file slurped
  - Retornado: success
  - Tipo: str
  - Exemplo: `/var/run/sshd.pid`