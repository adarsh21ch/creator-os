import { useLocation } from 'react-router-dom'
import { ComingLater } from '../components/ComingLater'

const screenNames: Record<string, { screen: string; phase: string }> = {
  '/': { screen: 'Today', phase: 'Phase 3 (Manager + daily brief)' },
  '/ideas': { screen: 'Ideas', phase: 'Phase 3 (Intelligence desk)' },
  '/studio': { screen: 'Studio', phase: 'Phase 2 (Creative desk)' },
  '/board': { screen: 'Board', phase: 'Phase 5 (Production desk)' },
  '/formats': { screen: 'Formats', phase: 'Phase 4 (Pattern Analyst)' },
  '/performance': { screen: 'Performance', phase: 'Phase 4 (Instagram Graph API loop)' },
  '/employees': { screen: 'Employees', phase: 'Phase 3 (admin panel for the 13 AI staff)' },
}

export function LaterPage() {
  const { pathname } = useLocation()
  const entry = screenNames[pathname] ?? { screen: 'This screen', phase: 'a later phase' }
  return <ComingLater screen={entry.screen} phase={entry.phase} />
}
