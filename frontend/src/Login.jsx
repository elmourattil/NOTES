import { useState } from 'react';
import axios from 'axios';
import { User, Calendar, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

function Login({ setStudentData }) {
  const [etudNum, setEtudNum] = useState('');
  const [etudDate, setEtudDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/students/login', {
        Etud_Numér: Number(etudNum),
        Etud_Naissance: etudDate,
      });

      localStorage.setItem("token", res.data.token);
      setStudentData(res.data.student);
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
            <User size={32} />
          </div>
          <h2>Connexion Étudiant</h2>
          <p>Entrez vos informations pour accéder à vos notes</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="etudNum" className="form-label">Numéro Étudiant</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input
                id="etudNum"
                type="text"
                className="form-input"
                placeholder="Entrez votre numéro étudiant"
                value={etudNum}
                onChange={(e) => setEtudNum(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="etudDate" className="form-label">Date de naissance</label>
            <div className="input-wrapper">
              <Calendar className="input-icon" size={20} />
              <input
                id="etudDate"
                type="text"
                className="form-input"
                placeholder="ex: 06/03/2005"
                value={etudDate}
                onChange={(e) => setEtudDate(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Connexion...' : 'Afficher mes notes'}
          </button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/admin" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Shield size={18} /> Accès admin
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;