# blockinfile

**Descrição:** Insert/update/remove a text block surrounded by marker lines

## Descrição
- This module will insert/update/remove a block of multi-line text surrounded by customizable marker lines.

## Opções
### `path`
- **Tipo:** path
- **Necessário:** True
- **Aliases:** dest, destfile, name

The file to modify.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

Whether the block should be there or not.

### `marker`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `# {mark} ANSIBLE MANAGED BLOCK`

The marker line template.

### `block`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** ``
- **Aliases:** content

The text to insert inside the marker lines.

### `insertafter`
- **Tipo:** str
- **Necessário:** não

If specified and no begin/ending O(marker) lines are found, the block will be inserted after the last match of specified regular expression.

### `insertbefore`
- **Tipo:** str
- **Necessário:** não

If specified and no begin/ending O(marker) lines are found, the block will be inserted before the last match of specified regular expression.

### `create`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Create a new file if it does not exist.

### `backup`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Create a backup file including the timestamp information so you can get the original file back if you somehow clobbered it incorrectly.

### `marker_begin`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `BEGIN`

This will be inserted at C({mark}) in the opening ansible block O(marker).

### `marker_end`
- **Tipo:** str
- **Necessário:** False
- **Padrão:** `END`

This will be inserted at C({mark}) in the closing ansible block O(marker).

### `append_newline`
- **Tipo:** bool
- **Necessário:** False
- **Padrão:** `False`

Append a blank line to the inserted block, if this does not appear at the end of the file.

### `prepend_newline`
- **Tipo:** bool
- **Necessário:** False
- **Padrão:** `False`

Prepend a blank line to the inserted block, if this does not appear at the beginning of the file.

### `encoding`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `utf-8`

The character set in which the target file is encoded.


## Exemplos de Uso

```yaml
# Before Ansible 2.3, option 'dest' or 'name' was used instead of 'path'
- name: Insert/Update "Match User" configuration block in /etc/ssh/sshd_config prepending and appending a new line
  ansible.builtin.blockinfile:
    path: /etc/ssh/sshd_config
    append_newline: true
    prepend_newline: true
    block: |
      Match User ansible-agent
      PasswordAuthentication no

- name: Insert/Update eth0 configuration stanza in /etc/network/interfaces
        (it might be better to copy files into /etc/network/interfaces.d/)
  ansible.builtin.blockinfile:
    path: /etc/network/interfaces
    block: |
      iface eth0 inet static
          address 192.0.2.23
          netmask 255.255.255.0

- name: Insert/Update configuration using a local file and validate it
  ansible.builtin.blockinfile:
    block: "{{ lookup('ansible.builtin.file', './local/sshd_config') }}"
    path: /etc/ssh/sshd_config
    backup: yes
    validate: /usr/sbin/sshd -T -f %s

- name: Insert/Update HTML surrounded by custom markers after <body> line
  ansible.builtin.blockinfile:
    path: /var/www/html/index.html
    marker: "<!-- {mark} ANSIBLE MANAGED BLOCK -->"
    insertafter: "<body>"
    block: |
      <h1>Welcome to {{ ansible_hostname }}</h1>
      <p>Last updated on {{ ansible_date_time.iso8601 }}</p>

- name: Remove HTML as well as surrounding markers
  ansible.builtin.blockinfile:
    path: /var/www/html/index.html
    marker: "<!-- {mark} ANSIBLE MANAGED BLOCK -->"
    block: ""

- name: Add mappings to /etc/hosts
  ansible.builtin.blockinfile:
    path: /etc/hosts
    block: |
      {{ item.ip }} {{ item.name }}
    marker: "# {mark} ANSIBLE MANAGED BLOCK {{ item.name }}"
  loop:
    - { name: host1, ip: 10.10.1.10 }
    - { name: host2, ip: 10.10.1.11 }
    - { name: host3, ip: 10.10.1.12 }

- name: Search with a multiline search flags regex and if found insert after
  blockinfile:
    path: listener.ora
    block: "{{ listener_line | indent(width=8, first=True) }}"
    insertafter: '(?m)SID_LIST_LISTENER_DG =\n.*\(SID_LIST ='
    marker: "    <!-- {mark} ANSIBLE MANAGED BLOCK -->"
```