# hostname

**Descrição:** Manage hostname

## Descrição
- Set system's hostname. Supports most OSs/Distributions including those using C(systemd).
- Windows, HP-UX, and AIX are not currently supported.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True

Name of the host.

### `use`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** alpine, debian, freebsd, generic, macos, macosx, darwin, openbsd, openrc, redhat, sles, solaris, systemd

Which strategy to use to update the hostname.


## Exemplos de Uso

```yaml
- name: Set a hostname
  ansible.builtin.hostname:
    name: web01

- name: Set a hostname specifying strategy
  ansible.builtin.hostname:
    name: web01
    use: systemd
```