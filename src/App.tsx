import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './lib/auth'
import { LoginPage } from './pages/Login'
import { BrandBrainPage } from './pages/BrandBrain'
import { LaterPage } from './pages/Later'
import { LibraryPage } from './pages/Library'
import { NotFoundPage } from './pages/NotFound'
import { SettingsPage } from './pages/Settings'
import { SourcesPage } from './pages/Sources'
import { StudioPage } from './pages/Studio'
import { WatchlistPage } from './pages/Watchlist'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  )
}

function Gate() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500 dark:bg-neutral-950">
        Loading…
      </div>
    )
  }

  if (!session) return <LoginPage />

  return (
    <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LaterPage />} />
            <Route path="ideas" element={<LaterPage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="board" element={<LaterPage />} />
            <Route path="formats" element={<LaterPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="performance" element={<LaterPage />} />
            <Route path="watchlist" element={<WatchlistPage />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="brand-brain" element={<BrandBrainPage />} />
            <Route path="employees" element={<LaterPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
      </Routes>
    </HashRouter>
  )
}
