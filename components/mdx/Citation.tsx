export function Citation({ id, children }: { id: string; children?: React.ReactNode }) {
  return (
    <sup className="ml-0.5">
      <a
        href={`#ref-${id}`}
        className="text-blue-600 dark:text-blue-400 hover:underline font-normal"
        aria-label={`Citation ${id}`}
      >
        [{children || id}]
      </a>
    </sup>
  )
}
