import { AlertTriangle } from 'lucide-react'

export function ClinicalWarning({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950 p-4 my-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-orange-800 dark:text-orange-200 mb-2">Clinical Note</p>
          <div className="text-orange-700 dark:text-orange-300 prose prose-sm dark:prose-invert">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
