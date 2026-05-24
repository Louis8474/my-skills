# fetch

**Descrição:** Fetch files from remote nodes

## Descrição
- This module works like M(ansible.builtin.copy), but in reverse.
- It is used for fetching files from remote machines and storing them locally in a file tree, organized by hostname.
- Files that already exist at O(dest) will be overwritten if they are different than the O(src).
- This module is also supported for Windows targets.

## Opções
### `src`
- **Tipo:** N/A
- **Necessário:** True

The file on the remote system to fetch.

### `dest`
- **Tipo:** N/A
- **Necessário:** True

A directory to save the file into.

### `fail_on_missing`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

When set to V(true), the task will fail if the remote file cannot be read for any reason.

### `validate_checksum`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Verify that the source and destination checksums match after the files are fetched.

### `flat`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Allows you to override the default behavior of appending hostname/path/to/file to the destination.

## Ver também
- `ansible.builtin.copy`
- `ansible.builtin.slurp`


## Exemplos de Uso

```yaml
- name: Store file into /tmp/fetched/host.example.com/tmp/somefile
  ansible.builtin.fetch:
    src: /tmp/somefile
    dest: /tmp/fetched

- name: Specifying a path directly
  ansible.builtin.fetch:
    src: /tmp/somefile
    dest: /tmp/prefix-{{ inventory_hostname }}
    flat: yes

- name: Specifying a destination path
  ansible.builtin.fetch:
    src: /tmp/uniquefile
    dest: /tmp/special/
    flat: yes

- name: Storing in a path relative to the playbook
  ansible.builtin.fetch:
    src: /tmp/uniquefile
    dest: special/prefix-{{ inventory_hostname }}
    flat: yes
```