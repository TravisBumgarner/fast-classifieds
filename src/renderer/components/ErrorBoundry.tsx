import { Component } from 'react'
import Error from '../pages/Error'
import { logger } from '../utilities'

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(err: unknown, info: unknown) {
    logger.error(err, info)
  }

  render() {
    if (this.state.hasError) return <Error />
    return this.props.children
  }
}

export default ErrorBoundary
