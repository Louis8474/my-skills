# user

**Descrição:** Manage user accounts

## Descrição
- Manage user accounts and user attributes.
- For Windows targets, use the M(ansible.windows.win_user) module instead.

## Opções
### `name`
- **Tipo:** str
- **Necessário:** True
- **Aliases:** user

Name of the user to create, remove or modify.

### `uid`
- **Tipo:** int
- **Necessário:** não

Optionally sets the I(UID) of the user.

### `comment`
- **Tipo:** str
- **Necessário:** não

Optionally sets the description (aka I(GECOS)) of user account.

### `hidden`
- **Tipo:** bool
- **Necessário:** não

macOS only, optionally hide the user from the login window and system preferences.

### `non_unique`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Optionally when used with the C(-u) option, this option allows to change the user ID to a non-unique value.

### `seuser`
- **Tipo:** str
- **Necessário:** não

Optionally sets the C(seuser) type C(user_u) on SELinux enabled systems.

### `group`
- **Tipo:** str
- **Necessário:** não

Optionally sets the user's primary group (takes a group name).

### `groups`
- **Tipo:** list
- **Necessário:** não

A list of supplementary groups which the user is also a member of.

### `append`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If V(true), add the user to the groups specified in O(groups).

### `shell`
- **Tipo:** path
- **Necessário:** não

Optionally set the user's shell.

### `home`
- **Tipo:** path
- **Necessário:** não

Optionally set the user's home directory.

### `skeleton`
- **Tipo:** str
- **Necessário:** não

Optionally set a home skeleton directory.

### `password`
- **Tipo:** str
- **Necessário:** não

If provided, set the user's password to the provided encrypted hash (Linux) or plain text password (macOS).

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

Whether the account should exist or not, taking action if the state is different from what is stated.

### `create_home`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`
- **Aliases:** createhome

Unless set to V(false), a home directory will be made for the user when the account is created or if the home directory does not exist.

### `move_home`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If set to V(true) when used with O(home), attempt to move the user's old home directory to the specified directory if it isn't there already and the old home exists.

### `system`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

When creating an account O(state=present), setting this to V(true) makes the user a system account.

### `force`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

This only affects O(state=absent), it forces removal of the user and associated directories on supported platforms.

### `remove`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

This only affects O(state=absent), it attempts to remove directories associated with the user.

### `login_class`
- **Tipo:** str
- **Necessário:** não

Optionally sets the user's login class, a feature of most BSD OSs.

### `generate_ssh_key`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Whether to generate a SSH key for the user in question.

### `ssh_key_bits`
- **Tipo:** int
- **Necessário:** não

Optionally specify number of bits in SSH key to create.

### `ssh_key_type`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `rsa`

Optionally specify the type of SSH key to generate.

### `ssh_key_file`
- **Tipo:** path
- **Necessário:** não

Optionally specify the SSH key filename.

### `ssh_key_comment`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `ansible-generated on $HOSTNAME`

Optionally define the comment for the SSH key.

### `ssh_key_passphrase`
- **Tipo:** str
- **Necessário:** não

Set a passphrase for the SSH key.

### `update_password`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `always`
- **Escolhas:** always, on_create

V(always) will update passwords if they differ.

### `expires`
- **Tipo:** float
- **Necessário:** não

An expiry time for the user in epoch, it will be ignored on platforms that do not support this.

### `password_lock`
- **Tipo:** bool
- **Necessário:** não

Lock the password (C(usermod -L), C(usermod -U), C(pw lock)).

### `local`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Forces the use of "local" command alternatives on platforms that implement it.

### `profile`
- **Tipo:** str
- **Necessário:** não

Sets the profile of the user.

### `authorization`
- **Tipo:** str
- **Necessário:** não

Sets the authorization of the user.

### `role`
- **Tipo:** str
- **Necessário:** não

Sets the role of the user.

### `password_expire_max`
- **Tipo:** int
- **Necessário:** não

Maximum number of days between password change.

### `password_expire_min`
- **Tipo:** int
- **Necessário:** não

Minimum number of days between password change.

### `password_expire_warn`
- **Tipo:** int
- **Necessário:** não

Number of days of warning before password expires.

### `umask`
- **Tipo:** str
- **Necessário:** não

Sets the umask of the user.

### `password_expire_account_disable`
- **Tipo:** int
- **Necessário:** não

Number of days after a password expires until the account is disabled.

### `uid_min`
- **Tipo:** int
- **Necessário:** não

Sets the UID_MIN value for user creation.

### `uid_max`
- **Tipo:** int
- **Necessário:** não

Sets the UID_MAX value for user creation.

## Ver também
- `ansible.posix.authorized_key`
- `ansible.builtin.group`
- `ansible.windows.win_user`


## Exemplos de Uso

```yaml
- name: Add the user 'johnd' with a specific uid and a primary group of 'admin'
  ansible.builtin.user:
    name: johnd
    comment: John Doe
    uid: 1040
    group: admin

- name: Create a user 'johnd' with a home directory
  ansible.builtin.user:
    name: johnd
    create_home: yes

- name: Add the user 'james' with a bash shell, appending the group 'admins' and 'developers' to the user's groups
  ansible.builtin.user:
    name: james
    shell: /bin/bash
    groups: admins,developers
    append: yes

- name: Remove the user 'johnd'
  ansible.builtin.user:
    name: johnd
    state: absent
    remove: yes

- name: Create a 2048-bit SSH key for user jsmith in ~jsmith/.ssh/id_rsa
  ansible.builtin.user:
    name: jsmith
    generate_ssh_key: yes
    ssh_key_bits: 2048
    ssh_key_file: .ssh/id_rsa

- name: Added a consultant whose account you want to expire
  ansible.builtin.user:
    name: james18
    shell: /bin/zsh
    groups: developers
    expires: 1422403387

- name: Starting at Ansible 2.6, modify user, remove expiry time
  ansible.builtin.user:
    name: james18
    expires: -1

- name: Set maximum expiration date for password
  ansible.builtin.user:
    name: ram19
    password_expire_max: 10

- name: Set minimum expiration date for password
  ansible.builtin.user:
    name: pushkar15
    password_expire_min: 5

- name: Set number of warning days for password expiration
  ansible.builtin.user:
    name: jane157
    password_expire_warn: 30

- name: Set number of days after password expires until account is disabled
  ansible.builtin.user:
    name: jimholden2016
    password_expire_account_disable: 15
```

## Valores de Retorno

- **append:** Whether or not to append the user to groups.
  - Retornado: When O(state) is V(present) and the user exists
  - Tipo: bool
  - Exemplo: `True`
- **comment:** Comment section from passwd file, usually the user name.
  - Retornado: When user exists
  - Tipo: str
  - Exemplo: `Agent Smith`
- **create_home:** Whether or not to create the home directory.
  - Retornado: When user does not exist and not check mode
  - Tipo: bool
  - Exemplo: `True`
- **force:** Whether or not a user account was forcibly deleted.
  - Retornado: When O(state) is V(absent) and user exists
  - Tipo: bool
  - Exemplo: `False`
- **group:** Primary user group ID
  - Retornado: When user exists
  - Tipo: int
  - Exemplo: `1001`
- **groups:** Comma-separated list of groups of which the user is a member.
  - Retornado: When user exists and O(state) is V(present)
  - Tipo: str
  - Exemplo: `chrony,apache`
- **home:** Path to user's home directory.
  - Retornado: When O(state) is V(present)
  - Tipo: str
  - Exemplo: `/home/asmith`
- **move_home:** Whether or not to move an existing home directory.
  - Retornado: When O(state) is V(present) and user exists
  - Tipo: bool
  - Exemplo: `False`
- **name:** User account name.
  - Retornado: always
  - Tipo: str
  - Exemplo: `asmith`
- **password:** Masked value of the password.
  - Retornado: When O(state) is V(present) and O(password) is not empty
  - Tipo: str
  - Exemplo: `NOT_LOGGING_PASSWORD`
- **remove:** Whether or not to remove the user account.
  - Retornado: When O(state) is V(absent) and user exists
  - Tipo: bool
  - Exemplo: `True`
- **shell:** User login shell.
  - Retornado: When O(state) is V(present)
  - Tipo: str
  - Exemplo: `/bin/bash`
- **ssh_fingerprint:** Fingerprint of generated SSH key.
  - Retornado: When O(generate_ssh_key) is V(True)
  - Tipo: str
  - Exemplo: `2048 SHA256:aYNHYcyVm87Igh0IMEDMbvW0QDlRQfE0aJugp684ko8 ansible-generated on host (RSA)`
- **ssh_key_file:** Path to generated SSH private key file.
  - Retornado: When O(generate_ssh_key) is V(True)
  - Tipo: str
  - Exemplo: `/home/asmith/.ssh/id_rsa`
- **ssh_public_key:** Generated SSH public key file.
  - Retornado: When O(generate_ssh_key) is V(True)
  - Tipo: str
  - Exemplo: `'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC95opt4SPEC06tOYsJQJIuN23BbLMGmYo8ysVZQc4h2DZE9ugbjWWGS1/pweUGjVstgzMkBEeBCByaEf/RJKNecKRPeGd2Bw9DCj/bn5Z6rGfNENKBmo 618mUJBvdlEgea96QGjOwSB7/gmonduC7gsWDMNcOdSE3wJMTim4lddiBx4RgC9yXsJ6Tkz9BHD73MXPpT5ETnse+A3fw3IGVSjaueVnlUyUmOBf7fzmZbhlFVXf2Zi2rFTXqvbdGHKkzpw1U8eB8xFPP7y d5u1u0e6Acju/8aZ/l17IDFiLke5IzlqIMRTEbDwLNeO84YQKWTm9fODHzhYe0yvxqLiK07 ansible-generated on host'
`
- **stderr:** Standard error from running commands.
  - Retornado: When stderr is returned by a command that is run
  - Tipo: str
  - Exemplo: `Group wheels does not exist`
- **stdout:** Standard output from running commands.
  - Retornado: When standard output is returned by the command that is run
  - Tipo: str
  - Exemplo: `None`
- **system:** Whether or not the account is a system account.
  - Retornado: When O(system) is passed to the module and the account does not exist
  - Tipo: bool
  - Exemplo: `True`
- **uid:** User ID of the user account.
  - Retornado: When O(uid) is passed to the module
  - Tipo: int
  - Exemplo: `1044`