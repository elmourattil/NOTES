import { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, LogOut, ArrowLeft, User, BookOpen, Award } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

function StudentNotesView({ onLogout }) {
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

    // Fetch student details with notes
    console.log('Fetching student notes for ID:', id);
    axios
      .get(`http://localhost:5000/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Student notes response:', res.data);
        setStudent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching student notes:', err);
        console.error('Error response:', err.response?.data);
        setError(`Erreur lors du chargement des notes: ${err.response?.data?.message || err.message}`);
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
                <h2>Notes de l'étudiant</h2>
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
                <h2>Notes de l'étudiant</h2>
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
              <h2>Notes de l'étudiant</h2>
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

        {/* Summary Cards */}
        <div className="results-grid">
          <div className="result-card">
            <div className="result-card-header">
              <div className="result-icon average-icon">
                <Award size={24} />
              </div>
              <h3>Moyenne générale</h3>
            </div>
            <div className="result-value">{student?.moyenne || 'N/A'}</div>
          </div>
          <div className="result-card">
            <div className="result-card-header">
              <div className="result-icon status-icon">
                <BookOpen size={24} />
              </div>
              <h3>Statut</h3>
            </div>
            <div className="result-value" style={{ fontSize: '1rem' }}>
              <span className={`result-status ${
                student?.statut === 'Admis' ? 'result-success' : 
                student?.statut === 'Ajourné' ? 'result-error' : 'result-warning'
              }`}>
                {student?.statut || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="subjects-table-container">
          <div className="table-header">
            <h3>Détail des notes</h3>
            <p>Notes par matière pour {student?.Etud_Filiere} - {student?.Etud_Annee}</p>
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
                {student?.matieres && student.matieres.length > 0 ? (
                  student.matieres.map((matiere, index) => (
                    <tr key={index}>
                      <td className="subject-code">{matiere.code || 'N/A'}</td>
                      <td className="subject-name">{matiere.nom || 'N/A'}</td>
                      <td className={`subject-grade ${
                        matiere.note >= 16 ? 'grade-excellent' :
                        matiere.note >= 14 ? 'grade-good' :
                        matiere.note >= 12 ? 'grade-average' :
                        matiere.note >= 10 ? 'grade-pass' : 'grade-fail'
                      }`}>
                        {matiere.note || 'N/A'}
                      </td>
                      <td>
                        <span className={`subject-result ${
                          matiere.resultat === 'Admis' ? 'result-success' : 
                          matiere.resultat === 'Ajourné' ? 'result-error' : 'result-warning'
                        }`}>
                          {matiere.resultat || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                      Aucune note disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentNotesView;
