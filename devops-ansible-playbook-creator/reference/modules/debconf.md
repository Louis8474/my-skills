# debconf

**Descrição:** Configure a .deb package

## Descrição
- Configure a .deb package using debconf-set-selections.
- Or just query existing selections.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True
- **Aliases:** pkg

Name of package to configure.

### `question`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** selection, setting

A debconf configuration setting.

### `vtype`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** boolean, error, multiselect, note, password, seen, select, string, text, title

The type of the value supplied.

### `value`
- **Tipo:** raw
- **Necessário:** não
- **Aliases:** answer

Value to set the configuration to.

### `unseen`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Do not set C(seen) flag when pre-seeding.


## Exemplos de Uso

```yaml
- name: Set default locale to fr_FR.UTF-8
  ansible.builtin.debconf:
    name: locales
    question: locales/default_environment_locale
    value: fr_FR.UTF-8
    vtype: select

- name: Set to generate locales
  ansible.builtin.debconf:
    name: locales
    question: locales/locales_to_be_generated
    value: en_US.UTF-8 UTF-8, fr_FR.UTF-8 UTF-8
    vtype: multiselect

- name: Accept oracle license
  ansible.builtin.debconf:
    name: oracle-java7-installer
    question: shared/accepted-oracle-license-v1-1
    value: 'true'
    vtype: select

- name: Specifying package you can register/return the list of questions and current values
  ansible.builtin.debconf:
    name: tzdata

- name: Pre-configure tripwire site passphrase
  ansible.builtin.debconf:
    name: tripwire
    question: tripwire/site-passphrase
    value: "{{ site_passphrase }}"
    vtype: password
  no_log: True
```

