# Error Handling

## playbooks_error_handling

### Error handling in playbooks

When Ansible receives a non-zero return code from a command or a failure from a module, by default it stops executing on that host and continues on other hosts. However, in some circumstances, you may want different behavior. Sometimes a non-zero return code indicates success. Sometimes you want a failure on one host to stop execution on all hosts. Ansible provides tools and settings to handle these situations and help you get the behavior, output, and reporting you want.

# Ignoring failed commands

By default, Ansible stops executing tasks on a host when a task fails on that host. You can use `ignore_errors` to continue despite of the failure.

``yaml
    - name: Do not count this as a failure
      ansible.builtin.command: /bin/false
      ignore_errors: true

The `ignore_errors` directive only works when the task can run and returns a value of 'failed'. It does not make Ansible ignore undefined variable errors, connection failures, execution issues (for example, missing packages), or syntax errors.

# Ignoring unreachable host errors

> **Adicionado na versão: 2.7**
>
> You can ignore a task failure due to the host instance being 'UNREACHABLE' with the `ignore_unreachable` keyword. Ansible ignores the task errors but continues to execute future tasks against the unreachable host. For example, at the task level:
>
> ``yaml
> - name: This executes, fails, and the failure is ignored
> ansible.builtin.command: /bin/true
> ignore_unreachable: true
>
> - name: This executes, fails, and ends the play for this host
> ansible.builtin.command: /bin/true
>
> And at the playbook level:
>
> ``yaml
> - hosts: all
> ignore_unreachable: true
> tasks:
> - name: This executes, fails, and the failure is ignored
> ansible.builtin.command: /bin/true
>
> - name: This executes, fails, and ends the play for this host
> ansible.builtin.command: /bin/true
> ignore_unreachable: false
>
>
> # Resetting unreachable hosts
>
> If Ansible cannot connect to a host, it marks that host as 'UNREACHABLE' and removes it from the list of active hosts for the run. You can use `meta: clear_host_errors`` to reactivate all hosts, so subsequent tasks can try to reach them again.
>
>
> # Handlers and failure
>
> Ansible runs `handlers ` at the end of each play. If a task notifies a handler but
>
another task fails later in the play, by default the handler does *not* run on that host,
which may leave the host in an unexpected state. For example, a task could update
a configuration file and notify a handler to restart some service. If a
task later in the same play fails, the configuration file might be changed but
the service will not be restarted.

You can change this behavior with the `--force-handlers` command-line option,
by including `force_handlers: True` in a play, or by adding `force_handlers = True`
to ansible.cfg. When handlers are forced, Ansible will run all notified handlers on
all hosts, even hosts with failed tasks. (Note that certain errors could still prevent
the handler from running, such as a host becoming unreachable.)

# Defining failure

Ansible lets you define what "failure" means in each task using the `failed_when` conditional. As with all conditionals in Ansible, lists of multiple `failed_when` conditions are joined with an implicit `and`, meaning the task only fails when *all* conditions are met. If you want to trigger a failure when *any* of the conditions is met, you must define the conditions in a single string with an explicit `or` operator.

For example, to fail when either of two conditions is true:

``yaml
    - name: Fail task when either condition is met
      ansible.builtin.command: /usr/bin/example-command
      register: command_result
      failed_when: command_result.rc != 0 or 'ERROR' in command_result.stdout

You may check for failure by searching for a word or phrase in the output of a command

``yaml
    - name: Fail task when the command error output prints FAILED
      ansible.builtin.command: /usr/bin/example-command -x -y -z
      register: command_result
      failed_when: "'FAILED' in command_result.stderr"

or based on the return code

``yaml
    - name: Fail task when both files are identical
      ansible.builtin.raw: diff foo/file1 bar/file2
      register: diff_cmd
      failed_when: diff_cmd.rc == 0 or diff_cmd.rc >= 2

You can also combine multiple conditions for failure. This task will fail if both conditions are true:

``yaml
    - name: Check if a file exists in temp and fail task if it does
      ansible.builtin.command: ls /tmp/this_should_not_be_here
      register: result
      failed_when:
        - result.rc == 0
        - '"No such" not in result.stderr'

If you want the task to fail when only one condition is satisfied, change the `failed_when` definition to

``yaml
      failed_when: result.rc == 0 or "No such" not in result.stderr

If you have too many conditions to fit neatly into one line, you can split it into a multi-line YAML value with `>`.

``yaml
    - name: example of many failed_when conditions with OR
      ansible.builtin.shell: "./myBinary"
      register: ret
      failed_when: >
        ("No such file or directory" in ret.stdout) or
        (ret.stderr != '') or
        (ret.rc == 10)

# Defining "changed"

Ansible lets you define when a particular task has "changed" a remote node using the `changed_when` conditional. This lets you determine, based on return codes or output, whether a change should be reported in Ansible statistics and whether a handler should be triggered or not. As with all conditionals in Ansible, lists of multiple `changed_when` conditions are joined with an implicit `and`, meaning the task only reports a change when *all* conditions are met. If you want to report a change when any of the conditions is met, you must define the conditions in a string with an explicit `or` operator. For example:

``yaml
    tasks:

      - name: Report 'changed' when the return code is not equal to 2
        ansible.builtin.shell: /usr/bin/billybass --mode="take me to the river"
        register: bass_result
        changed_when: "bass_result.rc != 2"

      - name: This will never report 'changed' status
        ansible.builtin.shell: wall 'beep'
        changed_when: False

      - name: This task will always report 'changed' status
        ansible.builtin.command: /path/to/command
        changed_when: True

You can also combine multiple conditions to override "changed" result.

``yaml
    - name: Combine multiple conditions to override 'changed' result
      ansible.builtin.command: /bin/fake_command
      register: result
      ignore_errors: True
      changed_when:
        - '"ERROR" in result.stderr'
        - result.rc == 2

You can reference simple variables in conditionals to avoid repeating certain terms, as in the following example:

``yaml
  - name: Example playbook
    hosts: myHosts
    vars:
      log_path: /home/ansible/logfolder/
      log_file: log.log

    tasks:
      - name: Create empty log file
        ansible.builtin.shell: mkdir {{ log_path }} || touch {{ log_path }}{{ log_file }}
        register: tmp
        changed_when:
          - tmp.rc == 0
          - 'tmp.stderr != "mkdir: cannot create directory ‘" ~ log_path ~ "’: File exists"'

> **Nota: Notice the missing double curly braces `{{ }}` around the `log_path` variable in the `changed_when` statement.**
>
> Just like `when` these two conditionals do not require templating delimiters (`{{ }}``) because they are raw Jinja2 expressions.
>
> If you still use them, ansible will raise a warning  that conditional statements should not include jinja2 templating delimiters.
>
> See `controlling_what_defines_failure` for more conditional syntax examples.
>
> # Ensuring success for command and shell
>
> The `command ` and `shell ` modules care about return codes, so if you have a command whose successful exit code is not zero, you can do this:
>
> ``yaml
> tasks:
> - name: Run this command and ignore the result
> ansible.builtin.shell: /usr/bin/somecommand || /bin/true
>
>
> # Aborting a play on all hosts
>
> Sometimes you want a failure on a single host, or failures on a certain percentage of hosts, to abort the entire play on all hosts. You can stop play execution after the first failure happens with `any_errors_fatal`. For finer-grained control, you can use `max_fail_percentage` to abort the run after a given percentage of hosts has failed.
>
> ## Aborting on the first error: any_errors_fatal
>
> If you set `any_errors_fatal`` and a task returns an error, Ansible finishes the fatal task on all hosts in the current batch and then stops executing the play on all hosts. Subsequent tasks and plays are not executed. You can recover from fatal errors by adding a `rescue section ` to the block. You can set `any_errors_fatal` at the play or block level.
>
> ``yaml
> - hosts: somehosts
> any_errors_fatal: true
> roles:
> - myrole
>
> - hosts: somehosts
> tasks:
> - block:
> - include_tasks: mytasks.yml
> any_errors_fatal: true
>
> You can use this feature when all tasks must be 100% successful to continue playbook execution. For example, if you run a service on machines in multiple data centers with load balancers to pass traffic from users to the service, you want all load balancers to be disabled before you stop the service for maintenance. To ensure that any failure in the task that disables the load balancers will stop all other tasks:
>
> ``yaml
> ---
> - hosts: load_balancers_dc_a
> any_errors_fatal: true
>
> tasks:
> - name: Shut down datacenter 'A'
> ansible.builtin.command: /usr/bin/disable-dc
>
> - hosts: frontends_dc_a
>
> tasks:
> - name: Stop service
> ansible.builtin.command: /usr/bin/stop-software
>
> - name: Update software
> ansible.builtin.command: /usr/bin/upgrade-software
>
> - hosts: load_balancers_dc_a
>
> tasks:
> - name: Start datacenter 'A'
> ansible.builtin.command: /usr/bin/enable-dc
>
> In this example, Ansible starts the software upgrade on the front ends only if all of the load balancers are successfully disabled.
>
>
> ## Setting a maximum failure percentage
>
> By default, Ansible continues to execute tasks as long as there are hosts that have not yet failed. In some situations, such as when executing a rolling update, you may want to abort the play when a certain threshold of failures has been reached. To achieve this, you can set a maximum failure percentage on a play:
>
> ``yaml
> ---
> - hosts: webservers
> max_fail_percentage: 30
> serial: 10
>
> The `max_fail_percentage`` setting applies to each batch when you use it with `serial `. In the example above, if more than 3 of the 10 servers in the first (or any) batch of servers failed, the rest of the play would be aborted.
>
> .. note::
>
> The percentage set must be exceeded, not equaled. For example, if serial were set to 4 and you wanted the task to abort the play when 2 of the systems failed, set the max_fail_percentage at 49 rather than 50.
>
> # Controlling errors in blocks
>
> You can also use blocks to define responses to task errors. This approach is similar to exception handling in many programming languages. See `block_error_handling` for details and examples.
>

---

## playbooks_handlers

# Handlers: running operations on change

Sometimes you want a task to run only when a change is made on a machine. For example, you may want to restart a service if a task updates the configuration of that service, but not if the configuration is unchanged. Ansible uses handlers to address this use case. Handlers are tasks that only run when notified.

## Handler example

This playbook, `verify-apache.yml`, contains a single play with a handler.

``yaml
    - name: Verify apache installation
      hosts: webservers
      vars:
        http_port: 80
        max_clients: 200
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
          notify:
            - Restart apache

        - name: Ensure apache is running
          ansible.builtin.service:
            name: httpd
            state: started

      handlers:
        - name: Restart apache
          ansible.builtin.service:
            name: httpd
            state: restarted

In this example playbook, the Apache server is restarted by the handler after all tasks are completed in the play.

## Notifying handlers

Tasks can instruct one or more handlers to execute using the `notify` keyword. The `notify` keyword can be applied to a task and accepts a list of handler names that are notified on a task change. Alternatively, a string containing a single handler name can be supplied as well. The following example demonstrates how multiple handlers can be notified by a single task:

``yaml
    tasks:
    - name: Template configuration file
      ansible.builtin.template:
        src: template.j2
        dest: /etc/foo.conf
      notify:
        - Restart apache
        - Restart memcached

    handlers:
      - name: Restart memcached
        ansible.builtin.service:
          name: memcached
          state: restarted

      - name: Restart apache
        ansible.builtin.service:
          name: apache
          state: restarted

In the above example, the handlers are executed on task change in the following order: `Restart memcached`, `Restart apache`. Handlers are executed in the order they are defined in the `handlers` section, not in the order listed in the `notify` statement. Notifying the same handler multiple times will result in executing the handler only once regardless of how many tasks notify it. For example, if multiple tasks update a configuration file and notify a handler to restart Apache, Ansible only bounces Apache once to avoid unnecessary restarts.

## Notifying and loops

Tasks can use loops to notify handlers. This is particularly useful when combined with variables to trigger multiple dynamic notifications.

Note that the handlers are triggered if the task as a whole is changed. When a loop is used the changed state is set if any of the loop items are changed.  That is, any change triggers all of the handlers.

``yaml
    tasks:
    - name: Template services
      ansible.builtin.template:
        src: "{{ item }}.j2"
        dest: /etc/systemd/system/{{ item }}.service
      # Note: if *any* loop iteration triggers a change, *all* handlers are run
      notify: Restart {{ item }}
      loop:
        - memcached
        - apache

    handlers:
      - name: Restart memcached
        ansible.builtin.service:
          name: memcached
          state: restarted

      - name: Restart apache
        ansible.builtin.service:
          name: apache
          state: restarted

In the above example both memcached and apache will be restarted if either template file is changed, neither will be restarted if no file changes.

## Naming handlers

Handlers must be named in order for tasks to be able to notify them using the `notify` keyword.

Alternatively, handlers can utilize the `listen` keyword. Using this handler keyword, handlers can listen on topics that can group multiple handlers as follows:

``yaml
    tasks:
      - name: Restart everything
        command: echo "this task will restart the web services"
        notify: "restart web services"

    handlers:
      - name: Restart memcached
        service:
          name: memcached
          state: restarted
        listen: "restart web services"

      - name: Restart apache
        service:
          name: apache
          state: restarted
        listen: "restart web services"

Notifying the `restart web services` topic results in executing all handlers listening to that topic regardless of how those handlers are named.

This use makes it much easier to trigger multiple handlers. It also decouples handlers from their names, making it easier to share handlers among playbooks and roles (especially when using third-party roles from a shared source such as Ansible Galaxy).

Each handler should have a globally unique name. If multiple handlers are defined with the same name, only the last one loaded into the play (see `handlers_insertion_order`_) can be notified and executed, effectively shadowing all of the previous handlers with the same name.

## Handler insertion order into the play

There is only one global, play-level scope for handlers regardless of where the handlers are defined, either in the `handlers:` section or in roles. The order in which handlers are added into the play is as follows:

#. Handlers from roles in the `roles:` section.

#. Handlers from the `handlers:` section.

#. Handlers from roles statically imported via `import_role` tasks.

#. Handlers from roles dynamically included via `include_role` tasks (available at runtime only after the `include_role` task executed).

In case handlers having the same name the last one loaded into the play, as per the above order, can be notified and executed.

## Controlling when handlers run

By default, handlers run after all the tasks in a particular play have been completed. Notified handlers are executed automatically after each of the following sections, in the following order: `pre_tasks`, `roles`/`tasks` and `post_tasks`. This approach is efficient, because the handler only runs once, regardless of how many tasks notify it. For example, if multiple tasks update a configuration file and notify a handler to restart Apache, Ansible only bounces Apache once to avoid unnecessary restarts.

If you need handlers to run before the end of the play, add a task to flush them using the `meta module `, which executes Ansible actions:

``yaml
    tasks:
      - name: Some tasks go here
        ansible.builtin.shell: ...

      - name: Flush handlers
        meta: flush_handlers

      - name: Some other tasks
        ansible.builtin.shell: ...

The `meta: flush_handlers` task triggers any handlers that have been notified at that point in the play.

Once handlers are executed, either automatically after each mentioned section or manually by the `flush_handlers` meta task, they can be notified and run again in later sections of the play.

## Defining when tasks change

You can control when handlers are notified about task changes using the `changed_when` keyword.

In the following example, the handler restarts the service each time the configuration file is copied:

``yaml
    tasks:
      - name: Copy httpd configuration
        ansible.builtin.copy:
          src: ./new_httpd.conf
          dest: /etc/httpd/conf/httpd.conf
        # The task is always reported as changed
        changed_when: True
        notify: Restart apache

See `override_the_changed_result` for more about `changed_when`.

## Using variables with handlers

You may want your Ansible handlers to use variables. For example, if the name of a service varies slightly by distribution, you want your output to show the exact name of the restarted service for each target machine. Avoid placing variables in the name of the handler. Since handler names are templated early on, Ansible may not have a value available for a handler name like this:

    handlers:
    # This handler name may cause your play to fail!
    - name: Restart "{{ web_service_name }}"

If the variable used in the handler name is not available, the entire play fails. Changing that variable mid-play **will not** result in newly created handler.

Instead, place variables in the task parameters of your handler. You can load the values using `include_vars` like this:

    tasks:
      - name: Set host variables based on distribution
        include_vars: "{{ ansible_facts.distribution }}.yml"

    handlers:
      - name: Restart web service
        ansible.builtin.service:
          name: "{{ web_service_name | default('httpd') }}"
          state: restarted

While handler names can contain a template, `listen` topics cannot.

## Handlers in roles

Handlers from roles are not just contained in their roles but rather inserted into the global scope with all other handlers from a play. As such they can be used outside of the role they are defined in. It also means that their name can conflict with handlers from outside the role. To ensure that a handler from a role is notified as opposed to one from outside the role with the same name, notify the handler by using its name in the following form: `role_name : handler_name`.

Handlers notified within the `roles` section are automatically flushed at the end of the `tasks` section.

## Includes and imports in handlers
Notifying a dynamic include such as `include_task` as a handler results in executing all tasks from within the include. It is not possible to notify a handler defined inside a dynamic include.

Having a static include such as `import_task` as a handler results in that handler being effectively rewritten by handlers from within that import before the play execution. A static include itself cannot be notified; the tasks from within that include, on the other hand, can be notified individually.

## Meta tasks as handlers

Since Ansible 2.14 :ansplugin:`meta tasks <ansible.builtin.meta#module>` are allowed to be used and notified as handlers. Note that however `flush_handlers` cannot be used as a handler to prevent unexpected behavior.

## Limitations

A handler cannot run `import_role` nor `include_role`.
Handlers `ignore tags `.

---

## playbooks_tags

### Tags

If you have a large playbook, it may be useful to run only specific parts of it instead of running the entire playbook. You can do this with Ansible tags. Using tags to execute or skip selected tasks is a two-step process:

   #. Add tags to your tasks, either individually or with tag inheritance from a block, play, role, or import.
   #. Select or skip tags when you run your playbook.

> **Nota: The `tags` keyword is part of 'pre processing' the playbook and has high precedence when deciding what tasks are available to consider for execution.**
>
>
>
> # Adding tags with the tags keyword
>
> You can add tags to a single task or include. You can also add tags to multiple tasks by defining them at the level of a block, play, role, or import. The keyword `tags` addresses all these use cases. The `tags` keyword always defines tags and adds them to tasks; it does not select or skip tasks for execution. You can only select or skip tasks based on tags at the command line when you run a playbook. See `using_tags` for more details.
>
> ## Adding tags to individual tasks
>
> At the simplest level, you can apply one or more tags to an individual task. You can add tags to tasks in playbooks, in task files, or within a role. Here is an example that tags two tasks with different tags:
>
> ``yaml
> tasks:
> - name: Install the servers
> ansible.builtin.yum:
> name:
> - httpd
> - memcached
> state: present
> tags:
> - packages
> - webservers
>
> - name: Configure the service
> ansible.builtin.template:
> src: templates/src.j2
> dest: /etc/foo.conf
> tags:
> - configuration
>
> You can apply the same tag to more than one individual task. This example tags several tasks with the same tag, "ntp":
>
> ``yaml
> ---
> # file: roles/common/tasks/main.yml
>
> - name: Install ntp
> ansible.builtin.yum:
> name: ntp
> state: present
> tags: ntp
>
> - name: Configure ntp
> ansible.builtin.template:
> src: ntp.conf.j2
> dest: /etc/ntp.conf
> notify:
> - restart ntpd
> tags: ntp
>
> - name: Enable and run ntpd
> ansible.builtin.service:
> name: ntpd
> state: started
> enabled: true
> tags: ntp
>
> - name: Install NFS utils
> ansible.builtin.yum:
> name:
> - nfs-utils
> - nfs-util-lib
> state: present
> tags: filesharing
>
> If you ran these four tasks in a playbook with `--tags ntp`, Ansible would run the three tasks tagged `ntp` and skip the one task that does not have that tag.
>
>
>
> #### Adding tags to handlers
>
> Handlers are a special case of tasks that only execute when notified, as such they ignore all tags and cannot be selected for nor against.
>
>
>
> #### Adding tags to blocks
>
> If you want to apply a tag to many, but not all, of the tasks in your play, use a `block ` and define the tags at that level. For example, we could edit the NTP example shown above to use a block:
>
> ``yaml
> # myrole/tasks/main.yml
> - name: ntp tasks
> tags: ntp
> block:
> - name: Install ntp
> ansible.builtin.yum:
> name: ntp
> state: present
>
> - name: Configure ntp
> ansible.builtin.template:
> src: ntp.conf.j2
> dest: /etc/ntp.conf
> notify:
> - restart ntpd
>
> - name: Enable and run ntpd
> ansible.builtin.service:
> name: ntpd
> state: started
> enabled: true
>
> - name: Install NFS utils
> ansible.builtin.yum:
> name:
> - nfs-utils
> - nfs-util-lib
> state: present
> tags: filesharing
>
>
> Be mindful that `tag` selection supersedes most other logic, including `block` error handling. Setting a tag on a task in a `block` but not in the `rescue` or `always` section will prevent those from triggering if your tags selection does not cover the tasks in those sections.
>
> ``yaml
> - block:
> - debug: msg=run with tag, but always fail
> failed_when: true
> tags: example
>
> rescue:
> - debug: msg=I always run because the block always fails, except if you select to only run 'example' tag
>
> always:
> - debug: msg=I always run, except if you select to only run 'example' tag
>
> This example runs all 3 tasks if called without specifying `--tags` but only runs the first task if you run with `--tags example`.
>
>
> #### Adding tags to plays
>
> If all the tasks in a play should get the same tag, you can add the tag at the level of the play. For example, if you had a play with only the NTP tasks, you could tag the entire play:
>
> ``yaml
> - hosts: all
> tags: ntp
> tasks:
> - name: Install ntp
> ansible.builtin.yum:
> name: ntp
> state: present
>
> - name: Configure ntp
> ansible.builtin.template:
> src: ntp.conf.j2
> dest: /etc/ntp.conf
> notify:
> - restart ntpd
>
> - name: Enable and run ntpd
> ansible.builtin.service:
> name: ntpd
> state: started
> enabled: true
>
> - hosts: fileservers
> tags: filesharing
> tasks:
> # ...
>
> .. note::
> The tasks tagged will include all implicit tasks (like fact gathering) of the play, including those added via roles.
>
>
> #### Adding tags to roles
>
> There are three ways to add tags to roles:
>
> #. Add the same tag or tags to all tasks in the role by setting tags under `roles`. See examples in this section.
> #. Add the same tag or tags to all tasks in the role by setting tags on a static `import_role`` in your playbook. See examples in `tags_on_imports`.
> #. Add a tag or tags to individual tasks or blocks within the role itself. This is the only approach that allows you to select or skip some tasks within the role. To select or skip tasks within the role, you must have tags set on individual tasks or blocks, use the dynamic `include_role` in your playbook, and add the same tag or tags to the include. When you use this approach, and then run your playbook with `--tags foo`, Ansible runs the include itself plus any tasks in the role that also have the tag `foo`. See `tags_on_includes` for details.
>
> When you incorporate a role in your playbook statically with the `roles` keyword, Ansible adds any tags you define to all the tasks in the role. For example:
>
> ``yaml
> roles:
> - role: webserver
> vars:
> port: 5000
> tags: [ web, foo ]
>
> or:
>
> ``yaml
> ---
> - hosts: webservers
> roles:
> - role: foo
> tags:
> - bar
> - baz
> # using YAML shorthand, this is equivalent to:
> # - { role: foo, tags: ["bar", "baz"] }
>
>
> .. note::
> When adding a tag at the role level, not only are all tasks tagged, but the role's dependencies also have their tasks tagged.
> See the tag inheritance section for details.
>
>
>
> #### Adding tags to includes
>
> You can apply tags to dynamic includes in a playbook. As with tags on an individual task, tags on an `include_*` task apply only to the include itself, not to any tasks within the included file or role. If you add `mytag` to a dynamic include, then run that playbook with `--tags mytag`, Ansible runs the include itself, runs any tasks within the included file or role tagged with `mytag`, and skips any tasks within the included file or role without that tag. See `selective_reuse` for more details.
>
> You add tags to includes the same way you add tags to any other task:
>
> ``yaml
> ---
> # file: roles/common/tasks/main.yml
>
> - name: Dynamic reuse of database tasks
> include_tasks: db.yml
> tags: db
>
> You can add a tag only to the dynamic include of a role. In this example, the `foo`` tag will `not` apply to tasks inside the `bar` role:
>
> ``yaml
> ---
> - hosts: webservers
> tasks:
> - name: Include the bar role
> include_role:
> name: bar
> tags:
> - foo
>
>
>
> #### Adding tags to imports
>
> You can also apply a tag or tags to all the tasks imported by the static `import_role` and `import_tasks` statements:
>
> ``yaml
> ---
> - hosts: webservers
> tasks:
> - name: Import the foo role
> import_role:
> name: foo
> tags:
> - bar
> - baz
>
> - name: Import tasks from foo.yml
> import_tasks: foo.yml
> tags: [ web, foo ]
>
>
> #### Tag inheritance for includes: blocks and the `apply` keyword
>
> By default, Ansible does not apply `tag inheritance ` to dynamic reuse with `include_role` and `include_tasks`. If you add tags to an include, they apply only to the include itself, not to any tasks in the included file or role. This allows you to execute selected tasks within a role or task file - see `selective_reuse` when you run your playbook.
>
> If you want tag inheritance, you probably want to use imports. However, using both includes and imports in a single playbook can lead to difficult-to-diagnose bugs. For this reason, if your playbook uses `include_*` to reuse roles or tasks, and you need tag inheritance on one include, Ansible offers two workarounds. You can use the `apply` keyword:
>
> ``yaml
> - name: Apply the db tag to the include and to all tasks in db.yml
> include_tasks:
> file: db.yml
> # adds 'db' tag to tasks within db.yml
> apply:
> tags: db
> # adds 'db' tag to this 'include_tasks' itself
> tags: db
>
> Or you can use a block:
>
> ``yaml
> - block:
> - name: Include tasks from db.yml
> include_tasks: db.yml
> tags: db
>
>
> # Special tags
>
> Ansible reserves several tag names for special behavior: `always`, `never`, `tagged`, `untagged` and `all`.
>
Both `always` and `never` are mostly for use in tagging the tasks themselves, the other three are used when selecting which tags to run or skip.

## Always and Never
Ansible reserves several tag names for special behavior, two of which are `always` and `never`. If you assign the `always` tag to a task or play, Ansible will always run that task or play, unless you specifically skip it (`--skip-tags always`) or another tag defined on that task.

For example:

``yaml
   tasks:
   - name: Print a message
     ansible.builtin.debug:
       msg: "Always runs"
     tags:
     - always

   - name: Print a message
     ansible.builtin.debug:
       msg: "runs when you use specify tag1, all(default) or tagged"
     tags:
     - tag1

   - name: Print a message
     ansible.builtin.debug:
       msg: "always runs unless you explicitly skip, like if you use `--skip-tags tag2`"
     tags:
        - always
        - tag2

> **Aviso: * The internal fact gathering task is tagged with 'always' by default. But it can be skipped if**
> you apply a tag to the play and you skip it directly (`--skip-tags`) or indirectly when you use
> `--tags` and omit it.
>
> .. warning::
> * The role argument specification validation task is tagged with 'always' by default. This validation
> will be skipped if you use `--skip-tags always`.
>
> > **Adicionado na versão: 2.5**
>
>
> If you assign the `never` tag to a task or play, Ansible skips that task or play unless you specifically request it (`--tags never`) or another tag defined for that task.
>
> For example:
>
> ``yaml
> tasks:
> - name: Run the rarely-used debug task, either with `--tags debug` or `--tags never`
> ansible.builtin.debug:
> msg: '{{ showmevar }}'
> tags: [ never, debug ]
>
> The rarely-used debug task in the example above only runs when you specifically request the `debug` or `never` tags.
>
>
> # Selecting or skipping tags when you run a playbook
>
> Once you have added tags to your tasks, includes, blocks, plays, roles, and imports, you can selectively execute or skip tasks based on their tags when you run `ansible-playbook`. Ansible runs or skips all tasks with tags that match the tags you pass at the command line. If you have added a tag at the block or play level, with `roles`, or with an import, that tag applies to every task within the block, play, role, or imported role or file. If you have a role with several tags and you want to call subsets of the role at different times, either `use it with dynamic includes `, or split the role into multiple roles.
>
>
> `ansible-playbook` offers five tag-related command-line options:
>
> * `--tags all` - run all tasks, tagged and untagged except if `never` (default behavior).
>
* `--tags tag1,tag2` - run only tasks with either the tag `tag1` or the tag `tag2` (also those tagged `always`).
* `--skip-tags tag3,tag4` - run all tasks except those with either the tag `tag3` or the tag `tag4` or `never`.
* `--tags tagged` - run only tasks with at least one tag (`never` overrides).
* `--tags untagged` - run only tasks with no tags (`always` overrides).

For example, to run only tasks and blocks tagged either `configuration` or `packages` in a very long playbook:

``bash
   ansible-playbook example.yml --tags "configuration,packages"

To run all tasks except those tagged `packages`:

``bash
   ansible-playbook example.yml --skip-tags "packages"

To run all tasks, even those excluded because are tagged `never`:

``bash
   ansible-playbook example.yml --tags "all,never"

Run tasks with tag1 or tag3 but skip tasks that also have tag4:

``bash
   ansible-playbook example.yml --tags "tag1,tag3" --skip-tags "tag4"

## Tag precedence
Skipping always takes precedence over explicit tags, for example, if you specify both `--tags` and `--skip-tags` the latter has precedence. For example `--tags tag1,tag3,tag4 --skip-tags tag3` will only run tasks tagged with tag1 or tag4, but not with tag3, even if the task has one of the other tags.

## Previewing the results of using tags

When you run a role or playbook, you might not know or remember which tasks have which tags, or which tags exist at all. Ansible offers two command-line flags for `ansible-playbook` that help you manage tagged playbooks:

* `--list-tags` - generate a list of available tags
* `--list-tasks` - when used with `--tags tagname` or `--skip-tags tagname`, generate a preview of tagged tasks

For example, if you do not know whether the tag for configuration tasks is `config` or `conf` in a playbook, role, or tasks file, you can display all available tags without running any tasks:

``bash
   ansible-playbook example.yml --list-tags

If you do not know which tasks have the tags `configuration` and `packages`, you can pass those tags and add `--list-tasks`. Ansible lists the tasks but does not execute any of them.

``bash
   ansible-playbook example.yml --tags "configuration,packages" --list-tasks

These command-line flags have one limitation: they cannot show tags or tasks within dynamically included files or roles. See `dynamic_vs_static` for more information on differences between static imports and dynamic includes.

## Selectively running tagged tasks in reusable files

If you have a role or a tasks file with tags defined at the task or block level, you can selectively run or skip those tagged tasks in a playbook if you use a dynamic include instead of a static import. You must use the same tag on the included tasks and on the include statement itself. For example, you might create a file with some tagged and some untagged tasks:

``yaml
   # mixed.yml
   tasks:
   - name: Run the task with no tags
     ansible.builtin.debug:
       msg: this task has no tags

   - name: Run the tagged task
     ansible.builtin.debug:
       msg: this task is tagged with mytag
     tags: mytag

   - block:
     - name: Run the first block task with mytag
       # ...
     - name: Run the second block task with mytag
       # ...
     tags:
     - mytag

And you might include the tasks file above in a playbook:

``yaml
   # myplaybook.yml
   - hosts: all
     tasks:
     - name: Run tasks from mixed.yml
       include_tasks:
         name: mixed.yml
       tags: mytag

When you run the playbook with `ansible-playbook -i hosts myplaybook.yml --tags "mytag"`, Ansible skips the task with no tags, runs the tagged individual task, and runs the two tasks in the block. Also it could run fact gathering (implicit task) as it is tagged with `always`.

## Tag inheritance: adding tags to multiple tasks

If you want to apply the same tag or tags to multiple tasks without adding a `tags` line to every task, you can define the tags at the level of your play or block, or when you add a role or import a file. Ansible applies the tags down the dependency chain to all child tasks. With roles and imports, Ansible appends the tags set by the `roles` section or import to any tags set on individual tasks or blocks within the role or imported file. This is called tag inheritance. Tag inheritance is convenient because you do not have to tag every task. However, the tags still apply to the tasks individually.

With plays, blocks, the `role` keyword, and static imports, Ansible applies tag inheritance, adding the tags you define to every task inside the play, block, role, or imported file. However, tag inheritance does *not* apply to dynamic reuse with `include_role` and `include_tasks`. With dynamic reuse (includes), the tags you define apply only to the include itself. If you need tag inheritance, use a static import. If you cannot use an import because the rest of your playbook uses includes, see `apply_keyword` for ways to work around this behavior.

You can apply tags to dynamic includes in a playbook. As with tags on an individual task, tags on an `include_*` task apply only to the include itself, not to any tasks within the included file or role. If you add `mytag` to a dynamic include, then run that playbook with `--tags mytag`, Ansible runs the include itself, runs any tasks within the included file or role tagged with `mytag`, and skips any tasks within the included file or role without that tag. See `selective_reuse` for more details.

## Configuring tags globally

If you run or skip certain tags by default, you can use the `TAGS_RUN` and `TAGS_SKIP` options in Ansible configuration to set those defaults.