# scry

https://dev.to/devteam/join-the-github-copilot-cli-challenge-win-github-universe-tickets-copilot-pro-subscriptions-and-50af

> A security-focused CLI that reveals hidden risks in JavaScript and Node.js codebases.

---

## What is scry?

**scry** is a command-line tool that scans JavaScript / Node.js projects for **common but dangerous security mistakes** and explains:

- **What was found**
- **Why it is risky**
- **How to fix it**

The goal is not just to flag issues, but to **teach developers to think more securely** while writing code.

In fantasy, _to scry_ means to reveal hidden truths.  
`scry` applies the same idea to code.

---

## Why scry exists

Modern developers ship code fast — often faster than they can think about security.

While powerful tools like linters and vulnerability scanners exist, many:

- Focus on rules without context
- Assume prior security knowledge
- Feel overwhelming for smaller projects

`scry` is intentionally different:

- Opinionated, not exhaustive
- Educational, not noisy
- Focused on **real-world security footguns**

It is designed to help developers **catch mistakes early** and **understand why they matter**.

---

## What scry checks for (initial rules)

`scry` scans source files and detects patterns such as:

- Hardcoded secrets (API keys, tokens, passwords)
- Insecure JWT storage (e.g. `localStorage`)
- Missing secure cookie flags (`httpOnly`, `secure`, `sameSite`)
- Dangerous use of `eval()`
- Weak password handling patterns
- Exposed or mismanaged `.env` usage
- Overly permissive CORS configurations

Each finding includes:

- Severity level
- File and line reference
- Explanation of risk
- Suggested fix

---

## Example usage

```bash
scry scan .
scry scan ./api
scry scan . --strict

## Example output

[HIGH] Hardcoded Secret
File: src/config.ts:14

Why this is dangerous:
Hardcoded secrets can be leaked via source control or logs.

Suggested fix:
Move secrets to environment variables and access them using process.env.
```
