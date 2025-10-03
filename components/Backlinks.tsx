import Link from 'next/link'
import { WikiPage } from '@/lib/graph-builder'
import { ArrowLeft } from 'lucide-react'

interface BacklinksProps {
  pages: WikiPage[]
}

export function Backlinks({ pages }: BacklinksProps) {
  if (pages.length === 0) return null

  return (
    <div className="mt-12 pt-6 border-t">
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">What Links Here</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        The following {pages.length} {pages.length === 1 ? 'page references' : 'pages reference'} this article:
      </p>
      <ul className="grid gap-2">
        {pages.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/wiki/${page.slug}`}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
            >
              <span>→</span>
              <span>{page.title}</span>
            </Link>
            {page.description && (
              <p className="text-sm text-muted-foreground ml-5 mt-1">
                {page.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
