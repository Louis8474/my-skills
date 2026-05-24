# setup

**Descrição:** Gathers facts about remote hosts

## Descrição
- This module is automatically called by playbooks to gather useful variables about remote hosts that can be used in playbooks. It can also be executed directly by C(/usr/bin/ansible) to check what variables are available to a host. Ansible provides many I(facts) about the system, automatically.
- This module is also supported for Windows targets.

## Opções
### `gather_subset`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `all`

If supplied, restrict the additional facts collected to the given subset. Possible values: V(all), V(all_ipv4_addresses), V(all_ipv6_addresses), V(apparmor), V(architecture), V(caps), V(chroot),V(cmdline), V(date_time), V(default_ipv4), V(default_ipv6), V(devices), V(distribution), V(distribution_major_version), V(distribution_release), V(distribution_version), V(dns), V(effective_group_ids), V(effective_user_id), V(env), V(facter), V(fips), V(hardware), V(interfaces), V(is_chroot), V(iscsi), V(kernel), V(local), V(lsb), V(machine), V(machine_id), V(mounts), V(network), V(ohai), V(os_family), V(pkg_mgr), V(platform), V(processor), V(processor_cores), V(processor_count), V(python), V(python_version), V(real_user_id), V(selinux), V(service_mgr), V(ssh_host_key_dsa_public), V(ssh_host_key_ecdsa_public), V(ssh_host_key_ed25519_public), V(ssh_host_key_rsa_public), V(ssh_host_pub_keys), V(ssh_pub_keys), V(system), V(system_capabilities), V(system_capabilities_enforced), V(systemd), V(user), V(user_dir), V(user_gecos), V(user_gid), V(user_id), V(user_shell), V(user_uid), V(virtual), V(virtualization_role), V(virtualization_type). Can specify a list of values to specify a larger subset. Values can also be used with an initial C(!) to specify that that specific subset should not be collected.  For instance: V(!hardware,!network,!virtual,!ohai,!facter). If V(!all) is specified then only the min subset is collected. To avoid collecting even the min subset, specify V(!all,!min). To collect only specific facts, use V(!all,!min), and specify the particular fact subsets. Use the filter parameter if you do not want to display some collected facts.

### `gather_timeout`
- **Tipo:** int
- **Necessário:** não
- **Padrão:** `10`

Set the default timeout in seconds for individual fact gathering.

### `filter`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

If supplied, only return facts that match one of the shell-style (fnmatch) pattern. An empty list basically means 'no filter'. As of Ansible 2.11, the type has changed from string to list and the default has became an empty list. A simple string is still accepted and works as a single pattern. The behaviour prior to Ansible 2.11 remains.

### `fact_path`
- **Tipo:** path
- **Necessário:** não
- **Padrão:** `/etc/ansible/facts.d`

Path used for local ansible facts (C(*.fact)) - files in this dir will be run (if executable) and their results be added to C(ansible_local) facts. If a file is not executable it is read instead. File/results format can be JSON or INI-format. The default O(fact_path) can be specified in C(ansible.cfg) for when setup is automatically called as part of C(gather_facts). NOTE - For windows clients, the results will be added to a variable named after the local file (without extension suffix), rather than C(ansible_local).


## Exemplos de Uso

```yaml
# Display facts from all hosts and store them indexed by `hostname` at `/tmp/facts`.
# ansible all -m ansible.builtin.setup --tree /tmp/facts

# Display only facts regarding memory found by ansible on all hosts and output them.
# ansible all -m ansible.builtin.setup -a 'filter=ansible_*_mb'

# Display only facts returned by facter.
# ansible all -m ansible.builtin.setup -a 'filter=facter_*'

# Collect only facts returned by facter.
# ansible all -m ansible.builtin.setup -a 'gather_subset=!all,facter'

- name: Collect only facts returned by facter
  ansible.builtin.setup:
    gather_subset:
      - '!all'
      - '!<any valid subset>'
      - facter

- name: Filter and return only selected facts
  ansible.builtin.setup:
    filter:
      - 'ansible_distribution'
      - 'ansible_machine_id'
      - 'ansible_*_mb'

# Display only facts about certain interfaces.
# ansible all -m ansible.builtin.setup -a 'filter=ansible_eth[0-2]'

# Restrict additional gathered facts to network and virtual (includes default minimum facts)
# ansible all -m ansible.builtin.setup -a 'gather_subset=network,virtual'

# Collect only network and virtual (excludes default minimum facts)
# ansible all -m ansible.builtin.setup -a 'gather_subset=!all,network,virtual'

# Do not call puppet facter or ohai even if present.
# ansible all -m ansible.builtin.setup -a 'gather_subset=!facter,!ohai'

# Only collect the default minimum amount of facts:
# ansible all -m ansible.builtin.setup -a 'gather_subset=!all'

# Collect no facts, even the default minimum subset of facts:
# ansible all -m ansible.builtin.setup -a 'gather_subset=!all,!min'

# Display facts from Windows hosts with custom facts stored in C:\custom_facts.
# ansible windows -m ansible.builtin.setup -a "fact_path='c:\custom_facts'"

# Gathers facts for the machines in the dbservers group (a.k.a Delegating facts)
- hosts: app_servers
  tasks:
    - name: Gather facts from db servers
      ansible.builtin.setup:
      delegate_to: "{{ item }}"
      delegate_facts: true
      loop: "{{ groups['dbservers'] }}"
```