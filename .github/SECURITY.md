# Security Policy

## GitHub Actions Security

This project follows security best practices for GitHub Actions workflows to prevent script injection and other vulnerabilities.

### Script Injection Prevention

**❌ Vulnerable Pattern:**
```yaml
- name: Example (UNSAFE)
  run: |
    echo "Branch: ${{ github.head_ref }}"
```

**Why it's unsafe:** An attacker could create a branch named `$(malicious command)` or `"; rm -rf /` which would be directly executed in the shell.

**✅ Secure Pattern:**
```yaml
- name: Example (SAFE)
  env:
    BRANCH_NAME: ${{ github.head_ref }}
  run: |
    echo "Branch: ${BRANCH_NAME}"
```

**Why it's safe:** The value is passed through an environment variable, so it's treated as data, not code.

### Security Measures Implemented

#### 1. Environment Variable Isolation

All untrusted inputs from GitHub context are passed through environment variables:

- `github.head_ref` → `env.PR_BRANCH`
- `github.base_ref` → `env.BASE_REF`
- `github.event.pull_request.title` → `env.PR_TITLE`
- `github.event.pull_request.user.login` → `env.PR_AUTHOR`
- `needs.*.result` → `env.*_RESULT`

**Files affected:**
- `.github/workflows/pr-checks.yml` (lines 19-28, 41-43)
- `.github/workflows/ci.yml` (lines 134-150)

#### 2. Proper Shell Quoting

All variable references in shell scripts use proper quoting:
```bash
# Correct usage
echo "Files changed: ${FILES_CHANGED}"
git diff "origin/${BASE_REF}...HEAD"
```

#### 3. Limited Workflow Permissions

Workflows use minimum required permissions:
```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write
```

#### 4. Pinned Action Versions

All actions use specific versions (not `@latest` or tags):
```yaml
uses: actions/checkout@v5
uses: actions/setup-node@v6
uses: pnpm/action-setup@v4
```

#### 5. Secure Secrets Handling

- API keys never logged or echoed
- Secrets only exposed to specific steps that need them
- `ANTHROPIC_API_KEY` only used in test step

### Dependency Security

#### Automated Scanning

1. **GitHub Dependency Review** (public repos only)
   - Runs on PRs to `main`
   - Blocks moderate+ severity vulnerabilities
   - Prevents problematic licenses (GPL-3.0, AGPL-3.0)

2. **pnpm audit** (all repos)
   - Runs on every PR to `main`
   - Checks for known vulnerabilities
   - Reports issues without blocking (informational)

#### Manual Security Checks

Run these commands locally before pushing:

```bash
# Check for vulnerabilities
pnpm audit

# View detailed report
pnpm audit --json

# Update dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

### Reporting Security Vulnerabilities

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email the maintainers directly (or use GitHub Security Advisories)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

We will respond within 48 hours and work to resolve the issue promptly.

### Security Best Practices for Contributors

#### When Adding Workflow Steps

1. **Never interpolate untrusted input directly:**
   ```yaml
   # ❌ WRONG
   run: echo "${{ github.event.issue.title }}"

   # ✅ CORRECT
   env:
     ISSUE_TITLE: ${{ github.event.issue.title }}
   run: echo "${ISSUE_TITLE}"
   ```

2. **Always quote shell variables:**
   ```bash
   # ❌ WRONG
   if [ $VAR = "test" ]

   # ✅ CORRECT
   if [ "${VAR}" = "test" ]
   ```

3. **Use specific action versions:**
   ```yaml
   # ❌ WRONG
   uses: some-action@latest

   # ✅ CORRECT
   uses: some-action@v2.1.3
   ```

4. **Minimize secrets exposure:**
   ```yaml
   # Only expose secrets to steps that need them
   - name: Step that needs secret
     env:
       API_KEY: ${{ secrets.API_KEY }}
     run: ./script-that-needs-key.sh

   - name: Step that doesn't need secret
     run: ./other-script.sh
   ```

#### When Adding Dependencies

1. **Review before installing:**
   ```bash
   # Check package info
   pnpm view package-name

   # Check recent activity
   pnpm view package-name time

   # Install
   pnpm add package-name
   ```

2. **Keep dependencies updated:**
   ```bash
   # Regular updates
   pnpm update

   # Check for security updates
   pnpm audit
   ```

3. **Use exact versions for critical packages:**
   ```json
   {
     "dependencies": {
       "@anthropic-ai/sdk": "0.68.0"  // exact version
     }
   }
   ```

### Security Checklist for PRs

Before submitting a PR, verify:

- [ ] No secrets or API keys in code or git history
- [ ] New workflow steps use environment variables for untrusted input
- [ ] All shell variables properly quoted
- [ ] New dependencies reviewed and scanned
- [ ] No console.log or debug statements with sensitive data
- [ ] Tests don't expose real API keys (use test fixtures)

### Known Safe Contexts

These GitHub contexts are safe to use directly (controlled by GitHub):

- `needs.<job>.result` - Always: `success`, `failure`, `cancelled`, or `skipped`
- `github.workflow` - Workflow name (no user input)
- `github.ref` - Git reference (validated by GitHub)
- `matrix.*` - Values from workflow matrix (defined by us)

However, we still pass them through environment variables for consistency and defense-in-depth.

### Resources

- [GitHub Actions Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Preventing Script Injection](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections)
- [Using Secrets Safely](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)

### Security Scanning Status

| Check | Status | Notes |
|-------|--------|-------|
| Script Injection | ✅ Protected | Environment variable isolation |
| Dependency Scanning | ✅ Enabled | pnpm audit + GitHub review |
| Secrets Management | ✅ Secure | Minimal exposure, never logged |
| Action Pinning | ✅ Complete | All actions use specific versions |
| Least Privilege | ✅ Applied | Minimal workflow permissions |

---

Last updated: 2025-11-09
