import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Perfil() {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setLogo(e.target.files[0]);
    setPreview(URL.createObjectURL(e.target.files[0]));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!logo) return;
    const formData = new FormData();
    formData.append('file', logo);
    try {
      await axios.post('https://red-ciudadana-production.up.railway.app/admin/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSuccess('Logo actualizado correctamente');
    } catch (err) {
      setError('Error al subir el logo');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
      <h2 style={{ marginBottom: 20 }}>Perfil Administrador</h2>
      <form onSubmit={handleUpload}>
        <label style={{ fontWeight: 'bold' }}>Logo institucional:</label>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ margin: '12px 0' }} />
        {preview && <img src={preview} alt="Preview" style={{ maxWidth: 200, marginTop: 10, borderRadius: 8 }} />}
        <button type="submit" style={{ marginTop: 16, padding: 10, borderRadius: 5, background: '#1976d2', color: 'white', border: 'none', fontWeight: 'bold' }}>
          Actualizar logo institucional
        </button>
        {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </form>
      <button onClick={handleLogout} style={{ marginTop: 32, padding: 10, borderRadius: 5, background: '#d32f2f', color: 'white', border: 'none', fontWeight: 'bold', width: '100%' }}>
        Cerrar sesión
      </button>
    </div>
  );
} 