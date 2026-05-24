# Reuse Roles

## playbooks_reuse_roles

### Roles

Roles let you automatically load related vars, files, tasks, handlers, and other Ansible artifacts based on a known file structure. After you group your content into roles, you can easily reuse them and share them with other users.

# Role directory structure

An Ansible role has a defined directory structure with seven main standard directories. You must include at least one of these directories in each role. You can omit any directories the role does not use. For example:

``text
    # playbooks
    site.yml
    webservers.yml
    fooservers.yml

By default, Ansible will look in most role directories for a `main.yml` file for relevant content (also `main.yaml` and `main`):

- `tasks/main.yml` - A list of tasks that the role provides to the play for execution.
- `handlers/main.yml` - handlers that are imported into the parent play for use by the role or other roles and tasks in the play.
- `defaults/main.yml`` - very low precedence values for variables provided by the role (see `playbooks_variables` for more information). A role's own defaults will take priority over other role's defaults, but any/all other variable sources will override this.
- `vars/main.yml` - high precedence variables provided by the role to the play (see `playbooks_variables` for more information).
- `files/stuff.txt` - one or more files that are available for the role and it's children.
- `templates/something.j2` - templates to use in the role or child roles.
- `meta/main.yml` - metadata for the role, including role dependencies and optional Galaxy metadata such as platforms supported. This is required for uploading into galaxy as a standalone role, but not for using the role in your play.

> **Nota: - None of the files above are required for a role. For example, you can just provide `files/something.txt` or `vars/for_import.yml` and it will still be a valid role.**
> - On stand alone roles you can also include custom modules and/or plugins, for example `library/my_module.py`, which may be used within this role (see `embedding_modules_and_plugins_in_roles` for more information).
> - A 'stand alone' role refers to role that is not part of a collection but as individually installable content.
> - Variables from `vars/` and `defaults/` are imported into play scope unless you disable it via the `public` option in `import_role`/`include_role`.
>
> You can add other YAML files in some directories, but they won't be used by default. They can be included/imported directly or specified when using `include_role/import_role`.
>
For example, you can place platform-specific tasks in separate files and refer to them in the `tasks/main.yml` file:

``yaml
    # roles/example/tasks/main.yml
    - name: Install the correct web server for RHEL
      import_tasks: redhat.yml
      when: ansible_facts['os_family']|lower == 'redhat'

    - name: Install the correct web server for Debian
      import_tasks: debian.yml
      when: ansible_facts['os_family']|lower == 'debian'

    # roles/example/tasks/redhat.yml
    - name: Install web server
      ansible.builtin.yum:
        name: "httpd"
        state: present

    # roles/example/tasks/debian.yml
    - name: Install web server
      ansible.builtin.apt:
        name: "apache2"
        state: present

Or call those tasks directly when loading the role, which bypasses the `main.yml` files:

``yaml
   - name: include apt tasks
     include_role:
         name: package_manager_bootstrap
         tasks_from: apt.yml
     when: ansible_facts['os_family'] == 'Debian'

Directories `defaults` and `vars` may also include *nested directories*. If your variables file is a directory, Ansible reads all variables files and directories inside in alphabetical order. If a nested directory contains variables files as well as directories, Ansible reads the directories first. Below is an example of a `vars/main` directory:

``text
  roles/
      common/          # this hierarchy represents a "role"
          vars/
              main/    #  <-- variables associated with this role
                  first_nested_directory/
                      first_variables_file.yml
                  second_nested_directory/
                      second_variables_file.yml
                  third_variables_file.yml

# Storing and finding roles

By default, Ansible looks for roles in the following locations:

- in collections, if you are using them
- in a directory called `roles/``, relative to the playbook file
- in the configured `roles_path `. The default search path is `~/.ansible/roles:/usr/share/ansible/roles:/etc/ansible/roles`.
- in the directory where the playbook file is located

If you store your roles in a different location, set the `roles_path ` configuration option so Ansible can find your roles. Checking shared roles into a single location makes them easier to use in multiple playbooks. See `intro_configuration` for details about managing settings in `ansible.cfg`.

Alternatively, you can call a role with a fully qualified path:

``yaml
    - hosts: webservers
      roles:
        - role: '/path/to/my/roles/common'

# Using roles

You can use roles in the following ways:

- at the play level with the `roles` option: This is the classic way of using roles in a play.
- at the tasks level with `include_role`: You can reuse roles dynamically anywhere in the `tasks` section of a play using `include_role`.
- at the tasks level with `import_role`: You can reuse roles statically anywhere in the `tasks` section of a play using `import_role`.
- as a dependency of another role (see the `dependencies` keyword in `meta/main.yml` in this same page).

## Using roles at the play level

The classic (original) way to use roles is with the `roles` option for a given play:

``yaml
    - hosts: webservers
      roles:
        - common
        - webservers

When you use the `roles` option at the play level, each role 'x' looks for a `main.yml` (also `main.yaml` and `main`) in the following directories:

- `roles/x/tasks/`
- `roles/x/handlers/`
- `roles/x/vars/`
- `roles/x/defaults/`
- `roles/x/meta/`
- Any copy, script, template or include tasks (in the role) can reference files in roles/x/{files,templates,tasks}/ (dir depends on task) without having to path them relatively or absolutely.

> **Nota: `vars` and `defaults` can also match to a directory of the same name and Ansible will process all the files contained in that directory. See `Role directory structure ` for more details.**
>
> .. note::
> If you use `include_role/import_role`, you can specify a custom file name instead of `main`. The `meta` directory is an exception because it does not allow for customization.
>
> When you use the `roles` option at the play level, Ansible treats the roles as static imports and processes them during playbook parsing. Ansible executes each play in this order:
>
> - Any `pre_tasks` defined in the play.
>
- Any handlers triggered by pre_tasks.
- Each role listed in `roles:`, in the order listed. Any role dependencies defined in the role's `meta/main.yml` run first, subject to tag filtering and conditionals. See `role_dependencies` for more details.
- Any `tasks` defined in the play.
- Any handlers triggered by the roles or tasks.
- Any `post_tasks` defined in the play.
- Any handlers triggered by post_tasks.

> **Nota: If using tags with tasks in a role, be sure to also tag your pre_tasks, post_tasks, and role dependencies and pass those along as well, especially if the pre/post tasks and role dependencies are used for monitoring outage window control or load balancing. See `tags` for details on adding and using tags.**
>
> You can pass other keywords to the `roles` option:
>
> ``yaml
> ---
> - hosts: webservers
> roles:
> - common
> - role: foo_app_instance
> vars:
> dir: '/opt/a'
> app_port: 5000
> tags: typeA
> - role: foo_app_instance
> vars:
> dir: '/opt/b'
> app_port: 5001
> tags: typeB
>
> When you add a tag to the `role` option, Ansible applies the tag to ALL tasks within the role.
>
> .. note::
>
> Prior to `ansible-core` 2.15, `vars:` within the `roles:`` section of a playbook are added to the play variables, making them available to all tasks within the play before and after the role. This behavior can be changed by `DEFAULT_PRIVATE_ROLE_VARS`. On more recent versions, `vars:` do not leak into the play's variable scope.
>
> ## Including roles: dynamic reuse
>
> You can reuse roles dynamically anywhere in the `tasks` section of a play using `include_role`. While roles added in a `roles` section run before any other tasks in a play, included roles run in the order they are defined. If there are other tasks before an `include_role` task, the other tasks will run first.
>
> To include a role:
>
> ``yaml
> ---
> - hosts: webservers
> tasks:
> - name: Print a message
> ansible.builtin.debug:
> msg: "this task runs before the example role"
>
> - name: Include the example role
> include_role:
> name: example
>
> - name: Print a message
> ansible.builtin.debug:
> msg: "this task runs after the example role"
>
> You can pass other keywords, including variables and tags, when including roles:
>
> ``yaml
> ---
> - hosts: webservers
> tasks:
> - name: Include the foo_app_instance role
> include_role:
> name: foo_app_instance
> vars:
> dir: '/opt/a'
> app_port: 5000
> tags: typeA
> # ...
>
> When you add a `tag ` to an `include_role` task, Ansible applies the tag **only** to the include itself. This means you can pass `--tags` to run only selected tasks from the role, if those tasks themselves have the same tag as the include statement. See `selective_reuse` for details.
>
> You can conditionally include a role:
>
> ``yaml
> ---
> - hosts: webservers
> tasks:
> - name: Include the some_role role
> include_role:
> name: some_role
> when: "ansible_facts['os_family'] == 'RedHat'"
>
> ## Importing roles: static reuse
>
> You can reuse roles statically anywhere in the `tasks` section of a play using `import_role`. The behavior is the same as using the `roles` keyword. For example:
>
> ``yaml
> ---
> - hosts: webservers
> tasks:
> - name: Print a message
> ansible.builtin.debug:
> msg: "before we run our role"
>
> - name: Import the example role
> import_role:
> name: example
>
> - name: Print a message
> ansible.builtin.debug:
> msg: "after we ran our role"
>
> You can pass other keywords, including variables and tags when importing roles:
>
> ``yaml
> ---
> - hosts: webservers
> tasks:
> - name: Import the foo_app_instance role
> import_role:
> name: foo_app_instance
> vars:
> dir: '/opt/a'
> app_port: 5000
> # ...
>
> When you add a tag to an `import_role`` statement, Ansible applies the tag to **all** tasks within the role. See `tag_inheritance` for details.
>
>
> # Role argument validation
>
> Beginning with version 2.11, you may choose to enable role argument validation based on an argument
>
specification. This specification is defined in the `meta/argument_specs.yml` file (or with the `.yaml`
file extension). When this argument specification is defined, a new task is inserted at the beginning of role execution
that will validate the parameters supplied for the role against the specification. If the parameters fail
validation, the role will fail execution.

> **Nota: Ansible also supports role specifications defined in the role `meta/main.yml` file, as well. However,**
> any role that defines the specs within this file will not work on versions below 2.11. For this reason,
> we recommend using the `meta/argument_specs.yml` file to maintain backward compatibility.
>
> .. note::
>
> When role argument validation is used on a role that has defined `dependencies `,
> then validation on those dependencies will run before the dependent role, even if argument validation fails
> for the dependent role.
>
> .. note::
>
> Ansible tags the inserted role argument validation task with `always `.
> If the role is `statically imported ` this task runs unless you use the `--skip-tags` flag.
>
> ## Specification format
>
> The role argument specification must be defined in a top-level `argument_specs` block within the
>
role `meta/argument_specs.yml` file. All fields are lowercase.

:entry-point-name:

    * The name of the role entry point.
    * This should be `main` in the case of an unspecified entry point.
    * This will be the base name of the tasks file to execute, with no `.yml` or `.yaml` file extension.

    :short_description:

        * A short, one-line description of the entry point. Ideally, it is a phrase and not a sentence.
        * The `short_description` is displayed by `ansible-doc -t role -l`.
        * It also becomes part of the title for the role page in the documentation.
        * The short description should always be a string and never a list, and should not end in a period.
        * You can use `Ansible markup ` in this field.

    :description:

        * A longer description that may contain multiple lines.
        * This can be a single string or a list of strings. In case this is a list of strings, every list
           element is a new paragraph.
        * You can use `Ansible markup ` in this field.

    :version_added:

        * The version of the role when the entrypoint was added.
        * This is a string, and not a float, for example, `version_added: '2.1'`.
        * In collections, this must be the collection version the entrypoint was added to. For example, `version_added: 1.0.0`.

    :author:

        * Name of the entry point authors.
        * This can be a single string or a list of strings. Use one list entry per author.
          If there is only a single author, use a string or a one-element list.

    :options:

        * Options are often called "parameters" or "arguments". This section defines those options.
        * For each role option (argument), you may include:

        :option-name:

            * The name of the option/argument.

        :description:

            * Detailed explanation of what this option does. It should be written in full sentences.
            * This can be a single string or a list of strings. In case this is a list of strings, every list
              element is a new paragraph.
            * You can use `Ansible markup ` in this field.

        :version_added:

            * Only needed if this option was added after the initial role/entry point release. In other words, this is greater than the top level `version_added` field.
            * This is a string, and not a float, for example, `version_added: '2.1'`.
            * In collections, this must be the collection version the option was added to. For example, `version_added: 1.0.0`.

        :type:

            * The data type of the option. See `Argument spec ` for allowed values for `type`. The default is `str`.
            * If an option is of type `list`, `elements` should be specified.

        :required:

            * Only needed if `true`.
            * If missing, the option is not required.

        :default:

            * If `required` is `false`/missing, `default` may be specified (assumed `null` if missing).
            * Ensure that the default value in the docs matches the default value in the code. The actual
              default for the role variable will always come from the role defaults (as defined in `Role directory structure `).
            * The default field must not be listed as part of the description unless it requires additional information or conditions.
            * If the option is a boolean value, you should use `true`/`false` if you want to be compatible with `ansible-lint`.

        :choices:

            * List of option values.
            * Should be absent if empty.

        :elements:

            * Specifies the data type for list elements when the type is `list`.

        :options:

            * If this option takes a dict or list of dicts, you can define the structure here.

## Sample specification

``yaml
  # roles/myapp/meta/argument_specs.yml
  argument_specs:
    # roles/myapp/tasks/main.yml entry point
    main:
      short_description: Main entry point for the myapp role
      description:
        - This is the main entrypoint for the C(myapp) role.
        - Here we can describe what this entrypoint does in lengthy words.
        - Every new list item is a new paragraph. You can have multiple sentences
          per paragraph.
      author:
        - Daniel Ziegenberg
      options:
        myapp_int:
          type: "int"
          required: false
          default: 42
          description:
            - "The integer value, defaulting to 42."
            - "This is a second paragraph."

        myapp_str:
          type: "str"
          required: true
          description: "The string value"

        myapp_list:
          type: "list"
          elements: "str"
          required: true
          description: "A list of string values."
          version_added: 1.3.0

        myapp_list_with_dicts:
          type: "list"
          elements: "dict"
          required: false
          default:
            - myapp_food_kind: "meat"
              myapp_food_boiling_required: true
              myapp_food_preparation_time: 60
            - myapp_food_kind: "fruits"
              myapp_food_preparation_time: 5
          description: "A list of dicts with a defined structure and with default a value."
          options:
            myapp_food_kind:
              type: "str"
              choices:
                - "vegetables"
                - "fruits"
                - "grains"
                - "meat"
              required: false
              description: "A string value with a limited list of allowed choices."

            myapp_food_boiling_required:
              type: "bool"
              required: false
              default: false
              description: "Whether the kind of food requires boiling before consumption."

            myapp_food_preparation_time:
              type: int
              required: true
              description: "Time to prepare a dish in minutes."

        myapp_dict_with_suboptions:
          type: "dict"
          required: false
          default:
            myapp_host: "bar.foo"
            myapp_exclude_host: true
            myapp_path: "/etc/myapp"
          description: "A dict with a defined structure and default values."
          options:
            myapp_host:
              type: "str"
              choices:
                - "foo.bar"
                - "bar.foo"
                - "ansible.foo.bar"
              required: true
              description: "A string value with a limited list of allowed choices."

            myapp_exclude_host:
              type: "bool"
              required: true
              description: "A boolean value."

            myapp_path:
              type: "path"
              required: true
              description: "A path value."

            original_name:
              type: list
              elements: "str"
              required: false
              description: "An optional list of string values."

    # roles/myapp/tasks/alternate.yml entry point
    alternate:
      short_description: Alternate entry point for the myapp role
      description:
        - This is the alternate entrypoint for the C(myapp) role.
      version_added: 1.2.0
      options:
        myapp_int:
          type: "int"
          required: false
          default: 1024
          description: "The integer value, defaulting to 1024."

# Running a role multiple times in one play

Ansible only executes each role once in a play, even if you define it multiple times unless the parameters defined on the role are different for each definition. For example, Ansible only runs the role `foo` once in a play like this:

``yaml
    - hosts: webservers
      roles:
        - foo
        - bar
        - foo

You have two options to force Ansible to run a role more than once.

## Passing different parameters

If you pass different parameters in each role definition, Ansible runs the role more than once. Providing different variable values is not the same as passing different role parameters. You must use the `roles` keyword for this behavior, since `import_role` and `include_role` do not accept role parameters.

This play runs the `foo` role twice:

``yaml
    - hosts: webservers
      roles:
        - { role: foo, message: "first" }
        - { role: foo, message: "second" }

This syntax also runs the `foo` role twice;

``yaml
    - hosts: webservers
      roles:
        - role: foo
          message: "first"
        - role: foo
          message: "second"

In these examples, Ansible runs `foo` twice because each role definition has different parameters.

## Using `allow_duplicates: true`

Add `allow_duplicates: true` to the `meta/main.yml` file for the role:

``yaml
    # playbook.yml
    - hosts: webservers
      roles:
        - foo
        - foo

    # roles/foo/meta/main.yml
    allow_duplicates: true

In this example, Ansible runs `foo` twice because we have explicitly enabled it to do so.

# Using role dependencies

Role dependencies let you automatically pull in other roles when using a role.

Role dependencies are prerequisites, not true dependencies. The roles do not have a parent/child relationship. Ansible loads all listed roles, runs the roles listed under `dependencies` first, then runs the role that lists them. The play object is the parent of all roles, including roles called by a `dependencies` list.

Role dependencies are stored in the `meta/main.yml` file within the role directory. This file should contain a list of roles and parameters to insert before the specified role. For example:

``yaml
    # roles/myapp/meta/main.yml
    dependencies:
      - role: common
        vars:
          some_parameter: 3
      - role: apache
        vars:
          apache_port: 80
      - role: postgres
        vars:
          dbname: blarg
          other_parameter: 12

Ansible always executes roles listed in `dependencies` before the role that lists them. Ansible executes this pattern recursively when you use the `roles` keyword. For example, if you list role `foo` under `roles:`, role `foo` lists role `bar` under `dependencies` in its meta/main.yml file, and role `bar` lists role `baz` under `dependencies` in its meta/main.yml, Ansible executes `baz`, then `bar`, then `foo`.

## Running role dependencies multiple times in one play

Ansible treats duplicate role dependencies like duplicate roles listed under `roles:`: Ansible only executes role dependencies once, even if defined multiple times, unless the parameters, tags, or when clause defined on the role are different for each definition. If two roles in a play both list a third role as a dependency, Ansible only runs that role dependency once, unless you pass different parameters, tags, when clause, or use `allow_duplicates: true` in the role you want to run multiple times. See `Galaxy role dependencies ` for more details.

> **Nota: Role deduplication does not consult the invocation signature of parent roles. Additionally, when using `vars:` instead of role params, there is a side effect of changing variable scoping. Using `vars:` results in those variables being scoped at the play level. In the below example, using `vars:` would cause `n` to be defined as `4` throughout the entire play, including roles called before it.**
>
> In addition to the above, users should be aware that role de-duplication occurs before variable evaluation. This means that :term:`Lazy Evaluation` may make seemingly different role invocations equivalently the same, preventing the role from running more than once.
>
>
> For example, a role named `car` depends on a role named `wheel` as follows:
>
> ``yaml
> ---
> dependencies:
> - role: wheel
> n: 1
> - role: wheel
> n: 2
> - role: wheel
> n: 3
> - role: wheel
> n: 4
>
> And the `wheel` role depends on two roles: `tire` and `brake`. The `meta/main.yml` for wheel would then contain the following:
>
> ``yaml
> ---
> dependencies:
> - role: tire
> - role: brake
>
> And the `meta/main.yml` for `tire` and `brake` would contain the following:
>
> ``yaml
> ---
> allow_duplicates: true
>
> The resulting order of execution would be as follows:
>
> ``text
> tire(n=1)
> brake(n=1)
> wheel(n=1)
> tire(n=2)
> brake(n=2)
> wheel(n=2)
> ...
> car
>
> To use `allow_duplicates: true` with role dependencies, you must specify it for the role listed under `dependencies`, not for the role that lists it. In the example above, `allow_duplicates: true` appears in the `meta/main.yml` of the `tire` and `brake` roles. The `wheel` role does not require `allow_duplicates: true`, because each instance defined by `car` uses different parameter values.
>
> .. note::
> See `playbooks_variables` for details on how Ansible chooses among variable values defined in different places (variable inheritance and scope).
> Also, deduplication happens ONLY at the play level, so multiple plays in the same playbook may rerun the roles.
>
>
> # Embedding modules and plugins in roles
>
> .. note::
> This applies only to standalone roles. Roles in collections do not support plugin embedding; they must use the collection's `plugins` structure to distribute plugins.
>
> If you write a custom module (see `developing_modules`) or a plugin (see `developing_plugins`), you might wish to distribute it as part of a role. For example, if you write a module that helps configure your company's internal software, and you want other people in your organization to use this module, but do not want to tell everyone how to configure their Ansible library path, you can include the module in your internal_config role.
>
> To add a module or a plugin to a role:
>
Alongside the 'tasks' and 'handlers' structure of a role, add a directory named 'library' and then include the module directly inside the 'library' directory.

Assuming you had this:

``text
    roles/
        my_custom_modules/
            library/
                module1
                module2

The module will be usable in the role itself, as well as any roles that are called *after* this role, as follows:

``yaml
    - hosts: webservers
      roles:
        - my_custom_modules
        - some_other_role_using_my_custom_modules
        - yet_another_role_using_my_custom_modules

If necessary, you can also embed a module in a role to modify a module in Ansible's core distribution. For example, you can use the development version of a particular module before it is released in production releases by copying the module and embedding the copy in a role. Use this approach with caution, as API signatures may change in core components, and this workaround is not guaranteed to work.

The same mechanism can be used to embed and distribute plugins in a role, using the same schema. For example, for a filter plugin:

```text
    roles/
        my_custom_filter/
            filter_plugins
                filter1
                filter2

These filters can then be used in a Jinja template in any role called after 'my_custom_filter'.

# Sharing roles: Ansible Galaxy

`Ansible Galaxy <https://galaxy.ansible.com>`_ is a free site for finding, downloading, rating, and reviewing all kinds of community-developed Ansible roles and can be a great way to get a jumpstart on your automation projects.

The client `ansible-galaxy` is included in Ansible. The Galaxy client allows you to download roles from Ansible Galaxy and provides an excellent default framework for creating your own roles.

Read the `Ansible Galaxy documentation <https://ansible.readthedocs.io/projects/galaxy-ng/en/latest/>`_ page for more information.

---

## playbooks_reuse

### Reusing Ansible artifacts

You can write a simple playbook in one very large file, and most users learn the one-file approach first. However, breaking your automation work up into smaller files is an excellent way to organize complex sets of tasks and reuse them. Smaller, more distributed artifacts let you reuse the same variables, tasks, and plays in multiple playbooks to address different use cases. You can use distributed artifacts across multiple parent playbooks or even multiple times within one playbook. For example, you might want to update your customer database as part of several different playbooks. If you put all the tasks related to updating your database in a tasks file or a role, you can reuse them in many playbooks while only maintaining them in one place.

# Creating reusable files and roles

Ansible offers four distributed, reusable artifacts: variables files, task files, playbooks, and roles.

  - A variables file contains only variables.
  - A task file contains only tasks.
  - A playbook contains at least one play, and may contain variables, tasks, and other content. You can reuse tightly focused playbooks, but you can only reuse them statically, not dynamically.
  - A role contains a set of related tasks, variables, defaults, handlers, and even modules or other plugins in a defined file-tree. Unlike variables files, task files, or playbooks, roles can be easily uploaded and shared through Ansible Galaxy. See `playbooks_reuse_roles` for details about creating and using roles.

> **Adicionado na versão: 2.4**
>
> # Reusing playbooks
>
> You can incorporate multiple playbooks into a main playbook. However, you can only use imports to reuse playbooks. For example:
>
> ``yaml
> - import_playbook: webservers.yml
> - import_playbook: databases.yml
>
> Importing incorporates playbooks in other playbooks statically. Ansible runs the plays and tasks in each imported playbook in the order they are listed, just as if they had been defined directly in the main playbook.
>
> You can select which playbook you want to import at runtime by defining your imported playbook file name with a variable, then passing the variable with either `--extra-vars` or the `vars` keyword. For example:
>
> ``yaml
> - import_playbook: "/path/to/{{ import_from_extra_var }}"
> - import_playbook: "{{ import_from_vars }}"
> vars:
> import_from_vars: /path/to/one_playbook.yml
>
> If you run this playbook with `ansible-playbook my_playbook -e import_from_extra_var=other_playbook.yml`, Ansible imports both one_playbook.yml and other_playbook.yml.
>
> # When to turn a playbook into a role
>
> For some use cases, simple playbooks work well. However, starting at a certain level of complexity, roles work better than playbooks. A role lets you store your defaults, handlers, variables, and tasks in separate directories, instead of in a single long document. Roles are easy to share on Ansible Galaxy. For complex use cases, most users find roles easier to read, understand, and maintain than all-in-one playbooks.
>
> # Reusing files and roles
>
> Ansible offers two ways to reuse files and roles in a playbook: dynamic and static.
>
> - For dynamic reuse, add an `include_*` task in the tasks section of a play:
>
> - `include_role `
> - `include_tasks `
> - `include_vars `
>
> - For static reuse, add an `import_*` task in the tasks section of a play:
>
> - `import_role `
> - `import_tasks `
>
> Task include and import statements can be used at arbitrary depth.
>
> You can still use the bare `roles ` keyword at the play level to incorporate a role in a playbook statically. However, the bare `include ` keyword, once used for both task files and playbook-level includes, is now deprecated.
>
> ## Includes: dynamic reuse
>
> Including roles, tasks, or variables adds them to a playbook dynamically. Ansible processes included files and roles as they come up in a playbook, so included tasks can be affected by the results of earlier tasks within the top-level playbook. Included roles and tasks are similar to handlers - they may or may not run, depending on the results of other tasks in the top-level playbook.
>
> The primary advantage of using `include_*` statements is looping. When a loop is used with an include, the included tasks or roles will be executed once for each item in the loop.
>
> The file names for included roles, tasks, and vars are templated before inclusion.
>
> You can pass variables into includes. See `ansible_variable_precedence` for more details on variable inheritance and precedence.
>
> ## Imports: static reuse
>
> Importing roles, tasks, or playbooks adds them to a playbook statically. Ansible pre-processes imported files and roles before it runs any tasks in a playbook, so imported content is never affected by other tasks within the top-level playbook.
>
> The file names for imported roles and tasks support templating, but the variables must be available when Ansible is pre-processing the imports. This can be done with the `vars` keyword or by using `--extra-vars`.
>
> You can pass variables to imports. You must pass variables if you want to run an imported file more than once in a playbook. For example:
>
> ```yaml
> tasks:
> - import_tasks: wordpress.yml
> vars:
> wp_user: timmy
>
> - import_tasks: wordpress.yml
> vars:
> wp_user: alice
>
> - import_tasks: wordpress.yml
> vars:
> wp_user: bob
>
> See `ansible_variable_precedence` for more details on variable inheritance and precedence.
>
>
> ## Comparing includes and imports: dynamic and static reuse
>
> Each approach to reusing distributed Ansible artifacts has advantages and limitations. You may choose dynamic reuse for some playbooks and static reuse for others. Although you can use both dynamic and static reuse in a single playbook, it is best to select one approach per playbook. Mixing static and dynamic reuse can introduce difficult-to-diagnose bugs into your playbooks. This table summarizes the main differences so you can choose the best approach for each playbook you create.
>
> .. table::
> :class: documentation-table
>
> ========================= ======================================== ========================================
> ..                        Include_*                                Import_*
> ========================= ======================================== ========================================
> Type of reuse             Dynamic                                  Static
>
> When processed            At runtime, when encountered             Pre-processed during playbook parsing
>
> Task or play              All includes are tasks                   `import_playbook` cannot be a task
>
> Task options              Apply only to include task itself        Apply to all child tasks in import
>
> Calling from loops        Executed once for each loop item         Cannot be used in a loop
>
> Using `--list-tags`     Tags within includes not listed          All tags appear with `--list-tags`
>
> Using `--list-tasks`    Tasks within includes not listed         All tasks appear with `--list-tasks`
>
> Notifying handlers        Cannot trigger handlers within includes  Can trigger individual imported handlers
>
> Using `--start-at-task` Cannot start at tasks within includes    Can start at imported tasks
>
> Using inventory variables Can `include_*: {{ inventory_var }}`   Cannot `import_*: {{ inventory_var }}`
>
> With playbooks            No `include_playbook`                  Can import full playbooks
>
> With variables files      Can include variables files              Use `vars_files:` to import variables
>
> ========================= ======================================== ========================================
>
>
> > **Nota: * There are also big differences in resource consumption and performance, imports are quite lean and fast, while includes require a lot of management**
>
> and accounting.
>
> # Reusing tasks as handlers
>
> You can also use includes and imports in the `handlers` section of a playbook. For example, if you want to define how to restart Apache, you only have to do that once for all of your playbooks. You might make a `restarts.yml` file that looks like:
>
> ``yaml
> # restarts.yml
> - name: Restart apache
> ansible.builtin.service:
> name: apache
> state: restarted
>
> - name: Restart mysql
> ansible.builtin.service:
> name: mysql
> state: restarted
>
> You can trigger handlers from either an import or an include, but the procedure is different for each method of reuse. If you include the file, you must notify the include itself, which triggers all the tasks in `restarts.yml`. If you import the file, you must notify the individual task(s) within `restarts.yml`. You can mix direct tasks and handlers with included or imported tasks and handlers.
>
> ## Triggering included (dynamic) handlers
>
> Includes are executed at run-time, so the name of the include exists during play execution, but the included tasks do not exist until the include itself is triggered. To use the `Restart apache` task with dynamic reuse, refer to the name of the include itself. This approach triggers all tasks in the included file as handlers. For example, with the task file shown above:
>
> ``yaml
> - name: Trigger an included (dynamic) handler
> hosts: localhost
> handlers:
> - name: Restart services
> include_tasks: restarts.yml
> tasks:
> - command: "true"
> notify: Restart services
>
> ## Triggering imported (static) handlers
>
> Imports are processed before the play begins, so the name of the import no longer exists during play execution, but the names of the individual imported tasks do exist. To use the `Restart apache` task with static reuse, refer to the name of each task or tasks within the imported file. For example, with the task file shown above:
>
> ```yaml
> - name: Trigger an imported (static) handler
> hosts: localhost
> handlers:
> - name: Restart services
> import_tasks: restarts.yml
> tasks:
> - command: "true"
> notify: Restart apache
> - command: "true"
> notify: Restart mysql
>

---

## playbooks_strategies

# Controlling playbook execution: strategies and more

By default, Ansible runs each task on all hosts affected by a play before starting the next task on any host, using 5 forks. If you want to change this default behavior, you can use a different strategy plugin, change the number of forks, or apply one of several keywords like `serial`.

## Selecting a strategy
The default behavior described above is the `linear strategy`. Ansible offers other strategies, including the `debug strategy` (see also  `playbook_debugger`) and the `free strategy`, which allows each host to run until the end of the play as fast as it can:

``yaml
    - hosts: all
      strategy: free
      tasks:
      # ...

You can select a different strategy for each play as shown above, or set your preferred strategy globally in `ansible.cfg`, under the `defaults` stanza:

``ini
    [defaults]
    strategy = free

All strategies are implemented as `strategy plugins`. Please review the documentation for each strategy plugin for details on how it works.

## Setting the number of forks
If you have the processing power available and want to use more forks, you can set the number in `ansible.cfg`:

```ini
    [defaults]
    forks = 30

or pass it on the command line: `ansible-playbook -f 30 my_playbook.yml`.

## Using keywords to control execution

In addition to strategies, several `keywords` also affect play execution. You can set a number, a percentage, or a list of numbers of hosts you want to manage at a time with `serial`. Ansible completes the play on the specified number or percentage of hosts before starting the next batch of hosts. You can restrict the number of workers allotted to a block or task with `throttle`. You can control how Ansible selects the next host in a group to execute against with `order`. You can run a task on a single host with `run_once`. These keywords are not strategies. They are directives or options applied to a play, block, or task.

Other keywords that affect play execution include `ignore_errors`, `ignore_unreachable`, and `any_errors_fatal`. These options are documented in `playbooks_error_handling`.

#### Setting the batch size with `serial`

By default, Ansible runs in parallel against all the hosts in the `pattern ` you set in the `hosts:` field of each play. If you want to manage only a few machines at a time, for example during a rolling update, you can define how many hosts Ansible should manage at a single time using the `serial` keyword:

``yaml
    - name: test play
      hosts: webservers
      serial: 3
      gather_facts: False

      tasks:
        - name: first task
          command: hostname
        - name: second task
          command: hostname

In the above example, if we had 6 hosts in the group 'webservers', Ansible would execute the play completely (both tasks) on 3 of the hosts before moving on to the next 3 hosts:

    PLAY [webservers] ***********************************************************************

    TASK [first task] ***********************************************************************
    changed: [web1]
    changed: [web3]
    changed: [web2]

    TASK [second task] **********************************************************************
    changed: [web1]
    changed: [web2]
    changed: [web3]

    PLAY [webservers] ***********************************************************************

    TASK [first task] ***********************************************************************
    changed: [web4]
    changed: [web5]
    changed: [web6]

    TASK [second task] **********************************************************************
    changed: [web4]
    changed: [web5]
    changed: [web6]

    PLAY RECAP ******************************************************************************
    web1                       : ok=2    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
    web2                       : ok=2    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
    web3                       : ok=2    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
    web4                       : ok=2    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
    web5                       : ok=2    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
    web6                       : ok=2    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0

> **Nota: Setting the batch size with `serial`` changes the scope of the Ansible failures to the batch size, not the entire host list. You can use  `ignore_unreachable ` or `max_fail_percentage ` to modify this behavior.**
>
> You can also specify a percentage with the `serial` keyword. Ansible applies the percentage to the total number of hosts in a play to determine the number of hosts per pass:
>
> ``yaml
> ---
> - name: test play
> hosts: webservers
> serial: "30%"
>
> If the number of hosts does not divide equally into the number of passes, the final pass contains the remainder. In this example, if you had 20 hosts in the webservers group, the first batch would contain 6 hosts, the second batch would contain 6 hosts, the third batch would contain 6 hosts, and the last batch would contain 2 hosts.
>
> You can also specify batch sizes as a list. For example:
>
> ``yaml
> ---
> - name: test play
> hosts: webservers
> serial:
> - 1
> - 5
> - 10
>
> In the above example, the first batch would contain a single host, the next would contain 5 hosts, and (if there are any hosts left), every following batch would contain either 10 hosts or all the remaining hosts, if fewer than 10 hosts remained.
>
> You can list multiple batch sizes as percentages:
>
> ``yaml
> ---
> - name: test play
> hosts: webservers
> serial:
> - "10%"
> - "20%"
> - "100%"
>
> You can also mix and match the values:
>
> ``yaml
> ---
> - name: test play
> hosts: webservers
> serial:
> - 1
> - 5
> - "20%"
>
> .. note::
> No matter how small the percentage, the number of hosts per pass will always be 1 or greater.
>
> #### Restricting execution with `throttle`
>
> The `throttle` keyword limits the number of workers for a particular task. It can be set at the block and task level. Use `throttle` to restrict tasks that may be CPU-intensive or interact with a rate-limiting API:
>
> ``yaml
> tasks:
> - command: /path/to/cpu_intensive_command
> throttle: 1
>
> If you have already restricted the number of forks or the number of machines to execute against in parallel, you can reduce the number of workers with `throttle`, but you cannot increase it. In other words, to have an effect, your `throttle` setting must be lower than your `forks` or `serial` setting if you are using them together.
>
> #### Ordering execution based on inventory
>
> The `order` keyword controls the order in which hosts are run. Possible values for order are:
>
> inventory:
> (default) The order provided by the inventory for the selection requested (see note below)
>
reverse_inventory:
    The same as above, but reversing the returned list
sorted:
    Sorted alphabetically sorted by name
reverse_sorted:
    Sorted by name in reverse alphabetical order
shuffle:
    Randomly ordered on each run

> **Nota: the 'inventory' order does not equate to the order in which hosts/groups are defined in the inventory source file, but the 'order in which a selection is returned from the compiled inventory'. This is a backwards compatible option and while reproducible it is not normally predictable. Due to the nature of inventory, host patterns, limits, inventory plugins and the ability to allow multiple sources, it is almost impossible to return such an order. For simple cases, this might happen to match the file definition order, but that is not guaranteed.**
>
>
> #### Running on a single machine with `run_once`
>
> If you want a task to run only on the first host in your batch of hosts, set `run_once` to true on that task:
>
> ``yaml
> ---
> # ...
>
> tasks:
>
> # ...
>
> - command: /opt/application/upgrade_db.py
> run_once: true
>
> # ...
>
> Ansible executes this task on the first host in the current batch and applies all results and facts to all the hosts in the same batch. This approach is similar to applying a conditional to a task such as:
>
> ``yaml
> - command: /opt/application/upgrade_db.py
> when: inventory_hostname == webservers[0]
>
> However, with `run_once`, the results are applied to all the hosts. To run the task on a specific host, instead of the first host in the batch, delegate the task:
>
> ``yaml
> - command: /opt/application/upgrade_db.py
> run_once: true
> delegate_to: web01.example.org
>
> As always with `delegation `, the action will be executed on the delegated host, but the information is still that of the original host in the task.
>
> .. note::
> When used together with `serial`, tasks marked as `run_once` will be run on one host in *each* serial batch. If the task must run only once regardless of `serial` mode, use
> :code:`when: inventory_hostname == ansible_play_hosts_all[0]` construct.
>
> .. note::
> Any conditional (in other words, `when:`) will use the variables of the 'first host' to decide if the task runs or not, no other hosts will be tested.
>
> .. note::
> If you want to avoid the default behavior of setting the fact for all hosts, set `delegate_facts: True` for the specific task or block.
>