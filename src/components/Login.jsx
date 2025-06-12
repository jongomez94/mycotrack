import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'El email no es válido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        default:
          errorMessage = 'Error al iniciar sesión';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#1a1a1a',
      padding: '20px'
    }}>
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{
          color: '#ffffff',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          Iniciar Sesión
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              color: '#a0aec0',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #4a5568',
                borderRadius: '4px',
                background: '#1a1a1a',
                color: '#ffffff',
                fontSize: '1rem'
              }}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              color: '#a0aec0',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #4a5568',
                borderRadius: '4px',
                background: '#1a1a1a',
                color: '#ffffff',
                fontSize: '1rem'
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              color: '#e53e3e',
              fontSize: '0.875rem',
              padding: '0.5rem',
              background: 'rgba(229, 62, 62, 0.1)',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.75rem',
              background: '#4299e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
