export function ComingLater({ screen, phase }: { screen: string; phase: string }) {
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold">{screen}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Not built yet — this is a {phase} screen. Phase 1 is the intake: Watchlist, Sources, Brand
        Brain, Library (Voice Training), and Settings. See{' '}
        <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-900">STATUS.md</code>{' '}
        for the build order.
      </p>
    </div>
  )
}
