import React, { useState } from 'react';
import { GraduationCap, Award, BookOpen, LogOut, ArrowLeft, Users, Search, Edit } from 'lucide-react';
import "./index.css";

function AdminStudentNotes({ student, onBack, onEdit, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());

  // Extraire les matières depuis les données de l'étudiant
  const extractSubjects = (student) => {
    const subjects = [];
    for (let i = 1; i <= 14; i++) {
      const code = student[`Obj${i}_Code`];
      const libelle = student[`Obj${i}_Libellé`];
      const note = student[`Obj${i}_Note_Ado/20`];
      const pt_jury = student[`Obj${i}_PtJury/20`];
      const res = student[`Obj${i}_Résultat`];

      if (code) {
        subjects.push({ 
          code, 
          libelle, 
          note: note || 0, 
          pt_jury: pt_jury || 0, 
          res: res || 'N/A' 
        });
      }
    }
    return subjects;
  };

  const subjects = extractSubjects(student);

  // Calculer la moyenne générale
  const calculateAverage = () => {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((sum, subject) => sum + (subject.note || 0), 0);
    return (total / subjects.length).toFixed(2);
  };

  // Obtenir le résultat global
  const getGlobalResult = () => {
    return student['Result_Résultat'] || 'N/A';
  };

  // Filtrer les matières selon la recherche
  const filteredSubjects = subjects.filter(subject =>
    subject.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSubjectExpanded = (index) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSubjects(newExpanded);
  };

  return (
    <div className="notes-container">
      <div className="notes-content">
        {/* Header */}
        <div className="notes-header">
          {onBack && (
            <button onClick={onBack} className="document-request-btn document-request-btn-secondary">
              <ArrowLeft size={16} />
              <span>Retour à la liste</span>
            </button>
          )}
          <div className="student-info">
            <div className="student-avatar">
              <GraduationCap size={24} />
            </div>
            <div className="student-details">
              <h2>{student.Etud_Prénom} {student.Etud_Nom}</h2>
              <p>Numéro étudiant: {student.Etud_Numér}</p>
              <p>Filière: {student.Etud_Filiere} - Groupe: {student.Etud_Groupe}</p>
            </div>
          </div>
          <div className="admin-notes-actions">
            {onEdit && (
              <button 
                onClick={() => onEdit(student)} 
                className="action-button action-button-success"
              >
                <Edit size={16} />
                <span className="button-text">Modifier</span>
              </button>
            )}
            {onLogout && (
              <button onClick={onLogout} className="logout-button admin-action-button">
                <LogOut size={16} />
                <span className="button-text">Déconnexion</span>
              </button>
            )}
          </div>
        </div>

        {/* Résultats globaux */}
        <div className="results-grid">
          <div className="result-card">
            <div className="result-card-header">
              <div className="result-icon average-icon">
                <Award size={20} />
              </div>
              <h3>Moyenne Générale</h3>
            </div>
            <div className="result-value">
              {calculateAverage()}/20
            </div>
          </div>

          <div className="result-card">
            <div className="result-card-header">
              <div className="result-icon status-icon">
                <BookOpen size={20} />
              </div>
              <h3>Résultat Global</h3>
            </div>
            <div className="result-value">
              <span className="student-result" style={{
                background: getGlobalResult() === 'Admis' ? '#dcfce7' : 
                           getGlobalResult() === 'VAC' ? '#dbeafe' : '#fef2f2',
                color: getGlobalResult() === 'Admis' ? '#166534' : 
                       getGlobalResult() === 'VAC' ? '#1d4ed8' : '#991b1b',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                {getGlobalResult()}
              </span>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="table-header">
          <div className="student-management-header">
            <h3>Détail des Notes par Matière</h3>
            <div className="search-container">
              <div className="input-wrapper">
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Rechercher une matière..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>
          <p>{filteredSubjects.length} matière(s) trouvée(s)</p>
        </div>

        {/* Tableau des matières */}
        <div className="subjects-table-container table-responsive">
          <table className="subjects-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Matière</th>
                <th>Note/20</th>
                <th>Points Jury</th>
                <th>Résultat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((subject, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className="subject-code">{subject.code}</td>
                    <td>
                      <div className="subject-name">{subject.libelle}</div>
                    </td>
                    <td>
                      <div className={`subject-grade ${subject.note >= 10 ? 'grade-pass' : 'grade-fail'}`}>
                        {subject.note}/20
                      </div>
                    </td>
                    <td>
                      <div className={`subject-grade ${subject.pt_jury >= 10 ? 'grade-pass' : 'grade-fail'}`}>
                        {subject.pt_jury && subject.pt_jury > 0 ? `${subject.pt_jury}/20` : ''}
                      </div>
                    </td>
                    <td>
                      <span className="subject-result" style={{
                        background: subject.res === 'V' ? '#dcfce7' : 
                                   subject.res === 'AC' ? '#fef2f2' : '#fef3c7',
                        color: subject.res === 'V' ? '#166534' : 
                               subject.res === 'AC' ? '#991b1b' : '#92400e'
                      }}>
                        {subject.res}
                      </span>
                    </td>
                    <td>
                      <button
                        className="expand-button action-button action-button-secondary action-button-small"
                        onClick={() => toggleSubjectExpanded(index)}
                      >
                        {expandedSubjects.has(index) ? 'Masquer' : 'Détails'}
                      </button>
                    </td>
                  </tr>
                  {expandedSubjects.has(index) && (
                    <tr>
                      <td colSpan="6" style={{ padding: '0', background: '#f8fafc' }}>
                        <div className="subject-details-expanded">
                          <h4 className="subject-details-title">
                            Détails de {subject.libelle}
                          </h4>
                          <div className="subject-details-grid">
                            <div className="detail-item">
                              <strong>Code matière:</strong> {subject.code}
                            </div>
                            <div className="detail-item">
                              <strong>Note étudiant:</strong> {subject.note}/20
                            </div>
                            <div className="detail-item">
                              <strong>Points jury:</strong> {subject.pt_jury && subject.pt_jury > 0 ? `${subject.pt_jury}/20` : 'N/A'}
                            </div>
                            <div className="detail-item">
                              <strong>Résultat:</strong> {subject.res}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Message si aucune matière trouvée */}
        {filteredSubjects.length === 0 && searchTerm && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#64748b',
            background: '#f8fafc',
            borderRadius: '8px',
            margin: '1rem 0'
          }}>
            <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>Aucune matière trouvée</h3>
            <p>Essayez avec un autre terme de recherche</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminStudentNotes;
