# mount_facts

**Descrição:** Retrieve mount information.

## Descrição
- Retrieve information about mounts from preferred sources and filter the results based on the filesystem type and device.

## Opções
### `devices`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `None`

A

### `fstypes`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `None`

A

### `sources`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `None`

A list of sources used to determine the mounts. Missing file sources (or empty files) are skipped. Repeat sources, including symlinks, are skipped.

### `mount_binary`
- **Tipo:** raw
- **Necessário:** não
- **Padrão:** `mount`

The O(mount_binary) is used if O(sources) contain the value "mount", or if O(sources) contains a dynamic source, and none were found (as can be expected on BSD or AIX hosts).

### `timeout`
- **Tipo:** float
- **Necessário:** não

This is the maximum number of seconds to wait for each mount to complete. When this is V(null), wait indefinitely.

### `on_timeout`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `error`
- **Escolhas:** error, warn, ignore

The action to take when gathering mount information exceeds O(timeout).

### `include_aggregate_mounts`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `None`

Whether or not the module should return the C(aggregate_mounts) list in C(ansible_facts).


## Exemplos de Uso

```yaml
- name: Get non-local devices
  mount_facts:
    devices: "[!/]*"

- name: Get FUSE subtype mounts
  mount_facts:
    fstypes:
      - "fuse.*"

- name: Get NFS mounts during gather_facts with timeout
  hosts: all
  gather_facts: true
  vars:
    ansible_facts_modules:
      - ansible.builtin.mount_facts
  module_default:
    ansible.builtin.mount_facts:
      timeout: 10
      fstypes:
        - nfs
        - nfs4

- name: Get mounts from a non-default location
  mount_facts:
    sources:
      - /usr/etc/fstab

- name: Get mounts from the mount binary
  mount_facts:
    sources:
      - mount
    mount_binary: /sbin/mount
```

## Valores de Retorno

- **ansible_facts:** ['An ansible_facts dictionary containing a dictionary of C(mount_points) and list of C(aggregate_mounts) when enabled.', 'Each key in C(mount_points) is a mount point, and the value contains mount information (similar to C(ansible_facts["mounts"])). Each value also contains the key C(ansible_context), with details about the source and line(s) corresponding to the parsed mount point.', 'When C(aggregate_mounts) are included, the containing dictionaries are the same format as the C(mount_point) values.']
  - Retornado: on success
  - Tipo: dict
  - Exemplo: `{'mount_points': {'/proc/sys/fs/binfmt_misc': {'ansible_context': {'source': '/proc/mounts', 'source_data': 'systemd-1 /proc/sys/fs/binfmt_misc autofs rw,relatime,fd=33,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=33850 0 0'}, 'block_available': 0, 'block_size': 4096, 'block_total': 0, 'block_used': 0, 'device': 'systemd-1', 'dump': 0, 'fstype': 'autofs', 'inode_available': 0, 'inode_total': 0, 'inode_used': 0, 'mount': '/proc/sys/fs/binfmt_misc', 'options': 'rw,relatime,fd=33,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=33850', 'passno': 0, 'size_available': 0, 'size_total': 0, 'uuid': None}}, 'aggregate_mounts': [{'ansible_context': {'source': '/proc/mounts', 'source_data': 'systemd-1 /proc/sys/fs/binfmt_misc autofs rw,relatime,fd=33,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=33850 0 0'}, 'block_available': 0, 'block_size': 4096, 'block_total': 0, 'block_used': 0, 'device': 'systemd-1', 'dump': 0, 'fstype': 'autofs', 'inode_available': 0, 'inode_total': 0, 'inode_used': 0, 'mount': '/proc/sys/fs/binfmt_misc', 'options': 'rw,relatime,fd=33,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=33850', 'passno': 0, 'size_available': 0, 'size_total': 0, 'uuid': None}, {'ansible_context': {'source': '/proc/mounts', 'source_data': 'binfmt_misc /proc/sys/fs/binfmt_misc binfmt_misc rw,nosuid,nodev,noexec,relatime 0 0'}, 'block_available': 0, 'block_size': 4096, 'block_total': 0, 'block_used': 0, 'device': 'binfmt_misc', 'dump': 0, 'fstype': 'binfmt_misc', 'inode_available': 0, 'inode_total': 0, 'inode_used': 0, 'mount': '/proc/sys/fs/binfmt_misc', 'options': 'rw,nosuid,nodev,noexec,relatime', 'passno': 0, 'size_available': 0, 'size_total': 0, 'uuid': None}]}`