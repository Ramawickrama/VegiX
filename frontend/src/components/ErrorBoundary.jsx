import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #feb2b2', margin: '20px' }}>
                    <h2 style={{ color: '#c53030' }}>⚠️ Something went wrong.</h2>
                    <p style={{ color: '#742a2a', marginBottom: '15px' }}>
                        {this.state.error?.message || 'The dashboard encountered a rendering error.'}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={this.handleRetry}
                            style={{ padding: '10px 20px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ padding: '10px 20px', backgroundColor: '#c53030', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
