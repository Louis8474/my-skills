# lineinfile

**Descrição:** Manage lines in text files

## Descrição
- This module ensures a particular line is in a file, or replace an existing line using a back-referenced regular expression.
- This is primarily useful when you want to change a single line in a file only.
- See the M(ansible.builtin.replace) module if you want to change multiple, similar lines or check M(ansible.builtin.blockinfile) if you want to insert/update/remove a block of lines in a file. For other cases, see the M(ansible.builtin.copy) or M(ansible.builtin.template) modules.

## Opções
### `path`
- **Tipo:** path
- **Necessário:** True
- **Aliases:** dest, destfile, name

The file to modify.

### `regexp`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** regex

The regular expression to look for in every line of the file.

### `search_string`
- **Tipo:** str
- **Necessário:** não

The literal string to look for in every line of the file. This does not have to match the entire line.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

Whether the line should be there or not.

### `line`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** value

The line to insert/replace into the file.

### `backrefs`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Used with O(state=present).

### `insertafter`
- **Tipo:** str
- **Necessário:** não

Used with O(state=present).

### `insertbefore`
- **Tipo:** str
- **Necessário:** não

Used with O(state=present).

### `create`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Used with O(state=present).

### `backup`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Create a backup file including the timestamp information so you can get the original file back if you somehow clobbered it incorrectly.

### `firstmatch`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Used with O(insertafter) or O(insertbefore).

### `encoding`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `utf-8`

The character set in which the target file is encoded.

## Ver também
- `ansible.builtin.blockinfile`
- `ansible.builtin.copy`
- `ansible.builtin.file`
- `ansible.builtin.replace`
- `ansible.builtin.template`
- `community.windows.win_lineinfile`


## Exemplos de Uso

```yaml
# NOTE: Before 2.3, option 'dest', 'destfile' or 'name' was used instead of 'path'
- name: Ensure SELinux is set to enforcing mode
  ansible.builtin.lineinfile:
    path: /etc/selinux/config
    regexp: '^SELINUX='
    line: SELINUX=enforcing

- name: Make sure group wheel is not in the sudoers configuration
  ansible.builtin.lineinfile:
    path: /etc/sudoers
    state: absent
    regexp: '^%wheel'

- name: Replace a localhost entry with our own
  ansible.builtin.lineinfile:
    path: /etc/hosts
    regexp: '^127\.0\.0\.1'
    line: 127.0.0.1 localhost
    owner: root
    group: root
    mode: '0644'

- name: Replace a localhost entry searching for a literal string to avoid escaping
  ansible.builtin.lineinfile:
    path: /etc/hosts
    search_string: '127.0.0.1'
    line: 127.0.0.1 localhost
    owner: root
    group: root
    mode: '0644'

- name: Ensure the default Apache port is 8080
  ansible.builtin.lineinfile:
    path: /etc/httpd/conf/httpd.conf
    regexp: '^Listen '
    insertafter: '^#Listen '
    line: Listen 8080

- name: Ensure php extension matches new pattern
  ansible.builtin.lineinfile:
    path: /etc/httpd/conf/httpd.conf
    search_string: '<FilesMatch ".php[45]?$">'
    insertafter: '^\t<Location \/>\n'
    line: '        <FilesMatch ".php[34]?$">'

- name: Ensure we have our own comment added to /etc/services
  ansible.builtin.lineinfile:
    path: /etc/services
    regexp: '^# port for http'
    insertbefore: '^www.*80/tcp'
    line: '# port for http by default'

- name: Add a line to a file if the file does not exist, without passing regexp
  ansible.builtin.lineinfile:
    path: /tmp/testfile
    line: 192.168.1.99 foo.lab.net foo
    create: yes

# NOTE: Yaml requires escaping backslashes in double quotes but not in single quotes
- name: Ensure the JBoss memory settings are exactly as needed
  ansible.builtin.lineinfile:
    path: /opt/jboss-as/bin/standalone.conf
    regexp: '^(.*)Xms(\d+)m(.*)$'
    line: '\1Xms${xms}m\3'
    backrefs: yes

# NOTE: Fully quoted because of the ': ' on the line. See the Gotchas in the YAML docs.
- name: Validate the sudoers file before saving
  ansible.builtin.lineinfile:
    path: /etc/sudoers
    state: present
    regexp: '^%ADMIN ALL='
    line: '%ADMIN ALL=(ALL) NOPASSWD: ALL'
    validate: /usr/sbin/visudo -cf %s

# See https://docs.python.org/3/library/re.html for further details on syntax
- name: Use backrefs with alternative group syntax to avoid conflicts with variable values
  ansible.builtin.lineinfile:
    path: /tmp/config
    regexp: ^(host=).*
    line: \g<1>{{ hostname }}
    backrefs: yes
```

