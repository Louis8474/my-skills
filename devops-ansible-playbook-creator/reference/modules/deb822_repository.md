# deb822_repository

**Descrição:** Add and remove deb822 formatted repositories

## Descrição
- Add and remove deb822 formatted repositories in Debian based distributions.

## Opções
### `allow_downgrade_to_insecure`
- **Tipo:** bool
- **Necessário:** não

Allow downgrading a package that was previously authenticated but is no longer authenticated.

### `allow_insecure`
- **Tipo:** bool
- **Necessário:** não

Allow insecure repositories.

### `allow_weak`
- **Tipo:** bool
- **Necessário:** não

Allow repositories signed with a key using a weak digest algorithm.

### `architectures`
- **Tipo:** list
- **Necessário:** não

Architectures to search within repository.

### `by_hash`
- **Tipo:** bool
- **Necessário:** não

Controls if APT should try to acquire indexes via a URI constructed from a hashsum of the expected file instead of using the well-known stable filename of the index.

### `check_date`
- **Tipo:** bool
- **Necessário:** não

Controls if APT should consider the machine's time correct and hence perform time related checks, such as verifying that a Release file is not from the future.

### `check_valid_until`
- **Tipo:** bool
- **Necessário:** não

Controls if APT should try to detect replay attacks.

### `components`
- **Tipo:** list
- **Necessário:** não

Components specify different sections of one distribution version present in a C(Suite).

### `date_max_future`
- **Tipo:** int
- **Necessário:** não

Controls how far from the future a repository may be.

### `enabled`
- **Tipo:** bool
- **Necessário:** não

Tells APT whether the source is enabled or not.

### `exclude`
- **Tipo:** list
- **Necessário:** não

Controls which packages C(APT) should exclude from the repository.

### `include`
- **Tipo:** list
- **Necessário:** não

Controls which packages C(APT) should use from the repository.

### `inrelease_path`
- **Tipo:** str
- **Necessário:** não

Determines the path to the C(InRelease) file, relative to the normal position of an C(InRelease) file.

### `install_python_debian`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Whether to automatically try to install the Python C(debian) library or not, if it is not already installed. Without this library, the module does not work. - Runs C(apt install python3-debian). - Only works with the system Python. If you are using a Python on the remote that is not the system Python, set O(install_python_debian=false) and ensure that the Python C(debian) library for your Python version is installed some other way.

### `languages`
- **Tipo:** list
- **Necessário:** não

Defines which languages information such as translated package descriptions should be downloaded.

### `name`
- **Tipo:** str
- **Necessário:** True

Name of the repo. Specifically used for C(X-Repolib-Name) and in naming the repository and signing key files.

### `pdiffs`
- **Tipo:** bool
- **Necessário:** não

Controls if APT should try to use C(PDiffs) to update old indexes instead of downloading the new indexes entirely.

### `signed_by`
- **Tipo:** str
- **Necessário:** não

Either a URL to a GPG key, absolute path to a keyring file, one or more fingerprints of keys either in the C(trusted.gpg) keyring or in the keyrings in the C(trusted.gpg.d/) directory, or an ASCII armored GPG public key block.

### `suites`
- **Tipo:** list
- **Necessário:** não

Suite can specify an exact path in relation to the URI(s) provided, in which case the Components: must be omitted and suite must end with a slash (C(/)). Alternatively, it may take the form of a distribution version (for example a version codename like C(disco) or C(artful)). If the suite does not specify a path, at least one component must be present.

### `targets`
- **Tipo:** list
- **Necessário:** não

Defines which download targets apt will try to acquire from this source.

### `trusted`
- **Tipo:** bool
- **Necessário:** não

Decides if a source is considered trusted or if warnings should be raised before, for example packages are installed from this source.

### `types`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `['deb']`
- **Escolhas:** deb, deb-src

Which types of packages to look for from a given source; either binary V(deb) or source code V(deb-src).

### `uris`
- **Tipo:** list
- **Necessário:** não

The URIs must specify the base of the Debian distribution archive, from which APT finds the information it needs.

### `mode`
- **Tipo:** raw
- **Necessário:** não
- **Padrão:** `0644`

The octal mode for newly created files in C(sources.list.d).

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

A source string state.


## Exemplos de Uso

```yaml
- name: Add debian repo
  deb822_repository:
    name: debian
    types: deb
    uris: http://deb.debian.org/debian
    suites: stretch
    components:
      - main
      - contrib
      - non-free

- name: Add debian repo with key
  deb822_repository:
    name: debian
    types: deb
    uris: https://deb.debian.org
    suites: stable
    components:
      - main
      - contrib
      - non-free
    signed_by: |-
      -----BEGIN PGP PUBLIC KEY BLOCK-----

      mDMEYCQjIxYJKwYBBAHaRw8BAQdAD/P5Nvvnvk66SxBBHDbhRml9ORg1WV5CvzKY
      CuMfoIS0BmFiY2RlZoiQBBMWCgA4FiEErCIG1VhKWMWo2yfAREZd5NfO31cFAmAk
      IyMCGyMFCwkIBwMFFQoJCAsFFgIDAQACHgECF4AACgkQREZd5NfO31fbOwD6ArzS
      dM0Dkd5h2Ujy1b6KcAaVW9FOa5UNfJ9FFBtjLQEBAJ7UyWD3dZzhvlaAwunsk7DG
      3bHcln8DMpIJVXht78sL
      =IE0r
      -----END PGP PUBLIC KEY BLOCK-----

- name: Add repo using key from URL
  deb822_repository:
    name: example
    types: deb
    uris: https://download.example.com/linux/ubuntu
    suites: '{{ ansible_distribution_release }}'
    components: stable
    architectures: amd64
    signed_by: https://download.example.com/linux/ubuntu/gpg
```

## Valores de Retorno

- **repo:** A source string for the repository
  - Retornado: always
  - Tipo: str
  - Exemplo: `X-Repolib-Name: debian
Types: deb
URIs: https://deb.debian.org
Suites: stable
Components: main contrib non-free
Signed-By:
    -----BEGIN PGP PUBLIC KEY BLOCK-----
    .
    mDMEYCQjIxYJKwYBBAHaRw8BAQdAD/P5Nvvnvk66SxBBHDbhRml9ORg1WV5CvzKY
    CuMfoIS0BmFiY2RlZoiQBBMWCgA4FiEErCIG1VhKWMWo2yfAREZd5NfO31cFAmAk
    IyMCGyMFCwkIBwMFFQoJCAsFFgIDAQACHgECF4AACgkQREZd5NfO31fbOwD6ArzS
    dM0Dkd5h2Ujy1b6KcAaVW9FOa5UNfJ9FFBtjLQEBAJ7UyWD3dZzhvlaAwunsk7DG
    3bHcln8DMpIJVXht78sL
    =IE0r
    -----END PGP PUBLIC KEY BLOCK-----
`
- **dest:** Path to the repository file
  - Retornado: always
  - Tipo: str
  - Exemplo: `/etc/apt/sources.list.d/focal-archive.sources`
- **key_filename:** Path to the signed_by key file
  - Retornado: always
  - Tipo: str
  - Exemplo: `/etc/apt/keyrings/debian.gpg`