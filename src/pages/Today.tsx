import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Badge, Card, EmptyState, PageHeader } from '../components/ui/primitives'
import type { NewsStory, WatchlistPost } from '../types'

type OutlierRow = WatchlistPost & { watchlist_accounts: { handle: string; wing: string | null } | null }

export function TodayPage() {
  const outliers = useQuery({
    queryKey: ['today_outliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlist_posts')
        .select('*, watchlist_accounts(handle, wing)')
        .eq('is_outlier', true)
        .order('outlier_ratio', { ascending: false })
        .limit(15)
      if (error) throw error
      return data as unknown as OutlierRow[]
    },
  })

  const news = useQuery({
    queryKey: ['today_news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_stories')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data as NewsStory[]
    },
  })

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Today"
        description={
          <>
            What the Intelligence desk found overnight — outlier posts from your{' '}
            <Link to="/watchlist" className="text-accent-300 underline decoration-accent-500/40 underline-offset-2 hover:text-accent-200">
              Watchlist
            </Link>{' '}
            and fresh headlines from your{' '}
            <Link to="/sources" className="text-accent-300 underline decoration-accent-500/40 underline-offset-2 hover:text-accent-200">
              Sources
            </Link>
            . No AI Manager writing this up yet — that's the next step once this raw feed proves
            useful day to day.
          </>
        }
      />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white/50">
          Outlier posts — 3× or more that account's own 30-day median
        </h2>
        {outliers.isLoading && <p className="text-sm text-white/40">Loading…</p>}
        {outliers.isError && (
          <p className="text-sm text-red-400">{(outliers.error as Error).message}</p>
        )}
        {outliers.data && outliers.data.length === 0 && (
          <EmptyState
            title="No outliers yet"
            description="The Influencer Watch desk runs daily at 08:30 IST once your Watchlist has active accounts — check back tomorrow, or log a link manually on the Watchlist screen."
          />
        )}
        <div className="space-y-2">
          {outliers.data?.map((o) => (
            <a key={o.id} href={o.post_url} target="_blank" rel="noreferrer">
              <Card className="p-4 transition-colors hover:border-accent-500/40">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">
                    @{o.watchlist_accounts?.handle ?? 'unknown'}{' '}
                    {o.watchlist_accounts?.wing && (
                      <span className="text-xs font-normal text-white/40">
                        ({o.watchlist_accounts.wing})
                      </span>
                    )}
                  </span>
                  <Badge variant="warning">
                    {o.outlier_ratio ? `${o.outlier_ratio.toFixed(1)}×` : 'outlier'}
                  </Badge>
                </div>
                {o.caption && <p className="mt-1 truncate text-xs text-white/40">{o.caption}</p>}
                <p className="mt-1 text-xs text-white/30">
                  {o.views?.toLocaleString() ?? '—'} views · {o.posted_at ?? 'no date'}
                </p>
              </Card>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white/50">Latest headlines</h2>
        {news.isLoading && <p className="text-sm text-white/40">Loading…</p>}
        {news.isError && <p className="text-sm text-red-400">{(news.error as Error).message}</p>}
        {news.data && news.data.length === 0 && (
          <EmptyState
            title="Nothing pulled yet"
            description="The nightly job runs at 02:00 IST once you've added a source, or add one on the Sources screen."
          />
        )}
        {news.data && news.data.length > 0 && (
          <Card className="divide-y divide-border-subtle overflow-hidden">
            {news.data.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="block p-4 text-sm transition-colors hover:bg-white/[0.03]"
              >
                <span className="font-medium text-white hover:text-accent-300">{s.title}</span>
                <div className="mt-0.5 text-xs text-white/30">
                  {s.published_at ? new Date(s.published_at).toLocaleDateString() : '—'}
                </div>
              </a>
            ))}
          </Card>
        )}
      </section>
    </div>
  )
}
