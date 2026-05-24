# template

**Descrição:** Template a file out to a target host

## Opções
### `follow`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Determine whether symbolic links should be followed.

## Ver também
- `ansible.builtin.copy`
- `ansible.windows.win_copy`
- `ansible.windows.win_template`


## Exemplos de Uso

```yaml
- name: Template a file to /etc/file.conf
  ansible.builtin.template:
    src: /mytemplates/foo.j2
    dest: /etc/file.conf
    owner: bin
    group: wheel
    mode: '0644'

- name: Template a file, using symbolic modes (equivalent to 0644)
  ansible.builtin.template:
    src: /mytemplates/foo.j2
    dest: /etc/file.conf
    owner: bin
    group: wheel
    mode: u=rw,g=r,o=r

- name: Copy a version of named.conf that is dependent on the OS. setype obtained by doing ls -Z /etc/named.conf on original file
  ansible.builtin.template:
    src: named.conf_{{ ansible_os_family }}.j2
    dest: /etc/named.conf
    group: named
    setype: named_conf_t
    mode: '0640'

- name: Create a DOS-style text file from a template
  ansible.builtin.template:
    src: config.ini.j2
    dest: /share/windows/config.ini
    newline_sequence: '\r\n'

- name: Copy a new sudoers file into place, after passing validation with visudo
  ansible.builtin.template:
    src: /mine/sudoers
    dest: /etc/sudoers
    validate: /usr/sbin/visudo -cf %s

- name: Update sshd configuration safely, avoid locking yourself out
  ansible.builtin.template:
    src: etc/ssh/sshd_config.j2
    dest: /etc/ssh/sshd_config
    owner: root
    group: root
    mode: '0600'
    validate: /usr/sbin/sshd -t -f %s
    backup: yes
```

## Valores de Retorno

- **dest:** Destination file/path, equal to the value passed to I(dest).
  - Retornado: success
  - Tipo: str
  - Exemplo: `/path/to/file.txt`
- **checksum:** SHA1 checksum of the rendered file
  - Retornado: always
  - Tipo: str
  - Exemplo: `373296322247ab85d26d5d1257772757e7afd172`
- **uid:** Numeric id representing the file owner
  - Retornado: success
  - Tipo: int
  - Exemplo: `1003`
- **gid:** Numeric id representing the group of the owner
  - Retornado: success
  - Tipo: int
  - Exemplo: `1003`
- **owner:** User name of owner
  - Retornado: success
  - Tipo: str
  - Exemplo: `httpd`
- **group:** Group name of owner
  - Retornado: success
  - Tipo: str
  - Exemplo: `www-data`
- **md5sum:** MD5 checksum of the rendered file
  - Retornado: changed
  - Tipo: str
  - Exemplo: `d41d8cd98f00b204e9800998ecf8427e`
- **mode:** Unix permissions of the file in octal representation as a string
  - Retornado: success
  - Tipo: str
  - Exemplo: `1755`
- **size:** Size of the rendered file in bytes
  - Retornado: success
  - Tipo: int
  - Exemplo: `42`
- **src:** Source file used for the copy on the target machine.
  - Retornado: changed
  - Tipo: str
  - Exemplo: `/home/httpd/.ansible/tmp/ansible-tmp-1423796390.97-147729857856000/source`