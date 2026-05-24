# Java Secure Coding Guidance

## Official-source basis

Oracle Secure Coding Guidelines for Java SE provides current Java-specific security guidance. Important themes include fundamentals, denial of service, confidential information, injection/inclusion, accessibility/extensibility, input validation, mutability, object construction, serialization/deserialization, and access control.

## Checklist

| Area | Check |
|---|---|
| Trust boundary | Identify where external users, services, files, config, or libraries cross into trusted code. |
| Input validation | Validate format, size, range, type, canonical form, and exceptional numeric values. |
| Injection | Avoid dynamic SQL, unsafe command lines, unsafe XML/HTML generation, and unsafe JNDI/XML handling. |
| DoS | Limit decompression, regex, XML expansion, image dimensions, collection sizes, and allocation sizes. |
| Sensitive data | Do not log secrets; sanitize exceptions crossing user boundaries. |
| Mutability | Avoid exposing mutable internals; make defensive copies. |
| Deserialization | Avoid untrusted deserialization; use filters and allowlists where unavoidable. |
| Accessibility | Minimize public/protected surface; restrict extension when contracts must hold. |
| Third-party code | Track updates and understand secure configuration. |

## Severity hint

- High: remote/untrusted input reaches execution, SQL, deserialization, XML external entities, or secret exposure.
- Medium: mutable exposure, weak validation, broad public surface, or missing resource limits.
- Low: documentation gaps or hardening improvements without immediate exploit path.
