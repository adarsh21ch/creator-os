import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BrandBrainPage } from './pages/BrandBrain'
import { LaterPage } from './pages/Later'
import { LibraryPage } from './pages/Library'
import { SettingsPage } from './pages/Settings'
import { SourcesPage } from './pages/Sources'
import { WatchlistPage } from './pages/Watchlist'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LaterPage />} />
            <Route path="ideas" element={<LaterPage />} />
            <Route path="studio" element={<LaterPage />} />
            <Route path="board" element={<LaterPage />} />
            <Route path="formats" element={<LaterPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="performance" element={<LaterPage />} />
            <Route path="watchlist" element={<WatchlistPage />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="brand-brain" element={<BrandBrainPage />} />
            <Route path="employees" element={<LaterPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
