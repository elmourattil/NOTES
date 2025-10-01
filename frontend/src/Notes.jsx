import { GraduationCap, Award, BookOpen, LogOut, ArrowLeft } from 'lucide-react';
import "./index.css";

function Notes({ student, filiere, onLogout, onBack }) {
  const subjects = [];

  // Extraire les matières depuis student + filiere
  for (let i = 1; i <= 14; i++) {
    const code = filiere[`Obj${i}_Code`];
    const libelle = filiere[`Obj${i}_Libellé`];
    const note = filiere[`Obj${i}_Note_Ado/20`];
    const pt_jury = filiere[`Obj${i}_PtJury/20`];
    const res = filiere[`Obj${i}_Résultat`];

    if (code) {
      subjects.push({ code, libelle, note, pt_jury, res });
    }
  }

  return (
    <div className="notes-container">
      <div className="notes-content">

        {/* Bouton retour */}
        

        {/* Header */}
        <div className="notes-header">
        {onBack && (
          <button onClick={onBack} className="document-request-btn document-request-btn-secondary">
            <ArrowLeft size={16} />
            <span>Retour aux filières</span>
          </button>
        )}
          <div className="student-info">
            
            <div className="student-avatar">
              <GraduationCap size={24} />
            </div>
            
            <div className="student-details">
              <h2>Bienvenue {student.Etud_Prénom} {student.Etud_Nom}</h2>
              <h5>Numéro étudiant: {student.Etud_Numér}</h5>
              <h5>Filière : {filiere.Etud_Filiere}</h5>
            </div>
          </div>
          
          {onLogout && (
            <button onClick={onLogout} className="logout-button notes-logout-button">
              <LogOut size={16} />
              <span className="button-text">Déconnexion</span>
            </button>
          )}
          
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
              {filiere['Result_Note_Ado/20']}
            </div>
          </div>

          <div className="result-card">
            <div className="result-card-header">
              <div className="result-icon status-icon">
                <BookOpen size={20} />
              </div>
              <h3>Résultat Global</h3>
            </div>
            <div className={`result-status ${filiere.Result_Résultat}`}>
              {filiere.Result_Résultat}
            </div>
          </div>
        </div>

        {/* Tableau des matières */}
        <div className="subjects-table-container">
          <div className="table-header">
            <h3>Détail des Notes par Matière</h3>
            <p>{subjects.length} matière(s) au total</p>
          </div>

          <div className="table-wrapper table-responsive">
            <table className="subjects-table">
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Note</th>
                  <th>Pt jury</th>
                  <th>Résultat</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr key={index}>
                    <td>
                      <div className="subject-name">{subject.libelle}</div>
                    </td>
                    <td>
                      <div className={`subject-grade ${subject.note}`}>
                        {subject.note}
                      </div>
                    </td>
                    <td>
                      <div className={`subject-grade ${subject.pt_jury}`}>
                        {subject.pt_jury && subject.pt_jury > 0 ? subject.pt_jury : ''}
                      </div>
                    </td>
                    <td>
                      <span className={`subject-result ${subject.res}`}>
                        {subject.res}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notes;
