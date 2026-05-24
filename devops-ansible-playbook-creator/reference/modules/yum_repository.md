# yum_repository

**Descrição:** Add or remove YUM repositories

## Descrição
- Add or remove YUM repositories in RPM-based Linux distributions.
- If you wish to update an existing repository definition use M(community.general.ini_file) instead.

## Opções
### `async`
- **Tipo:** bool
- **Necessário:** não

If set to V(true) Yum will download packages and metadata from this repo in parallel, if possible.

### `bandwidth`
- **Tipo:** str
- **Necessário:** não

Maximum available network bandwidth in bytes/second. Used with the O(throttle) option.

### `baseurl`
- **Tipo:** list
- **Necessário:** não

URL to the directory where the yum repository's 'repodata' directory lives.

### `cost`
- **Tipo:** str
- **Necessário:** não

Relative cost of accessing this repository. Useful for weighing one repo's packages as greater/less than any other.

### `countme`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `None`

Whether a special flag should be added to a randomly chosen metalink/mirrorlist query each week. This allows the repository owner to estimate the number of systems consuming it.

### `deltarpm_metadata_percentage`
- **Tipo:** str
- **Necessário:** não

When the relative size of deltarpm metadata vs pkgs is larger than this, deltarpm metadata is not downloaded from the repo. Note that you can give values over V(100), so V(200) means that the metadata is required to be half the size of the packages. Use V(0) to turn off this check, and always download metadata.

### `deltarpm_percentage`
- **Tipo:** str
- **Necessário:** não

When the relative size of delta vs pkg is larger than this, delta is not used. Use V(0) to turn off delta rpm processing. Local repositories (with file://O(baseurl)) have delta rpms turned off by default.

### `description`
- **Tipo:** str
- **Necessário:** não

A human-readable string describing the repository. This option corresponds to the C(name) property in the repo file.

### `enabled`
- **Tipo:** bool
- **Necessário:** não

This tells yum whether or not use this repository.

### `enablegroups`
- **Tipo:** bool
- **Necessário:** não

Determines whether yum will allow the use of package groups for this repository.

### `exclude`
- **Tipo:** list
- **Necessário:** não
- **Aliases:** excludepkgs

List of packages to exclude from updates or installs. This should be a space separated list. Shell globs using wildcards (for example V(*) and V(?)) are allowed.

### `failovermethod`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** roundrobin, priority

V(roundrobin) randomly selects a URL out of the list of URLs to start with and proceeds through each of them as it encounters a failure contacting the host.

### `file`
- **Tipo:** str
- **Necessário:** não

File name without the C(.repo) extension to save the repo in. Defaults to the value of O(name).

### `gpgcakey`
- **Tipo:** str
- **Necessário:** não

A URL pointing to the ASCII-armored CA key file for the repository.

### `gpgcheck`
- **Tipo:** bool
- **Necessário:** não

Tells yum whether or not it should perform a GPG signature check on packages.

### `gpgkey`
- **Tipo:** list
- **Necessário:** não

A URL pointing to the ASCII-armored GPG key file for the repository.

### `module_hotfixes`
- **Tipo:** bool
- **Necessário:** não

Disable module RPM filtering and make all RPMs from the repository available. The default is V(null).

### `http_caching`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** all, packages, none

Determines how upstream HTTP caches are instructed to handle any HTTP downloads that Yum does.

### `include`
- **Tipo:** str
- **Necessário:** não

Include external configuration file. Both, local path and URL is supported. Configuration file will be inserted at the position of the C(include=) line. Included files may contain further include lines. Yum will abort with an error if an inclusion loop is detected.

### `includepkgs`
- **Tipo:** list
- **Necessário:** não

List of packages you want to only use from a repository. This should be a space separated list. Shell globs using wildcards (for example V(*) and V(?)) are allowed. Substitution variables (for example V($releasever)) are honored here.

### `ip_resolve`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** 4, 6, IPv4, IPv6, whatever

Determines how yum resolves host names.

### `keepalive`
- **Tipo:** bool
- **Necessário:** não

This tells yum whether or not HTTP/1.1 keepalive should be used with this repository. This can improve transfer speeds by using one connection when downloading multiple files from a repository.

### `metadata_expire`
- **Tipo:** str
- **Necessário:** não

Time (in seconds) after which the metadata will expire.

### `metadata_expire_filter`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** never, read-only:past, read-only:present, read-only:future

Filter the O(metadata_expire) time, allowing a trade of speed for accuracy if a command doesn't require it. Each yum command can specify that it requires a certain level of timeliness quality from the remote repos. from "I'm about to install/upgrade, so this better be current" to "Anything that's available is good enough".

### `metalink`
- **Tipo:** str
- **Necessário:** não

Specifies a URL to a metalink file for the repomd.xml, a list of mirrors for the entire repository are generated by converting the mirrors for the repomd.xml file to a O(baseurl).

### `mirrorlist`
- **Tipo:** str
- **Necessário:** não

Specifies a URL to a file containing a list of baseurls.

### `mirrorlist_expire`
- **Tipo:** str
- **Necessário:** não

Time (in seconds) after which the mirrorlist locally cached will expire.

### `name`
- **Tipo:** str
- **Necessário:** True

Unique repository ID. This option builds the section name of the repository in the repo file.

### `password`
- **Tipo:** str
- **Necessário:** não

Password to use with the username for basic authentication.

### `priority`
- **Tipo:** str
- **Necessário:** não

Enforce ordered protection of repositories. The value is an integer from 1 to 99.

### `protect`
- **Tipo:** bool
- **Necessário:** não

Protect packages from updates from other repositories.

### `proxy`
- **Tipo:** str
- **Necessário:** não

URL to the proxy server that yum should use. Set to V(_none_) to disable the global proxy setting.

### `proxy_password`
- **Tipo:** str
- **Necessário:** não

Password for this proxy.

### `proxy_username`
- **Tipo:** str
- **Necessário:** não

Username to use for proxy.

### `repo_gpgcheck`
- **Tipo:** bool
- **Necessário:** não

This tells yum whether or not it should perform a GPG signature check on the repodata from this repository.

### `reposdir`
- **Tipo:** path
- **Necessário:** não
- **Padrão:** `/etc/yum.repos.d`

Directory where the C(.repo) files will be stored.

### `retries`
- **Tipo:** str
- **Necessário:** não

Set the number of times any attempt to retrieve a file should retry before returning an error. Setting this to V(0) makes yum try forever.

### `s3_enabled`
- **Tipo:** bool
- **Necessário:** não

Enables support for S3 repositories.

### `skip_if_unavailable`
- **Tipo:** bool
- **Necessário:** não

If set to V(true) yum will continue running if this repository cannot be contacted for any reason. This should be set carefully as all repos are consulted for any given command.

### `ssl_check_cert_permissions`
- **Tipo:** bool
- **Necessário:** não

Whether yum should check the permissions on the paths for the certificates on the repository (both remote and local).

### `sslcacert`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** ca_cert

Path to the directory containing the databases of the certificate authorities yum should use to verify SSL certificates.

### `sslclientcert`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** client_cert

Path to the SSL client certificate yum should use to connect to repos/remote sites.

### `sslclientkey`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** client_key

Path to the SSL client key yum should use to connect to repos/remote sites.

### `sslverify`
- **Tipo:** bool
- **Necessário:** não
- **Aliases:** validate_certs

Defines whether yum should verify SSL certificates/hosts at all.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

State of the repo file.

### `throttle`
- **Tipo:** str
- **Necessário:** não

Enable bandwidth throttling for downloads.

### `timeout`
- **Tipo:** str
- **Necessário:** não

Number of seconds to wait for a connection before timing out.

### `ui_repoid_vars`
- **Tipo:** str
- **Necessário:** não

When a repository id is displayed, append these yum variables to the string if they are used in the O(baseurl)/etc. Variables are appended in the order listed (and found).

### `username`
- **Tipo:** str
- **Necessário:** não

Username to use for basic authentication to a repo or really any url.


## Exemplos de Uso

```yaml
- name: Add repository
  ansible.builtin.yum_repository:
    name: epel
    description: EPEL YUM repo
    baseurl: https://download.fedoraproject.org/pub/epel/$releasever/$basearch/

- name: Add multiple repositories into the same file (1/2)
  ansible.builtin.yum_repository:
    name: epel
    description: EPEL YUM repo
    file: external_repos
    baseurl: https://download.fedoraproject.org/pub/epel/$releasever/$basearch/
    gpgcheck: no

- name: Add multiple repositories into the same file (2/2)
  ansible.builtin.yum_repository:
    name: rpmforge
    description: RPMforge YUM repo
    file: external_repos
    baseurl: http://apt.sw.be/redhat/el7/en/$basearch/rpmforge
    mirrorlist: http://mirrorlist.repoforge.org/el7/mirrors-rpmforge
    enabled: no

# Handler showing how to clean yum metadata cache
- name: yum-clean-metadata
  ansible.builtin.command: yum clean metadata

# Example removing a repository and cleaning up metadata cache
- name: Remove repository (and clean up left-over metadata)
  ansible.builtin.yum_repository:
    name: epel
    state: absent
  notify: yum-clean-metadata

- name: Remove repository from a specific repo file
  ansible.builtin.yum_repository:
    name: epel
    file: external_repos
    state: absent
```

## Valores de Retorno

- **repo:** repository name
  - Retornado: success
  - Tipo: str
  - Exemplo: `epel`
- **state:** state of the target, after execution
  - Retornado: success
  - Tipo: str
  - Exemplo: `present`