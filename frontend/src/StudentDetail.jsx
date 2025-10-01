import { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, LogOut, ArrowLeft, User, Calendar, BookOpen, Award } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

function StudentDetail({ onLogout }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    // Fetch student details
    console.log('Fetching student details for ID:', id);
    axios
      .get(`http://localhost:5000/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Student details response:', res.data);
        setStudent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching student details:', err);
        console.error('Error response:', err.response?.data);
        setError(`Erreur lors du chargement des détails: ${err.response?.data?.message || err.message}`);
        setLoading(false);
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin');
        }
      });
  }, [navigate, id]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    if (onLogout) onLogout();
    navigate('/admin');
  };

  const handleBackToStudents = () => {
    navigate('/admin/students');
  };

  if (loading) {
    return (
      <div className="notes-container">
        <div className="notes-content">
          <div className="notes-header">
            <div className="student-info">
              <div className="student-avatar">
                <Shield size={24} />
              </div>
              <div className="student-details">
                <h2>Détails de l'étudiant</h2>
                <p>Chargement...</p>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notes-container">
        <div className="notes-content">
          <div className="notes-header">
            <div className="student-info">
              <div className="student-avatar">
                <Shield size={24} />
              </div>
              <div className="student-details">
                <h2>Détails de l'étudiant</h2>
                <p>Erreur</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="logout-button" onClick={handleBackToStudents}>
                <ArrowLeft size={18} /> Retour
              </button>
              <button className="logout-button" onClick={handleLogout}>
                <LogOut size={18} /> Se déconnecter
              </button>
            </div>
          </div>
          <div className="error-message">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-container">
      <div className="notes-content">
        <div className="notes-header">
          <div className="student-info">
            <div className="student-avatar">
              <User size={24} />
            </div>
            <div className="student-details">
              <h2>Détails de l'étudiant</h2>
              <p>{student?.Etud_Nom || 'N/A'} - {student?.Etud_Numér}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="logout-button" onClick={handleBackToStudents}>
              <ArrowLeft size={18} /> Retour
            </button>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} /> Se déconnecter
            </button>
          </div>
        </div>

        {/* Student Information Cards */}
        <div className="results-grid">
          {/* Basic Info Card */}
          <div className="result-card">
            <div className="result-card-header">
              <div className="result-icon average-icon">
                <User size={24} />
              </div>
              <h3>Informations personnelles</h3>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Numéro étudiant:</strong> {student?.Etud_Numér || 'N/A'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Nom:</strong> {student?.Etud_Nom || 'N/A'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Date de naissance:</strong> {student?.Etud_Naissance || 'N/A'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Email:</strong> {student?.Etud_Email || 'N/A'}
              </div>
            </div>
          </div>

          {/* Academic Info Card */}
          <div className="result-card">
            <div className="result-card-header">
              <div className="result-icon status-icon">
                <BookOpen size={24} />
              </div>
              <h3>Informations académiques</h3>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Filière:</strong> {student?.Etud_Filiere || 'N/A'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Année:</strong> {student?.Etud_Annee || 'N/A'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Niveau:</strong> {student?.Etud_Niveau || 'N/A'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Groupe:</strong> {student?.Etud_Groupe || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        {student?.matieres && student.matieres.length > 0 && (
          <div className="subjects-table-container" style={{ marginTop: '1.5rem' }}>
            <div className="table-header">
              <h3>Notes et matières</h3>
              <p>Détail des notes par matière</p>
            </div>
            <div className="table-wrapper">
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Matière</th>
                    <th>Note</th>
                    <th>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {student.matieres.map((matiere, index) => (
                    <tr key={index}>
                      <td className="subject-code">{matiere.code || 'N/A'}</td>
                      <td className="subject-name">{matiere.nom || 'N/A'}</td>
                      <td className="subject-grade">{matiere.note || 'N/A'}</td>
                      <td>
                        <span className={`subject-result ${
                          matiere.resultat === 'Admis' ? 'result-success' : 
                          matiere.resultat === 'Ajourné' ? 'result-error' : 'result-warning'
                        }`}>
                          {matiere.resultat || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {student?.moyenne && (
          <div className="results-grid" style={{ marginTop: '1.5rem' }}>
            <div className="result-card">
              <div className="result-card-header">
                <div className="result-icon average-icon">
                  <Award size={24} />
                </div>
                <h3>Moyenne générale</h3>
              </div>
              <div className="result-value">{student.moyenne}</div>
            </div>
            <div className="result-card">
              <div className="result-card-header">
                <div className="result-icon status-icon">
                  <Calendar size={24} />
                </div>
                <h3>Statut</h3>
              </div>
              <div className="result-value" style={{ fontSize: '1rem' }}>
                <span className={`result-status ${
                  student.statut === 'Admis' ? 'result-success' : 
                  student.statut === 'Ajourné' ? 'result-error' : 'result-warning'
                }`}>
                  {student.statut || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDetail;
