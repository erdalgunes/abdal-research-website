import Link from 'next/link'
import { WikiPage } from '@/lib/graph-builder'
import { BookOpen } from 'lucide-react'

interface SeeAlsoProps {
  pages: WikiPage[]
  title?: string
}

export function SeeAlso({ pages, title = "See Also" }: SeeAlsoProps) {
  if (pages.length === 0) return null

  return (
    <div className="mt-12 pt-6 border-t">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="grid gap-3">
        {pages.map((page) => (
          <div key={page.slug} className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
            <Link
              href={`/wiki/${page.slug}`}
              className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {page.title}
            </Link>
            {page.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {page.description}
              </p>
            )}
            {page.category && (
              <span className="inline-block mt-1 text-xs bg-muted px-2 py-1 rounded">
                {page.category}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
