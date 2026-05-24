# pause

**Descrição:** Pause playbook execution

## Descrição
- Pauses playbook execution for a set amount of time, or until a prompt is acknowledged. All parameters are optional. The default behavior is to pause with a prompt.
- To pause/wait/sleep per host, use the M(ansible.builtin.wait_for) module.
- You can use C(ctrl+c) if you wish to advance a pause earlier than it is set to expire or if you need to abort a playbook run entirely. To continue early press C(ctrl+c) and then C(c). To abort a playbook press C(ctrl+c) and then C(a).
- Prompting for a set amount of time is not supported. Pausing playbook execution is interruptible but does not return user input.
- The pause module integrates into async/parallelized playbooks without any special considerations (see Rolling Updates). When using pauses with the C(serial) playbook parameter (as in rolling updates) you are only prompted once for the current group of hosts.
- This module is also supported for Windows targets.

## Opções
### `minutes`
- **Tipo:** N/A
- **Necessário:** não

A positive number of minutes to pause for.

### `seconds`
- **Tipo:** N/A
- **Necessário:** não

A positive number of seconds to pause for.

### `prompt`
- **Tipo:** N/A
- **Necessário:** não

Optional text to use for the prompt message.

### `echo`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `yes`

Controls whether or not keyboard input is shown when typing.


## Exemplos de Uso

```yaml
- name: Pause for 5 minutes to build app cache
  ansible.builtin.pause:
    minutes: 5

- name: Pause until you can verify updates to an application were successful
  ansible.builtin.pause:

- name: A helpful reminder of what to look out for post-update
  ansible.builtin.pause:
    prompt: "Make sure org.foo.FooOverload exception is not present"

- name: Pause to get some sensitive input
  ansible.builtin.pause:
    prompt: "Enter a secret"
    echo: no
```

## Valores de Retorno

- **user_input:** User input from interactive console
  - Retornado: if no waiting time set
  - Tipo: str
  - Exemplo: `Example user input`
- **start:** Time when started pausing
  - Retornado: always
  - Tipo: str
  - Exemplo: `2017-02-23 14:35:07.298862`
- **stop:** Time when ended pausing
  - Retornado: always
  - Tipo: str
  - Exemplo: `2017-02-23 14:35:09.552594`
- **delta:** Time paused in seconds
  - Retornado: always
  - Tipo: str
  - Exemplo: `2`
- **stdout:** Output of pause module
  - Retornado: always
  - Tipo: str
  - Exemplo: `Paused for 0.04 minutes`
- **echo:** Value of echo setting
  - Retornado: always
  - Tipo: bool
  - Exemplo: `True`