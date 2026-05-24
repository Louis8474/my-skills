# Conditionals Loops

## playbooks_conditionals

### Conditionals

In a playbook, you may want to execute different tasks or have different goals, depending on the value of a fact (data about the remote system), a variable, or the result of a previous task. You may want the value of some variables to depend on the value of other variables. Or you may want to create additional groups of hosts based on whether the hosts match other criteria. You can do all of these things with conditionals.

Ansible uses Jinja2 `tests ` and `filters ` in conditionals. Ansible supports all the standard tests and filters and adds some unique ones as well.

> **Nota: There are many options to control execution flow in Ansible. You can find more examples of supported conditionals at `<https://jinja.palletsprojects.com/en/latest/templates/#comparisons>`_.**
>
>
>
> # Basic conditionals with `when`
>
> The simplest conditional statement applies to a single task. Create the task, then add a `when` statement that applies a test. The `when` clause is a raw Jinja2 expression without double curly braces (see `jinja2_simple`). When you run the task or playbook, Ansible evaluates the test for all hosts. On any host where the test passes (returns a value of True), Ansible runs that task. For example, if you are installing mysql on multiple machines, some of which have SELinux enabled, you might have a task to configure SELinux to allow mysql to run. You would only want that task to run on machines that have SELinux enabled:
>
> ```yaml
> tasks:
> - name: Configure SELinux to start mysql on any port
> ansible.posix.seboolean:
> name: mysql_connect_any
> state: true
> persistent: true
> when: ansible_selinux.status == "enabled"
> # all variables can be used directly in conditionals without double curly braces
>
> ## Conditionals based on ansible_facts
>
> Often you want to execute or skip a task based on facts. Facts are attributes of individual hosts, including IP address, operating system, the status of a filesystem, and many more. With conditionals based on facts:
>
> - You can install a certain package only when the operating system is a particular version.
> - You can skip configuring a firewall on hosts with internal IP addresses.
> - You can perform cleanup tasks only when a filesystem is getting full.
>
> See `commonly_used_facts` for a list of facts that frequently appear in conditional statements. Not all facts exist for all hosts. For example, the 'lsb_major_release' fact used in the example below only exists when the `lsb_release package` is installed on the target host. To see what facts are available on your systems, add a debug task to your playbook:
>
> ``yaml
> - name: Show facts available on the system
> ansible.builtin.debug:
> var: ansible_facts
>
> Here is a sample conditional based on a fact:
>
> ``yaml
> tasks:
> - name: Shut down Debian flavored systems
> ansible.builtin.command: /sbin/shutdown -t now
> when: ansible_facts['os_family'] == "Debian"
>
> If you have multiple conditions, you can group them with parentheses:
>
> ```yaml
> tasks:
> - name: Shut down CentOS 6 and Debian 7 systems
> ansible.builtin.command: /sbin/shutdown -t now
> when: (ansible_facts['distribution'] == "CentOS" and ansible_facts['distribution_major_version'] == "6") or
> (ansible_facts['distribution'] == "Debian" and ansible_facts['distribution_major_version'] == "7")
>
> You can use `logical operators <https://jinja.palletsprojects.com/en/latest/templates/#logic>`_ to combine conditions. When you have multiple conditions that all need to be true (that is, a logical `and`), you can specify them as a list:
>
> ``yaml
> tasks:
> - name: Shut down CentOS 6 systems
> ansible.builtin.command: /sbin/shutdown -t now
> when:
> - ansible_facts['distribution'] == "CentOS"
> - ansible_facts['distribution_major_version'] == "6"
>
> If a fact or variable is a string, and you need to run a mathematical comparison on it, use a filter to ensure that Ansible reads the value as an integer:
>
> ``yaml
> tasks:
> - ansible.builtin.shell: echo "only on Red Hat 6, derivatives, and later"
> when: ansible_facts['os_family'] == "RedHat" and ansible_facts['lsb']['major_release'] | int >= 6
>
> You can store Ansible facts as variables to use for conditional logic, as in the following example:
>
> ``yaml
> tasks:
> - name: Get the CPU temperature
> set_fact:
> temperature: "{{ ansible_facts['cpu_temperature'] }}"
>
> - name: Restart the system if the temperature is too high
> when: temperature | float > 90
> shell: "reboot"
>
>
> ## Conditions based on registered variables
>
> Often in a playbook, you want to execute or skip a task based on the outcome of an earlier task. For example, you might want to configure a service after it is upgraded by an earlier task. To create a conditional based on a registered variable:
>
> #. Register the outcome of the earlier task as a variable.
> #. Create a conditional test based on the registered variable.
>
> You create the name of the registered variable using the `register` keyword. A registered variable always contains the status of the task that created it as well as any output that the task generated. You can use registered variables in templates and action lines as well as in conditional `when` statements. You can access the string contents of the registered variable using `variable.stdout`. For example:
>
> ``yaml
> - name: Test play
> hosts: all
>
> tasks:
>
> - name: Register a variable
> ansible.builtin.shell: cat /etc/motd
> register: motd_contents
>
> - name: Use the variable in conditional statement
> ansible.builtin.shell: echo "motd contains the word hi"
> when: motd_contents.stdout.find('hi') != -1
>
> You can use registered results in the loop of a task if the variable is a list. If the variable is not a list, you can convert it into a list, with either `stdout_lines` or with `variable.stdout.split()`. You can also split the lines by other fields:
>
> ``yaml
> - name: Registered variable usage as a loop list
> hosts: all
> tasks:
>
> - name: Retrieve the list of home directories
> ansible.builtin.command: ls /home
> register: home_dirs
>
> - name: Add home dirs to the backup spooler
> ansible.builtin.file:
> path: /mnt/bkspool/{{ item }}
> src: /home/{{ item }}
> state: link
> loop: "{{ home_dirs.stdout_lines }}"
> # same as loop: "{{ home_dirs.stdout.split() }}"
>
> The string content of a registered variable can be empty. If you want to run another task only on hosts where the stdout of your registered variable is empty, check the registered variable's string contents for emptiness:
>
> ``yaml
> - name: check registered variable for emptiness
> hosts: all
>
> tasks:
>
> - name: List contents of directory
> ansible.builtin.command: ls mydir
> register: contents
>
> - name: Check contents for emptiness
> ansible.builtin.debug:
> msg: "Directory is empty"
> when: contents.stdout == ""
>
> Ansible always registers something in a registered variable for every host, even on hosts where a task fails or Ansible skips a task because a condition is not met. To run a follow-up task on these hosts, query the registered variable for `is skipped` (not for "undefined" or "default"). See `registered_variables` for more information. Here are sample conditionals based on the success or failure of a task. Remember to ignore errors if you want Ansible to continue executing on a host when a failure occurs:
>
> ``yaml
> tasks:
> - name: Register a variable, ignore errors and continue
> ansible.builtin.command: /bin/false
> register: result
> ignore_errors: true
>
> - name: Run only if the task that registered the "result" variable fails
> ansible.builtin.command: /bin/something
> when: result is failed
>
> - name: Run only if the task that registered the "result" variable succeeds
> ansible.builtin.command: /bin/something_else
> when: result is succeeded
>
> - name: Run only if the task that registered the "result" variable is skipped
> ansible.builtin.command: /bin/still/something_else
> when: result is skipped
>
> - name: Run only if the task that registered the "result" variable changed something.
> ansible.builtin.command: /bin/still/something_else
> when: result is changed
>
> .. note:: Older versions of Ansible used `success` and `fail`, but `succeeded` and `failed` use the correct tense. All of these options are now valid.
>
>
> ## Conditionals based on variables
>
> You can also create conditionals based on variables defined in the playbooks or inventory. Because conditionals require boolean input (a test must evaluate as True to trigger the condition), you must apply the `| bool` filter to non-boolean variables, such as string variables with content like 'yes', 'on', '1', or 'true'. You can define variables like this:
>
> ``yaml
> vars:
> epic: true
> monumental: "yes"
>
> With the variables above, Ansible would run one of these tasks and skip the other:
>
> ```yaml
> tasks:
> - name: Run the command if "epic" or "monumental" is true
> ansible.builtin.shell: echo "This certainly is epic!"
> when: epic or monumental | bool
>
> - name: Run the command if "epic" is false
> ansible.builtin.shell: echo "This certainly isn't epic!"
> when: not epic
>
> If a required variable has not been set, you can skip or fail using Jinja2's `defined` test. For example:
>
> ``yaml
> tasks:
> - name: Run the command if "foo" is defined
> ansible.builtin.shell: echo "I've got '{{ foo }}' and am not afraid to use it!"
> when: foo is defined
>
> - name: Fail if "bar" is undefined
> ansible.builtin.fail: msg="Bailing out. This play requires 'bar'"
> when: bar is undefined
>
> This is especially useful in combination with the conditional import of `vars`` files (see below).
>
As the examples show, you do not need to use `{{ }}` to use variables inside conditionals, as these are already implied.

## Using conditionals in loops

If you combine a `when` statement with a `loop `, Ansible processes the condition separately for each item. This is by design, so you can execute the task on some items in the loop and skip it on other items. For example:

```yaml
    tasks:
        - name: Run with items greater than 5
          ansible.builtin.command: echo {{ item }}
          loop: [ 0, 2, 4, 6, 8, 10 ]
          when: item > 5

If you need to skip the whole task when the loop variable is undefined, use the `|default` filter to provide an empty iterator. For example, when looping over a list:

``yaml
        - name: Skip the whole task when a loop variable is undefined
          ansible.builtin.command: echo {{ item }}
          loop: "{{ mylist|default([]) }}"
          when: item > 5

You can do the same thing when looping over a dict:

``yaml
        - name: The same as above using a dict
          ansible.builtin.command: echo {{ item.key }}
          loop: "{{ query('dict', mydict|default({})) }}"
          when: item.value > 5

## Loading custom facts

You can provide your own facts, as described in `developing_modules`.  To run them, just make a call to your own custom fact gathering module at the top of your list of tasks, and the variables returned there will be accessible for future tasks:

```yaml
    tasks:
        - name: Gather site specific fact data
          action: site_facts

        - name: Use a custom fact
          ansible.builtin.command: /usr/bin/thingy
          when: my_custom_fact_just_retrieved_from_the_remote_system == '1234'

## Conditionals with reuse

You can use conditionals with reusable tasks files, playbooks, or roles. Ansible executes these conditional statements differently for dynamic reuse (includes) and static reuse (imports). See `playbooks_reuse` for more information on reuse in Ansible.

#### Conditionals with imports

When you add a conditional to an import statement, Ansible applies the condition to all tasks within the imported file. This behavior is the equivalent of `tag_inheritance`. Ansible applies the condition to every task and evaluates each task separately. For example, if you want to define and then display a variable that was not previously defined, you might have a playbook called `main.yml` and a tasks file called `other_tasks.yml`:

``yaml
    # all tasks within an imported file inherit the condition from the import statement
    # main.yml
    - hosts: all
      tasks:
      - import_tasks: other_tasks.yml # note "import"
        when: x is not defined

    # other_tasks.yml
    - name: Set a variable
      ansible.builtin.set_fact:
        x: foo

    - name: Print a variable
      ansible.builtin.debug:
        var: x

Ansible expands this at execution time to the equivalent of:

``yaml
    - name: Set a variable if not defined
      ansible.builtin.set_fact:
        x: foo
      when: x is not defined
      # this task sets a value for x

    - name: Do the task if "x" is not defined
      ansible.builtin.debug:
        var: x
      when: x is not defined
      # Ansible skips this task, because x is now defined

If `x` is initially defined, both tasks are skipped as intended. But if `x` is initially undefined, the debug task will be skipped since the conditional is evaluated for every imported task. The conditional will evaluate to `true` for the `set_fact` task, which will define the variable and cause the `debug` conditional to evaluate to `false`.

If this is not the behavior you want, use an `include_*` statement to apply a condition only to that statement itself.

``yaml
    # using a conditional on include_* only applies to the include task itself
    # main.yml
    - hosts: all
      tasks:
      - include_tasks: other_tasks.yml # note "include"
        when: x is not defined

Now if `x` is initially undefined, the debug task will not be skipped because the conditional is evaluated at the time of the include and does not apply to the individual tasks.

You can apply conditions to `import_playbook` as well as to the other `import_*`` statements. When you use this approach, Ansible returns a 'skipped' message for every task on every host that does not match the criteria, creating repetitive output. In many cases the `group_by module ` can be a more streamlined way to accomplish the same objective; see `os_variance`.

#### Conditionals with includes

When you use a conditional on an `include_*` statement, the condition is applied only to the include task itself and not to any other tasks within the included file(s). To contrast with the example used for conditionals on imports above, look at the same playbook and tasks file, but using an include instead of an import:

``yaml
    # Includes let you reuse a file to define a variable when it is not already defined

    # main.yml
    - include_tasks: other_tasks.yml
      when: x is not defined

    # other_tasks.yml
    - name: Set a variable
      ansible.builtin.set_fact:
        x: foo

    - name: Print a variable
      ansible.builtin.debug:
        var: x

Ansible expands this at execution time to the equivalent of:

``yaml
    # main.yml
    - include_tasks: other_tasks.yml
      when: x is not defined
      # if condition is met, Ansible includes other_tasks.yml

    # other_tasks.yml
    - name: Set a variable
      ansible.builtin.set_fact:
        x: foo
      # no condition applied to this task, Ansible sets the value of x to foo

    - name: Print a variable
      ansible.builtin.debug:
        var: x
      # no condition applied to this task, Ansible prints the debug statement

By using `include_tasks` instead of `import_tasks`, both tasks from `other_tasks.yml` will be executed as expected. For more information on the differences between `include` v `import` see `playbooks_reuse`.

#### Conditionals with roles

There are three ways to apply conditions to roles:

  - Add the same condition or conditions to all tasks in the role by placing your `when` statement under the `roles` keyword. See the example in this section.
  - Add the same condition or conditions to all tasks in the role by placing your `when` statement on a static `import_role` in your playbook.
  - Add a condition or conditions to individual tasks or blocks within the role itself. This is the only approach that allows you to select or skip some tasks within the role based on your `when` statement. To select or skip tasks within the role, you must have conditions set on individual tasks or blocks, use the dynamic `include_role` in your playbook, and add the condition or conditions to the include. When you use this approach, Ansible applies the condition to the include itself plus any tasks in the role that also have that `when` statement.

When you incorporate a role in your playbook statically with the `roles` keyword, Ansible adds the conditions you define to all the tasks in the role. For example:

``yaml
   - hosts: webservers
     roles:
        - role: debian_stock_config
          when: ansible_facts['os_family'] == 'Debian'

## Selecting variables, files, or templates based on facts

Sometimes the facts about a host determine the values you want to use for certain variables or even the file or template you want to select for that host. For example, the names of packages are different on CentOS and Debian. The configuration files for common services are also different on different OS flavors and versions. To load different variables files, templates, or other files based on a fact about the hosts:

  1) name your vars files, templates, or files to match the Ansible fact that differentiates them

  2) select the correct vars file, template, or file for each host with a variable based on that Ansible fact

Ansible separates variables from tasks, keeping your playbooks from turning into arbitrary code with nested conditionals. This approach results in more streamlined and auditable configuration rules because there are fewer decision points to track.

#### Selecting variables files based on facts

You can create a playbook that works on multiple platforms and OS versions with a minimum of syntax by placing your variable values in vars files and conditionally importing them. If you want to install Apache on some CentOS and some Debian servers, create variables files with YAML keys and values. For example:

``yaml
    # for vars/RedHat.yml
    apache: httpd
    somethingelse: 42

Then import those variables files based on the facts you gather on the hosts in your playbook:

``yaml
    - hosts: webservers
      remote_user: root
      vars_files:
        - "vars/common.yml"
        - [ "vars/{{ ansible_facts['os_family'] }}.yml", "vars/os_defaults.yml" ]
      tasks:
      - name: Make sure apache is started
        ansible.builtin.service:
          name: '{{ apache }}'
          state: started

Ansible gathers facts on the hosts in the webservers group, then interpolates the variable "ansible_facts['os_family']" into a list of file names. If you have hosts with Red Hat operating systems (CentOS, for example), Ansible looks for 'vars/RedHat.yml'. If that file does not exist, Ansible attempts to load 'vars/os_defaults.yml'. For Debian hosts, Ansible first looks for 'vars/Debian.yml', before falling back on 'vars/os_defaults.yml'. If no files in the list are found, Ansible raises an error.

#### Selecting files and templates based on facts

You can use the same approach when different OS flavors or versions require different configuration files or templates. Select the appropriate file or template based on the variables assigned to each host. This approach is often much cleaner than putting a lot of conditionals into a single template to cover multiple OS or package versions.

For example, you can template out a configuration file that is very different between, say, CentOS and Debian:

``yaml
    - name: Template a file
      ansible.builtin.template:
        src: "{{ item }}"
        dest: /etc/myapp/foo.conf
      loop: "{{ query('first_found', { 'files': myfiles, 'paths': mypaths}) }}"
      vars:
        myfiles:
          - "{{ ansible_facts['distribution'] }}.conf"
          -  default.conf
        mypaths: ['search_location_one/somedir/', '/opt/other_location/somedir/']

# Debugging conditionals

If your conditional `when` statement is not behaving as you intended, you can add a `debug` statement to determine if the condition evaluates to `true` or `false`. A common cause of unexpected behavior in conditionals is testing an integer as a string or a string as an integer. To debug a conditional statement, add the entire statement as the `var:` value in a `debug` task. Ansible then shows the test and how the statement evaluates. For example, here is a set of tasks and sample output: 

``yaml
   - name: check value of return code
     ansible.builtin.debug:
       var: bar_status.rc
       
   - name: check test for rc value as string
     ansible.builtin.debug:
       var: bar_status.rc == "127"

   - name: check test for rc value as integer
     ansible.builtin.debug:
       var: bar_status.rc == 127

   TASK [check value of return code] *********************************************************************************
   ok: [foo-1] => {
       "bar_status.rc": "127"
   }

   TASK [check test for rc value as string] **************************************************************************
   ok: [foo-1] => {
       "bar_status.rc == \"127\"": false
   }

   TASK [check test for rc value as integer] *************************************************************************
   ok: [foo-1] => {
       "bar_status.rc == 127": true
   }

# Commonly-used facts

The following Ansible facts are frequently used in conditionals.

## ansible_facts['distribution']

Possible values (sample, not complete list):

``text
    Alpine
    Altlinux
    Amazon
    Archlinux
    ClearLinux
    Coreos
    CentOS
    Debian
    Fedora
    Gentoo
    Mandriva
    NA
    OpenWrt
    OracleLinux
    RedHat
    Slackware
    SLES
    SMGL
    SUSE
    Ubuntu
    VMwareESX

## ansible_facts['distribution_major_version']

The major version of the operating system. For example, the value is `16` for Ubuntu 16.04.

## ansible_facts['os_family']

Possible values (sample, not complete list):

```text
    AIX
    Alpine
    Altlinux
    Archlinux
    Darwin
    Debian
    FreeBSD
    Gentoo
    HP-UX
    Mandrake
    RedHat
    SMGL
    Slackware
    Solaris
    Suse
    Windows

---

## playbooks_loops

### Loops

Ansible offers the `loop`, `with_<lookup>`, and `until` keywords to execute a task multiple times. Examples of commonly-used loops include changing ownership on several files and/or directories with the `file module `, creating multiple users with the `user module `, and
repeating a polling step until a certain result is reached.

> **Nota: * We added `loop` in Ansible 2.5. as a simpler way to do loops, but we recommend it for most use cases.**
> * We have not deprecated the use of `with_<lookup>` - that syntax will still be valid for the foreseeable future.
> * `loop` and `with_<lookup>` are mutually exclusive. While it is possible to nest them under `until`, this affects each loop iteration.
>
>
> # Comparing loops
>
> * The normal use case for `until` has to do with tasks that are likely to fail, while `loop` and `with_<lookup>` are meant for repeating tasks with slight variations.
>
* The `loop` and `with_<lookup>` will run the task once per item in the list used as input, while `until` will rerun the task until a condition is met.
  For programmers the former are "for loops" and the latter is a "while/until loop".
* The `with_<lookup>` keywords rely on `lookup_plugins` - even  `items` is a lookup.
* The `loop` keyword is equivalent to `with_list`, and is the best choice for simple loops.
* The `loop` keyword will not accept a string as input, see `query_vs_lookup`.
* The `until` keyword accepts an 'end conditional' (expression that returns `True` or `False`)  that is "implicitly templated" (no need for `{{ }}`),
  commonly based on the variable you `register` for the task.
* `loop_control` affects both `loop` and `with_<lookup>`, but not `until`, which has its own companion keywords: `retries` and `delay`.
* Generally speaking, any use of `with_*` covered in `migrating_to_loop` can be updated to use `loop`.
* Be careful when changing `with_items` to `loop`, as `with_items` performs implicit single-level flattening.
  You may need to use `| flatten(1)` with `loop` to match the exact outcome. For example, to get the same output as:

``yaml
  with_items:
    - 1
    - [2,3]
    - 4

you would need

  loop: "{{ [1, [2, 3], 4] | flatten(1) }}"

* Any `with_*` statement that requires using `lookup` within a loop should not be converted to use the `loop` keyword. For example, instead of doing:

  loop: "{{ lookup('fileglob', '*.txt', wantlist=True) }}"

it is cleaner to keep

``yaml
  with_fileglob: '*.txt'

# Using loops

## Iterating over a simple list

Repeated tasks can be written as standard loops over a simple list of strings. You can define the list directly in the task.

    - name: Add several users
      ansible.builtin.user:
        name: "{{ item }}"
        state: present
        groups: "wheel"
      loop:
         - testuser1
         - testuser2

You can define the list in a variables file, or in the 'vars' section of your play, then refer to the name of the list in the task.

    loop: "{{ somelist }}"

Either of these examples would be the equivalent of

```yaml
    - name: Add user testuser1
      ansible.builtin.user:
        name: "testuser1"
        state: present
        groups: "wheel"

    - name: Add user testuser2
      ansible.builtin.user:
        name: "testuser2"
        state: present
        groups: "wheel"

You can pass a list directly to a parameter for some plugins. Most of the packaging modules, like `yum ` and `apt `, have this capability. When available, passing the list to a parameter is better than looping over the task. For example

   - name: Optimal yum
     ansible.builtin.yum:
       name: "{{ list_of_packages }}"
       state: present

   - name: Non-optimal yum, slower and may cause issues with interdependencies
     ansible.builtin.yum:
       name: "{{ item }}"
       state: present
     loop: "{{ list_of_packages }}"

Check the `module documentation ` to see if you can pass a list to any particular module's parameter(s).

## Iterating over a list of hashes

If you have a list of hashes, you can reference subkeys in a loop. For example:

    - name: Add several users
      ansible.builtin.user:
        name: "{{ item.name }}"
        state: present
        groups: "{{ item.groups }}"
      loop:
        - { name: 'testuser1', groups: 'wheel' }
        - { name: 'testuser2', groups: 'root' }

When combining `conditionals ` with a loop, the `when:` statement is processed separately for each item.
See `the_when_statement` for examples.

## Iterating over a dictionary

To loop over a dict, use the  `dict2items `:

    - name: Using dict2items
      ansible.builtin.debug:
        msg: "{{ item.key }}: {{ item.value.ip_address }} {{ item.value.role }}"
      loop: "{{ server_configs | dict2items }}"
      vars:
        server_configs:
          web_01:
            ip_address: "10.1.1.50"
            role: "frontend"
          db_01:
            ip_address: "10.1.1.100"
            role: "backend_db"

Here, we are iterating over `server_configs` and printing the key and selected nested fields.

If the values in the dictionary are themselves dictionaries (for example, each group maps
to a dict containing a `gid`), remember that after applying `dict2items` each loop item
has two attributes: `item.key` and `item.value`. Access nested fields via
`item.value.<field>`.

## Registering variables with a loop

You can register the output of a loop as a variable. For example

   - name: Register loop output as a variable
     ansible.builtin.shell: "echo {{ item }}"
     loop:
       - "one"
       - "two"
     register: echo

When you use `register` with a loop, the data structure placed in the variable will contain a `results` attribute that is a list of all responses from the module. This differs from the data structure returned when using `register` without a loop. The `changed`/`failed`/`skipped` attribute that's beside the `results` will represent the overall state. `changed`/`failed` will be `true` if at least one of the iterations triggered a change/failed, while `skipped` will be `true` only if all iterations were skipped.

``json
    {
        "changed": true,
        "msg": "All items completed",
        "results": [
            {
                "changed": true,
                "cmd": "echo \"one\" ",
                "delta": "0:00:00.003110",
                "end": "2013-12-19 12:00:05.187153",
                "invocation": {
                    "module_args": "echo \"one\"",
                    "module_name": "shell"
                },
                "item": "one",
                "rc": 0,
                "start": "2013-12-19 12:00:05.184043",
                "stderr": "",
                "stdout": "one"
            },
            {
                "changed": true,
                "cmd": "echo \"two\" ",
                "delta": "0:00:00.002920",
                "end": "2013-12-19 12:00:05.245502",
                "invocation": {
                    "module_args": "echo \"two\"",
                    "module_name": "shell"
                },
                "item": "two",
                "rc": 0,
                "start": "2013-12-19 12:00:05.242582",
                "stderr": "",
                "stdout": "two"
            }
        ]
    }

Subsequent loops over the registered variable to inspect the results may look like

    - name: Fail if return code is not 0
      ansible.builtin.fail:
        msg: "The command ({{ item.cmd }}) did not have a 0 return code"
      when: item.rc != 0
      loop: "{{ echo.results }}"

During iteration, the result of the current item will be placed in the variable.

    - name: Place the result of the current item in the variable
      ansible.builtin.shell: echo "{{ item }}"
      loop:
        - one
        - two
      register: echo
      changed_when: echo.stdout != "one"

## Retrying a task until a condition is met

> **Adicionado na versão: 1.4**
>
> You can use the `until` keyword to retry a task until a certain condition is met. Here's an example:
>
> ``yaml
> - name: Retry a task until a certain condition is met
> ansible.builtin.shell: /usr/bin/foo
> register: result
> until: result.stdout.find("all systems go") != -1
> retries: 5
> delay: 10
>
> This task runs up to 5 times with a delay of 10 seconds between each attempt. If the result of any attempt has "all systems go" in its stdout, the task succeeds. The default value for "retries" is 3 and "delay" is 5.
>
> To see the results of individual retries, run the play with `-vv`.
>
> When you run a task with `until` and register the result as a variable, the registered variable will include a key called "attempts", which records the number of retries for the task.
>
> If `until` is not specified, the task will retry until the task succeeds but at most `retries` times (New in version 2.16).
>
> You can combine the `until` keyword with `loop` or `with_<lookup>`. The result of the task for each element of the loop is registered in the variable and can be used in the `until` condition. Here is an example:
>
> ``yaml
> - name: Retry combined with a loop
> uri:
> url: "https://{{ item }}.ansible.com"
> method: GET
> register: uri_output
> with_items:
> - "galaxy"
> - "docs"
> - "forum"
> - "www"
> retries: 2
> delay: 1
> until: "uri_output.status == 200"
>
> > **Nota: When you use the `timeout`` keyword in a loop, it applies to each attempt of the task action. See `TASK_TIMEOUT ` for more details.**
>
>
>
> ## Looping over inventory
>
> Normally the play itself is a loop over your inventory, but sometimes you need a task to do the same over a different set of hosts.
>
To loop over your inventory, or just a subset of it, you can use a regular `loop` with the `ansible_play_batch` or `groups` variables.

    - name: Show all the hosts in the inventory
      ansible.builtin.debug:
        msg: "{{ item }}"
      loop: "{{ groups['all'] }}"

    - name: Show all the hosts in the current play
      ansible.builtin.debug:
        msg: "{{ item }}"
      loop: "{{ ansible_play_batch }}"

There is also a specific lookup plugin `inventory_hostnames` that can be used like this

    - name: Show all the hosts in the inventory
      ansible.builtin.debug:
        msg: "{{ item }}"
      loop: "{{ query('inventory_hostnames', 'all') }}"

    - name: Show all the hosts matching the pattern, ie all but the group www
      ansible.builtin.debug:
        msg: "{{ item }}"
      loop: "{{ query('inventory_hostnames', 'all:!www') }}"

More information on the patterns can be found in `intro_patterns`.

# Ensuring list input for `loop`: using `query` rather than `lookup`

The `loop` keyword requires a list as input, but the `lookup` keyword returns a string of comma-separated values by default. Ansible 2.5 introduced a new Jinja2 function named `query ` that always returns a list, offering a simpler interface and more predictable output from lookup plugins when using the `loop` keyword.

You can force `lookup` to return a list to `loop` by using `wantlist=True`, or you can use `query` instead.

The following two examples do the same thing.

    loop: "{{ query('inventory_hostnames', 'all') }}"

    loop: "{{ lookup('inventory_hostnames', 'all', wantlist=True) }}"

# Adding controls to loops
> **Adicionado na versão: 2.1**
>
> The `loop_control` keyword lets you manage your loops in useful ways.
>
> ## Limiting loop output with `label`
>
> **Adicionado na versão: 2.2**
>
> When looping over complex data structures, the console output of your task can be enormous. To limit the displayed output, use the `label` directive with `loop_control`.
>
> .. code-block:: yaml+jinja
>
> - name: Create servers
> digital_ocean:
> name: "{{ item.name }}"
> state: present
> loop:
> - name: server1
> disks: 3gb
> ram: 15Gb
> network:
> nic01: 100Gb
> nic02: 10Gb
> # ...
> loop_control:
> label: "{{ item.name }}"
>
> The output of this task will display just the `name` field for each `item` instead of the entire contents of the multi-line `{{ item }}` variable.
>
> > **Nota: This is for making console output more readable, not protecting sensitive data. If there is sensitive data in `loop`, set `no_log: true` on the task to prevent disclosure.**
>
>
> ## Pausing within a loop
>
> **Adicionado na versão: 2.2**
>
> To control the time (in seconds) between the execution of each item in a task loop, use the `pause` directive with `loop_control`.
>
> .. code-block:: yaml+jinja
>
> # main.yml
> - name: Create servers, pause 3s before creating next
> community.digitalocean.digital_ocean:
> name: "{{ item }}"
> state: present
> loop:
> - server1
> - server2
> loop_control:
> pause: 3
>
> ## Breaking out of a loop
>
> **Adicionado na versão: 2.18**
>
> Use the `break_when` directive with `loop_control` to exit a loop after any item, based on Jinja2 expressions.
>
> .. code-block:: yaml+jinja
>
> # main.yml
> - name: Use set_fact in a loop until a condition is met
> vars:
> special_characters: "!@#$%^&*(),.?:{}|<>"
> character_set: "digits,ascii_letters,{{ special_characters }}"
> password_policy: '^(?=.*\d)(?=.*[A-Z])(?=.*[{{ special_characters | regex_escape }}]).{12,}$'
> block:
> - name: Generate a password until it contains a digit, uppercase letter, and special character (10 attempts)
> set_fact:
> password: "{{ lookup('password', '/dev/null', chars=character_set, length=12) }}"
> loop: "{{ range(0, 10) }}"
> loop_control:
> break_when:
> - password is match(password_policy)
>
> - fail:
> msg: "Maximum attempts to generate a valid password exceeded"
> when: password is not match(password_policy)
>
> ## Tracking progress through a loop with `index_var`
>
> **Adicionado na versão: 2.5**
>
> To keep track of where you are in a loop, use the `index_var` directive with `loop_control`. This directive specifies a variable name to contain the current loop index.
>
> .. code-block:: yaml+jinja
>
> - name: Count our fruit
> ansible.builtin.debug:
> msg: "{{ item }} with index {{ my_idx }}"
> loop:
> - apple
> - banana
> - pear
> loop_control:
> index_var: my_idx
>
> > **Nota: `index_var` is 0 indexed.**
>
>
>
> ## Extended loop variables
>
> **Adicionado na versão: 2.8**
>
> As of Ansible 2.8, you can get extended loop information using the `extended` option to loop control. This option will expose the following information.
>
> ==========================  ===========
>
Variable                    Description
--------------------------  -----------
`ansible_loop.allitems`   The list of all items in the loop
`ansible_loop.index`      The current iteration of the loop. (1 indexed)
`ansible_loop.index0`     The current iteration of the loop. (0 indexed)
`ansible_loop.revindex`   The number of iterations from the end of the loop (1 indexed)
`ansible_loop.revindex0`  The number of iterations from the end of the loop (0 indexed)
`ansible_loop.first`      `True` if first iteration
`ansible_loop.last`       `True` if last iteration
`ansible_loop.length`     The number of items in the loop
`ansible_loop.previtem`   The item from the previous iteration of the loop. Undefined during the first iteration.
`ansible_loop.nextitem`   The item from the following iteration of the loop. Undefined during the last iteration.
==========================  ===========

``yaml
      loop_control:
        extended: true

> **Nota: When using `loop_control.extended` more memory will be utilized on the control node. This is a result of `ansible_loop.allitems` containing a reference to the full loop data for every loop. When serializing the results for display in callback plugins within the main ansible process, these references may be dereferenced causing memory usage to increase.**
>
> > **Adicionado na versão: 2.14**
>
>
> To disable the `ansible_loop.allitems` item, to reduce memory consumption, set `loop_control.extended_allitems: false`.
>
> ``yaml
> loop_control:
> extended: true
> extended_allitems: false
>
> ## Accessing the name of your loop_var
>
> **Adicionado na versão: 2.8**
>
> As of Ansible 2.8, you can get the name of the value provided to `loop_control.loop_var` using the `ansible_loop_var` variable
>
> For role authors, writing roles that allow loops, instead of dictating the required `loop_var` value, you can gather the value through the following
>
> .. code-block:: yaml+jinja
>
> "{{ lookup('vars', ansible_loop_var) }}"
>
>
>
> # Nested Loops
>
> While we are using `loop` in these examples, the same applies to `with_<lookup>`.
>
> ## Iterating over nested lists
>
> The simplest way to 'nest' loops is to avoid nesting loops, just format the data to achieve the same result.
>
You can use Jinja2 expressions to iterate over complex lists. For example, a loop can combine nested lists, which simulates a nested loop.

    - name: Give users access to multiple databases
      community.mysql.mysql_user:
        name: "{{ item[0] }}"
        priv: "{{ item[1] }}.*:ALL"
        append_privs: true
        password: "foo"
      loop: "{{ ['alice', 'bob'] | product(['clientdb', 'employeedb', 'providerdb']) | list }}"

## Stacking loops via include_tasks
> **Adicionado na versão: 2.1**
>
> You can nest two looping tasks using `include_tasks`. However, by default, Ansible sets the loop variable `item` for each loop.
>
This means the inner, nested loop will overwrite the value of `item` from the outer loop.
To avoid this, you can specify the name of the variable for each loop using `loop_var` with `loop_control`.

    # main.yml
    - include_tasks: inner.yml
      loop:
        - 1
        - 2
        - 3
      loop_control:
        loop_var: outer_item

    # inner.yml
    - name: Print outer and inner items
      ansible.builtin.debug:
        msg: "outer item={{ outer_item }} inner item={{ item }}"
      loop:
        - a
        - b
        - c

> **Nota: If Ansible detects that the current loop is using a variable that has already been defined, it will raise an error to fail the task.**
>
> ## Until and loop
>
> The `until` condition will apply per `item` of the `loop`:
>
> .. code-block:: yaml+jinja
>
> - debug: msg={{item}}
> loop:
> - 1
> - 2
> - 3
> retries: 2
> until: item > 2
>
> This will make Ansible retry the first 2 items twice, then fail the item on the 3rd attempt,
>
then succeed at the first attempt on the 3rd item, in the end failing the task as a whole.

```none
    [started TASK: debug on localhost]
    FAILED - RETRYING: [localhost]: debug (2 retries left).Result was: {
        "attempts": 1,
        "changed": false,
        "msg": 1,
        "retries": 3
    }
    FAILED - RETRYING: [localhost]: debug (1 retries left).Result was: {
        "attempts": 2,
        "changed": false,
        "msg": 1,
        "retries": 3
    }
    failed: [localhost] (item=1) => {
        "msg": 1
    }
    FAILED - RETRYING: [localhost]: debug (2 retries left).Result was: {
        "attempts": 1,
        "changed": false,
        "msg": 2,
        "retries": 3
    }
    FAILED - RETRYING: [localhost]: debug (1 retries left).Result was: {
        "attempts": 2,
        "changed": false,
        "msg": 2,
        "retries": 3
    }
    failed: [localhost] (item=2) => {
        "msg": 2
    }
    ok: [localhost] => (item=3) => {
        "msg": 3
    }
    fatal: [localhost]: FAILED! => {"msg": "One or more items failed"}

# Migrating from with_X to loop

---

## playbooks_blocks

### Blocks

Blocks create logical groups of tasks. Blocks also offer ways to handle task errors, similar to exception handling in many programming languages.

# Grouping tasks with blocks

All tasks in a block inherit directives applied at the block level. Most of what you can apply to a single task (with the exception of loops) can be applied at the block level, so blocks make it much easier to set data or directives common to the tasks. The directive does not affect the block itself, it is only inherited by the tasks enclosed by a block. For example, a `when` statement is applied to the tasks within a block, not to the block itself.

``yaml
 :emphasize-lines: 3
 :caption: Block example with named tasks inside the block

  tasks:
    - name: Install, configure, and start Apache
      when: ansible_facts['distribution'] == 'CentOS'
      block:
        - name: Install httpd and memcached
          ansible.builtin.yum:
            name:
            - httpd
            - memcached
            state: present

        - name: Apply the foo config template
          ansible.builtin.template:
            src: templates/src.j2
            dest: /etc/foo.conf

        - name: Start service bar and enable it
          ansible.builtin.service:
            name: bar
            state: started
            enabled: True
      become: true
      become_user: root
      ignore_errors: true

In the example above, the 'when' condition will be evaluated before Ansible runs each of the three tasks in the block. All three tasks also inherit the privilege escalation directives, running as the root user. Finally, `ignore_errors: true`` ensures that Ansible continues to execute the playbook even if some of the tasks fail.

> **Nota: All tasks in a block, including the ones included through `include_role`, inherit directives applied at the block level.**
>
> Names for blocks have been available since Ansible 2.3. We recommend using names in all tasks, within blocks or elsewhere, for better visibility into the tasks being executed when you run the playbook.
>
>
> # Handling errors with blocks
>
> You can control how Ansible responds to task errors using blocks with `rescue` and `always` sections.
>
> .. note::
>
> Errors caused by invalid task definitions and unreachable hosts do not trigger the `rescue` or `always` sections of a block.
>
> Rescue blocks specify tasks to run when an earlier task in a block fails. This approach is similar to exception handling in many programming languages. Ansible only runs rescue blocks after a task returns a 'failed' state.
>
>
> ``yaml
> :emphasize-lines: 3,14
> :caption: Block error handling example
>
> tasks:
> - name: Handle the error
> block:
> - name: Print a message
> ansible.builtin.debug:
> msg: 'I execute normally'
>
> - name: Force a failure
> ansible.builtin.command: /bin/false
>
> - name: Never print this
> ansible.builtin.debug:
> msg: 'I never execute, due to the above task failing, :-('
> rescue:
> - name: Print when errors
> ansible.builtin.debug:
> msg: 'I caught an error, can do stuff here to fix it, :-)'
>
> You can also add an `always` section to a block. Tasks in the `always` section run no matter what the task status of the previous block is.
>
>
> ``yaml
> :emphasize-lines: 3,14
> :caption: Block with always section
>
> tasks:
> - name: Always do X
> block:
> - name: Print a message
> ansible.builtin.debug:
> msg: 'I execute normally'
>
> - name: Force a failure
> ansible.builtin.command: /bin/false
>
> - name: Never print this
> ansible.builtin.debug:
> msg: 'I never execute :-('
> always:
> - name: Always do this
> ansible.builtin.debug:
> msg: "This always executes, :-)"
>
> Together, these elements offer complex error handling.
>
> ``yaml
> :emphasize-lines: 3,14,25
> :caption: Block with all sections
>
> tasks:
> - name: Attempt and graceful roll back demo
> block:
> - name: Print a message
> ansible.builtin.debug:
> msg: 'I execute normally'
>
> - name: Force a failure
> ansible.builtin.command: /bin/false
>
> - name: Never print this
> ansible.builtin.debug:
> msg: 'I never execute, due to the above task failing, :-('
> rescue:
> - name: Print when errors
> ansible.builtin.debug:
> msg: 'I caught an error'
>
> - name: Force a failure in middle of recovery! >:-)
> ansible.builtin.command: /bin/false
>
> - name: Never print this
> ansible.builtin.debug:
> msg: 'I also never execute :-('
> always:
> - name: Always do this
> ansible.builtin.debug:
> msg: "This always executes"
>
> The tasks in the `block` execute normally. If any tasks in the block return `failed`, the `rescue` section executes tasks to recover from the error. The `always` section runs regardless of the results of the `block` and `rescue` sections.
>
> If an error occurs in the block and the rescue task succeeds, Ansible reverts the failed status of the original task for the run and continues to run the play as if the original task had succeeded. The rescued task is considered successful and does not trigger `max_fail_percentage` or `any_errors_fatal` configurations. However, Ansible still reports a failure in the playbook statistics.
>
> You can use blocks with `flush_handlers` in a rescue task to ensure that all handlers run even if an error occurs:
>
> ``yaml
> :emphasize-lines: 3,12
> :caption: Block run handlers in error handling
>
> tasks:
> - name: Attempt and graceful roll back demo
> block:
> - name: Print a message
> ansible.builtin.debug:
> msg: 'I execute normally'
> changed_when: true
> notify: Run me even after an error
>
> - name: Force a failure
> ansible.builtin.command: /bin/false
> rescue:
> - name: Make sure all handlers run
> meta: flush_handlers
> handlers:
> - name: Run me even after an error
> ansible.builtin.debug:
> msg: 'This handler runs even on error'
>
>
> > **Adicionado na versão: 2.1**
>
>
> Ansible provides a couple of variables for tasks in the `rescue` portion of a block:
>
> ansible_failed_task
> The task that returned 'failed' and triggered the rescue. For example, to get the name use `ansible_failed_task.name`.
>
> ansible_failed_result
> The captured return result of the failed task that triggered the rescue. This would equate to having used this var in the `register` keyword.
>
> These can be inspected in the `rescue` section:
>
> ``yaml
> :emphasize-lines: 11,16
> :caption: Use special variables in rescue section.
>
> tasks:
> - name: Attempt and graceful roll back demo
> block:
> - name: Do Something
> ansible.builtin.shell: grep $(whoami) /etc/hosts
>
> - name: Force a failure, if previous one succeeds
> ansible.builtin.command: /bin/false
> rescue:
> - name: All is good if the first task failed
> when: ansible_failed_task.name == 'Do Something'
> ansible.builtin.debug:
> msg: All is good, ignore error as grep could not find 'me' in hosts
>
> - name: All is good if the second task failed
> when: "'/bin/false' in ansible_failed_result.cmd | d([])"
> ansible.builtin.fail:
> msg: It is still false!!!
>
> .. note::
>
> In `ansible-core` 2.14 or later, both variables are propagated from an inner block to an outer `rescue`` portion of a block when nesting blocks.
>