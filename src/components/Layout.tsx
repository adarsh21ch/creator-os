import { NavLink, Outlet } from 'react-router-dom'
import { supabaseConfigured } from '../lib/supabase'

type NavItem = { to: string; label: string; phase1: boolean }
type NavGroup = { title: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    title: 'Daily',
    items: [
      { to: '/', label: 'Today', phase1: false },
      { to: '/ideas', label: 'Ideas', phase1: false },
      { to: '/studio', label: 'Studio', phase1: false },
      { to: '/board', label: 'Board', phase1: false },
    ],
  },
  {
    title: 'What you learn',
    items: [
      { to: '/formats', label: 'Formats', phase1: false },
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
      { to: '/employees', label: 'Employees', phase1: false },
      { to: '/settings', label: 'Settings', phase1: true },
    ],
  },
]

export function Layout() {
  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <aside className="w-56 shrink-0 border-r border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-6 px-2">
          <div className="text-sm font-semibold tracking-tight">Creator OS</div>
          <div className="text-xs text-neutral-500">Adarsh's AI newsroom</div>
        </div>
        <nav className="space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                        isActive
                          ? 'bg-purple-100 font-medium text-purple-900 dark:bg-purple-900/30 dark:text-purple-200'
                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                    {!item.phase1 && (
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800">
                        later
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {!supabaseConfigured && (
          <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Supabase not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
