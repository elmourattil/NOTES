import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, X, ArrowLeft, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function NotesImport({ onLogout }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Test component loading
  console.log('NotesImport component loaded');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Veuillez sélectionner un fichier CSV valide');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(0, 6); // First 6 lines (header + 5 data rows)
        const preview = lines.map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return { line: index + 1, values };
        });
        setPreviewData(preview);
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus({ type: 'loading', message: 'Import en cours...' });
    
    const formData = new FormData();
    formData.append('csvFile', selectedFile);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5000/api/admin/import-notes', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus({
        type: 'success',
        message: 'Import réussi !',
        details: response.data
      });
      
      // Clear file after successful upload
      setSelectedFile(null);
      setPreviewData([]);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Erreur lors de l\'import',
        details: error.response?.data || error.message
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setError('');
    setUploadStatus(null);
  };

  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('adminToken');
      navigate('/admin');
    }
  };

  return (
    <div className="notes-container">
      <div className="notes-content">
        <div className="notes-header">
          <div className="student-info">
            <div className="student-avatar">
              <Upload size={24} />
            </div>
            <div className="student-details">
              <h2>Import des notes</h2>
              <h5>Importez les notes des étudiants depuis un fichier CSV</h5>
            </div>
          </div>
          <div className="header-actions">
            <button className="back-button" onClick={handleBackToDashboard}>
              <ArrowLeft size={16} /> Retour
            </button>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} /> Se déconnecter
            </button>
          </div>
        </div>

        <div className="upload-section">

          <div className="instructions-section">
            <h4 style={{ marginBottom: '0.5rem', color: '#0c4a6e' }}>
              Instructions d'import
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#0c4a6e', margin: 0 }}>
              Le fichier CSV doit contenir les colonnes suivantes : Etud_Numér, Etud_Nom, Etud_Prénom, 
              Etud_Naissance, Etud_Filiere, Result_Note_Ado/20, Result_Résultat, et les colonnes Obj1_* à Obj14_* 
              pour chaque matière.
            </p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <div className="file-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="#64748b" />
              <span style={{ fontWeight: '500' }}>
                {selectedFile ? selectedFile.name : 'Aucun fichier sélectionné'}
              </span>
            </div>
            {selectedFile && (
              <button className="remove-file-btn" onClick={handleRemoveFile}>
                <X size={14} />
              </button>
            )}
          </div>

          {!selectedFile && (
            <button className="file-select-btn" onClick={() => document.getElementById('file-input').click()}>
              <Upload size={16} />
              Sélectionner un fichier CSV
            </button>
          )}

          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {selectedFile && (
            <button 
              className="upload-btn" 
              onClick={handleUpload}
              disabled={uploadStatus?.type === 'loading'}
            >
              {uploadStatus?.type === 'loading' ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid currentColor', borderRadius: '50%' }}></div>
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Importer les notes
                </>
              )}
            </button>
          )}

          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.type}`}>
              <div className="status-header">
                {uploadStatus.type === 'success' ? '✅ ' : '❌ '}
                {uploadStatus.message}
              </div>
              {uploadStatus.details && (
                <div className="status-details">
                  <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {JSON.stringify(uploadStatus.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {previewData.length > 0 && (
            <div className="preview-section">
              <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
                Aperçu du fichier (premières lignes)
              </h4>
              <div className="subjects-table-container">
                <table className="subjects-table">
                  <thead>
                    <tr>
                      <th>Ligne</th>
                      {previewData[0]?.values.map((_, index) => (
                        <th key={index}>Colonne {index + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td style={{ fontWeight: '600', color: '#64748b' }}>{row.line}</td>
                        {row.values.map((value, colIndex) => (
                          <td key={colIndex} className="preview-note">
                            {value || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesImport;
