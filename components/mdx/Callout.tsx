import { Info } from 'lucide-react'

export function Callout({
  title,
  children
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 p-4 my-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && (
            <p className="font-bold text-blue-800 dark:text-blue-200 mb-2">{title}</p>
          )}
          <div className="text-blue-700 dark:text-blue-300 prose prose-sm dark:prose-invert">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
