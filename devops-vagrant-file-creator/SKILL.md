---
name: devops-vagrant-file-creator
description: Expert assistant for creating and optimizing Vagrantfile configurations. Uses a deep knowledge base of Vagrant providers, networking, and provisioning. Trigger this skill whenever the user talks about "vagrant", "Vagrantfile", "virtual machine", "provision vm", "dev environment", or "local server".
license: MIT
compatibility: Requires Vagrant >=2.3.0
---

# Vagrant File Creator

Generate production-ready `Vagrantfile` configurations using Ruby best practices and the comprehensive Vagrant knowledge base.

## Core Capabilities

- Generate `Vagrantfile` from scratch based on user requirements
- Validate and optimize existing Vagrantfiles
- Support multiple providers: VirtualBox (default), Docker, Hyper-V, VMware
- Configure networking: port forwarding, private/public networks, static IPs
- Add provisioners: Shell scripts, Ansible, Docker, Puppet, Chef
- Multi-machine setups for cluster environments
- Synced folders and shared directories

## Workflow

### 1. Analyze User Request

Check if the request contains sufficient detail:

- **Base OS/Box**: e.g., ubuntu/focal, bento/ubuntu-22.04, centos/stream8
- **Provider**: VirtualBox (default), docker, vmware_fusion, hyperv
- **Resources**: CPU cores, memory (MB), disk size
- **Networking**: Port forwarding, private network, public network
- **Provisioning**: Shell scripts, Ansible playbooks, Docker installation
- **Synced Folders**: Host-to-guest directory mapping

### 2. Clarify Ambiguities

If the request lacks details, use the `question` tool to ask:

1. **Base Box**: "Which base box would you like to use? (e.g., ubuntu/focal, bento/debian-11)"
2. **Provider**: "Which provider? (default: VirtualBox) - Options: docker, vmware_fusion, hyperv"
3. **Resources**: "How much memory (MB) and CPU cores? (default: 1024MB, 2 CPUs)"
4. **Networking**: "Do you need port forwarding or a private network?"
5. **Provisioning**: "Should I add any provisioners? (e.g., install Docker, run shell script)"

### 3. Consult Knowledge Base

Reference files in `reference/` directory:

- `vagrantfile/index.mdx` - Vagrantfile syntax and load order
- `providers/` - Provider-specific configurations
- `networking/` - Network configuration options
- `provisioning/` - Provisioner setups
- `synced-folders/` - Folder sharing options
- `multi-machine.mdx` - Multi-VM configurations

### 4. Generate Vagrantfile

Output a complete, well-commented `Vagrantfile` following this structure:

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  # Box configuration
  config.vm.box = "ubuntu/focal"

  # Provider-specific settings
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
    vb.cpus = 2
  end

  # Network configuration
  # config.vm.network "forwarded_port", guest: 80, host: 8080
  # config.vm.network "private_network", ip: "192.168.33.10"

  # Synced folders
  # config.vm.synced_folder "./data", "/vagrant_data"

  # Provisioning
  # config.vm.provision "shell", inline: <<-SHELL
  #   apt-get update
  #   apt-get install -y nginx
  # SHELL
end
```

## Templates

### Basic Ubuntu VM (Default)

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal"
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
    vb.cpus = 2
    vb.name = "dev-machine"
  end
end
```

### Docker Development Environment

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "hashicorp/bionic64"
  config.vm.provider "docker" do |d|
    d.image = "ubuntu:22.04"
    d.has_ssh = true
  end

  config.vm.provision "shell", inline: <<-SHELL
    apt-get update
    apt-get install -y docker.io docker-compose
  SHELL
end
```

### Multi-Machine Cluster

```ruby
Vagrant.configure("2") do |config|
  # Control plane
  config.vm.define "master" do |master|
    master.vm.box = "ubuntu/focal"
    master.vm.hostname = "master"
    master.vm.network "private_network", ip: "192.168.50.10"
    master.vm.provider "virtualbox" do |vb|
      vb.memory = "2048"
      vb.cpus = 2
    end
  end

  # Worker nodes
  (1..2).each do |i|
    config.vm.define "worker-#{i}" do |worker|
      worker.vm.box = "ubuntu/focal"
      worker.vm.hostname = "worker-#{i}"
      worker.vm.network "private_network", ip: "192.168.50.#{10 + i}"
      worker.vm.provider "virtualbox" do |vb|
        vb.memory = "1024"
        vb.cpus = 1
      end
    end
  end
end
```

## Best Practices

1. **Always use version control**: Vagrantfile should be committed to git
2. **Pin box versions**: Use `config.vm.box_version` for reproducibility
3. **Use private networks** for multi-machine setups
4. **Add meaningful VM names** via provider configuration
5. **Comment provisioners** explaining what they install
6. **Use external scripts** for complex provisioning via `path: "scripts/setup.sh"`

## Common Box Names

| OS | Box Name |
|----|----------|
| Ubuntu 22.04 | `ubuntu/jammy64` |
| Ubuntu 20.04 | `ubuntu/focal64` |
| Debian 11 | `debian/bullseye64` |
| CentOS Stream 9 | `centos/stream9` |
| Fedora 38 | `fedora/38-cloud-base` |

## Output Format

When generating a Vagrantfile:

1. Display the complete file content in a code block
2. Add usage instructions:
   - `vagrant up` - Start the VM
   - `vagrant ssh` - Connect to the VM
   - `vagrant halt` - Stop the VM
   - `vagrant destroy` - Delete the VM
3. Note any required plugins (e.g., `vagrant plugin install vagrant-docker`)
