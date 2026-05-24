# async_status

**Descrição:** Obtain status of asynchronous task

## Descrição
- This module gets the status of an asynchronous task.
- This module is also supported for Windows targets.

## Opções
### `jid`
- **Tipo:** str
- **Necessário:** True

Job or task identifier

### `mode`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `status`
- **Escolhas:** cleanup, status

If V(status), obtain the status.

## Ver também


## Exemplos de Uso

```yaml
---
- name: Asynchronous dnf task
  ansible.builtin.dnf:
    name: docker-io
    state: present
  async: 1000
  poll: 0
  register: dnf_sleeper

- name: Wait for asynchronous job to end
  ansible.builtin.async_status:
    jid: '{{ dnf_sleeper.ansible_job_id }}'
  register: job_result
  until: job_result is finished
  retries: 100
  delay: 10

- name: Clean up async file
  ansible.builtin.async_status:
    jid: '{{ dnf_sleeper.ansible_job_id }}'
    mode: cleanup
```

## Valores de Retorno

- **ansible_job_id:** The asynchronous job id
  - Retornado: success
  - Tipo: str
  - Exemplo: `360874038559.4169`
- **finished:** Whether the asynchronous job has finished or not
  - Retornado: always
  - Tipo: bool
  - Exemplo: `True`
- **started:** Whether the asynchronous job has started or not
  - Retornado: always
  - Tipo: bool
  - Exemplo: `True`
- **stdout:** Any output returned by async_wrapper
  - Retornado: always
  - Tipo: str
- **stderr:** Any errors returned by async_wrapper
  - Retornado: always
  - Tipo: str
- **erased:** Path to erased job file
  - Retornado: when file is erased
  - Tipo: str