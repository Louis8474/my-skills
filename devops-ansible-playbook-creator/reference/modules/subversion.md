# subversion

**Descrição:** Deploys a subversion repository

## Descrição
- Deploy given repository URL / revision to dest. If dest exists, update to the specified revision, otherwise perform a checkout.

## Opções
### `repo`
- **Tipo:** str
- **Necessário:** True
- **Aliases:** name, repository

The subversion URL to the repository.

### `dest`
- **Tipo:** path
- **Necessário:** não

Absolute path where the repository should be deployed.

### `revision`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `HEAD`
- **Aliases:** rev, version

Specific revision to checkout.

### `force`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), modified files will be discarded. If V(false), module will fail if it encounters modified files. Prior to 1.9 the default was V(true).

### `in_place`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If the directory exists, then the working copy will be checked-out over-the-top using C(svn checkout --force); if force is specified then existing files with different content are reverted.

### `username`
- **Tipo:** str
- **Necessário:** não

C(--username) parameter passed to svn.

### `password`
- **Tipo:** str
- **Necessário:** não

C(--password) parameter passed to svn when svn is less than version 1.10.0. This is not secure and the password will be leaked to argv.

### `executable`
- **Tipo:** path
- **Necessário:** não

Path to svn executable to use. If not supplied, the normal mechanism for resolving binary paths will be used.

### `checkout`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

If V(false), do not check out the repository if it does not exist locally.

### `update`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

If V(false), do not retrieve new revisions from the origin repository.

### `export`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), do export instead of checkout/update.

### `switch`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

If V(false), do not call svn switch before update.

### `validate_certs`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(false), passes the C(--trust-server-cert) flag to svn.


## Exemplos de Uso

```yaml
- name: Checkout subversion repository to specified folder
  ansible.builtin.subversion:
    repo: svn+ssh://an.example.org/path/to/repo
    dest: /src/checkout

- name: Export subversion directory to folder
  ansible.builtin.subversion:
    repo: svn+ssh://an.example.org/path/to/repo
    dest: /src/export
    export: yes

- name: Get information about the repository whether or not it has already been cloned locally
  ansible.builtin.subversion:
    repo: svn+ssh://an.example.org/path/to/repo
    dest: /src/checkout
    checkout: no
    update: no
```

