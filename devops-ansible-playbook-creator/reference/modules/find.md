# find

**Descrição:** Return a list of files based on specific criteria

## Descrição
- Return a list of files based on specific criteria. Multiple criteria are AND'd together.
- For Windows targets, use the M(ansible.windows.win_find) module instead.
- This module does not use the C(find) command, it is a much simpler and slower Python implementation. It is intended for small and simple uses. Those that need the extra power or speed and have expertise with the UNIX command, should use it directly.

## Opções
### `age`
- **Tipo:** str
- **Necessário:** não

Select files whose age is equal to or greater than the specified time.

### `get_checksum`
- **Tipo:** N/A
- **Necessário:** não
- **Padrão:** `False`



### `checksum_algorithm`
- **Tipo:** N/A
- **Necessário:** não



### `patterns`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`
- **Aliases:** pattern

One or more (shell or regex) patterns, which type is controlled by O(use_regex) option.

### `excludes`
- **Tipo:** list
- **Necessário:** não
- **Aliases:** exclude

One or more (shell or regex) patterns, which type is controlled by O(use_regex) option.

### `contains`
- **Tipo:** str
- **Necessário:** não

A regular expression or pattern which should be matched against the file content.

### `read_whole_file`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

When doing a O(contains) search, determines whether the whole file should be read into memory or if the regex should be applied to the file line-by-line.

### `paths`
- **Tipo:** list
- **Necessário:** True
- **Aliases:** name, path

List of paths of directories to search. All paths must be fully qualified.

### `file_type`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `file`
- **Escolhas:** any, directory, file, link

Type of file to select.

### `recurse`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If target is a directory, recursively descend into the directory looking for files.

### `size`
- **Tipo:** str
- **Necessário:** não

Select files whose size is equal to or greater than the specified size.

### `age_stamp`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `mtime`
- **Escolhas:** atime, ctime, mtime

Choose the file property against which we compare age.

### `hidden`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Set this to V(true) to include hidden files, otherwise they are ignored.

### `mode`
- **Tipo:** raw
- **Necessário:** não

Choose objects matching a specified permission. This value is restricted to modes that can be applied using the python C(os.chmod(\)) function.

### `exact_mode`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Restrict mode matching to exact matches only, and not as a minimum set of permissions to match.

### `follow`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Set this to V(true) to follow symlinks in path for systems with python 2.6+.

### `use_regex`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If V(false), the patterns are file globs (shell).

### `depth`
- **Tipo:** int
- **Necessário:** não

Set the maximum number of levels to descend into.

### `encoding`
- **Tipo:** str
- **Necessário:** não

When doing a O(contains) search, determine the encoding of the files to be searched.

### `limit`
- **Tipo:** int
- **Necessário:** não

Limit the maximum number of matching paths returned. After finding this many, the find action stops looking.

## Ver também
- `ansible.windows.win_find`


## Exemplos de Uso

```yaml
- name: Recursively find /tmp files older than 2 days
  ansible.builtin.find:
    paths: /tmp
    age: 2d
    recurse: yes

- name: Recursively find /tmp files older than 4 weeks and equal or greater than 1 megabyte
  ansible.builtin.find:
    paths: /tmp
    age: 4w
    size: 1m
    recurse: yes

- name: Recursively find /var/tmp files with last access time greater than 3600 seconds
  ansible.builtin.find:
    paths: /var/tmp
    age: 3600
    age_stamp: atime
    recurse: yes

- name: Find /var/log files equal or greater than 10 megabytes ending with .old or .log.gz
  ansible.builtin.find:
    paths: /var/log
    patterns: '*.old,*.log.gz'
    size: 10m

# Note that YAML double quotes require escaping backslashes but yaml single quotes do not.
- name: Find /var/log files equal or greater than 10 megabytes ending with .old or .log.gz via regex
  ansible.builtin.find:
    paths: /var/log
    patterns: "^.*?\\.(?:old|log\\.gz)$"
    size: 10m
    use_regex: yes

- name: Find /var/log all directories, exclude nginx and mysql
  ansible.builtin.find:
    paths: /var/log
    recurse: no
    file_type: directory
    excludes: 'nginx,mysql'

# When using patterns that contain a comma, make sure they are formatted as lists to avoid splitting the pattern
- name: Use a single pattern that contains a comma formatted as a list
  ansible.builtin.find:
    paths: /var/log
    file_type: file
    use_regex: yes
    patterns: ['^_[0-9]{2,4}_.*.log$']

- name: Use multiple patterns that contain a comma formatted as a YAML list
  ansible.builtin.find:
    paths: /var/log
    file_type: file
    use_regex: yes
    patterns:
      - '^_[0-9]{2,4}_.*.log$'
      - '^[a-z]{1,5}_.*log$'

- name: Find file containing "wally" without necessarily reading all files
  ansible.builtin.find:
    paths: /var/log
    file_type: file
    contains: wally
    read_whole_file: true
    patterns: "^.*\\.log$"
    use_regex: true
    recurse: true
    limit: 1
```

## Valores de Retorno

- **files:** All matches found with the specified criteria (see stat module for full output of each dictionary)
  - Retornado: success
  - Tipo: list
  - Exemplo: `[{'path': '/var/tmp/test1', 'mode': '0644', '...': '...', 'checksum': '16fac7be61a6e4591a33ef4b729c5c3302307523'}, {'path': '/var/tmp/test2', '...': '...'}]`
- **matched:** Number of matches
  - Retornado: success
  - Tipo: int
  - Exemplo: `14`
- **examined:** Number of filesystem objects looked at
  - Retornado: success
  - Tipo: int
  - Exemplo: `34`
- **skipped_paths:** skipped paths and reasons they were skipped
  - Retornado: success
  - Tipo: dict
  - Exemplo: `{'/laskdfj': "'/laskdfj' is not a directory"}`