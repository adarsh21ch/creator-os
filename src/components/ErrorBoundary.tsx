import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

// A single broken screen (a bad query, an unexpected null) shouldn't take
// down the whole app with a blank white page — this catches it and shows
// what broke instead.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-8 dark:bg-neutral-950">
          <div className="max-w-md rounded-lg border border-red-300 bg-red-50 p-6 text-sm dark:border-red-800 dark:bg-red-950/40">
            <p className="font-medium text-red-800 dark:text-red-300">Something broke on this screen.</p>
            <p className="mt-2 text-red-700 dark:text-red-400">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null })
                window.location.hash = '#/'
              }}
              className="mt-4 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Back to Today
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
