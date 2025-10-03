import Link from 'next/link'
import { WikiPage } from '@/lib/graph-builder'
import { FolderOpen } from 'lucide-react'

interface CategoryPagesProps {
  pages: WikiPage[]
  category: string
}

export function CategoryPages({ pages, category }: CategoryPagesProps) {
  if (pages.length === 0) return null

  return (
    <div className="mt-12 pt-6 border-t">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">More in {category}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pages.slice(0, 6).map((page) => (
          <Link
            key={page.slug}
            href={`/wiki/${page.slug}`}
            className="block p-3 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
          >
            <div className="font-medium text-blue-600 dark:text-blue-400">
              {page.title}
            </div>
            {page.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {page.description}
              </p>
            )}
          </Link>
        ))}
      </div>
      {pages.length > 6 && (
        <p className="text-sm text-muted-foreground mt-3">
          And {pages.length - 6} more {pages.length - 6 === 1 ? 'article' : 'articles'} in this category...
        </p>
      )}
    </div>
  )
}
