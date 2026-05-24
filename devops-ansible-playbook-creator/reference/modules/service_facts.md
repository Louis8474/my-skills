# service_facts

**Descrição:** Return service state information as fact data

## Descrição
- Return service state information as fact data for various service management utilities.


## Exemplos de Uso

```yaml
- name: Populate service facts
  ansible.builtin.service_facts:

- name: Print service facts
  ansible.builtin.debug:
    var: ansible_facts.services

- name: show names of existing systemd services, sometimes systemd knows about services that were never installed
  debug: msg={{ existing_systemd_services | map(attribute='name') }}
  vars:
     known_systemd_services: "{{ ansible_facts['services'].values() | selectattr('source', 'equalto', 'systemd') }}"
     existing_systemd_services: "{{ known_systemd_services | rejectattr('status', 'equalto', 'not-found') }}"

- name: restart systemd service if it exists
  service:
    state: restarted
    name: ntpd.service
  when: ansible_facts['services']['ntpd.service']['status'] | default('not-found') != 'not-found'
```

## Valores de Retorno

- **ansible_facts:** Facts to add to ansible_facts about the services on the system
  - Retornado: always
  - Tipo: complex