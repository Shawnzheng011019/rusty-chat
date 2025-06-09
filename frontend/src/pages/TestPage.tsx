import React, { useState, useEffect } from 'react';
import { wsService } from '../services/websocket';

export const TestPage: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    runTests();
  }, []);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    addResult('Starting connection tests...');

    // Test API connection
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setApiStatus('success');
        addResult('✅ API connection successful');
      } else {
        setApiStatus('error');
        addResult('❌ API connection failed');
      }
    } catch (error) {
      setApiStatus('error');
      addResult('❌ API connection error: ' + error);
    }

    // Test WebSocket connection
    try {
      wsService.on('connected', () => {
        setWsStatus('connected');
        addResult('✅ WebSocket connection successful');
      });

      wsService.on('disconnected', () => {
        setWsStatus('disconnected');
        addResult('⚠️ WebSocket disconnected');
      });

      wsService.on('max_reconnect_attempts_reached', () => {
        setWsStatus('error');
        addResult('❌ WebSocket connection failed after max retries');
      });

      // Test if WebSocket is already connected
      if (wsService.isConnected()) {
        setWsStatus('connected');
        addResult('✅ WebSocket already connected');
      }
    } catch (error) {
      setWsStatus('error');
      addResult('❌ WebSocket error: ' + error);
    }

    // Test API endpoints
    await testApiEndpoints();
  };

  const testApiEndpoints = async () => {
    const endpoints = [
      { path: '/api/health', method: 'GET', name: 'Health Check' },
      { path: '/api/auth/login', method: 'POST', name: 'Login Endpoint', expectError: true },
      { path: '/api/auth/register', method: 'POST', name: 'Register Endpoint', expectError: true },
    ];

    for (const endpoint of endpoints) {
      try {
        const options: RequestInit = {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (endpoint.method === 'POST') {
          options.body = JSON.stringify({});
        }

        const response = await fetch(endpoint.path, options);
        
        if (endpoint.expectError) {
          addResult(`✅ ${endpoint.name} endpoint accessible (expected error response)`);
        } else if (response.ok) {
          addResult(`✅ ${endpoint.name} endpoint working`);
        } else {
          addResult(`⚠️ ${endpoint.name} endpoint returned ${response.status}`);
        }
      } catch (error) {
        addResult(`❌ ${endpoint.name} endpoint error: ${error}`);
      }
    }
  };

  const testWebSocketMessage = () => {
    if (wsService.isConnected()) {
      wsService.sendMessage({ type: 'ping', data: { timestamp: Date.now() } });
      addResult('📤 Sent test WebSocket message');
    } else {
      addResult('❌ Cannot send message - WebSocket not connected');
    }
  };

  const reconnectWebSocket = () => {
    addResult('🔄 Attempting to reconnect WebSocket...');
    wsService.reconnect();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'loading':
      case 'disconnected':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Connected';
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      case 'loading':
        return 'Loading...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Rusty Chat Connection Test
          </h1>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Status</h3>
              <div className={`text-lg font-medium ${getStatusColor(apiStatus)}`}>
                {getStatusText(apiStatus)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Backend API connection status
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">WebSocket Status</h3>
              <div className={`text-lg font-medium ${getStatusColor(wsStatus)}`}>
                {getStatusText(wsStatus)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Real-time communication status
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Run Tests Again
            </button>
            <button
              onClick={testWebSocketMessage}
              disabled={wsStatus !== 'connected'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test WebSocket Message
            </button>
            <button
              onClick={reconnectWebSocket}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Reconnect WebSocket
            </button>
          </div>

          {/* Test Results */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">No test results yet...</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>1. Make sure the backend is running: <code className="bg-blue-100 px-1 rounded">cargo run</code></p>
              <p>2. Ensure PostgreSQL is running and the database is set up</p>
              <p>3. Verify Redis is running for WebSocket functionality</p>
              <p>4. Check that all environment variables are properly configured</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="/login"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go to Login
            </a>
            <a
              href="/register"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go to Register
            </a>
            <a
              href="/chat"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go to Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
