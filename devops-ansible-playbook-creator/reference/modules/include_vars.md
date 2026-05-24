# include_vars

**Descrição:** Load variables from files, dynamically within a task

## Descrição
- Loads YAML/JSON variables dynamically from a file or directory, recursively, during task runtime.
- If loading a directory, the files are sorted alphabetically before being loaded.
- This module is also supported for Windows targets.
- To assign included variables to a different host than C(inventory_hostname), use C(delegate_to) and set C(delegate_facts=yes).

## Opções
### `file`
- **Tipo:** path
- **Necessário:** não

The file name from which variables should be loaded.

### `dir`
- **Tipo:** path
- **Necessário:** não

The directory name from which the variables should be loaded.

### `name`
- **Tipo:** str
- **Necessário:** não

The name of a variable into which assign the included vars.

### `depth`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `0`

When using O(dir), this module will, by default, recursively go through each sub directory and load up the variables. By explicitly setting the depth, this module will only go as deep as the depth.

### `files_matching`
- **Tipo:** str
- **Necessário:** não

Limit the files that are loaded within any directory to this regular expression.

### `ignore_files`
- **Tipo:** list
- **Necessário:** não

List of file names to ignore.

### `extensions`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `['json', 'yaml', 'yml']`

List of file extensions to read when using O(dir).

### `ignore_unknown_extensions`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Ignore unknown file extensions within the directory.

### `hash_behaviour`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `None`
- **Escolhas:** replace, merge

If set to V(merge), merges existing hash variables instead of overwriting them.

### `free-form`
- **Tipo:** N/A
- **Necessário:** não

This module allows you to specify the O(file) option directly without any other options.

## Ver também
- `ansible.builtin.set_fact`


## Exemplos de Uso

```yaml
- name: Include vars of stuff.yaml into the 'stuff' variable (2.2).
  ansible.builtin.include_vars:
    file: stuff.yaml
    name: stuff

- name: Conditionally decide to load in variables into 'plans' when x is 0, otherwise do not. (2.2)
  ansible.builtin.include_vars:
    file: contingency_plan.yaml
    name: plans
  when: x == 0

- name: Load a variable file based on the OS type, or a default if not found. Using free-form to specify the file.
  ansible.builtin.include_vars: "{{ lookup('ansible.builtin.first_found', params) }}"
  vars:
    params:
      files:
        - '{{ansible_distribution}}.yaml'
        - '{{ansible_os_family}}.yaml'
        - default.yaml
      paths:
        - 'vars'

- name: Bare include (free-form)
  ansible.builtin.include_vars: myvars.yaml

- name: Include all .json and .jsn files in vars/all and all nested directories (2.3)
  ansible.builtin.include_vars:
    dir: vars/all
    extensions:
      - 'json'
      - 'jsn'

- name: Include all default extension files in vars/all and all nested directories and save the output in test. (2.2)
  ansible.builtin.include_vars:
    dir: vars/all
    name: test

- name: Include default extension files in vars/services (2.2)
  ansible.builtin.include_vars:
    dir: vars/services
    depth: 1

- name: Include only files matching bastion.yaml (2.2)
  ansible.builtin.include_vars:
    dir: vars
    files_matching: bastion.yaml

- name: Include all .yaml files except bastion.yaml (2.3)
  ansible.builtin.include_vars:
    dir: vars
    ignore_files:
      - 'bastion.yaml'
    extensions:
      - 'yaml'

- name: Ignore warnings raised for files with unknown extensions while loading (2.7)
  ansible.builtin.include_vars:
    dir: vars
    ignore_unknown_extensions: True
    extensions:
      - ''
      - 'yaml'
      - 'yml'
      - 'json'
```

## Valores de Retorno

- **ansible_facts:** Variables that were included and their values
  - Retornado: success
  - Tipo: dict
  - Exemplo: `{'variable': 'value'}`
- **ansible_included_var_files:** A list of files that were successfully included
  - Retornado: success
  - Tipo: list
  - Exemplo: `['/path/to/file.json', '/path/to/file.yaml']`