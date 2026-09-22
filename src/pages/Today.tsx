import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
      <h1 className="text-xl font-semibold">Today</h1>
      <p className="mt-1 text-sm text-neutral-500">
        What the Intelligence desk found overnight — outlier posts from your{' '}
        <Link to="/watchlist" className="underline">
          Watchlist
        </Link>{' '}
        and fresh headlines from your{' '}
        <Link to="/sources" className="underline">
          Sources
        </Link>
        . No AI Manager writing this up yet — that's the next step once this raw feed proves
        useful day to day.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-500">
          Outlier posts — 3× or more that account's own 30-day median
        </h2>
        {outliers.isLoading && <p className="mt-2 text-sm text-neutral-500">Loading…</p>}
        {outliers.isError && (
          <p className="mt-2 text-sm text-red-600">{(outliers.error as Error).message}</p>
        )}
        {outliers.data && outliers.data.length === 0 && (
          <p className="mt-2 text-sm text-neutral-500">
            None yet. The Influencer Watch desk runs daily at 08:30 IST once your Watchlist has
            active accounts — check back tomorrow, or log a link manually on the Watchlist screen.
          </p>
        )}
        <div className="mt-3 space-y-2">
          {outliers.data?.map((o) => (
            <a
              key={o.id}
              href={o.post_url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md border border-amber-300 bg-amber-50 p-3 text-sm hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-950/60"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  @{o.watchlist_accounts?.handle ?? 'unknown'}{' '}
                  {o.watchlist_accounts?.wing && (
                    <span className="text-xs font-normal text-neutral-500">
                      ({o.watchlist_accounts.wing})
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                  {o.outlier_ratio ? `${o.outlier_ratio.toFixed(1)}×` : 'outlier'}
                </span>
              </div>
              {o.caption && (
                <p className="mt-1 truncate text-xs text-neutral-600 dark:text-neutral-400">
                  {o.caption}
                </p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                {o.views?.toLocaleString() ?? '—'} views · {o.posted_at ?? 'no date'}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-500">Latest headlines</h2>
        {news.isLoading && <p className="mt-2 text-sm text-neutral-500">Loading…</p>}
        {news.isError && <p className="mt-2 text-sm text-red-600">{(news.error as Error).message}</p>}
        {news.data && news.data.length === 0 && (
          <p className="mt-2 text-sm text-neutral-500">
            Nothing pulled yet — the nightly job runs at 02:00 IST once you've added a source, or
            add one on the Sources screen.
          </p>
        )}
        {news.data && news.data.length > 0 && (
          <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200 text-sm dark:divide-neutral-800 dark:border-neutral-800">
            {news.data.map((s) => (
              <li key={s.id} className="p-3">
                <a href={s.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                  {s.title}
                </a>
                <div className="text-xs text-neutral-500">
                  {s.published_at ? new Date(s.published_at).toLocaleDateString() : '—'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
