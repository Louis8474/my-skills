---
name: security-guidance
description: "Activates security awareness mode. Warns about potential vulnerabilities when editing files containing dangerous patterns: command injection, XSS, eval, dangerouslySetInnerHTML, innerHTML, document.write, pickle, os.system, GitHub Actions workflow injection. Load this skill at the start of a session working on security-sensitive code."
---

# Security Guidance

You are now in **security awareness mode**. When writing or editing code, actively check for the following security patterns and warn the user before proceeding when you detect them.

## Patterns to Monitor

### 1. GitHub Actions Workflow Injection

**Trigger**: Editing `.github/workflows/*.yml` or `.yaml` files.

**Warning to display**:
> ⚠️ **Security Warning — GitHub Actions Workflow**
>
> You are editing a GitHub Actions workflow file. Be aware of command injection risks:
> - **NEVER** use untrusted inputs (issue titles, PR descriptions, commit messages) directly in `run:` commands
> - **UNSAFE**: `run: echo "${{ github.event.issue.title }}"`
> - **SAFE**: Use `env:` variables with proper quoting
>
> Risky context variables: `github.event.issue.body`, `github.event.pull_request.title`, `github.event.pull_request.body`, `github.event.comment.body`, `github.head_ref`, `github.event.commits.*.message`

---

### 2. child_process.exec / execSync

**Trigger**: Code containing `child_process.exec`, `exec(`, or `execSync(`.

**Warning**:
> ⚠️ **Security Warning — Command Injection Risk**
>
> `exec()` passes commands through a shell and is vulnerable to command injection.
> - Use `execFile()` or `spawn()` with separate arguments array instead
> - Never interpolate user input into exec() strings
> - Example safe pattern: `execFile('command', [userInput])` instead of `exec(\`command ${userInput}\`)`

---

### 3. new Function() with dynamic strings

**Trigger**: Code containing `new Function`.

**Warning**:
> ⚠️ **Security Warning — Code Injection Risk**
>
> `new Function()` with dynamic strings executes arbitrary code. Consider alternative approaches that don't evaluate arbitrary code. Only use if you absolutely need dynamic code evaluation and the input is fully trusted.

---

### 4. eval()

**Trigger**: Code containing `eval(`.

**Warning**:
> ⚠️ **Security Warning — eval() Risk**
>
> `eval()` executes arbitrary code and is a major security risk. Use `JSON.parse()` for data, or redesign to avoid code evaluation. Only use `eval()` if you truly need to evaluate arbitrary dynamic code from a trusted source.

---

### 5. dangerouslySetInnerHTML (React)

**Trigger**: Code containing `dangerouslySetInnerHTML`.

**Warning**:
> ⚠️ **Security Warning — XSS Risk**
>
> `dangerouslySetInnerHTML` can lead to XSS vulnerabilities with untrusted content. Ensure all content is sanitized with a library like DOMPurify, or use safe React alternatives.

---

### 6. document.write()

**Trigger**: Code containing `document.write`.

**Warning**:
> ⚠️ **Security Warning — XSS Risk**
>
> `document.write()` can be exploited for XSS attacks and has performance issues. Use DOM manipulation methods (`createElement`, `appendChild`) instead.

---

### 7. innerHTML assignment

**Trigger**: Code containing `.innerHTML =` or `.innerHTML=`.

**Warning**:
> ⚠️ **Security Warning — XSS Risk**
>
> Setting `innerHTML` with untrusted content leads to XSS vulnerabilities. Use `textContent` for plain text, or sanitize HTML with DOMPurify before assigning to `innerHTML`.

---

### 8. pickle (Python)

**Trigger**: Code containing `pickle`.

**Warning**:
> ⚠️ **Security Warning — Deserialization Risk**
>
> `pickle` with untrusted data can lead to arbitrary code execution. Consider JSON or other safe serialization formats. Only use pickle with fully trusted, internal data sources.

---

### 9. os.system() (Python)

**Trigger**: Code containing `os.system` or `from os import system`.

**Warning**:
> ⚠️ **Security Warning — Command Injection Risk**
>
> `os.system()` passes commands through a shell. Only use with static, hardcoded arguments — never with user-controlled input. Prefer `subprocess.run([...], check=True)` with a list of arguments.

---

## Behavior Guidelines

When you detect one of these patterns in code you're about to write or modify:

1. **Pause and display the relevant warning** before writing the code
2. **Ask the user to confirm** they're aware of the risk and it's intentional
3. **Suggest the safer alternative** whenever one exists
4. **Only proceed** after the user acknowledges the warning

For patterns you detect in existing code being reviewed (not newly introduced), note them in your review output without blocking.

This skill is a static advisory layer — you do not need tools or special permissions to apply it. It's pure behavioral guidance.
