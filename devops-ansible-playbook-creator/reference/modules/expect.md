# expect

**Descrição:** Executes a command and responds to prompts

## Descrição
- The M(ansible.builtin.expect) module executes a command and responds to prompts.
- The given command will be executed on all selected nodes. It will not be processed through the shell, so variables like C($HOME) and operations like C("<"), C(">"), C("|"), and C("&") will not work.

## Opções
### `command`
- **Tipo:** str
- **Necessário:** True

The command module takes command to run.

### `creates`
- **Tipo:** path
- **Necessário:** não

A filename, when it already exists, this step will B(not) be run.

### `removes`
- **Tipo:** path
- **Necessário:** não

A filename, when it does not exist, this step will B(not) be run.

### `chdir`
- **Tipo:** path
- **Necessário:** não

Change into this directory before running the command.

### `responses`
- **Tipo:** dict
- **Necessário:** True

Mapping of prompt regular expressions and corresponding answer(s).

### `timeout`
- **Tipo:** raw
- **Necessário:** não
- **Padrão:** `30`

Amount of time in seconds to wait for the expected strings. Use V(null) to disable timeout.

### `echo`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Whether or not to echo out your response strings.

## Ver também
- `ansible.builtin.script`
- `ansible.builtin.shell`


## Exemplos de Uso

```yaml
- name: Case insensitive password string match
  ansible.builtin.expect:
    command: passwd username
    responses:
      (?i)password: "MySekretPa$$word"
  # you don't want to show passwords in your logs
  no_log: true

- name: Match multiple regular expressions and demonstrate individual and repeated responses
  ansible.builtin.expect:
    command: /path/to/custom/command
    responses:
      Question:
        # give a unique response for each of the 3 hypothetical prompts matched
        - response1
        - response2
        - response3
      # give the same response for every matching prompt
      "^Match another prompt$": "response"

- name: Multiple questions with responses
  ansible.builtin.expect:
    command: /path/to/custom/command
    responses:
        "Please provide your name":
            - "Anna"
        "Database user":
            - "{{ db_username }}"
        "Database password":
            - "{{ db_password }}"
```