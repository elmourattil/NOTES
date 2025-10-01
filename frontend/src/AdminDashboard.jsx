import { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard({ onLogout }) {
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin', { replace: true });
      return;
    }
    
    axios
      .get('http://localhost:5000/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAdmin(res.data))
      .catch(() => {
        setError("Session expirée, veuillez vous reconnecter");
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    if (onLogout) onLogout();
    navigate('/admin');
  };

  const handleImportNotes = () => {
    console.log('Navigating to import notes...');
    navigate('/admin/import-notes');
  };

  const handleStudentManagement = () => {
    console.log('Navigating to student management...');
    navigate('/admin/students');
  };

  const handleDocumentRequests = () => {
    console.log('Navigating to document requests...');
    navigate('/admin/document-requests');
  };


  return (
    <div className="notes-container">
      <div className="notes-content">
        <div className="notes-header">
          <div className="student-info">
            <div className="student-avatar">
              <Shield size={24} />
            </div>
            <div className="student-details">
              <h2>Tableau de bord admin</h2>
              <h5>{admin ? admin.email : 'Chargement...'}</h5>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} /> Se déconnecter
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="results-grid">
          <div 
            className="result-card" 
            onClick={handleImportNotes}
            style={{ cursor: 'pointer' }}
          >
            <div className="result-card-header">
              <div className="result-icon average-icon">📄</div>
              <h3>Import des notes</h3>
            </div>
            <div className="result-value" style={{ fontSize: '1rem' }}>
              Cliquez pour accéder
            </div>
          </div>
          
          <div 
            className="result-card" 
            onClick={handleStudentManagement}
            style={{ cursor: 'pointer' }}
          >
            <div className="result-card-header">
              <div className="result-icon status-icon">👥</div>
              <h3>Gestion des étudiants</h3>
            </div>
            <div className="result-value" style={{ fontSize: '1rem' }}>
              Cliquez pour accéder
            </div>
          </div>

          <div 
            className="result-card" 
            onClick={handleDocumentRequests}
            style={{ cursor: 'pointer' }}
          >
            <div className="result-card-header">
              <div className="result-icon status-icon">📋</div>
              <h3>Demandes de Documents</h3>
            </div>
            <div className="result-value" style={{ fontSize: '1rem' }}>
              Cliquez pour accéder
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;


