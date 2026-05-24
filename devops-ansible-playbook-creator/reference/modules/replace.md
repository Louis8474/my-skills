# replace

**Descrição:** Replace all instances of a particular string in a file using a back-referenced regular expression

## Descrição
- This module will replace all instances of a pattern within a file.
- It is up to the user to maintain idempotence by ensuring that the same pattern would never match any replacements made.

## Opções
### `path`
- **Tipo:** path
- **Necessário:** True
- **Aliases:** dest, destfile, name

The file to modify.

### `regexp`
- **Tipo:** str
- **Necessário:** True

The regular expression to look for in the contents of the file.

### `replace`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** ``

The string to replace regexp matches.

### `after`
- **Tipo:** str
- **Necessário:** não

If specified, only content after this match will be replaced/removed.

### `before`
- **Tipo:** str
- **Necessário:** não

If specified, only content before this match will be replaced/removed.

### `backup`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Create a backup file including the timestamp information so you can get the original file back if you somehow clobbered it incorrectly.

### `encoding`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `utf-8`

The character encoding for reading and writing the file.


## Exemplos de Uso

```yaml
- name: Replace old hostname with new hostname (requires Ansible >= 2.4)
  ansible.builtin.replace:
    path: /etc/hosts
    regexp: '(\s+)old\.host\.name(\s+.*)?$'
    replace: '\1new.host.name\2'

- name: Replace after the expression till the end of the file (requires Ansible >= 2.4)
  ansible.builtin.replace:
    path: /etc/apache2/sites-available/default.conf
    after: 'NameVirtualHost [*]'
    regexp: '^(.+)$'
    replace: '# \1'

- name: Replace before the expression from the beginning of the file (requires Ansible >= 2.4)
  ansible.builtin.replace:
    path: /etc/apache2/sites-available/default.conf
    before: '# live site config'
    regexp: '^(.+)$'
    replace: '# \1'

# Prior to Ansible 2.7.10, using before and after in combination did the opposite of what was intended.
# see https://github.com/ansible/ansible/issues/31354 for details.
# Note (?m) which turns on MULTILINE mode so ^ matches any line's beginning
- name: Replace between the expressions (requires Ansible >= 2.4)
  ansible.builtin.replace:
    path: /etc/hosts
    after: '(?m)^<VirtualHost [*]>'
    before: '</VirtualHost>'
    regexp: '^(.+)$'
    replace: '# \1'

- name: Supports common file attributes
  ansible.builtin.replace:
    path: /home/jdoe/.ssh/known_hosts
    regexp: '^old\.host\.name[^\n]*\n'
    owner: jdoe
    group: jdoe
    mode: '0644'

- name: Supports a validate command
  ansible.builtin.replace:
    path: /etc/apache/ports
    regexp: '^(NameVirtualHost|Listen)\s+80\s*$'
    replace: '\1 127.0.0.1:8080'
    validate: '/usr/sbin/apache2ctl -f %s -t'

- name: Short form task (in ansible 2+) necessitates backslash-escaped sequences
  ansible.builtin.replace: path=/etc/hosts regexp='\\b(localhost)(\\d*)\\b' replace='\\1\\2.localdomain\\2 \\1\\2'

- name: Long form task does not
  ansible.builtin.replace:
    path: /etc/hosts
    regexp: '\b(localhost)(\d*)\b'
    replace: '\1\2.localdomain\2 \1\2'

- name: Explicitly specifying positional matched groups in replacement
  ansible.builtin.replace:
    path: /etc/ssh/sshd_config
    regexp: '^(ListenAddress[ ]+)[^\n]+$'
    replace: '\g<1>0.0.0.0'

- name: Explicitly specifying named matched groups
  ansible.builtin.replace:
    path: /etc/ssh/sshd_config
    regexp: '^(?P<dctv>ListenAddress[ ]+)(?P<host>[^\n]+)$'
    replace: '#\g<dctv>\g<host>\n\g<dctv>0.0.0.0'
```

