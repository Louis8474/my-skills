# dpkg_selections

**Descrição:** Dpkg package selection selections

## Descrição
- Change dpkg package selection state via C(--get-selections) and C(--set-selections).

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True

Name of the package.

### `selection`
- **Tipo:** str
- **Necessário:** True
- **Escolhas:** install, hold, deinstall, purge

The selection state to set the package to.


## Exemplos de Uso

```yaml
- name: Prevent python from being upgraded
  ansible.builtin.dpkg_selections:
    name: python
    selection: hold

- name: Allow python to be upgraded
  ansible.builtin.dpkg_selections:
    name: python
    selection: install
```