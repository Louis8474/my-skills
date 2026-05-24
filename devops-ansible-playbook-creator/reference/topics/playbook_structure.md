# Playbook Structure

## playbooks_intro

### Ansible playbooks

Ansible Playbooks provide a repeatable, reusable, simple configuration management and multimachine deployment system that is well suited to deploying complex applications. If you need to execute a task with Ansible more than once, you can write a playbook and put the playbook under source control. You can then use the playbook to push new configurations or confirm the configuration of remote systems.

Playbooks allow you to perform the following actions:

* Declare configurations.
* Orchestrate steps of any manual ordered process on multiple sets of machines in a defined order.
* Launch tasks synchronously or `asynchronously `.

# Playbook syntax

You express playbooks in YAML format with a minimum of syntax. If you are not familiar with YAML, review the `yaml_syntax` overview and consider installing an add-on for your text editor (see `other_tools_and_programs`) to help you write clean YAML syntax in your playbooks.

A playbook consists of one or more 'plays' in an ordered list. The terms 'playbook' and 'play' are sports analogies. Each play executes part of the overall goal of the playbook, running one or more tasks. Each task calls an Ansible module.

# Playbook execution

A playbook runs in order from top to bottom. Within each play, tasks also run in order from top to bottom. Playbooks with multiple plays can orchestrate multimachine deployments, running one play on your webservers, another play on your database servers, and a third play on your network infrastructure. At a minimum, each play defines two things:

* The managed nodes to target, using a `pattern `.
* At least one task to execute.

For Ansible 2.10 and later, you should use the fully-qualified collection name (FQCN) in your playbooks. Using the FQCN ensures that you have selected the correct module, because multiple collections can contain modules with the same name. For example, `user`. See `collections_using_playbook`.

In the following example, the first play targets the web servers and the second play targets the database servers.

``yaml
    - name: Update web servers
      hosts: webservers
      remote_user: root

      tasks:
      - name: Ensure apache is at the latest version
        ansible.builtin.yum:
          name: httpd
          state: latest

      - name: Write the apache config file
        ansible.builtin.template:
          src: /srv/httpd.j2
          dest: /etc/httpd.conf

    - name: Update db servers
      hosts: databases
      remote_user: root

      tasks:
      - name: Ensure postgresql is at the latest version
        ansible.builtin.yum:
          name: postgresql
          state: latest

      - name: Ensure that postgresql is started
        ansible.builtin.service:
          name: postgresql
          state: started

Your playbook can include more than just a hosts line and tasks. For example, the playbook above sets a `remote_user` for each play. The `remote_user`` is the user account for the SSH connection. You can add other `playbook_keywords` at the playbook, play, or task level to influence how Ansible behaves. Playbook keywords can control the `connection plugin `, whether to use `privilege escalation `, how to handle errors, and more. To support a variety of environments, you can set many of these parameters as command-line flags in your Ansible configuration, or in your inventory. Learning the `precedence rules ` for these sources of data helps you as you expand your Ansible ecosystem.

## Task execution

By default, Ansible executes each task in order, one at a time, against all machines matched by the host pattern. Each task executes a module with specific arguments. After a task has executed on all target machines, Ansible moves to the next task. You can use `strategies ` to change this default behavior. Within each play, Ansible applies the same task directives to all hosts. If a task fails on a host, Ansible removes that host from the rotation for the rest of the playbook.

When you run a playbook, Ansible returns information about connections, the `name` lines of all your plays and tasks, whether each task has succeeded or failed on each machine, and whether each task has made a change on each machine. At the bottom of the playbook execution, Ansible provides a summary of the nodes that were targeted and how they performed. General failures and fatal "unreachable" communication attempts are kept separate in the counts.

## Desired state and idempotency

Most Ansible modules check whether the desired final state has already been achieved and exit without performing any actions if that state has been achieved. Repeating the task does not change the final state. Modules that behave this way are 'idempotent'. Whether you run a playbook once or multiple times, the outcome should be the same. However, not all playbooks and not all modules behave this way. If you are unsure, test your playbooks in a sandbox environment before running them multiple times in production.

## Running playbooks

To run your playbook, use the `ansible-playbook` command.

``bash
    ansible-playbook playbook.yml -f 10

Use the `--verbose` flag when running your playbook to see detailed output from successful and unsuccessful tasks.

## Running playbooks in check mode

The Ansible check mode allows you to execute a playbook without applying any alterations to your systems. You can use check mode to test playbooks before you implement them in a production environment.

To run a playbook in check mode, pass the `-C` or `--check` flag to the `ansible-playbook` command:

``bash
    ansible-playbook --check playbook.yaml

Executing this command runs the playbook normally. Instead of implementing any modifications, Ansible provides a report on the changes it would have made. This report includes details such as file modifications, command execution, and module calls.

Check mode offers a safe and practical approach to examine the functionality of your playbooks without risking unintended changes to your systems. Check mode is also a valuable tool for troubleshooting playbooks that are not functioning as expected.

# Ansible-Pull

You can invert the Ansible architecture so that nodes check in to a central location instead of you pushing configuration out to them.

The `ansible-pull` command is a small script that checks out a repo of configuration instructions from git and then runs `ansible-playbook` against that content.

If you load balance your checkout location, `ansible-pull` scales infinitely.

Run `ansible-pull --help` for details.

# Verifying playbooks

You may want to verify your playbooks to catch syntax errors and other problems before you run them. The `ansible-playbook` command offers several options for verification, including `--check`, `--diff`, `--list-hosts`, `--list-tasks`, and `--syntax-check`. The `validate-playbook-tools` topic describes other tools for validating and testing playbooks.

## ansible-lint

You can use `ansible-lint <https://ansible.readthedocs.io/projects/lint/>`_ for detailed, Ansible-specific feedback on your playbooks before you execute them. For example, if you run `ansible-lint` on the playbook called `verify-apache.yml` near the top of this page, you should get the following results:

```bash
    $ ansible-lint verify-apache.yml
    [403] Package installs should not use latest
    verify-apache.yml:8
    Task/Handler: ensure apache is at the latest version

The `ansible-lint default rules <https://ansible.readthedocs.io/projects/lint/rules/>`_ page describes each error.

---

## playbooks_advanced_syntax

### Advanced playbook syntax

The advanced YAML syntax examples on this page give you more control over the data placed in YAML files used by Ansible.
You can find additional information about Python-specific YAML in the official `PyYAML Documentation <https://pyyaml.org/wiki/PyYAMLDocumentation#YAMLtagsandPythontypes>`_.

# Unsafe or raw strings

When handling values returned by lookup plugins, Ansible uses a data type called `unsafe` to block templating. Marking data as unsafe prevents malicious users from abusing Jinja2 templates to execute arbitrary code on target machines. The Ansible implementation ensures that unsafe values are never templated. It is more comprehensive than escaping Jinja2 with `{% raw %} ... {% endraw %}` tags.

You can use the same `unsafe` data type in variables you define, to prevent templating errors and information disclosure. You can mark values supplied by `vars_prompts` as unsafe. You can also use `unsafe` in playbooks. The most common use cases include passwords that allow special characters like `{` or `%`, and JSON arguments that look like templates but should not be templated. For example:

``yaml
    mypassword: !unsafe 234%234{435lkj{{lkjsdf

In a playbook:

``yaml
    hosts: all
    vars:
      my_unsafe_variable: !unsafe 'unsafe % value'
    tasks:
        ...

For complex variables such as hashes or arrays, use `!unsafe` on the individual elements:

```yaml
    my_unsafe_array:
      - !unsafe 'unsafe element'
      - 'safe element'

    my_unsafe_hash:
      unsafe_key: !unsafe 'unsafe value'

# YAML anchors and aliases: sharing variable values

`YAML anchors and aliases <https://yaml.org/spec/1.2/spec.html#id2765878>`_ help you define, maintain, and flexibly use shared variable values.
You define an anchor with `&`, then refer to it using an alias, denoted with `*`. Here's an example that sets three values with an anchor, uses two of those values with an alias, and overrides the third value:

``yaml
    # ...
    vars:
      app1:
        jvm: &jvm_opts
          opts: '-Xms1G -Xmx2G'
          port: 1000
          path: /usr/lib/app1
      app2:
        jvm:
          <<: *jvm_opts
          path: /usr/lib/app2
    # ...

Here, `app1` and `app2` share the values for `opts` and `port` using the anchor `&jvm_opts` and the alias `*jvm_opts`.
The value for `path` is merged by `<<`` or `merge operator <https://yaml.org/type/merge.html>`_.

Anchors and aliases also let you share complex sets of variable values, including nested variables. If you have one variable value that includes another variable value, you can define them separately:

``yaml
      vars:
        webapp_version: 1.0
        webapp_custom_name: ToDo_App-1.0

This is inefficient and, at scale, means more maintenance. To incorporate the version value in the name, you can use an anchor in `app_version` and an alias in `custom_name`:

``yaml
      vars:
        webapp:
            version: &my_version 1.0
            custom_name:
                - "ToDo_App"
                - *my_version

Now, you can reuse the value of `app_version` within the value of  `custom_name` and use the output in a template:

``yaml
    - name: Using values nested inside dictionary
      hosts: localhost
      vars:
        webapp:
          version: &my_version 1.0
          custom_name:
            - "ToDo_App"
            - *my_version
      tasks:
      - name: Using Anchor value
        ansible.builtin.debug:
          msg: My app is called "{{ webapp.custom_name | join('-') }}".

You've anchored the value of `version` with the `&my_version` anchor and reused it with the `*my_version`` alias. Anchors and aliases let you access nested values inside dictionaries.

---

## YAMLSyntax

# YAML Syntax

This page provides a basic overview of correct YAML syntax, which is how Ansible
playbooks (our configuration management language) are expressed.

We use YAML because it is easier for humans to read and write than other common
data formats like XML or JSON.  Further, there are libraries available in most
programming languages for working with YAML.

You may also wish to read `working_with_playbooks` at the same time to see how this
is used in practice.

## YAML Basics

For Ansible, nearly every YAML file starts with a list.
Each item in the list is a list of key/value pairs, commonly
called a "hash" or a "dictionary".  So, we need to know how
to write lists and dictionaries in YAML.

There's another small quirk to YAML.  All YAML files (regardless of their association with Ansible or not) can optionally
begin with `---` and end with `...`.  This is part of the YAML format and indicates the start and end of a document.

All members of a list are lines beginning at the same indentation level starting with a `"- "` (a dash and a space):

``yaml
    # A list of tasty fruits
    - Apple
    - Orange
    - Strawberry
    - Mango
    ...

A dictionary is represented in a simple `key: value` form (the colon must be followed by a space):

``yaml
    # An employee record
    martin:
      name: Martin D'vloper
      job: Developer
      skill: Elite

More complicated data structures are possible, such as lists of dictionaries, dictionaries whose values are lists or a mix of both:

``yaml
    # Employee records
    - martin:
        name: Martin D'vloper
        job: Developer
        skills:
          - python
          - perl
          - pascal
    - tabitha:
        name: Tabitha Bitumen
        job: Developer
        skills:
          - lisp
          - fortran
          - erlang

Dictionaries and lists can also be represented in an abbreviated form if you really want to:

``yaml
    martin: {name: Martin D'vloper, job: Developer, skill: Elite}
    fruits: ['Apple', 'Orange', 'Strawberry', 'Mango']

These are called "Flow collections".

Ansible doesn't really use these too much, but you can also specify a `boolean value ` (true/false) in several forms:

``yaml
    create_key: true
    needs_agent: false
    knows_oop: True
    likes_emacs: TRUE
    uses_cvs: false

Use lowercase 'true' or 'false' for boolean values in dictionaries if you want to be compatible with default yamllint options.

Values can span multiple lines using `|` or `>`.  Spanning multiple lines using a "Literal Block Scalar" `|` will include the newlines and any trailing spaces.
Using a "Folded Block Scalar" `>` will fold newlines to spaces; it is used to make what would otherwise be a very long line easier to read and edit.
In either case the indentation will be ignored.
Examples are:

``yaml
    include_newlines: |
                exactly as you see
                will appear these three
                lines of poetry

    fold_newlines: >
                this is really a
                single line of text
                despite appearances

While in the above `>` example all newlines are folded into spaces, there are two ways to enforce a newline to be kept:

``yaml
    fold_some_newlines: >
        a
        b

        c
        d
          e
        f

Alternatively, it can be enforced by including newline `\n` characters:

``yaml
    fold_same_newlines: "a b\nc d\n  e\nf\n"

Let's combine what we learned so far in an arbitrary YAML example.
This really has nothing to do with Ansible, but will give you a feel for the format:

```yaml
    # An employee record
    name: Martin D'vloper
    job: Developer
    skill: Elite
    employed: True
    foods:
      - Apple
      - Orange
      - Strawberry
      - Mango
    languages:
      perl: Elite
      python: Elite
      pascal: Lame
    education: |
      4 GCSEs
      3 A-Levels
      BSc in the Internet of Things

That's all you really need to know about YAML to start writing `Ansible` playbooks.

## Gotchas

While you can put just about anything into an unquoted scalar, there are some exceptions.
A colon followed by a space (or newline) `": "` is an indicator for a mapping.
A space followed by the pound sign `" #"` starts a comment.

Because of this, the following is going to result in a YAML syntax error:

``text
    foo: somebody said I should put a colon here: so I did

    windows_drive: c:

...but this will work:

``yaml
    windows_path: c:\windows

You will want to quote hash values using colons followed by a space or the end of the line:

``yaml
    foo: 'somebody said I should put a colon here: so I did'

    windows_drive: 'c:'

...and then the colon will be preserved.

Alternatively, you can use double quotes:

``yaml
    foo: "somebody said I should put a colon here: so I did"

    windows_drive: "c:"

The difference between single quotes and double quotes is that in double quotes
you can use escapes:

``yaml
    foo: "a \t TAB and a \n NEWLINE"

The list of allowed escapes can be found in the YAML Specification under "Escape Sequences" (YAML 1.1) or "Escape Characters" (YAML 1.2).

The following is invalid YAML:

``text
    foo: "an escaped \' single quote"

Further, Ansible uses "{{ var }}" for variables.  If a value after a colon starts
with a "{", YAML will think it is a dictionary, so you must quote it, like so:

``yaml
    foo: "{{ variable }}"

If your value starts with a quote the entire value must be quoted, not just part of it. Here are some additional examples of how to properly quote things:

``yaml
    foo: "{{ variable }}/additional/string/literal"
    foo2: "{{ variable }}\\backslashes\\are\\also\\special\\characters"
    foo3: "even if it is just a string literal it must all be quoted"

Not valid:

``text
    foo: "E:\\path\\"rest\\of\\path

In addition to `'` and `"` there are a number of characters that are special (or reserved) and cannot be used
as the first character of an unquoted scalar: `[] {} > | * & ! % # ` @ ,`.

You should also be aware of `? : -`. In YAML, they are allowed at the beginning of a string if a non-space
character follows, but YAML processor implementations differ, so it is better to use quotes.

In Flow Collections, the rules are a bit more strict:

``text
    a scalar in block mapping: this } is [ all , valid

    flow mapping: { key: "you { should [ use , quotes here" }

Boolean conversion is helpful, but this can be a problem when you want a literal `yes` or other boolean values as a string.
In these cases just use quotes:

```yaml
    non_boolean: "yes"
    other_string: "False"

YAML converts certain strings into floating-point values, such as the string
`1.0`. If you need to specify a version number (in a requirements.yml file, for
example), you will need to quote the value if it looks like a floating-point
value:

```yaml
  version: "1.0"