import { WikiPage } from '@/lib/graph-builder'

interface SchemaOrgProps {
  page: WikiPage
  content: string
  url: string
}

export function SchemaOrg({ page, url }: SchemaOrgProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    'headline': page.title,
    'description': page.description,
    'author': {
      '@type': 'Person',
      'name': 'Erdal Güneş',
      'affiliation': 'Alevi Kalenderi Abdal tradition'
    },
    'inLanguage': 'en',
    'keywords': page.keywords?.join(', '),
    'about': page.keywords?.map(keyword => ({
      '@type': 'Thing',
      'name': keyword
    })),
    'isPartOf': {
      '@type': 'Book',
      'name': 'Sacred Madness: Saints, Dervishes, and the Mystical Path'
    },
    'url': url,
    'dateModified': new Date().toISOString(),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
