import { useLocation } from 'react-router-dom'
import { ComingLater } from '../components/ComingLater'

const screenNames: Record<string, { screen: string; phase: string }> = {
  '/performance': { screen: 'Performance', phase: 'Phase 4 (Instagram Graph API loop)' },
}

export function LaterPage() {
  const { pathname } = useLocation()
  const entry = screenNames[pathname] ?? { screen: 'This screen', phase: 'a later phase' }
  return <ComingLater screen={entry.screen} phase={entry.phase} />
}
