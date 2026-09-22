import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Badge, Card, PageHeader } from '../components/ui/primitives'
import type { Format, ReelFormatRow } from '../types'

const STATUS_LABEL: Record<Format['status'], string> = {
  promoted: 'Promoted',
  killed: 'Killed',
  watching: 'Watching',
}

const STATUS_VARIANT: Record<Format['status'], 'success' | 'default' | 'warning'> = {
  promoted: 'success',
  killed: 'default',
  watching: 'warning',
}

export function FormatsPage() {
  const formats = useQuery({
    queryKey: ['formats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('formats').select('*').order('code')
      if (error) throw error
      return data as Format[]
    },
  })

  const reelFormats = useQuery({
    queryKey: ['reel_formats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reel_formats')
        .select('format_id, reels(id, posted_at, pillar, is_organic, views)')
      if (error) throw error
      return data as unknown as ReelFormatRow[]
    },
  })

  const reelsByFormat = new Map<string, ReelFormatRow['reels'][]>()
  for (const row of reelFormats.data ?? []) {
    const list = reelsByFormat.get(row.format_id) ?? []
    list.push(row.reels)
    reelsByFormat.set(row.format_id, list)
  }

  const promoted = formats.data?.filter((f) => f.status === 'promoted') ?? []
  const killed = formats.data?.filter((f) => f.status === 'killed') ?? []
  const watching = formats.data?.filter((f) => f.status === 'watching') ?? []

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Formats"
        description="What the teardown of your own reels actually found — not opinion, the data. A pattern is promoted only once it appears in 3+ winners and is meaningfully rarer in losers. The Scriptwriter is instructed to follow every promoted rule below."
      />

      {formats.isLoading && <p className="mt-6 text-sm text-white/40">Loading…</p>}
      {formats.isError && (
        <p className="mt-6 text-sm text-red-400">{(formats.error as Error).message}</p>
      )}

      {promoted.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-white/50">Promoted — use these</h2>
          <div className="space-y-4">
            {promoted.map((f) => (
              <FormatCard key={f.id} format={f} reels={reelsByFormat.get(f.id) ?? []} />
            ))}
          </div>
        </section>
      )}

      {watching.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-white/50">Watching — not proven yet</h2>
          <div className="space-y-4">
            {watching.map((f) => (
              <FormatCard key={f.id} format={f} reels={reelsByFormat.get(f.id) ?? []} />
            ))}
          </div>
        </section>
      )}

      {killed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 text-sm font-semibold text-white/50">
            Killed — looked promising, disproved by the losers
          </h2>
          <p className="mb-3 text-xs text-white/30">
            Recorded so nobody re-derives these. They still show up in your reels — they're just
            not why those reels won.
          </p>
          <div className="space-y-4">
            {killed.map((f) => (
              <FormatCard key={f.id} format={f} reels={reelsByFormat.get(f.id) ?? []} />
            ))}
          </div>
        </section>
      )}

      {formats.data && formats.data.length === 0 && (
        <p className="mt-6 text-sm text-white/40">
          No formats yet — they show up once a teardown promotes or kills a pattern.
        </p>
      )}

      <Card className="mt-10 border-amber-500/25 bg-amber-500/[0.06] p-4 text-xs text-amber-200/90">
        <strong className="text-amber-200">Confound worth remembering:</strong> the 3 losers in
        this sample include 2 paid promotions — cold audiences behave differently from warm ones,
        so part of the gap may be distribution, not content. The 1 organic loser still fits
        neither promoted format cleanly, which is what keeps F-01 and F-02 standing. Next
        validation step: 3–5 more <em>organic</em> losers in the{' '}
        <Link to="/library" className="underline text-amber-100">
          Library
        </Link>
        .
      </Card>
    </div>
  )
}

function FormatCard({
  format,
  reels,
}: {
  format: Format
  reels: ReelFormatRow['reels'][]
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-white/30">{format.code}</span>
        <h3 className="font-medium text-white">{format.name}</h3>
        <Badge variant={STATUS_VARIANT[format.status]}>{STATUS_LABEL[format.status]}</Badge>
        {format.evidence && <span className="text-xs text-white/40">{format.evidence}</span>}
      </div>

      <p className="mt-2 text-sm text-white/60">{format.description}</p>

      {format.scriptwriter_rule && (
        <p className="mt-3 rounded-lg bg-accent-500/10 p-3 text-xs text-accent-200">
          <span className="font-medium text-accent-100">Rule for the Scriptwriter: </span>
          {format.scriptwriter_rule}
        </p>
      )}

      {reels.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-white/40">
            {reels.length} reel{reels.length === 1 ? '' : 's'} in your Library fit this
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {reels.map((r) => (
              <span
                key={r.id}
                className="rounded-md border border-border px-2 py-1 text-xs text-white/50"
              >
                {r.pillar ?? 'Untitled'} · {r.posted_at ?? 'no date'} ·{' '}
                {r.is_organic ? 'organic' : 'paid'}
                {r.views != null ? ` · ${r.views.toLocaleString()} views` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
