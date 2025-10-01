import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, LogOut, ArrowLeft, Users, Search, Eye, Edit, BookOpen, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditStudentModal from './EditStudentModal';
import AdminStudentNotes from './AdminStudentNotes';

function StudentManagement({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState(new Set());
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentNotes, setShowStudentNotes] = useState(false);
  const navigate = useNavigate();

  // Test component loading
  console.log('StudentManagement component loaded');
  console.log('Current adminData from localStorage:', localStorage.getItem('adminToken') ? 'Token exists' : 'No token');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No admin token found, redirecting to admin login');
      navigate('/admin');
      return;
    }

    console.log('Fetching students with token:', token.substring(0, 20) + '...');

    // Fetch all students with notes
    axios
      .get('http://localhost:5000/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Students fetched successfully:', res.data);
        setStudents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching students:', err);
        console.error('Error response:', err.response);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
        
        setError(`Erreur lors du chargement des étudiants: ${err.response?.data?.message || err.message}`);
        setLoading(false);
        
        if (err.response?.status === 401) {
          console.log('Unauthorized, removing token and redirecting');
          localStorage.removeItem('adminToken');
          navigate('/admin');
        } else if (err.code === 'ECONNREFUSED') {
          setError('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.');
        }
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    if (onLogout) onLogout();
    navigate('/admin');
  };

  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleSaveStudent = (updatedStudent) => {
    setStudents(students.map(student => 
      student._id === updatedStudent._id ? updatedStudent : student
    ));
  };

  const handleViewStudentNotes = (student) => {
    setSelectedStudent(student);
    setShowStudentNotes(true);
  };

  const handleBackToList = () => {
    setShowStudentNotes(false);
    setSelectedStudent(null);
  };

  const toggleExpanded = (studentId) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // Function to extract subjects from student data
  const extractSubjects = (student) => {
    const subjects = [];
    for (let i = 1; i <= 14; i++) {
      const code = student[`Obj${i}_Code`];
      const libelle = student[`Obj${i}_Libellé`];
      const note = student[`Obj${i}_Note_Ado/20`];
      const pt_jury = student[`Obj${i}_PtJury/20`];
      const res = student[`Obj${i}_Résultat`];

      if (code) {
        subjects.push({ code, libelle, note, pt_jury, res });
      }
    }
    return subjects;
  };

  // Calculate average grade for a student
  const calculateAverage = (student) => {
    const subjects = extractSubjects(student);
    if (subjects.length === 0) return 0;
    
    const total = subjects.reduce((sum, subject) => sum + (subject.note || 0), 0);
    return (total / subjects.length).toFixed(2);
  };

  // Get global result for a student
  const getGlobalResult = (student) => {
    return student['Result_Résultat'] || 'N/A';
  };

  // Filter students based on search term (nom, prénom, ou code apogée)
  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    const nom = student.Etud_Nom?.toLowerCase() || '';
    const prenom = student.Etud_Prénom?.toLowerCase() || '';
    const codeApogee = student.Etud_Numér?.toString() || '';
    
    // Recherche par nom complet
    const nomComplet = `${prenom} ${nom}`;
    
    return (
      nom.includes(searchLower) ||
      prenom.includes(searchLower) ||
      nomComplet.includes(searchLower) ||
      codeApogee.includes(searchTerm) || // Recherche exacte pour le code apogée
      codeApogee.startsWith(searchTerm) // Recherche par les premiers numéros
    );
  });

  if (loading) {
    return (
      <div className="notes-container">
        <div className="notes-content">
          <div className="loading">Chargement des étudiants...</div>
        </div>
      </div>
    );
  }

  // If there's an error and no students, show error page
  if (error && students.length === 0) {
    return (
      <div className="notes-container">
        <div className="notes-content">
          <div className="notes-header">
            <button className="document-request-btn document-request-btn-secondary" onClick={handleBackToDashboard}>
              <ArrowLeft size={16} /> Retour au tableau de bord
            </button>
            <div className="student-info">
              <div className="student-avatar">
                <Users size={24} />
              </div>
              <div className="student-details">
                <h2>Gestion des étudiants</h2>
                <p>Administration des données étudiantes</p>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} /> Se déconnecter
            </button>
          </div>

          <div className="error-message" style={{ margin: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>Erreur de chargement</h3>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="back-button" 
                onClick={() => window.location.reload()}
                style={{ background: '#4f46e5' }}
              >
                🔄 Recharger la page
              </button>
              <button className="back-button" onClick={handleBackToDashboard}>
                <ArrowLeft size={16} /> Retour au tableau de bord
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering StudentManagement with students:', students.length, 'loading:', loading, 'error:', error);

  // Si on affiche les notes d'un étudiant spécifique
  if (showStudentNotes && selectedStudent) {
    return (
      <AdminStudentNotes
        student={selectedStudent}
        onBack={handleBackToList}
        onEdit={handleEditStudent}
        onLogout={handleLogout}
      />
    );
  }

  // Version simplifiée pour debug
  if (students.length === 0 && !loading && !error) {
    return (
      <div className="notes-container">
        <div className="notes-content">
          <div className="notes-header">
          <button className="document-request-btn document-request-btn-secondary" onClick={handleBackToDashboard}>
            <ArrowLeft size={16} /> Retour au tableau de bord
          </button>
            <div className="student-info">
              <div className="student-avatar">
                <Users size={24} />
              </div>
              <div className="student-details">
                <h2>Gestion des étudiants</h2>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} /> Se déconnecter
            </button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>Aucun étudiant trouvé</h3>
            <p>Vérifiez que des données sont présentes dans la base de données.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-container">
      <div className="notes-content">
        <div className="notes-header">
          <button className="document-request-btn document-request-btn-secondary" onClick={handleBackToDashboard}>
            <ArrowLeft size={16} /> Retour au tableau de bord
          </button>
          <div className="student-info">
            <div className="student-avatar">
              <Users size={24} />
            </div>
            <div className="student-details">
              <h2>Gestion des étudiants</h2>
              <p>Administration des données étudiantes</p>
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

        <div className="table-header">
          <div className="student-management-header">
            <div className="search-container">
              <div className="input-wrapper">
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou code apogée..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>
          <h3>Liste des étudiants ({filteredStudents.length})</h3>
          <p>Cliquez sur "Notes" pour voir les notes détaillées d'un étudiant</p>
        </div>

        <div className="subjects-table-container table-responsive">
          <table className="students-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Filière</th>
                <th>Groupe</th>
                <th>Moyenne</th>
                <th>Résultat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#e0e7ff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#4f46e5'
                      }}>
                        {student.Etud_Prénom?.[0]}{student.Etud_Nom?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {student.Etud_Prénom} {student.Etud_Nom}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {student.Etud_Numér}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{student.Etud_Filiere || 'N/A'}</td>
                  <td>{student.Etud_Groupe || 'N/A'}</td>
                  <td className="student-average">
                    {calculateAverage(student)}/20
                  </td>
                  <td>
                    <span className="student-result" style={{
                      background: getGlobalResult(student) === 'Admis' ? '#dcfce7' : 
                                 getGlobalResult(student) === 'VAC' ? '#dbeafe' : '#fef2f2',
                      color: getGlobalResult(student) === 'Admis' ? '#166534' : 
                             getGlobalResult(student) === 'VAC' ? '#1d4ed8' : '#991b1b'
                    }}>
                      {getGlobalResult(student)}
                    </span>
                  </td>
                  <td>
                    <div className="student-actions">
                      <button
                        className="expand-button action-button action-button-primary"
                        onClick={() => handleViewStudentNotes(student)}
                      >
                        <Eye size={12} />
                        <span className="action-text">Notes</span>
                      </button>
                      <button
                        className="expand-button action-button action-button-success"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit size={12} />
                        <span className="action-text">Modifier</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && editingStudent && (
        <EditStudentModal
          student={editingStudent}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveStudent}
        />
      )}
    </div>
  );
}

export default StudentManagement;
