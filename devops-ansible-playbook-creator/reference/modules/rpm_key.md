# rpm_key

**Descrição:** Adds or removes a gpg key from the rpm db

## Descrição
- Adds or removes C(rpm --import) a gpg key to your rpm database.

## Opções
### `key`
- **Tipo:** str
- **Necessário:** True

Key that will be modified. Can be a url, a file on the managed node, or a keyid if the key already exists in the database.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

If the key will be imported or removed from the rpm db.

### `validate_certs`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

If V(false) and the O(key) is a url starting with V(https), SSL certificates will not be validated.

### `fingerprint`
- **Tipo:** list
- **Necessário:** não

The long-form fingerprint of the key being imported.


## Exemplos de Uso

```yaml
- name: Import a key from a url
  ansible.builtin.rpm_key:
    state: present
    key: http://apt.sw.be/RPM-GPG-KEY.dag.txt

- name: Import a key from a file
  ansible.builtin.rpm_key:
    state: present
    key: /path/to/key.gpg

- name: Ensure a key is not present in the db
  ansible.builtin.rpm_key:
    state: absent
    key: DEADB33F

- name: Verify the key, using a fingerprint, before import
  ansible.builtin.rpm_key:
    key: /path/to/RPM-GPG-KEY.dag.txt
    fingerprint: EBC6 E12C 62B1 C734 026B  2122 A20E 5214 6B8D 79E6

- name: Verify the key, using multiple fingerprints, before import
  ansible.builtin.rpm_key:
    key: /path/to/RPM-GPG-KEY.dag.txt
    fingerprint:
      - EBC6 E12C 62B1 C734 026B  2122 A20E 5214 6B8D 79E6
      - 19B7 913E 6284 8E3F 4D78 D6B4 ECD9 1AB2 2EB6 8D86
```

