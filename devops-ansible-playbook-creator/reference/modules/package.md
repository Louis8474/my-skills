# package

**Descrição:** Generic OS package manager

## Descrição
- This modules manages packages on a target without specifying a package manager module (like M(ansible.builtin.dnf), M(ansible.builtin.apt), ...). It is convenient to use in an heterogeneous environment of machines without having to create a specific task for each package manager. M(ansible.builtin.package) calls behind the module for the package manager used by the operating system discovered by the module M(ansible.builtin.setup).  If M(ansible.builtin.setup) was not yet run, M(ansible.builtin.package) will run it.
- This module acts as a proxy to the underlying package manager module. While all arguments will be passed to the underlying module, not all modules support the same arguments. This documentation only covers the minimum intersection of module arguments that all packaging modules support.
- For Windows targets, use the M(ansible.windows.win_package) module instead.

## Opções
### `name`
- **Tipo:** N/A
- **Necessário:** True

Package name, or package specifier with version.

### `state`
- **Tipo:** N/A
- **Necessário:** True

Whether to install (V(present)), or remove (V(absent)) a package.

### `use`
- **Tipo:** N/A
- **Necessário:** não
- **Padrão:** `auto`

The required package manager module to use (V(dnf), V(apt), and so on). The default V(auto) will use existing facts or try to auto-detect it.


## Exemplos de Uso

```yaml
- name: Install ntpdate
  ansible.builtin.package:
    name: ntpdate
    state: present

# This uses a variable as this changes per distribution.
- name: Remove the apache package
  ansible.builtin.package:
    name: "{{ apache }}"
    state: absent

- name: Install the latest version of Apache and MariaDB
  ansible.builtin.package:
    name:
      - httpd
      - mariadb-server
    state: latest

- name: Use the dnf package manager to install httpd
  ansible.builtin.package:
    name: httpd
    state: present
    use: dnf
```