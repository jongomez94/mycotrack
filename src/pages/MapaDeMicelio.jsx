import { useState, useEffect } from 'react';
import MicelioGraph from '../components/MicelioGraph';
import Login from '../components/Login';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

export default function MapaDeMicelio() {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#1a1a1a',
        color: '#ffffff'
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#232323', margin: 0, padding: 0, position: 'fixed', top: 0, left: 0 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem 0.5rem 2rem',
        margin: 0
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>Mycotrack</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#e53e3e',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Cerrar sesión
        </button>
      </div>
      <div style={{ width: '100vw', height: 'calc(100vh - 4.5rem)' }}>
        <MicelioGraph updateTrigger={updateTrigger} setUpdateTrigger={setUpdateTrigger} />
      </div>
    </div>
  );
}
