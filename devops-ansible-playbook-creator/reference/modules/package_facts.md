# package_facts

**Descrição:** Package information as facts

## Descrição
- Return information about installed packages as facts.

## Opções
### `manager`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `['auto']`
- **Escolhas:** auto, rpm, yum, dnf, dnf5, zypper, apt, portage, pkg, pkg5, pkgng, pacman, apk, pkg_info, openbsd_pkg

The package manager(s) used by the system so we can query the package information. This is a list and can support multiple package managers per system, since version 2.8.

### `strategy`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `first`
- **Escolhas:** first, all

This option controls how the module queries the package managers on the system.


## Exemplos de Uso

```yaml
- name: Gather the package facts
  ansible.builtin.package_facts:
    manager: auto

- name: Print the package facts
  ansible.builtin.debug:
    var: ansible_facts.packages

- name: Check whether a package called foobar is installed
  ansible.builtin.debug:
    msg: "{{ ansible_facts.packages['foobar'] | length }} versions of foobar are installed!"
  when: "'foobar' in ansible_facts.packages"
```

## Valores de Retorno

- **ansible_facts:** Facts to add to ansible_facts.
  - Retornado: always
  - Tipo: complex