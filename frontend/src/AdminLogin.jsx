import { useState } from 'react';
import axios from 'axios';
import { Shield, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function AdminLogin({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', {
        email,
        password,
      });
      localStorage.setItem('adminToken', res.data.token);
      if (onLoggedIn) onLoggedIn(res.data.admin);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Shield size={32} />
          </div>
          <h2>Connexion Admin</h2>
          <p>Accédez au panneau d'administration</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="adminEmail" className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                id="adminEmail"
                type="email"
                className="form-input"
                placeholder="ex: admin@ecole.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="adminPassword" className="form-label">Mot de passe</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="adminPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Connexion...' : "Se connecter"}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
            Retour à la connexion étudiant
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;


