import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoWorkspaces = () => {
    window.location.href = '/workspaces'
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <Card className="border-0 bg-white/20 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-white/80 text-sm">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <div className="flex gap-2">
              <Button onClick={this.handleReload} className="bg-white/20 hover:bg-white/30 text-white">
                Reload
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoWorkspaces}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Back to Workspaces
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}

export default ErrorBoundary
