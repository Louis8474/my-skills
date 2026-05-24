# dnf5

**Descrição:** Manages packages with the I(dnf5) package manager

## Descrição
- Installs, upgrade, removes, and lists packages and groups with the I(dnf5) package manager.
- WARNING: The I(dnf5) package manager is still under development and not all features that the existing M(ansible.builtin.dnf) module provides are implemented in M(ansible.builtin.dnf5), please consult specific options for more information.

## Opções
### `auto_install_module_deps`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Automatically install dependencies required to run this module.

### `name`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`
- **Aliases:** pkg

A package name or package specifier with version, like C(name-1.0). When using O(state=latest), this can be C(*) which means run: C(dnf -y update). You can also pass a url or a local path to an rpm file. To operate on several packages this can accept a comma separated string of packages or a list of packages.

### `list`
- **Tipo:** str
- **Necessário:** não

Various (non-idempotent) commands for usage with C(/usr/bin/ansible) and I(not) playbooks. Use M(ansible.builtin.package_facts) instead of the O(list) argument as a best practice.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** absent, present, installed, removed, latest

Whether to install (V(present), V(latest)), or remove (V(absent)) a package.

### `enablerepo`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

I(Repoid) of repositories to enable for the install/update operation. These repos will not persist beyond the transaction. When specifying multiple repos, separate them with a C(,).

### `disablerepo`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

I(Repoid) of repositories to disable for the install/update operation. These repos will not persist beyond the transaction. When specifying multiple repos, separate them with a C(,).

### `conf_file`
- **Tipo:** str
- **Necessário:** não

The remote dnf configuration file to use for the transaction.

### `disable_gpg_check`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Whether to disable the GPG checking of signatures of packages being installed. Has an effect only if O(state) is V(present) or V(latest).

### `installroot`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `/`

Specifies an alternative installroot, relative to which all packages will be installed.

### `releasever`
- **Tipo:** str
- **Necessário:** não

Specifies an alternative release from which all packages will be installed.

### `autoremove`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), removes all "leaf" packages from the system that were originally installed as dependencies of user-installed packages but which are no longer required by any such package. Should be used alone or when O(state=absent).

### `exclude`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

Package name(s) to exclude when O(state=present) or O(state=latest). This can be a list or a comma separated string.

### `skip_broken`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Skip all unavailable packages or packages with broken dependencies without raising an error. Equivalent to passing the C(--skip-broken) option.

### `update_cache`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`
- **Aliases:** expire-cache

Force dnf to check if cache is out of date and redownload if needed. Has an effect only if O(state=present) or O(state=latest).

### `update_only`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

When using latest, only update installed packages. Do not install packages.

### `security`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If set to V(true), and O(state=latest) then only installs updates that have been marked security related.

### `bugfix`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If set to V(true), and O(state=latest) then only installs updates that have been marked bugfix related.

### `enable_plugin`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

I(Plugin) name to enable for the install/update operation. The enabled plugin will not persist beyond the transaction.

### `disable_plugin`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

I(Plugin) name to disable for the install/update operation. The disabled plugins will not persist beyond the transaction.

### `disable_excludes`
- **Tipo:** str
- **Necessário:** não

Disable the excludes defined in DNF config files.

### `validate_certs`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

This is effectively a no-op in the dnf5 module as dnf5 itself handles downloading a https url as the source of the rpm, but is an accepted parameter for feature parity/compatibility with the M(ansible.builtin.dnf) module.

### `sslverify`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

Disables SSL validation of the repository server for this transaction.

### `allow_downgrade`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Specify if the named package and version is allowed to downgrade a maybe already installed higher version of that package. Note that setting O(allow_downgrade=true) can make this module behave in a non-idempotent way. The task could end up with a set of packages that does not match the complete list of specified packages to install (because dependencies between the downgraded package and others can cause changes to the packages which were in the earlier transaction).

### `download_only`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Only download the packages, do not install them.

### `lock_timeout`
- **Tipo:** int
- **Necessário:** False
- **Padrão:** `30`

This is currently a no-op as dnf5 does not provide an option to configure it.

### `install_weak_deps`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

Will also install all packages linked by a weak dependency relation.

### `download_dir`
- **Tipo:** str
- **Necessário:** não

Specifies an alternate directory to store packages.

### `allowerasing`
- **Tipo:** bool
- **Necessário:** False
- **Padrão:** `no`

If V(true) it allows  erasing  of  installed  packages to resolve dependencies.

### `nobest`
- **Tipo:** bool
- **Necessário:** False

This is the opposite of the O(best) option kept for backwards compatibility.

### `best`
- **Tipo:** bool
- **Necessário:** False

When set to V(true), either use a package with the highest version available or fail.

### `cacheonly`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Tells dnf to run entirely from system cache; does not download or update metadata.


## Exemplos de Uso

```yaml
- name: Install the latest version of Apache
  ansible.builtin.dnf5:
    name: httpd
    state: latest

- name: Install Apache >= 2.4
  ansible.builtin.dnf5:
    name: httpd >= 2.4
    state: present

- name: Install the latest version of Apache and MariaDB
  ansible.builtin.dnf5:
    name:
      - httpd
      - mariadb-server
    state: latest

- name: Remove the Apache package
  ansible.builtin.dnf5:
    name: httpd
    state: absent

- name: Install the latest version of Apache from the testing repo
  ansible.builtin.dnf5:
    name: httpd
    enablerepo: testing
    state: present

- name: Upgrade all packages
  ansible.builtin.dnf5:
    name: "*"
    state: latest

- name: Update the webserver, depending on which is installed on the system. Do not install the other one
  ansible.builtin.dnf5:
    name:
      - httpd
      - nginx
    state: latest
    update_only: yes

- name: Install the nginx rpm from a remote repo
  ansible.builtin.dnf5:
    name: 'http://nginx.org/packages/centos/6/noarch/RPMS/nginx-release-centos-6-0.el6.ngx.noarch.rpm'
    state: present

- name: Install nginx rpm from a local file
  ansible.builtin.dnf5:
    name: /usr/local/src/nginx-release-centos-6-0.el6.ngx.noarch.rpm
    state: present

- name: Install Package based upon the file it provides
  ansible.builtin.dnf5:
    name: /usr/bin/cowsay
    state: present

- name: Install the 'Development tools' package group
  ansible.builtin.dnf5:
    name: '@Development tools'
    state: present

- name: Autoremove unneeded packages installed as dependencies
  ansible.builtin.dnf5:
    autoremove: yes

- name: Uninstall httpd but keep its dependencies
  ansible.builtin.dnf5:
    name: httpd
    state: absent
    autoremove: no
```

## Valores de Retorno

- **msg:** Additional information about the result
  - Retornado: always
  - Tipo: str
  - Exemplo: `Nothing to do`
- **results:** A list of the dnf transaction results
  - Retornado: success
  - Tipo: list
  - Exemplo: `['Installed: lsof-4.94.0-4.fc37.x86_64']`
- **failures:** A list of the dnf transaction failures
  - Retornado: failure
  - Tipo: list
  - Exemplo: `["Argument 'lsof' matches only excluded packages."]`
- **rc:** For compatibility, 0 for success, 1 for failure
  - Retornado: always
  - Tipo: int
  - Exemplo: `0`