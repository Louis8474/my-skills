# validate_argument_spec

**Descrição:** Validate role argument specs.

## Descrição
- This module validates role arguments with a defined argument specification.

## Opções
### `argument_spec`
- **Tipo:** N/A
- **Necessário:** True

A dictionary like AnsibleModule argument_spec.

### `provided_arguments`
- **Tipo:** N/A
- **Necessário:** não

A dictionary of the arguments that will be validated according to argument_spec.


## Exemplos de Uso

```yaml
- name: verify vars needed for this task file are present when included
  ansible.builtin.validate_argument_spec:
    argument_spec: '{{ required_data }}'
  vars:
    required_data:
      # unlike spec file, just put the options in directly
      stuff:
        description: stuff
        type: str
        choices: ['who', 'knows', 'what']
        default: what
      but:
        description: i guess we need one
        type: str
        required: true


- name: verify vars needed for this task file are present when included, with spec from a spec file
  ansible.builtin.validate_argument_spec:
    argument_spec: "{{ (lookup('ansible.builtin.file', 'myargspec.yml') | from_yaml )['specname']['options'] }}"


- name: verify vars needed for next include and not from inside it, also with params i'll only define there
  block:
    - ansible.builtin.validate_argument_spec:
        argument_spec: "{{ lookup('ansible.builtin.file', 'nakedoptions.yml') }}"
        provided_arguments:
          but: "that i can define on the include itself, like in it's `vars:` keyword"

    - name: the include itself
      vars:
        stuff: knows
        but: nobuts!
```

## Valores de Retorno

- **argument_errors:** A list of arg validation errors.
  - Retornado: failure
  - Tipo: list
  - Exemplo: `['error message 1', 'error message 2']`
- **argument_spec_data:** A dict of the data from the 'argument_spec' arg.
  - Retornado: failure
  - Tipo: dict
  - Exemplo: `{'some_arg': {'type': 'str'}, 'some_other_arg': {'type': 'int', 'required': True}}`
- **validate_args_context:** A dict of info about where validate_args_spec was used
  - Retornado: always
  - Tipo: dict
  - Exemplo: `{'name': 'my_role', 'type': 'role', 'path': '/home/user/roles/my_role/', 'argument_spec_name': 'main'}`