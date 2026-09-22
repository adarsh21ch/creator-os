import { NavLink, Outlet } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Badge } from './ui/primitives'

type NavItem = { to: string; label: string; phase1: boolean }
type NavGroup = { title: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    title: 'Team',
    items: [{ to: '/manager', label: 'Manager', phase1: true }],
  },
  {
    title: 'Daily',
    items: [
      { to: '/', label: 'Today', phase1: true },
      { to: '/ideas', label: 'Ideas', phase1: true },
      { to: '/studio', label: 'Studio', phase1: true },
      { to: '/board', label: 'Board', phase1: true },
    ],
  },
  {
    title: 'What you learn',
    items: [
      { to: '/formats', label: 'Formats', phase1: true },
      { to: '/library', label: 'Library', phase1: true },
      { to: '/performance', label: 'Performance', phase1: false },
    ],
  },
  {
    title: 'What you feed it',
    items: [
      { to: '/watchlist', label: 'Watchlist', phase1: true },
      { to: '/sources', label: 'Sources', phase1: true },
      { to: '/brand-brain', label: 'Brand Brain', phase1: true },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/employees', label: 'Employees', phase1: true },
      { to: '/settings', label: 'Settings', phase1: true },
    ],
  },
]

export function Layout() {
  const { session } = useAuth()
  const initial = session?.user.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex min-h-screen bg-canvas text-white">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border-subtle bg-surface/60 p-4">
        <div className="mb-7 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-700 font-display text-sm font-bold text-white shadow-glow">
            C
          </div>
          <div>
            <div className="font-display text-sm font-semibold tracking-tight text-white">
              Creator OS
            </div>
            <div className="text-[11px] text-white/40">Adarsh's AI newsroom</div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150 ${
                        isActive
                          ? 'bg-accent-500/15 font-medium text-white'
                          : 'text-white/55 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                              isActive ? 'bg-accent-400' : 'bg-white/15 group-hover:bg-white/30'
                            }`}
                          />
                          {item.label}
                        </span>
                        {!item.phase1 && (
                          <Badge variant="default" className="text-[9px]">
                            later
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {session && (
          <div className="mt-4 flex items-center gap-2.5 border-t border-border-subtle pt-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-white/60">{session.user.email}</div>
            </div>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-md px-1.5 py-1 text-[11px] text-white/40 hover:bg-white/5 hover:text-white/80"
            >
              Sign out
            </button>
          </div>
        )}

        {!supabaseConfigured && (
          <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-[11px] text-amber-300">
            Supabase not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
