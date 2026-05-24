# tempfile

**Descrição:** Creates temporary files and directories

## Descrição
- The M(ansible.builtin.tempfile) module creates temporary files and directories. C(mktemp) command takes different parameters on various systems, this module helps to avoid troubles related to that. Files/directories created by module are accessible only by creator. In case you need to make them world-accessible you need to use M(ansible.builtin.file) module.
- For Windows targets, use the M(ansible.windows.win_tempfile) module instead.

## Opções
### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `file`
- **Escolhas:** directory, file

Whether to create file or directory.

### `path`
- **Tipo:** path
- **Necessário:** não

Location where temporary file or directory should be created.

### `prefix`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `ansible.`

Prefix of file/directory name created by module.

### `suffix`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** ``

Suffix of file/directory name created by module.

## Ver também
- `ansible.builtin.file`
- `ansible.windows.win_tempfile`


## Exemplos de Uso

```yaml
- name: Create temporary build directory
  ansible.builtin.tempfile:
    state: directory
    suffix: build

- name: Create temporary file
  ansible.builtin.tempfile:
    state: file
    suffix: temp
  register: tempfile_1

- name: Create a temporary file with a specific prefix
  ansible.builtin.tempfile:
     state: file
     suffix: txt
     prefix: myfile_

- name: Use the registered var and the file module to remove the temporary file
  ansible.builtin.file:
    path: "{{ tempfile_1.path }}"
    state: absent
  when: tempfile_1.path is defined
```

## Valores de Retorno

- **path:** Path to created file or directory.
  - Retornado: success
  - Tipo: str
  - Exemplo: `/tmp/ansible.bMlvdk`