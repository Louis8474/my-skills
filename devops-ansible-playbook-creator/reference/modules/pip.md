# pip

**Descrição:** Manages Python library dependencies

## Descrição
- Manage Python library dependencies. To use this module, one of the following keys is required: O(name) or O(requirements).

## Opções
### `name`
- **Tipo:** list
- **Necessário:** não

The name of a Python library to install or the url(bzr+,hg+,git+,svn+) of the remote package.

### `version`
- **Tipo:** str
- **Necessário:** não

The version number to install of the Python library specified in the O(name) parameter.

### `requirements`
- **Tipo:** str
- **Necessário:** não

The path to a pip requirements file, which should be local to the remote system. File can be specified as a relative path if using the O(chdir) option.

### `virtualenv`
- **Tipo:** path
- **Necessário:** não

An optional path to a I(virtualenv) directory to install into. It cannot be specified together with the O(executable) parameter (added in 2.1). If the virtualenv does not exist, it will be created before installing packages. The optional O(virtualenv_site_packages), O(virtualenv_command), and O(virtualenv_python) options affect the creation of the virtualenv.

### `virtualenv_site_packages`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Whether the virtual environment will inherit packages from the global C(site-packages) directory. Note that if this setting is changed on an already existing virtual environment it will not have any effect, the environment must be deleted and newly created.

### `virtualenv_command`
- **Tipo:** path
- **Necessário:** não
- **Padrão:** `virtualenv`

The command or a pathname to the command to create the virtual environment with. For example V(pyvenv), V(virtualenv), V(virtualenv2), V(~/bin/virtualenv), V(/usr/local/bin/virtualenv).

### `virtualenv_python`
- **Tipo:** str
- **Necessário:** não

The Python executable used for creating the virtual environment. For example V(python3.13). When not specified, the Python version used to run the ansible module is used. This parameter should not be used when O(virtualenv_command) is using V(pyvenv) or the C(-m venv) module.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, forcereinstall, latest, present

The state of module.

### `extra_args`
- **Tipo:** str
- **Necessário:** não

Extra arguments passed to C(pip).

### `editable`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `no`

Pass the editable flag.

### `chdir`
- **Tipo:** path
- **Necessário:** não

cd into this directory before running the command.

### `executable`
- **Tipo:** path
- **Necessário:** não

The explicit executable or pathname for the C(pip) executable, if different from the Ansible Python interpreter. For example V(pip3.13), if there are multiple Python installations in the system and you want to run pip for the Python 3.13 installation.

### `umask`
- **Tipo:** str
- **Necessário:** não

The system umask to apply before installing the pip package. This is useful, for example, when installing on systems that have a very restrictive umask by default (e.g., C(0077)) and you want to C(pip install) packages which are to be used by all users. Note that this requires you to specify desired umask mode as an octal string, (e.g., C(0022)).

### `break_system_packages`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Allow C(pip) to modify an externally-managed Python installation as defined by PEP 668.


## Exemplos de Uso

```yaml
- name: Install bottle python package
  ansible.builtin.pip:
    name: bottle

- name: Install bottle python package on version 0.11
  ansible.builtin.pip:
    name: bottle==0.11

- name: Install bottle python package with version specifiers
  ansible.builtin.pip:
    name: bottle>0.10,<0.20,!=0.11

- name: Install multi python packages with version specifiers
  ansible.builtin.pip:
    name:
      - django>1.11.0,<1.12.0
      - bottle>0.10,<0.20,!=0.11

- name: Install python package using a proxy
  ansible.builtin.pip:
    name: six
  environment:
    http_proxy: 'http://127.0.0.1:8080'
    https_proxy: 'https://127.0.0.1:8080'

# You do not have to supply '-e' option in extra_args
- name: Install MyApp using one of the remote protocols (bzr+,hg+,git+,svn+)
  ansible.builtin.pip:
    name: svn+http://myrepo/svn/MyApp#egg=MyApp

- name: Install MyApp using one of the remote protocols (bzr+,hg+,git+)
  ansible.builtin.pip:
    name: git+http://myrepo/app/MyApp

- name: Install MyApp from local tarball
  ansible.builtin.pip:
    name: file:///path/to/MyApp.tar.gz

- name: Install bottle into the specified (virtualenv), inheriting none of the globally installed modules
  ansible.builtin.pip:
    name: bottle
    virtualenv: /my_app/venv

- name: Install bottle into the specified (virtualenv), inheriting globally installed modules
  ansible.builtin.pip:
    name: bottle
    virtualenv: /my_app/venv
    virtualenv_site_packages: yes

- name: Install bottle into the specified (virtualenv), using Python 3.13
  ansible.builtin.pip:
    name: bottle
    virtualenv: /my_app/venv
    virtualenv_command: virtualenv-3.13

- name: Install bottle within a user home directory
  ansible.builtin.pip:
    name: bottle
    extra_args: --user

- name: Install specified python requirements
  ansible.builtin.pip:
    requirements: /my_app/requirements.txt

- name: Install specified python requirements in indicated (virtualenv)
  ansible.builtin.pip:
    requirements: /my_app/requirements.txt
    virtualenv: /my_app/venv

- name: Install specified python requirements and custom Index URL
  ansible.builtin.pip:
    requirements: /my_app/requirements.txt
    extra_args: -i https://example.com/pypi/simple

- name: Install specified python requirements offline from a local directory with downloaded packages
  ansible.builtin.pip:
    requirements: /my_app/requirements.txt
    extra_args: "--no-index --find-links=file:///my_downloaded_packages_dir"

- name: Install bottle for Python 3.13 specifically, using the 'pip3.13' executable
  ansible.builtin.pip:
    name: bottle
    executable: pip3.13

- name: Install bottle, forcing reinstallation if it's already installed
  ansible.builtin.pip:
    name: bottle
    state: forcereinstall

- name: Install bottle while ensuring the umask is 0022 (to ensure other users can use it)
  ansible.builtin.pip:
    name: bottle
    umask: "0022"
  become: True

- name: Run a module inside a virtual environment
  block:
    - name: Ensure the virtual environment exists
      pip:
        name: psutil
        virtualenv: "{{ venv_dir }}"
        # On Debian-based systems the correct python*-venv package must be installed to use the `venv` module.
        virtualenv_command: "{{ ansible_python_interpreter }} -m venv"

    - name: Run a module inside the virtual environment
      wait_for:
        port: 22
      vars:
        # Alternatively, use a block to affect multiple tasks, or use set_fact to affect the remainder of the playbook.
        ansible_python_interpreter: "{{ venv_python }}"

  vars:
    venv_dir: /tmp/pick-a-better-venv-path
    venv_python: "{{ venv_dir }}/bin/python"
```

## Valores de Retorno

- **cmd:** pip command used by the module
  - Retornado: success
  - Tipo: str
  - Exemplo: `pip2 install ansible six`
- **name:** list of python modules targeted by pip
  - Retornado: success
  - Tipo: list
  - Exemplo: `['ansible', 'six']`
- **requirements:** Path to the requirements file
  - Retornado: success, if a requirements file was provided
  - Tipo: str
  - Exemplo: `/srv/git/project/requirements.txt`
- **version:** Version of the package specified in 'name'
  - Retornado: success, if a name and version were provided
  - Tipo: str
  - Exemplo: `2.5.1`
- **virtualenv:** Path to the virtualenv
  - Retornado: success, if a virtualenv path was provided
  - Tipo: str
  - Exemplo: `/tmp/virtualenv`