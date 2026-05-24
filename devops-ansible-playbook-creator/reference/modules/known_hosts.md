# known_hosts

**Descrição:** Add or remove a host from the C(known_hosts) file

## Descrição
- The M(ansible.builtin.known_hosts) module lets you add or remove host keys from the C(known_hosts) file.
- Starting at Ansible 2.2, multiple entries per host are allowed, but only one for each key type supported by ssh. This is useful if you're going to want to use the M(ansible.builtin.git) module over ssh, for example.
- If you have a very large number of host keys to manage, you will find the M(ansible.builtin.template) module more useful.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True
- **Aliases:** host

The host to add or remove (must match a host specified in key). It will be converted to lowercase so that C(ssh-keygen) can find it.

### `key`
- **Tipo:** str
- **Necessário:** não

The SSH public host key, as a string.

### `path`
- **Tipo:** path
- **Necessário:** não
- **Padrão:** `~/.ssh/known_hosts`

The known_hosts file to edit.

### `hash_host`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Hash the hostname in the known_hosts file.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

V(present) to add host keys.


## Exemplos de Uso

```yaml
- name: Tell the host about our servers it might want to ssh to
  ansible.builtin.known_hosts:
    path: /etc/ssh/ssh_known_hosts
    name: foo.com.invalid
    key: "{{ lookup('ansible.builtin.file', 'pubkeys/foo.com.invalid') }}"

- name: Another way to call known_hosts
  ansible.builtin.known_hosts:
    name: host1.example.com   # or 10.9.8.77
    key: host1.example.com,10.9.8.77 ssh-rsa ASDeararAIUHI324324  # some key gibberish
    path: /etc/ssh/ssh_known_hosts
    state: present

- name: Add host with custom SSH port
  ansible.builtin.known_hosts:
    name: '[host1.example.com]:2222'
    key: '[host1.example.com]:2222 ssh-rsa ASDeararAIUHI324324' # some key gibberish
    path: /etc/ssh/ssh_known_hosts
    state: present
```