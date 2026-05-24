# get_url

**Descrição:** Downloads files from HTTP, HTTPS, or FTP to node

## Descrição
- Downloads files from HTTP, HTTPS, or FTP to the remote server. The remote server I(must) have direct access to the remote resource.
- By default, if an environment variable E(<protocol>_proxy) is set on the target host, requests will be sent through that proxy. This behaviour can be overridden by setting a variable for this task (see R(setting the environment,playbooks_environment)), or by using the use_proxy option.
- HTTP redirects can redirect from HTTP to HTTPS so you should be sure that your proxy environment for both protocols is correct.
- From Ansible 2.4 when run with C(--check), it will do a HEAD request to validate the URL but will not download the entire file or verify it against hashes and will report incorrect changed status.
- For Windows targets, use the M(ansible.windows.win_get_url) module instead.

## Opções
### `ciphers`
- **Tipo:** list
- **Necessário:** não

SSL/TLS Ciphers to use for the request.

### `decompress`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Whether to attempt to decompress gzip content-encoded responses.

### `url`
- **Tipo:** str
- **Necessário:** True

HTTP, HTTPS, or FTP URL in the form C((http|https|ftp)://[user[:pass]]@host.domain[:port]/path).

### `dest`
- **Tipo:** path
- **Necessário:** True

Absolute path of where to download the file to.

### `tmp_dest`
- **Tipo:** path
- **Necessário:** não

Absolute path of where temporary file is downloaded to.

### `force`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If V(true) and O(dest) is not a directory, will download the file every time and replace the file if the contents change. If V(false), the file will only be downloaded if the destination does not exist. Generally should be V(true) only for small local files.

### `backup`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Create a backup file including the timestamp information so you can get the original file back if you somehow clobbered it incorrectly.

### `checksum`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** ``

If a checksum is passed to this parameter, the digest of the destination file will be calculated after it is downloaded to ensure its integrity and verify that the transfer completed successfully. Format: <algorithm>:<checksum|url>, for example C(checksum="sha256:D98291AC[...]B6DC7B97"), C(checksum="sha256:http://example.com/path/sha256sum.txt").

### `use_proxy`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

if V(false), it will not use a proxy, even if one is defined in an environment variable on the target hosts.

### `validate_certs`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

If V(false), SSL certificates will not be validated.

### `timeout`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `10`

Timeout in seconds for URL request.

### `headers`
- **Tipo:** dict
- **Necessário:** não

Add custom HTTP headers to a request in hash/dict format.

### `url_username`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** username

The username for use in HTTP basic authentication.

### `url_password`
- **Tipo:** str
- **Necessário:** não
- **Aliases:** password

The password for use in HTTP basic authentication.

### `force_basic_auth`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Force the sending of the Basic authentication header upon initial request.

### `client_cert`
- **Tipo:** path
- **Necessário:** não

PEM formatted certificate chain file to be used for SSL client authentication.

### `client_key`
- **Tipo:** path
- **Necessário:** não

PEM formatted file that contains your private key to be used for SSL client authentication.

### `http_agent`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `ansible-httpget`

Header to identify as, generally appears in web server logs.

### `unredirected_headers`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

A list of header names that will not be sent on subsequent redirected requests. This list is case insensitive. By default all headers will be redirected. In some cases it may be beneficial to list headers such as C(Authorization) here to avoid potential credential exposure.

### `use_gssapi`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Use GSSAPI to perform the authentication, typically this is for Kerberos or Kerberos through Negotiate authentication.

### `use_netrc`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `True`

Determining whether to use credentials from C(~/.netrc) file.

## Ver também
- `ansible.builtin.uri`
- `ansible.windows.win_get_url`


## Exemplos de Uso

```yaml
- name: Download foo.conf
  ansible.builtin.get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    mode: '0440'

- name: Download file and force basic auth
  ansible.builtin.get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    force_basic_auth: yes

- name: Download file with custom HTTP headers
  ansible.builtin.get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    headers:
      key1: one
      key2: two

- name: Download file with check (sha256)
  ansible.builtin.get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    checksum: sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c

- name: Download file with check (md5)
  ansible.builtin.get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    checksum: md5:66dffb5228a211e61d6d7ef4a86f5758

- name: Download file with checksum url (sha256)
  ansible.builtin.get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    checksum: sha256:http://example.com/path/sha256sum.txt

- name: Download file from a file path
  ansible.builtin.get_url:
    url: file:///tmp/a_file.txt
    dest: /tmp/afilecopy.txt

- name: < Fetch file that requires authentication.
        username/password only available since 2.8, in older versions you need to use url_username/url_password
  ansible.builtin.get_url:
    url: http://example.com/path/file.conf
    dest: /etc/foo.conf
    username: bar
    password: '{{ mysecret }}'
```

## Valores de Retorno

- **backup_file:** name of backup file created after download
  - Retornado: changed and if backup=yes
  - Tipo: str
  - Exemplo: `/path/to/file.txt.2015-02-12@22:09~`
- **checksum_dest:** sha1 checksum of the file after copy
  - Retornado: success
  - Tipo: str
  - Exemplo: `6e642bb8dd5c2e027bf21dd923337cbb4214f827`
- **checksum_src:** sha1 checksum of the file
  - Retornado: success
  - Tipo: str
  - Exemplo: `6e642bb8dd5c2e027bf21dd923337cbb4214f827`
- **dest:** destination file/path
  - Retornado: success
  - Tipo: str
  - Exemplo: `/path/to/file.txt`
- **elapsed:** The number of seconds that elapsed while performing the download
  - Retornado: always
  - Tipo: int
  - Exemplo: `23`
- **gid:** group id of the file
  - Retornado: success
  - Tipo: int
  - Exemplo: `100`
- **group:** group of the file
  - Retornado: success
  - Tipo: str
  - Exemplo: `httpd`
- **md5sum:** md5 checksum of the file after download
  - Retornado: when supported
  - Tipo: str
  - Exemplo: `2a5aeecc61dc98c4d780b14b330e3282`
- **mode:** permissions of the target
  - Retornado: success
  - Tipo: str
  - Exemplo: `0644`
- **msg:** the HTTP message from the request
  - Retornado: always
  - Tipo: str
  - Exemplo: `OK (unknown bytes)`
- **owner:** owner of the file
  - Retornado: success
  - Tipo: str
  - Exemplo: `httpd`
- **secontext:** the SELinux security context of the file
  - Retornado: success
  - Tipo: str
  - Exemplo: `unconfined_u:object_r:user_tmp_t:s0`
- **size:** size of the target
  - Retornado: success
  - Tipo: int
  - Exemplo: `1220`
- **src:** source file used after download
  - Retornado: always
  - Tipo: str
  - Exemplo: `/tmp/tmpAdFLdV`
- **state:** state of the target
  - Retornado: success
  - Tipo: str
  - Exemplo: `file`
- **status_code:** the HTTP status code from the request
  - Retornado: always
  - Tipo: int
  - Exemplo: `200`
- **uid:** owner id of the file, after execution
  - Retornado: success
  - Tipo: int
  - Exemplo: `100`
- **url:** the actual URL used for the request
  - Retornado: always
  - Tipo: str
  - Exemplo: `https://www.ansible.com/`