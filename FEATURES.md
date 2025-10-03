# Sacred Madness Wiki - Features Documentation

## 🧠 Zettelkasten + Wikipedia Hybrid System

This wiki combines the best of both worlds: **Zettelkasten's** bidirectional linking with **Wikipedia's** familiar navigation patterns, plus AI-powered research assistance.

---

## ✅ Implemented Features

### 1. **Bidirectional Backlinks** (Zettelkasten-Style)

Every page shows "What Links Here" - other pages that reference the current article.

**Implementation:**
- Link graph parser in `lib/graph-builder.ts`
- Supports multiple link formats:
  - Markdown: `[text](/wiki/slug)`
  - Wiki-style: `[[slug]]` or `[[text|slug]]`
  - Raw URLs: `/wiki/slug`
- Backlinks component: `components/Backlinks.tsx`

**Usage in Markdown:**
```markdown
My spiritual heritage as an [Alevi Kalenderi Abdal](/wiki/kaygusuz-abdal-and-alevi-mysticism)...
```

---

### 2. **See Also Sections** (Wikipedia-Style)

Curated related articles appear at the bottom of each page.

**Frontmatter Configuration:**
```yaml
---
title: "Preface"
keywords: ["bipolar ii", "alevi", "kalenderi"]
related:
  - "introduction-why-sacred-madness"
  - "bipolar-ii-and-the-mystic-practical-reflections"
seeAlso:
  - "kaygusuz-abdal-and-alevi-mysticism"
  - "abdals-the-kalenderi-and-antinomian-dervishes"
---
```

---

### 3. **Category Pages**

Articles in the same category are automatically suggested.

**Frontmatter:**
```yaml
category: "Sufi Traditions"
```

---

### 4. **Schema.org Structured Data**

Every page includes JSON-LD metadata for AI/search engines.

**What's included:**
- `@type`: ScholarlyArticle
- Author information
- Keywords
- Related articles
- URL
- Open Graph tags for social sharing

**View in browser:** Right-click → View Page Source → search for `application/ld+json`

---

### 5. **API Endpoints for AI/RAG**

Three REST APIs make content machine-readable:

#### **GET `/api/content/[slug]`**
Returns clean markdown + metadata for any page.

```bash
curl http://localhost:3000/api/content/preface
```

Response:
```json
{
  "slug": "preface",
  "title": "Preface",
  "description": "...",
  "keywords": ["bipolar ii", "alevi", ...],
  "content": "# Preface\n\nThis book emerges...",
  "wordCount": 450,
  "url": "https://sacred-madness.vercel.app/wiki/preface"
}
```

#### **GET `/api/graph`**
Returns the complete knowledge graph.

```bash
curl http://localhost:3000/api/graph
```

Response:
```json
{
  "nodes": [
    {"id": "preface", "title": "Preface", "category": "Introduction"},
    ...
  ],
  "edges": [
    {"from": "preface", "to": "kaygusuz-abdal-and-alevi-mysticism"},
    ...
  ],
  "stats": {
    "totalPages": 20,
    "totalLinks": 45,
    "categories": ["Introduction", "Sufi Traditions", ...]
  }
}
```

#### **GET `/api/search?q=query`**
Full-text search across all pages.

```bash
curl "http://localhost:3000/api/search?q=abdals"
```

---

### 6. **AI Research Assistant** 🤖

Floating chat interface powered by **Claude Sonnet 4.5** + **Tavily**.

**Features:**
- **Explain Concepts**: Ask the AI to explain complex theological/mystical terms
- **Find Connections**: Discover related concepts across traditions
- **Generate Questions**: Get research questions about the topic
- **Find Sources**: Tavily searches academic databases for citations

**Quick Actions:**
- Click "Explain" to understand the current page
- Click "Find Connections" to explore related ideas
- Click "Find Sources" to get academic citations

**How it works:**
1. Floating chat button (bottom-right corner)
2. Context-aware: knows which page you're on
3. Streams responses from Claude Sonnet 4.5
4. Integrates Tavily for academic source discovery

---

## 🔧 Setup Instructions

### 1. **Environment Variables**

Create `.env.local` file:

```bash
# OpenRouter API Key (for Claude Sonnet 4.5)
OPENROUTER_API_KEY=sk-or-v1-...

# Tavily API Key (for academic citations)
TAVILY_API_KEY=tvly-...

# Base URL
NEXT_PUBLIC_BASE_URL=https://sacred-madness.vercel.app
```

**Get API Keys:**
- OpenRouter: https://openrouter.ai/keys
- Tavily: https://tavily.com

### 2. **Run Development Server**

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

### 3. **Test AI Features**

1. Navigate to any wiki page
2. Click the floating chat icon (bottom-right)
3. Try quick actions or ask questions

---

## 📊 Knowledge Graph Visualization (Future)

The `/api/graph` endpoint is ready for visualization. Suggested tools:
- **React Flow**: https://reactflow.dev
- **D3.js**: https://d3js.org

Example integration:
```tsx
const graph = await fetch('/api/graph').then(r => r.json())
// Render nodes and edges with React Flow or D3
```

---

## 📝 Content Authoring Best Practices

### **Add Internal Links**

Link to other wiki pages liberally:

```markdown
The [abdals](/wiki/abdals-the-kalenderi-and-antinomian-dervishes)
wandered through Anatolia...
```

### **Use Descriptive Frontmatter**

```yaml
---
title: "Clear, descriptive title"
description: "One-sentence summary for AI/SEO (150-200 chars)"
category: "Introduction | Sufi Traditions | Holy Fools | etc."
keywords: ["term1", "term2", "term3"]
related:
  - "closely-related-page-1"
  - "closely-related-page-2"
seeAlso:
  - "tangentially-related-page-1"
  - "comparison-page"
---
```

**Tip:** `related` shows in "See Also", `seeAlso` shows after "See Also" separator.

### **Write AI-Friendly Content**

- Use clear headings (H2, H3)
- Define technical terms on first use
- Add context for abbreviations
- Include examples and comparisons

---

## 🚀 For Researchers

### **Use the API for RAG**

Feed wiki content to your AI tools:

```python
import requests

# Get all pages
graph = requests.get('http://localhost:3000/api/graph').json()

# Get specific page content
page = requests.get('http://localhost:3000/api/content/preface').json()

# Feed to your RAG pipeline
context = page['content']
```

### **Search Programmatically**

```bash
curl "http://localhost:3000/api/search?q=divine+intoxication"
```

### **AI Research Workflow**

1. **Explore**: Browse wiki with backlinks/see-also
2. **Question**: Ask AI assistant about concepts
3. **Cite**: Use "Find Sources" to get academic references
4. **Connect**: Follow link graph to discover relationships

---

## 🎯 Next Steps

Planned enhancements:
- [ ] Interactive knowledge graph visualization
- [ ] Export pages as PDF with citations
- [ ] "Cite this page" button
- [ ] Reading progress tracking
- [ ] AI-suggested cross-references

---

## 📚 Architecture

```
app/
├── api/
│   ├── content/[slug]/route.ts   # Page content API
│   ├── graph/route.ts            # Knowledge graph API
│   ├── search/route.ts           # Search API
│   └── ai/
│       ├── chat/route.ts         # OpenRouter integration
│       └── citations/route.ts    # Tavily integration
├── wiki/[slug]/page.tsx          # Dynamic wiki pages
components/
├── Backlinks.tsx                 # "What links here"
├── SeeAlso.tsx                   # "See also" section
├── CategoryPages.tsx             # Category suggestions
├── SchemaOrg.tsx                 # JSON-LD metadata
└── AIChat.tsx                    # Floating AI assistant
lib/
├── graph-builder.ts              # Link graph parser
├── toc.ts                        # Table of contents
└── mdx-components.tsx            # Custom MDX components
```

---

## 🤝 Contributing

When adding new pages:
1. Create markdown file in `content/chapters/`
2. Add comprehensive frontmatter
3. Link to related pages
4. Test AI chat on your page
5. Verify backlinks appear on related pages

---

**Built with:** Next.js 15, Claude Sonnet 4.5, Tavily, Schema.org

🤖 This wiki is AI-enhanced and AI-readable!
