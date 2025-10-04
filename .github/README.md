# GitHub Workflows & CI/CD Documentation

This directory contains GitHub Actions workflows and configuration files for automated CI/CD pipelines, security scanning, and dependency management.

## 📁 Directory Structure

```
.github/
├── workflows/
│   ├── ci.yml              # Main CI pipeline (lint, test, build)
│   ├── deploy.yml          # Vercel deployment automation
│   └── security.yml        # Security scanning & dependency audit
├── dependabot.yml          # Automated dependency updates
├── pull_request_template.md # PR template with checklists
└── README.md              # This file
```

## 🔄 Workflows Overview

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**
- **Lint**: Runs ESLint to check code quality
- **Type Check**: Validates TypeScript types
- **Test**: Runs Vitest test suite with coverage
- **Build**: Builds the Next.js application
- **Test Matrix** (PRs only): Tests against Node.js 18, 20, 22

**Artifacts:**
- Test coverage reports (30 days retention)
- Build output (7 days retention)

**Status:** ✅ Required for merging PRs

### 2. Deployment (`deploy.yml`)

**Triggers:**
- Push to `main` branch (production)
- Pull requests (preview deployments)
- Manual workflow dispatch

**Jobs:**
- **Production Deploy**: Deploys to Vercel production on main branch
- **Preview Deploy**: Creates preview deployments for PRs

**Features:**
- Automatic PR comments with deployment URLs
- Environment-specific deployments
- Build artifact caching

### 3. Security Scanning (`security.yml`)

**Triggers:**
- Weekly schedule (Mondays at 9:00 AM UTC)
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

**Jobs:**
- **Dependency Audit**: Runs `npm audit` for vulnerabilities
- **Outdated Dependencies**: Checks for outdated packages
- **CodeQL Analysis**: Advanced security scanning
- **Secret Scanning**: Detects leaked secrets with TruffleHog

**Automated Actions:**
- Creates GitHub issues for vulnerabilities
- Generates detailed reports
- Weekly dependency health checks

## 🔐 Required Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Essential Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel deployment token | [Vercel Account Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel organization ID | Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project ID | Project Settings → General |

### Optional Secrets

| Secret Name | Description | Purpose |
|-------------|-------------|---------|
| `CODECOV_TOKEN` | Codecov upload token | Code coverage reporting |
| `GITHUB_TOKEN` | Auto-provided by GitHub | Creating issues, PR comments |

## 🤖 Dependabot Configuration

Dependabot automatically creates PRs for dependency updates with the following settings:

**Schedule:**
- **Frequency**: Weekly (Mondays at 9:00 AM CET)
- **Open PR Limit**: 10 for npm, 5 for GitHub Actions

**Grouped Updates:**
- Next.js packages (`next`, `@next/*`)
- React packages (`react`, `react-dom`)
- Testing packages (Vitest, Testing Library)
- Tailwind CSS packages
- Radix UI components
- ESLint packages
- MDX packages

**Auto-ignore:**
- Major version updates for React (requires manual review)

## 📝 Pull Request Template

The PR template includes comprehensive checklists for:

- ✅ Type of change (bug fix, feature, etc.)
- 🧪 Testing requirements
- 📊 Code quality checks
- 📚 Documentation updates
- 🔒 Security considerations
- 🚀 Deployment notes

## 🚀 Using the Workflows

### Running CI Locally

Before pushing, run these commands locally:

```bash
# Run all checks
npm run lint          # ESLint
npx tsc --noEmit     # TypeScript check
npm run test         # Run tests
npm run build        # Build application
```

### Manual Deployment

Trigger a manual deployment:

1. Go to **Actions** tab
2. Select **Deploy to Vercel** workflow
3. Click **Run workflow**
4. Choose environment (production/preview)

### Viewing Workflow Results

- **CI Status**: Visible in PR checks
- **Coverage Reports**: Uploaded as artifacts
- **Security Reports**: Check Issues tab for alerts
- **Deployment URLs**: Posted as PR comments

## 📊 Status Badges

Add these badges to your README:

```markdown
![CI](https://github.com/USERNAME/REPO/workflows/CI%20Pipeline/badge.svg)
![Deploy](https://github.com/USERNAME/REPO/workflows/Deploy%20to%20Vercel/badge.svg)
![Security](https://github.com/USERNAME/REPO/workflows/Security%20Scanning/badge.svg)
```

## 🔧 Customization

### Modifying Workflows

All workflow files use standard GitHub Actions YAML syntax:

- **Add new jobs**: Add to respective workflow file
- **Change triggers**: Modify `on:` section
- **Update Node version**: Change `node-version` in setup step
- **Adjust schedules**: Modify `cron` expressions

### Adding New Checks

To add a new CI check:

1. Add job to [`ci.yml`](workflows/ci.yml)
2. Update PR template checklist
3. Document in this README

## 🐛 Troubleshooting

### Common Issues

**CI Fails on Type Check**
```bash
# Run locally to see errors
npx tsc --noEmit
```

**Deployment Fails**
- Verify `VERCEL_TOKEN` is set correctly
- Check Vercel project configuration
- Review deployment logs in Actions tab

**Security Scan Creates Too Many Issues**
- Adjust audit level in [`security.yml`](workflows/security.yml)
- Configure ignore list in [`dependabot.yml`](dependabot.yml)

**Dependabot PRs Not Appearing**
- Check organization settings allow Dependabot
- Verify [`dependabot.yml`](dependabot.yml) syntax
- Check Dependabot logs in Insights → Dependency graph

### Getting Help

- **Workflow Syntax**: [GitHub Actions Documentation](https://docs.github.com/en/actions)
- **Vercel Deployment**: [Vercel CLI Documentation](https://vercel.com/docs/cli)
- **Dependabot**: [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

## 📈 Best Practices

1. **Always run CI checks locally before pushing**
2. **Keep dependencies up to date** (review Dependabot PRs weekly)
3. **Address security issues promptly** (check Issues tab)
4. **Review deployment previews** before merging PRs
5. **Monitor workflow run times** and optimize if needed

## 🔄 Workflow Maintenance

### Monthly Tasks
- [ ] Review and merge Dependabot PRs
- [ ] Check security scan results
- [ ] Update workflow versions if needed
- [ ] Review and optimize cache strategy

### Quarterly Tasks
- [ ] Audit workflow permissions
- [ ] Update Node.js versions in matrix
- [ ] Review and update ignored dependencies
- [ ] Optimize workflow concurrency settings

---

**Last Updated**: 2025-01-04  
**Maintained By**: Erdal Güneş (@erdalgunes)