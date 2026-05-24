# stat

**Descrição:** Retrieve file or file system status

## Descrição
- Retrieves facts for a file similar to the Linux/Unix C(stat) command.
- For Windows targets, use the M(ansible.windows.win_stat) module instead.

## Opções
### `path`
- **Tipo:** path
- **Necessário:** True
- **Aliases:** dest, name

The full path of the file/object to get the facts of.

### `follow`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Whether to follow symlinks.

### `get_mime`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`
- **Aliases:** mime, mime_type, mime-type

Use file magic and return data about the nature of the file. This uses the C(file) utility found on most Linux/Unix systems.

### `get_attributes`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`
- **Aliases:** attr, attributes

Get file attributes using lsattr tool if present.

### `get_checksum`
- **Tipo:** N/A
- **Necessário:** não



### `get_selinux_context`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Get file SELinux context in a list V([user, role, type, range]), and will get V([None, None, None, None]) if it is not possible to retrieve the context, either because it does not exist or some other issue.

## Ver também
- `ansible.builtin.file`
- `ansible.windows.win_stat`


## Exemplos de Uso

```yaml
# Obtain the stats of /etc/foo.conf, and check that the file still belongs
# to 'root'. Fail otherwise.
- name: Get stats of a file
  ansible.builtin.stat:
    path: /etc/foo.conf
  register: st
- name: Fail if the file does not belong to 'root'
  ansible.builtin.fail:
    msg: "Whoops! file ownership has changed"
  when: st.stat.pw_name != 'root'

# Determine if a path exists and is a symlink. Note that if the path does
# not exist, and we test sym.stat.islnk, it will fail with an error. So
# therefore, we must test whether it is defined.
# Run this to understand the structure, the skipped ones do not pass the
# check performed by 'when'
- name: Get stats of the FS object
  ansible.builtin.stat:
    path: /path/to/something
  register: sym

- name: Print a debug message
  ansible.builtin.debug:
    msg: "islnk isn't defined (path doesn't exist)"
  when: sym.stat.islnk is not defined

- name: Print a debug message
  ansible.builtin.debug:
    msg: "islnk is defined (path must exist)"
  when: sym.stat.islnk is defined

- name: Print a debug message
  ansible.builtin.debug:
    msg: "Path exists and is a symlink"
  when: sym.stat.islnk is defined and sym.stat.islnk

- name: Print a debug message
  ansible.builtin.debug:
    msg: "Path exists and isn't a symlink"
  when: sym.stat.islnk is defined and sym.stat.islnk == False


# Determine if a path exists and is a directory.  Note that we need to test
# both that p.stat.isdir actually exists, and also that it's set to true.
- name: Get stats of the FS object
  ansible.builtin.stat:
    path: /path/to/something
  register: p
- name: Print a debug message
  ansible.builtin.debug:
    msg: "Path exists and is a directory"
  when: p.stat.isdir is defined and p.stat.isdir

- name: Do not calculate the checksum
  ansible.builtin.stat:
    path: /path/to/myhugefile
    get_checksum: no

- name: Use sha256 to calculate the checksum
  ansible.builtin.stat:
    path: /path/to/something
    checksum_algorithm: sha256
```

## Valores de Retorno

- **stat:** Dictionary containing all the stat data, some platforms might add additional fields.
  - Retornado: success
  - Tipo: dict