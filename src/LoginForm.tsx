import React, { useState } from 'react';
import { reducers } from './module_bindings';
import { useReducer } from 'spacetimedb/react';

interface LoginFormProps {
  onSuccess: (username: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const register = useReducer(reducers.register);
  const login = useReducer(reducers.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register({ username, password });
      } else {
        await login({ username, password });
      }
      onSuccess(username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>
          {isRegistering ? 'Register' : 'Login'}
        </h1>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginBottom: '10px',
            }}
          >
            {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Login')}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#007bff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
