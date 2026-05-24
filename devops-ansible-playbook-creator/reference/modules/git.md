# git

**Descrição:** Deploy software (or files) from git checkouts

## Descrição
- Manage I(git) checkouts of repositories to deploy files or software.

## Opções
### `repo`
- **Tipo:** str
- **Necessário:** True
- **Aliases:** name

git, SSH, or HTTP(S) protocol address of the git repository.

### `dest`
- **Tipo:** path
- **Necessário:** True

The path of where the repository should be checked out. This is equivalent to C(git clone [repo_url] [directory]). The repository named in O(repo) is not appended to this path and the destination directory must be empty. This parameter is required, unless O(clone) is set to V(false).

### `version`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `HEAD`

What version of the repository to check out. This can be the literal string V(HEAD), a branch name, a tag name. It can also be a I(SHA-1) hash, in which case O(refspec) needs to be specified if the given revision is not already available.

### `accept_hostkey`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Will ensure or not that C(-o StrictHostKeyChecking=no) is present as an ssh option.

### `accept_newhostkey`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

As of OpenSSH 7.5, C(-o StrictHostKeyChecking=accept-new) can be used which is safer and will only accepts host keys which are not present or are the same. If V(true), ensure that C(-o StrictHostKeyChecking=accept-new) is present as an ssh option.

### `ssh_opts`
- **Tipo:** str
- **Necessário:** não

Options git will pass to ssh when used as protocol, it works via C(git)'s E(GIT_SSH)/E(GIT_SSH_COMMAND) environment variables.

### `key_file`
- **Tipo:** path
- **Necessário:** não

Specify an optional private key file path, on the target host, to use for the checkout.

### `reference`
- **Tipo:** str
- **Necessário:** não

Reference repository (see C(git clone --reference ...)).

### `remote`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `origin`

Name of the remote.

### `refspec`
- **Tipo:** str
- **Necessário:** não

Add an additional refspec to be fetched. If version is set to a I(SHA-1) not reachable from any branch or tag, this option may be necessary to specify the ref containing the I(SHA-1). Uses the same syntax as the C(git fetch) command. An example value could be "refs/meta/config".

### `force`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), any modified files in the working repository will be discarded.  Prior to 0.7, this was always V(true) and could not be disabled.  Prior to 1.9, the default was V(true).

### `depth`
- **Tipo:** int
- **Necessário:** não

Create a shallow clone with a history truncated to the specified number or revisions. The minimum possible value is V(1), otherwise ignored. Needs I(git>=1.9.1) to work correctly.

### `clone`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

If V(false), do not clone the repository even if it does not exist locally.

### `update`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

If V(false), do not retrieve new revisions from the origin repository.

### `executable`
- **Tipo:** path
- **Necessário:** não

Path to git executable to use. If not supplied, the normal mechanism for resolving binary paths will be used.

### `bare`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), repository will be created as a bare repo, otherwise it will be a standard repo with a workspace.

### `umask`
- **Tipo:** raw
- **Necessário:** não

The umask to set before doing any checkouts, or any other repository maintenance.

### `recursive`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

If V(false), repository will be cloned without the C(--recursive) option, skipping sub-modules.

### `single_branch`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Clone only the history leading to the tip of the specified revision.

### `track_submodules`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), submodules will track the latest commit on their master branch (or other branch specified in C(.gitmodules)).  If V(false), submodules will be kept at the revision specified by the main project. This is equivalent to specifying the C(--remote) flag to git submodule update.

### `verify_commit`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

If V(true), when cloning or checking out a O(version) verify the signature of a GPG signed commit. This requires git version>=2.1.0 to be installed. The commit MUST be signed and the public key MUST be present in the GPG keyring.

### `archive`
- **Tipo:** path
- **Necessário:** não

Specify archive file path with extension. If specified, creates an archive file of the specified format containing the tree structure for the source tree. Allowed archive formats ["zip", "tar.gz", "tar", "tgz"].

### `archive_prefix`
- **Tipo:** str
- **Necessário:** não

Specify a prefix to add to each file path in archive. Requires O(archive) to be specified.

### `separate_git_dir`
- **Tipo:** path
- **Necessário:** não

The path to place the cloned repository. If specified, Git repository can be separated from working tree.

### `gpg_allowlist`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

A list of trusted GPG fingerprints to compare to the fingerprint of the GPG-signed commit.


## Exemplos de Uso

```yaml
- name: Git checkout
  ansible.builtin.git:
    repo: 'https://github.com/ansible/ansible.git'
    dest: /tmp/checkout
    version: release-0.22

- name: Read-write git checkout from github
  ansible.builtin.git:
    repo: git@github.com:ansible/ansible.git
    dest: /tmp/checkout

- name: Just ensuring the repo checkout exists
  ansible.builtin.git:
    repo: 'https://github.com/ansible/ansible.git'
    dest: /tmp/checkout
    update: no

- name: Just get information about the repository whether or not it has already been cloned locally
  ansible.builtin.git:
    repo: git@github.com:ansible/ansible.git
    dest: /tmp/checkout
    clone: no
    update: no

- name: Checkout a github repo and use refspec to fetch all pull requests
  ansible.builtin.git:
    repo: 'https://github.com/ansible/ansible.git'
    dest: /tmp/checkout
    refspec: '+refs/pull/*:refs/heads/*'

- name: Create git archive from repo
  ansible.builtin.git:
    repo: git@github.com:ansible/ansible.git
    dest: /tmp/checkout
    archive: /tmp/ansible.zip

- name: Clone a repo with separate git directory
  ansible.builtin.git:
    repo: 'https://github.com/ansible/ansible.git'
    dest: /tmp/checkout
    separate_git_dir: /tmp/repo

- name: Example clone of a single branch
  ansible.builtin.git:
    repo: git@github.com:ansible/ansible.git
    dest: /tmp/checkout
    single_branch: yes
    version: master

- name: Avoid hanging when http(s) password is missing
  ansible.builtin.git:
    repo: 'https://github.com/ansible/ansible.git'
    dest: /tmp/checkout
  environment:
    GIT_TERMINAL_PROMPT: 0 # reports "terminal prompts disabled" on missing password
    # or GIT_ASKPASS: /bin/true # for git before version 2.3.0, reports "Authentication failed" on missing password
```

## Valores de Retorno

- **after:** Last commit revision of the repository retrieved during the update.
  - Retornado: success
  - Tipo: str
  - Exemplo: `4c020102a9cd6fe908c9a4a326a38f972f63a903`
- **before:** Commit revision before the repository was updated, "null" for new repository.
  - Retornado: success
  - Tipo: str
  - Exemplo: `67c04ebe40a003bda0efb34eacfb93b0cafdf628`
- **remote_url_changed:** Contains True or False whether or not the remote URL was changed.
  - Retornado: success
  - Tipo: bool
  - Exemplo: `True`
- **git_dir_now:** Contains the new path of .git directory if it is changed.
  - Retornado: success
  - Tipo: str
  - Exemplo: `/path/to/new/git/dir`
- **git_dir_before:** Contains the original path of .git directory if it is changed.
  - Retornado: success
  - Tipo: str
  - Exemplo: `/path/to/old/git/dir`