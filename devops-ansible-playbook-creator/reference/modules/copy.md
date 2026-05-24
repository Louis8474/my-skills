# copy

**Descrição:** Copy files to remote locations

## Descrição
- The M(ansible.builtin.copy) module copies a file or a directory structure from the local or remote machine to a location on the remote machine. File system meta-information (permissions, ownership, etc.) may be set, even when the file or directory already exists on the target system. Some meta-information may be copied on request.
- Get meta-information with the M(ansible.builtin.stat) module.
- Set meta-information with the M(ansible.builtin.file) module.
- Use the M(ansible.builtin.fetch) module to copy files from remote locations to the local box.
- If you need variable interpolation in copied files, use the M(ansible.builtin.template) module. Using a variable with the O(content) parameter produces unpredictable results.
- For Windows targets, use the M(ansible.windows.win_copy) module instead.

## Opções
### `src`
- **Tipo:** path
- **Necessário:** não

Local path to a file to copy to the remote server.

### `content`
- **Tipo:** str
- **Necessário:** não

When used instead of O(src), sets the contents of a file directly to the specified value.

### `dest`
- **Tipo:** path
- **Necessário:** True

Remote absolute path where the file should be copied to.

### `backup`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Create a backup file including the timestamp information so you can get the original file back if you somehow clobbered it incorrectly.

### `force`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Influence whether the remote file must always be replaced.

### `mode`
- **Tipo:** N/A
- **Necessário:** não

The permissions of the destination file or directory.

### `directory_mode`
- **Tipo:** raw
- **Necessário:** não

Set the access permissions of newly created directories to the given mode. Permissions on existing directories do not change.

### `remote_src`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Influence whether O(src) needs to be transferred or already is present remotely.

### `follow`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

This flag indicates that filesystem links in the destination, if they exist, should be followed.

### `local_follow`
- **Tipo:** bool
- **Necessário:** não

This flag indicates that filesystem links in the source tree, if they exist, should be followed.

### `checksum`
- **Tipo:** str
- **Necessário:** não

SHA1 checksum of the file being transferred.

## Ver também
- `ansible.builtin.assemble`
- `ansible.builtin.fetch`
- `ansible.builtin.file`
- `ansible.builtin.template`
- `ansible.posix.synchronize`
- `ansible.windows.win_copy`


## Exemplos de Uso

```yaml
- name: Copy file with owner and permissions
  ansible.builtin.copy:
    src: /srv/myfiles/foo.conf
    dest: /etc/foo.conf
    owner: foo
    group: foo
    mode: '0644'

- name: Copy file with owner and permission, using symbolic representation
  ansible.builtin.copy:
    src: /srv/myfiles/foo.conf
    dest: /etc/foo.conf
    owner: foo
    group: foo
    mode: u=rw,g=r,o=r

- name: Another symbolic mode example, adding some permissions and removing others
  ansible.builtin.copy:
    src: /srv/myfiles/foo.conf
    dest: /etc/foo.conf
    owner: foo
    group: foo
    mode: u+rw,g-wx,o-rwx

- name: Copy a new "ntp.conf" file into place, backing up the original if it differs from the copied version
  ansible.builtin.copy:
    src: /mine/ntp.conf
    dest: /etc/ntp.conf
    owner: root
    group: root
    mode: '0644'
    backup: yes

- name: Copy a new "sudoers" file into place, after passing validation with visudo
  ansible.builtin.copy:
    src: /mine/sudoers
    dest: /etc/sudoers
    validate: /usr/sbin/visudo -csf %s

- name: Copy a "sudoers" file on the remote machine for editing
  ansible.builtin.copy:
    src: /etc/sudoers
    dest: /etc/sudoers.edit
    remote_src: yes
    validate: /usr/sbin/visudo -csf %s

- name: Copy using inline content
  ansible.builtin.copy:
    content: '# This file was moved to /etc/other.conf'
    dest: /etc/mine.conf

- name: If follow=yes, /path/to/file will be overwritten by contents of foo.conf
  ansible.builtin.copy:
    src: /etc/foo.conf
    dest: /path/to/link  # link to /path/to/file
    follow: yes

- name: If follow=no, /path/to/link will become a file and be overwritten by contents of foo.conf
  ansible.builtin.copy:
    src: /etc/foo.conf
    dest: /path/to/link  # link to /path/to/file
    follow: no
```

## Valores de Retorno

- **dest:** Destination file/path.
  - Retornado: success
  - Tipo: str
  - Exemplo: `/path/to/file.txt`
- **src:** Source file used for the copy on the target machine.
  - Retornado: changed
  - Tipo: str
  - Exemplo: `/home/httpd/.ansible/tmp/ansible-tmp-1423796390.97-147729857856000/source`
- **md5sum:** MD5 checksum of the file after running copy.
  - Retornado: when supported
  - Tipo: str
  - Exemplo: `2a5aeecc61dc98c4d780b14b330e3282`
- **checksum:** SHA1 checksum of the file after running copy.
  - Retornado: success
  - Tipo: str
  - Exemplo: `6e642bb8dd5c2e027bf21dd923337cbb4214f827`
- **backup_file:** Name of backup file created.
  - Retornado: changed and if backup=yes
  - Tipo: str
  - Exemplo: `/path/to/file.txt.2015-02-12@22:09~`
- **gid:** Group id of the file, after execution.
  - Retornado: success
  - Tipo: int
  - Exemplo: `100`
- **group:** Group of the file, after execution.
  - Retornado: success
  - Tipo: str
  - Exemplo: `httpd`
- **owner:** Owner of the file, after execution.
  - Retornado: success
  - Tipo: str
  - Exemplo: `httpd`
- **uid:** Owner id of the file, after execution.
  - Retornado: success
  - Tipo: int
  - Exemplo: `100`
- **mode:** Permissions of the target, after execution.
  - Retornado: success
  - Tipo: str
  - Exemplo: `0644`
- **size:** Size of the target, after execution.
  - Retornado: success
  - Tipo: int
  - Exemplo: `1220`
- **state:** State of the target, after execution.
  - Retornado: success
  - Tipo: str
  - Exemplo: `file`