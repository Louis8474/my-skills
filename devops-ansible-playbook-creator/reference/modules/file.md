# file

**Descrição:** Manage files and file properties

## Descrição
- Set attributes of files, directories, or symlinks and their targets.
- Alternatively, remove files, symlinks or directories.
- Many other modules support the same options as the M(ansible.builtin.file) module - including M(ansible.builtin.copy), M(ansible.builtin.template), and M(ansible.builtin.assemble).
- For Windows targets, use the M(ansible.windows.win_file) module instead.

## Opções
### `path`
- **Tipo:** path
- **Necessário:** True
- **Aliases:** dest, name

Path to the file being managed.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** absent, directory, file, hard, link, touch

If V(absent), directories will be recursively deleted, and files or symlinks will be unlinked. In the case of a directory, if C(diff) is declared, you will see the files and folders deleted listed under C(path_contents). Note that V(absent) will not cause M(ansible.builtin.file) to fail if the O(path) does not exist as the state did not change.

### `src`
- **Tipo:** path
- **Necessário:** não

Path of the file to link to.

### `recurse`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Recursively set the specified file attributes on directory contents.

### `force`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Force the creation of the links in two cases: if the link type is symbolic and the source file does not exist (but will appear later); the destination exists and is a file (so, we need to unlink the O(path) file and create a link to the O(src) file in place of it).


### `follow`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

This flag indicates that filesystem links, if they exist, should be followed.

### `modification_time`
- **Tipo:** str
- **Necessário:** não

This parameter indicates the time the file's modification time should be set to.

### `modification_time_format`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `%Y%m%d%H%M.%S`

When used with O(modification_time), indicates the time format that must be used.

### `access_time`
- **Tipo:** str
- **Necessário:** não

This parameter indicates the time the file's access time should be set to.

### `access_time_format`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `%Y%m%d%H%M.%S`

When used with O(access_time), indicates the time format that must be used.

## Ver também
- `ansible.builtin.assemble`
- `ansible.builtin.copy`
- `ansible.builtin.stat`
- `ansible.builtin.template`
- `ansible.windows.win_file`


## Exemplos de Uso

```yaml
- name: Change file ownership, group and permissions
  ansible.builtin.file:
    path: /etc/foo.conf
    owner: foo
    group: foo
    mode: '0644'

- name: Change file group using gid
  ansible.builtin.file:
    path: /etc/bar.conf
    group: "1000"

- name: Give insecure permissions to an existing file
  ansible.builtin.file:
    path: /work
    owner: root
    group: root
    mode: '1777'

- name: Create a symbolic link
  ansible.builtin.file:
    src: /file/to/link/to
    dest: /path/to/symlink
    owner: foo
    group: foo
    state: link

- name: Create two hard links
  ansible.builtin.file:
    src: '/tmp/{{ item.src }}'
    dest: '{{ item.dest }}'
    state: hard
  loop:
    - { src: x, dest: y }
    - { src: z, dest: k }

- name: Touch a file, using symbolic modes to set the permissions (equivalent to 0644)
  ansible.builtin.file:
    path: /etc/foo.conf
    state: touch
    mode: u=rw,g=r,o=r

- name: Touch the same file, but add/remove some permissions
  ansible.builtin.file:
    path: /etc/foo.conf
    state: touch
    mode: u+rw,g-wx,o-rwx

- name: Touch again the same file, but do not change times this makes the task idempotent
  ansible.builtin.file:
    path: /etc/foo.conf
    state: touch
    mode: u+rw,g-wx,o-rwx
    modification_time: preserve
    access_time: preserve

- name: Create a directory if it does not exist
  ansible.builtin.file:
    path: /etc/some_directory
    state: directory
    mode: '0755'

- name: Update modification and access time of given file
  ansible.builtin.file:
    path: /etc/some_file
    state: file
    modification_time: now
    access_time: now

- name: Set access time based on seconds from epoch value
  ansible.builtin.file:
    path: /etc/another_file
    state: file
    access_time: '{{ "%Y%m%d%H%M.%S" | strftime(stat_var.stat.atime) }}'

- name: Recursively change ownership of a directory
  ansible.builtin.file:
    path: /etc/foo
    state: directory
    recurse: yes
    owner: foo
    group: foo

- name: Remove file (delete file)
  ansible.builtin.file:
    path: /etc/foo.txt
    state: absent

- name: Recursively remove directory
  ansible.builtin.file:
    path: /etc/foo
    state: absent
```

## Valores de Retorno

- **dest:** Destination file/path, equal to the value passed to O(path).
  - Retornado: O(state=touch), O(state=hard), O(state=link)
  - Tipo: str
  - Exemplo: `/path/to/file.txt`
- **path:** Destination file/path, equal to the value passed to O(path).
  - Retornado: O(state=absent), O(state=directory), O(state=file)
  - Tipo: str
  - Exemplo: `/path/to/file.txt`