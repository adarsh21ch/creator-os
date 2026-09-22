import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Format, ReelFormatRow } from '../types'

const STATUS_LABEL: Record<Format['status'], string> = {
  promoted: 'Promoted',
  killed: 'Killed',
  watching: 'Watching',
}

const STATUS_STYLE: Record<Format['status'], string> = {
  promoted:
    'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300',
  killed:
    'border-neutral-300 bg-neutral-100 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
  watching:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
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
      <h1 className="text-xl font-semibold">Formats</h1>
      <p className="mt-1 text-sm text-neutral-500">
        What the teardown of your own reels actually found — not opinion, the data. A pattern is
        promoted only once it appears in 3+ winners and is meaningfully rarer in losers. The
        Scriptwriter is instructed to follow every promoted rule below.
      </p>

      {formats.isLoading && <p className="mt-6 text-sm text-neutral-500">Loading…</p>}
      {formats.isError && (
        <p className="mt-6 text-sm text-red-600">{(formats.error as Error).message}</p>
      )}

      {promoted.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-500">Promoted — use these</h2>
          <div className="mt-3 space-y-4">
            {promoted.map((f) => (
              <FormatCard key={f.id} format={f} reels={reelsByFormat.get(f.id) ?? []} />
            ))}
          </div>
        </section>
      )}

      {watching.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-500">Watching — not proven yet</h2>
          <div className="mt-3 space-y-4">
            {watching.map((f) => (
              <FormatCard key={f.id} format={f} reels={reelsByFormat.get(f.id) ?? []} />
            ))}
          </div>
        </section>
      )}

      {killed.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-500">
            Killed — looked promising, disproved by the losers
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Recorded so nobody re-derives these. They still show up in your reels — they're just
            not why those reels won.
          </p>
          <div className="mt-3 space-y-4">
            {killed.map((f) => (
              <FormatCard key={f.id} format={f} reels={reelsByFormat.get(f.id) ?? []} />
            ))}
          </div>
        </section>
      )}

      {formats.data && formats.data.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">
          No formats yet — they show up once a teardown promotes or kills a pattern.
        </p>
      )}

      <div className="mt-10 rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <strong>Confound worth remembering:</strong> the 3 losers in this sample include 2 paid
        promotions — cold audiences behave differently from warm ones, so part of the gap may be
        distribution, not content. The 1 organic loser still fits neither promoted format cleanly,
        which is what keeps F-01 and F-02 standing. Next validation step: 3–5 more <em>organic</em>{' '}
        losers in the <Link to="/library" className="underline">Library</Link>.
      </div>
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
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-neutral-400">{format.code}</span>
        <h3 className="font-medium">{format.name}</h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[format.status]}`}
        >
          {STATUS_LABEL[format.status]}
        </span>
        {format.evidence && (
          <span className="text-xs text-neutral-500">{format.evidence}</span>
        )}
      </div>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{format.description}</p>

      {format.scriptwriter_rule && (
        <p className="mt-3 rounded-md bg-purple-50 p-3 text-xs text-purple-900 dark:bg-purple-900/20 dark:text-purple-200">
          <span className="font-medium">Rule for the Scriptwriter: </span>
          {format.scriptwriter_rule}
        </p>
      )}

      {reels.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-neutral-500">
            {reels.length} reel{reels.length === 1 ? '' : 's'} in your Library fit this
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {reels.map((r) => (
              <span
                key={r.id}
                className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
              >
                {r.pillar ?? 'Untitled'} · {r.posted_at ?? 'no date'} ·{' '}
                {r.is_organic ? 'organic' : 'paid'}
                {r.views != null ? ` · ${r.views.toLocaleString()} views` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
