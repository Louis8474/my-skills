# apt

**Descrição:** Manages apt-packages

## Descrição
- Manages I(apt) packages (such as for Debian/Ubuntu).

## Opções
### `auto_install_module_deps`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Automatically install dependencies required to run this module.

### `name`
- **Tipo:** list
- **Necessário:** não
- **Aliases:** package, pkg

A list of package names, like V(foo), or package specifier with version, like V(foo=1.0) or V(foo>=1.0). Name wildcards (fnmatch) like V(apt*) and version wildcards like V(foo=1.0*) are also supported.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, build-dep, latest, present, fixed

Indicates the desired package state. V(latest) ensures that the latest version is installed. V(build-dep) ensures the package build dependencies are installed. V(fixed) attempt to correct a system with broken dependencies in place.

### `update_cache`
- **Tipo:** bool
- **Necessário:** não
- **Aliases:** update-cache

Run the equivalent of C(apt-get update) before the operation. Can be run as part of the package installation or as a separate step.

### `update_cache_retries`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `5`

Amount of retries if the cache update fails. Also see O(update_cache_retry_max_delay).

### `update_cache_retry_max_delay`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `12`

Use an exponential backoff delay for each retry (see O(update_cache_retries)) up to this max delay in seconds.

### `cache_valid_time`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `0`

Update the apt cache if it is older than the O(cache_valid_time). This option is set in seconds.

### `purge`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Will force purging of configuration files if O(state=absent) or O(autoremove=yes).

### `default_release`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** default-release

Corresponds to the C(-t) option for I(apt) and sets pin priorities.

### `install_recommends`
- **Tipo:** bool
- **Necessário:** não
- **Aliases:** install-recommends

Corresponds to the C(--no-install-recommends) option for C(apt). V(true) installs recommended packages. V(false) does not install recommended packages. By default, Ansible will use the same defaults as the operating system. Suggested packages are never installed.

### `force`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Corresponds to the C(--force-yes) to C(apt-get) and implies O(allow_unauthenticated=yes) and O(allow_downgrade=yes).

### `clean`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Run the equivalent of C(apt-get clean) to clear out the local repository of retrieved package files. It removes everything but the lock file from C(/var/cache/apt/archives/) and C(/var/cache/apt/archives/partial/).

### `allow_unauthenticated`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`
- **Aliases:** allow-unauthenticated

Ignore if packages cannot be authenticated. This is useful for bootstrapping environments that manage their own apt-key setup.

### `allow_downgrade`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`
- **Aliases:** allow-downgrade, allow_downgrades, allow-downgrades

Corresponds to the C(--allow-downgrades) option for I(apt).

### `allow_change_held_packages`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Allows changing the version of a package which is on the apt hold list.

### `upgrade`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `no`
- **Escolhas:** dist, full, no, safe, yes

If yes or safe, performs an aptitude safe-upgrade.

### `dpkg_options`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `force-confdef,force-confold`

Add C(dpkg) options to C(apt) command. Defaults to C(-o "Dpkg::Options::=--force-confdef" -o "Dpkg::Options::=--force-confold").

### `deb`
- **Tipo:** path
- **Necessário:** False

Path to a .deb package on the remote machine.

### `autoremove`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), remove unused dependency packages for all module states except V(build-dep). It can also be used as the only option.

### `autoclean`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), cleans the local repository of retrieved package files that can no longer be downloaded.

### `policy_rc_d`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `None`

Force the exit code of C(/usr/sbin/policy-rc.d).

### `only_upgrade`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Only upgrade a package if it is already installed.

### `fail_on_autoremove`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Corresponds to the C(--no-remove) option for C(apt).

### `force_apt_get`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Force usage of apt-get instead of aptitude.

### `lock_timeout`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `60`

How many seconds will this action wait to acquire a lock on the apt db.

## Ver também
- `ansible.builtin.deb822_repository`


## Exemplos de Uso

```yaml
- name: Install apache httpd (state=present is optional)
  ansible.builtin.apt:
    name: apache2
    state: present

- name: Update repositories cache and install "foo" package
  ansible.builtin.apt:
    name: foo
    update_cache: yes

- name: Remove "foo" package
  ansible.builtin.apt:
    name: foo
    state: absent

- name: Install the package "foo"
  ansible.builtin.apt:
    name: foo

- name: Install a list of packages
  ansible.builtin.apt:
    pkg:
    - foo
    - foo-tools

- name: Install the version '1.00' of package "foo"
  ansible.builtin.apt:
    name: foo=1.00

- name: Update the repository cache and update package "nginx" to latest version using default release squeeze-backport
  ansible.builtin.apt:
    name: nginx
    state: latest
    default_release: squeeze-backports
    update_cache: yes

- name: Install the version '1.18.0' of package "nginx" and allow potential downgrades
  ansible.builtin.apt:
    name: nginx=1.18.0
    state: present
    allow_downgrade: yes

- name: Install zfsutils-linux with ensuring conflicted packages (e.g. zfs-fuse) will not be removed.
  ansible.builtin.apt:
    name: zfsutils-linux
    state: latest
    fail_on_autoremove: yes

- name: Install latest version of "openjdk-6-jdk" ignoring "install-recommends"
  ansible.builtin.apt:
    name: openjdk-6-jdk
    state: latest
    install_recommends: no

- name: Update all packages to their latest version
  ansible.builtin.apt:
    name: "*"
    state: latest

- name: Upgrade the OS (apt-get dist-upgrade)
  ansible.builtin.apt:
    upgrade: dist

- name: Run the equivalent of "apt-get update" as a separate step
  ansible.builtin.apt:
    update_cache: yes

- name: Only run "update_cache=yes" if the last one is more than 3600 seconds ago
  ansible.builtin.apt:
    update_cache: yes
    cache_valid_time: 3600

- name: Pass options to dpkg on run
  ansible.builtin.apt:
    upgrade: dist
    update_cache: yes
    dpkg_options: 'force-confold,force-confdef'

- name: Install a .deb package
  ansible.builtin.apt:
    deb: /tmp/mypackage.deb

- name: Install the build dependencies for package "foo"
  ansible.builtin.apt:
    pkg: foo
    state: build-dep

- name: Install a .deb package from the internet
  ansible.builtin.apt:
    deb: https://example.com/python-ppq_0.1-1_all.deb

- name: Remove useless packages from the cache
  ansible.builtin.apt:
    autoclean: yes

- name: Remove dependencies that are no longer required
  ansible.builtin.apt:
    autoremove: yes

- name: Remove dependencies that are no longer required and purge their configuration files
  ansible.builtin.apt:
    autoremove: yes
    purge: true

- name: Run the equivalent of "apt-get clean" as a separate step
  ansible.builtin.apt:
    clean: yes
```

## Valores de Retorno

- **cache_updated:** if the cache was updated or not
  - Retornado: success, in some cases
  - Tipo: bool
  - Exemplo: `True`
- **cache_update_time:** time of the last cache update (0 if unknown)
  - Retornado: success, in some cases
  - Tipo: int
  - Exemplo: `1425828348000`
- **stdout:** output from apt
  - Retornado: success, when needed
  - Tipo: str
  - Exemplo: `Reading package lists...
Building dependency tree...
Reading state information...
The following extra packages will be installed:
  apache2-bin ...`
- **stderr:** error output from apt
  - Retornado: success, when needed
  - Tipo: str
  - Exemplo: `AH00558: apache2: Could not reliably determine the server's fully qualified domain name, using 127.0.1.1. Set the 'ServerName' directive globally to ...`