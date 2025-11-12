import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // optionally log to console/server
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: '#fee', color: '#900', minHeight: '100vh' }}>
          <h1>Application Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
          <details style={{ whiteSpace: 'pre-wrap' }}>{this.state.info?.componentStack}</details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
