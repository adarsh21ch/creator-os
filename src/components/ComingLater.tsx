import { Badge } from './ui/primitives'

export function ComingLater({ screen, phase }: { screen: string; phase: string }) {
  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">{screen}</h1>
        <Badge>later</Badge>
      </div>
      <p className="mt-2 text-sm text-white/50">
        Not built yet — this is a {phase} screen. See{' '}
        <code className="rounded bg-white/10 px-1 py-0.5 text-white/70">STATUS.md</code> for the
        build order.
      </p>
    </div>
  )
}
