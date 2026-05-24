# unarchive

**Descrição:** Unpacks an archive after (optionally) copying it from the local machine

## Descrição
- The M(ansible.builtin.unarchive) module unpacks an archive. It will not unpack a compressed file that does not contain an archive.
- By default, it will copy the source file from the local system to the target before unpacking.
- Set O(remote_src=yes) to unpack an archive which already exists on the target.
- If checksum validation is desired, use M(ansible.builtin.get_url) or M(ansible.builtin.uri) instead to fetch the file and set O(remote_src=yes).
- For Windows targets, use the M(community.windows.win_unzip) module instead.

## Opções
### `src`
- **Tipo:** path
- **Necessário:** True

If O(remote_src=no) (default), local path to archive file to copy to the target server; can be absolute or relative. If O(remote_src=yes), path on the target server to existing archive file to unpack.

### `dest`
- **Tipo:** path
- **Necessário:** True

Remote absolute path where the archive should be unpacked.

### `copy`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

If true, the file is copied from local controller to the managed (remote) node, otherwise, the plugin will look for src archive on the managed machine.

### `creates`
- **Tipo:** path
- **Necessário:** não

If the specified absolute path (file or directory) already exists, this step will B(not) be run.

### `io_buffer_size`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `65536`

Size of the volatile memory buffer that is used for extracting files from the archive in bytes.

### `list_files`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If set to True, return the list of files that are contained in the tarball.

### `exclude`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

List the directory and file entries that you would like to exclude from the unarchive action.

### `include`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

List of directory and file entries that you would like to extract from the archive. If O(include) is not empty, only files listed here will be extracted.

### `keep_newer`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Do not replace existing files that are newer than files from the archive.

### `extra_opts`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

Specify additional options by passing in an array.

### `remote_src`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Set to V(true) to indicate the archived file is already on the remote system and not local to the Ansible controller.

### `validate_certs`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

This only applies if using a https URL as the source of the file.

## Ver também
- `community.general.archive`
- `community.general.iso_extract`
- `community.windows.win_unzip`


## Exemplos de Uso

```yaml
- name: Extract foo.tgz into /var/lib/foo
  ansible.builtin.unarchive:
    src: foo.tgz
    dest: /var/lib/foo

- name: Unarchive a file that is already on the remote machine
  ansible.builtin.unarchive:
    src: /tmp/foo.zip
    dest: /usr/local/bin
    remote_src: yes

- name: Unarchive a file that needs to be downloaded (added in 2.0)
  ansible.builtin.unarchive:
    src: https://example.com/example.zip
    dest: /usr/local/bin
    remote_src: yes

- name: Unarchive a file with extra options
  ansible.builtin.unarchive:
    src: /tmp/foo.zip
    dest: /usr/local/bin
    extra_opts:
    - --transform
    - s/^xxx/yyy/
```

## Valores de Retorno

- **dest:** Path to the destination directory.
  - Retornado: always
  - Tipo: str
  - Exemplo: `/opt/software`
- **files:** List of all the files in the archive.
  - Retornado: When O(list_files) is V(True)
  - Tipo: list
  - Exemplo: `["file1", "file2"]`
- **gid:** Numerical ID of the group that owns the destination directory.
  - Retornado: always
  - Tipo: int
  - Exemplo: `1000`
- **group:** Name of the group that owns the destination directory.
  - Retornado: always
  - Tipo: str
  - Exemplo: `librarians`
- **handler:** Archive software handler used to extract and decompress the archive.
  - Retornado: always
  - Tipo: str
  - Exemplo: `TgzArchive`
- **mode:** String that represents the octal permissions of the destination directory.
  - Retornado: always
  - Tipo: str
  - Exemplo: `0755`
- **owner:** Name of the user that owns the destination directory.
  - Retornado: always
  - Tipo: str
  - Exemplo: `paul`
- **size:** The size of destination directory in bytes. Does not include the size of files or subdirectories contained within.
  - Retornado: always
  - Tipo: int
  - Exemplo: `36`
- **src:** ["The source archive's path.", 'If O(src) was a remote web URL, or from the local ansible controller, this shows the temporary location where the download was stored.']
  - Retornado: always
  - Tipo: str
  - Exemplo: `/home/paul/test.tar.gz`
- **state:** State of the destination. Effectively always "directory".
  - Retornado: always
  - Tipo: str
  - Exemplo: `directory`
- **uid:** Numerical ID of the user that owns the destination directory.
  - Retornado: always
  - Tipo: int
  - Exemplo: `1000`