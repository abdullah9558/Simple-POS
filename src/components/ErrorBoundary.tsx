import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../shared/logger'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error(error.message, 'ErrorBoundary', {
      stack: error.stack,
      componentStack: info.componentStack,
    })
  }

  private handleReload = () => {
    window.location.hash = '#/'
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-6 py-8 max-w-md">
          <h1 className="text-title text-text-primary">
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </h1>
          <p className="mt-2 text-body text-text-secondary">{this.state.message}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="h-9 rounded-md border border-border-subtle bg-surface-raised px-4 text-body-medium text-text-primary hover:bg-surface"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="h-9 rounded-md bg-accent px-4 text-body-medium text-white hover:opacity-90"
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    )
  }
}
