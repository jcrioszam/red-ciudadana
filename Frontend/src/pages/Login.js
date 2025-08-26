import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(identificador, password);
      if (success) {
        console.log('Login exitoso, redirigiendo...');
        navigate('/dashboard');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      console.log('Error en login:', err);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Bienvenido a Red Ciudadana</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: 300, gap: 10 }}>
        <input
          type="text"
          placeholder="Correo electrónico o teléfono"
          value={identificador}
          onChange={e => setIdentificador(e.target.value)}
          required
          disabled={isLoading}
          style={{ padding: 10, borderRadius: 5, border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={isLoading}
          style={{ padding: 10, borderRadius: 5, border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: 10, 
            borderRadius: 5, 
            background: isLoading ? '#ccc' : '#1976d2', 
            color: 'white', 
            border: 'none', 
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
}

export default Login; 