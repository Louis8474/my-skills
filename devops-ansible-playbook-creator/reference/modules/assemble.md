# assemble

**Descrição:** Assemble configuration files from fragments

## Descrição
- Assembles a configuration file from fragments.
- Often a particular program will take a single configuration file and does not support a C(conf.d) style structure where it is easy to build up the configuration from multiple sources. M(ansible.builtin.assemble) will take a directory of files that can be local or have already been transferred to the system, and concatenate them together to produce a destination file.
- Files are assembled in string sorting order.
- Puppet calls this idea I(fragments).

## Opções
### `src`
- **Tipo:** path
- **Necessário:** True

An already existing directory full of source files.

### `dest`
- **Tipo:** path
- **Necessário:** True

A file to create using the concatenation of all of the source files.

### `backup`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Create a backup file (if V(true)), including the timestamp information so you can get the original file back if you somehow clobbered it incorrectly.

### `delimiter`
- **Tipo:** str
- **Necessário:** não

A delimiter to separate the file contents.

### `remote_src`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

If V(false), it will search for src at originating/master machine.

### `regexp`
- **Tipo:** str
- **Necessário:** não

Assemble files only if the given regular expression matches the filename.

### `ignore_hidden`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

A boolean that controls if files that start with a C(.) will be included or not.

### `validate`
- **Tipo:** str
- **Necessário:** não

The validation command to run before copying into place.

## Ver também
- `ansible.builtin.copy`
- `ansible.builtin.template`
- `ansible.windows.win_copy`


## Exemplos de Uso

```yaml
- name: Assemble from fragments from a directory
  ansible.builtin.assemble:
    src: /etc/someapp/fragments
    dest: /etc/someapp/someapp.conf

- name: Insert the provided delimiter between fragments
  ansible.builtin.assemble:
    src: /etc/someapp/fragments
    dest: /etc/someapp/someapp.conf
    delimiter: '### START FRAGMENT ###'

- name: Assemble a new "sshd_config" file into place, after passing validation with sshd
  ansible.builtin.assemble:
    src: /etc/ssh/conf.d/
    dest: /etc/ssh/sshd_config
    validate: /usr/sbin/sshd -t -f %s
```

