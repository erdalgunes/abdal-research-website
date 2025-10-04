# Sacred Madness Wiki

[![CI Pipeline](https://github.com/USERNAME/abdal-research-website/workflows/CI%20Pipeline/badge.svg)](https://github.com/USERNAME/abdal-research-website/actions/workflows/ci.yml)
[![Deploy](https://github.com/USERNAME/abdal-research-website/workflows/Deploy%20to%20Vercel/badge.svg)](https://github.com/USERNAME/abdal-research-website/actions/workflows/deploy.yml)
[![Security](https://github.com/USERNAME/abdal-research-website/workflows/Security%20Scanning/badge.svg)](https://github.com/USERNAME/abdal-research-website/actions/workflows/security.yml)

A comprehensive Wikipedia-style research wiki exploring divine intoxication, holy foolishness, and sacred madness across Orthodox Christianity and Sufi Islam.

## 🌟 Features

- **20+ Research Chapters** - Comprehensive coverage from Byzantine saloi to Sufi abdals
- **Wikipedia-Style Navigation** - Collapsible sidebar, table of contents, breadcrumbs
- **Dark Mode** - Seamless light/dark theme switching
- **Mobile Responsive** - Fully optimized for all devices
- **Custom MDX Components** - Clinical warnings, reflections, citations
- **Fast Performance** - Built with Next.js 15 and Turbopack

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Content Structure

- `/content/chapters/` - 20 converted chapters from Sacred Madness book
- `/content/papers/` - Abdal continuity research paper sections
- `/app/wiki/[slug]/` - Dynamic wiki pages
- `/components/mdx/` - Custom MDX components

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Content**: MDX with next-mdx-remote
- **Theme**: next-themes
- **Icons**: Lucide React

## 📖 Research Topics

### Holy Fools & Christianity
- Byzantine saloi traditions
- Russian yurodivye
- St. Andrew, St. Basil, St. Simeon

### Sufi Mysticism
- Abdals & Kalenderi dervishes
- Majdhub / Mast traditions
- Kaygusuz Abdal & Alevi mysticism

### Mental Health & Spirituality
- St. Dymphna & Geel care model
- Psychiatry & neuroscience perspectives
- Bipolar II & mystical experience

### Comparative Analysis
- Cross-traditional phenomenology
- Language, metaphor, and interpretation
- Theologies of ecstasy

## 🔄 CI/CD Pipeline

This project uses GitHub Actions for automated testing, linting, and deployment:

### Automated Workflows

- **CI Pipeline**: Runs on every push and PR
  - ✅ ESLint code quality checks
  - 📘 TypeScript type checking
  - 🧪 Vitest test suite with coverage
  - 🏗️ Next.js build verification

- **Deployment**: Automated Vercel deployments
  - 🚀 Production deploy on main branch
  - 🎭 Preview deployments for PRs
  - 💬 Automatic PR comments with URLs

- **Security Scanning**: Weekly automated scans
  - 🔒 npm audit for vulnerabilities
  - 📦 Outdated dependency checks
  - 🔍 CodeQL security analysis
  - 🔑 Secret scanning with TruffleHog

### Running CI Checks Locally

```bash
npm run lint              # Run ESLint
npx tsc --noEmit         # Type checking
npm run test             # Run tests
npm run test:coverage    # Tests with coverage
npm run build            # Build production
```

For detailed CI/CD documentation, see [`.github/README.md`](.github/README.md)

## 🌐 Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

### Manual Build

```bash
npm run build
npm start
```

## 📝 Content Conversion

Convert Typst academic documents to markdown:

```bash
node scripts/convert-typst.js <input.typ> <output-dir>
```

## 🤝 Author

**Erdal Güneş**
- Alevi Kalenderi Abdal tradition
- Lived experience with Bipolar II
- Comparative religious studies scholar

## 🤝 Contributing

Contributions are welcome! Please read our [PR template](.github/pull_request_template.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run local CI checks (`npm run lint && npm test && npm run build`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

All rights reserved © 2025 Erdal Güneş

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
