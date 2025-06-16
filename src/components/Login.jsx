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
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(34, 40, 49, 0.98)',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        width: '100%',
        maxWidth: '380px',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(4px)'
      }}>
        <h2 style={{
          color: '#fff',
          marginBottom: '2rem',
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: '700',
          letterSpacing: '0.02em',
          textShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          Iniciar Sesión
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block',
              color: '#a0aec0',
              marginBottom: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem',
                border: '1.5px solid #31343b',
                borderRadius: '6px',
                background: '#23272f',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
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
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem',
                border: '1.5px solid #31343b',
                borderRadius: '6px',
                background: '#23272f',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              color: '#e53e3e',
              fontSize: '0.95rem',
              padding: '0.75rem',
              background: 'rgba(229, 62, 62, 0.12)',
              borderRadius: '6px',
              textAlign: 'center',
              fontWeight: 500,
              marginBottom: '-0.5rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.95rem',
              background: 'linear-gradient(90deg, #4299e1 0%, #38a1db 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(66,153,225,0.10)',
              letterSpacing: '0.01em',
              transition: 'opacity 0.2s, box-shadow 0.2s'
            }}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
