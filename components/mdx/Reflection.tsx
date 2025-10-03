import { Pencil } from 'lucide-react'

export function Reflection({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg my-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-3">
        <Pencil className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-purple-800 dark:text-purple-200 mb-2">Reflection</p>
          <div className="text-purple-700 dark:text-purple-300 italic prose prose-sm dark:prose-invert">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
