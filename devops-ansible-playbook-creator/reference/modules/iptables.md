# iptables

**Descrição:** Modify iptables rules

## Descrição
- M(ansible.builtin.iptables) is used to set up, maintain, and inspect the tables of IP packet filter rules in the Linux kernel.
- This module does not handle the saving and/or loading of rules, but rather only manipulates the current rules that are present in memory. This is the same as the behaviour of the C(iptables) and C(ip6tables) command which this module uses internally.

## Opções
### `table`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `filter`
- **Escolhas:** filter, nat, mangle, raw, security

This option specifies the packet matching table on which the command should operate.

### `state`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `present`
- **Escolhas:** absent, present

Whether the rule should be absent or present.

### `action`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `append`
- **Escolhas:** append, insert

Whether the rule should be appended at the bottom or inserted at the top.

### `rule_num`
- **Tipo:** str
- **Necessário:** não

Insert the rule as the given rule number.

### `ip_version`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `ipv4`
- **Escolhas:** ipv4, ipv6, both

Which version of the IP protocol this rule should apply to.

### `chain`
- **Tipo:** str
- **Necessário:** não

Specify the iptables chain to modify.

### `protocol`
- **Tipo:** str
- **Necessário:** não

The protocol of the rule or of the packet to check.

### `source`
- **Tipo:** str
- **Necessário:** não

Source specification.

### `destination`
- **Tipo:** str
- **Necessário:** não

Destination specification.

### `tcp_flags`
- **Tipo:** dict
- **Necessário:** não

TCP flags specification.

### `match`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

Specifies a match to use, that is, an extension module that tests for a specific property.

### `jump`
- **Tipo:** str
- **Necessário:** não

This specifies the target of the rule; i.e., what to do if the packet matches it.

### `gateway`
- **Tipo:** str
- **Necessário:** não

This specifies the IP address of the host to send the cloned packets.

### `log_prefix`
- **Tipo:** str
- **Necessário:** não

Specifies a log text for the rule. Only makes sense with a LOG jump.

### `log_level`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** 0, 1, 2, 3, 4, 5, 6, 7, emerg, alert, crit, error, warning, notice, info, debug

Logging level according to the syslogd-defined priorities.

### `goto`
- **Tipo:** str
- **Necessário:** não

This specifies that the processing should continue in a user-specified chain.

### `in_interface`
- **Tipo:** str
- **Necessário:** não

Name of an interface via which a packet was received (only for packets entering the V(INPUT), V(FORWARD) and V(PREROUTING) chains).

### `out_interface`
- **Tipo:** str
- **Necessário:** não

Name of an interface via which a packet is going to be sent (for packets entering the V(FORWARD), V(OUTPUT) and V(POSTROUTING) chains).

### `fragment`
- **Tipo:** str
- **Necessário:** não

This means that the rule only refers to second and further fragments of fragmented packets.

### `set_counters`
- **Tipo:** str
- **Necessário:** não

This enables the administrator to initialize the packet and byte counters of a rule (during V(INSERT), V(APPEND), V(REPLACE) operations).

### `source_port`
- **Tipo:** str
- **Necessário:** não

Source port or port range specification.

### `destination_port`
- **Tipo:** str
- **Necessário:** não

Destination port or port range specification. This can either be a service name or a port number. An inclusive range can also be specified, using the format first:last. If the first port is omitted, '0' is assumed; if the last is omitted, '65535' is assumed. If the first port is greater than the second one they will be swapped. This is only valid if the rule also specifies one of the following protocols: tcp, udp, dccp or sctp.

### `destination_ports`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

This specifies multiple destination port numbers or port ranges to match in the multiport module.

### `to_ports`
- **Tipo:** str
- **Necessário:** não

This specifies a destination port or range of ports to use, without this, the destination port is never altered.

### `to_destination`
- **Tipo:** str
- **Necessário:** não

This specifies a destination address to use with O(ctstate=DNAT).

### `to_source`
- **Tipo:** str
- **Necessário:** não

This specifies a source address to use with O(ctstate=SNAT).

### `syn`
- **Tipo:** str
- **Necessário:** não
- **Padrão:** `ignore`
- **Escolhas:** ignore, match, negate

This allows matching packets that have the SYN bit set and the ACK and RST bits unset.

### `set_dscp_mark`
- **Tipo:** str
- **Necessário:** não

This allows specifying a DSCP mark to be added to packets. It takes either an integer or hex value.

### `set_dscp_mark_class`
- **Tipo:** str
- **Necessário:** não

This allows specifying a predefined DiffServ class which will be translated to the corresponding DSCP mark.

### `comment`
- **Tipo:** str
- **Necessário:** não

This specifies a comment that will be added to the rule.

### `ctstate`
- **Tipo:** list
- **Necessário:** não
- **Padrão:** `[]`

A list of the connection states to match in the conntrack module.

### `src_range`
- **Tipo:** str
- **Necessário:** não

Specifies the source IP range to match the iprange module.

### `dst_range`
- **Tipo:** str
- **Necessário:** não

Specifies the destination IP range to match in the iprange module.

### `match_set`
- **Tipo:** str
- **Necessário:** não

Specifies a set name that can be defined by ipset.

### `match_set_flags`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** src, dst, src,dst, dst,src, dst,dst, src,src

Specifies the necessary flags for the match_set parameter.

### `limit`
- **Tipo:** str
- **Necessário:** não

Specifies the maximum average number of matches to allow per second.

### `limit_burst`
- **Tipo:** str
- **Necessário:** não

Specifies the maximum burst before the above limit kicks in.

### `uid_owner`
- **Tipo:** str
- **Necessário:** não

Specifies the UID or username to use in the match by owner rule.

### `gid_owner`
- **Tipo:** str
- **Necessário:** não

Specifies the GID or group to use in the match by owner rule.

### `reject_with`
- **Tipo:** str
- **Necessário:** não

Specifies the error packet type to return while rejecting. It implies C(jump=REJECT).

### `icmp_type`
- **Tipo:** str
- **Necessário:** não

This allows specification of the ICMP type, which can be a numeric ICMP type, type/code pair, or one of the ICMP type names shown by the command C(iptables -p icmp -h).

### `flush`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

Flushes the specified table and chain of all rules.

### `policy`
- **Tipo:** str
- **Necessário:** não
- **Escolhas:** ACCEPT, DROP, QUEUE, RETURN

Set the policy for the chain to the given target.

### `wait`
- **Tipo:** str
- **Necessário:** não

Wait N seconds for the xtables lock to prevent multiple instances of the program from running concurrently.

### `chain_management`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

If V(true) and O(state) is V(present), the chain will be created if needed.

### `numeric`
- **Tipo:** bool
- **Necessário:** não
- **Padrão:** `False`

This parameter controls the running of the list -action of iptables, which is used internally by the module.


## Exemplos de Uso

```yaml
- name: Block specific IP
  ansible.builtin.iptables:
    chain: INPUT
    source: 8.8.8.8
    jump: DROP
  become: yes

- name: Forward port 80 to 8600
  ansible.builtin.iptables:
    table: nat
    chain: PREROUTING
    in_interface: eth0
    protocol: tcp
    match: tcp
    destination_port: 80
    jump: REDIRECT
    to_ports: 8600
    comment: Redirect web traffic to port 8600
  become: yes

- name: Allow related and established connections
  ansible.builtin.iptables:
    chain: INPUT
    ctstate: ESTABLISHED,RELATED
    jump: ACCEPT
  become: yes

- name: Allow new incoming SYN packets on TCP port 22 (SSH)
  ansible.builtin.iptables:
    chain: INPUT
    protocol: tcp
    destination_port: 22
    ctstate: NEW
    syn: match
    jump: ACCEPT
    comment: Accept new SSH connections.

- name: Match on IP ranges
  ansible.builtin.iptables:
    chain: FORWARD
    src_range: 192.168.1.100-192.168.1.199
    dst_range: 10.0.0.1-10.0.0.50
    jump: ACCEPT

- name: Allow source IPs defined in ipset "admin_hosts" on port 22
  ansible.builtin.iptables:
    chain: INPUT
    match_set: admin_hosts
    match_set_flags: src
    destination_port: 22
    jump: ALLOW

- name: Tag all outbound tcp packets with DSCP mark 8
  ansible.builtin.iptables:
    chain: OUTPUT
    jump: DSCP
    table: mangle
    set_dscp_mark: 8
    protocol: tcp

- name: Tag all outbound tcp packets with DSCP DiffServ class CS1
  ansible.builtin.iptables:
    chain: OUTPUT
    jump: DSCP
    table: mangle
    set_dscp_mark_class: CS1
    protocol: tcp

# Create the user-defined chain ALLOWLIST
- iptables:
    chain: ALLOWLIST
    chain_management: true

# Delete the user-defined chain ALLOWLIST
- iptables:
    chain: ALLOWLIST
    chain_management: true
    state: absent

- name: Insert a rule on line 5
  ansible.builtin.iptables:
    chain: INPUT
    protocol: tcp
    destination_port: 8080
    jump: ACCEPT
    action: insert
    rule_num: 5

# Think twice before running following task as this may lock target system
- name: Set the policy for the INPUT chain to DROP
  ansible.builtin.iptables:
    chain: INPUT
    policy: DROP

- name: Reject tcp with tcp-reset
  ansible.builtin.iptables:
    chain: INPUT
    protocol: tcp
    reject_with: tcp-reset
    ip_version: ipv4

- name: Set tcp flags
  ansible.builtin.iptables:
    chain: OUTPUT
    jump: DROP
    protocol: tcp
    tcp_flags:
      flags: ALL
      flags_set:
        - ACK
        - RST
        - SYN
        - FIN

- name: Iptables flush filter
  ansible.builtin.iptables:
    chain: "{{ item }}"
    flush: yes
  with_items:  [ 'INPUT', 'FORWARD', 'OUTPUT' ]

- name: Iptables flush nat
  ansible.builtin.iptables:
    table: nat
    chain: '{{ item }}'
    flush: yes
  with_items: [ 'INPUT', 'OUTPUT', 'PREROUTING', 'POSTROUTING' ]

- name: Log packets arriving into an user-defined chain
  ansible.builtin.iptables:
    chain: LOGGING
    action: append
    state: present
    limit: 2/second
    limit_burst: 20
    log_prefix: "IPTABLES:INFO: "
    log_level: info

- name: Allow connections on multiple ports
  ansible.builtin.iptables:
    chain: INPUT
    protocol: tcp
    destination_ports:
      - "80"
      - "443"
      - "8081:8083"
    jump: ACCEPT
```