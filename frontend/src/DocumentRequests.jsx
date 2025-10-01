import { useState, useEffect } from "react";
import axios from "axios";

const DocumentRequests = ({ student, onBack, onLogout }) => {
  const [requests, setRequests] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newRequest, setNewRequest] = useState({
    documentType: "",
    customDocumentType: ""
  });

  const documentTypes = [
    { value: "attestation_scolarite", label: "Attestation de Scolarité" },
    { value: "releve_notes", label: "Relevé des Notes" },
    { value: "attestation_reussite", label: "Attestation de Réussite" },
    { value: "certificat_scolarite", label: "Certificat de Scolarité" },
    { value: "attestation_inscription", label: "Attestation d'Inscription" },
    { value: "releve_notes_officiel", label: "Relevé des Notes Officiel" },
    { value: "autre", label: "Autre" }
  ];

  const statusLabels = {
    pending: "En attente",
    processing: "En cours de traitement",
    completed: "Terminé",
    rejected: "Rejeté"
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/document-requests/student/${student._id}`
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestData = {
        documentType: newRequest.documentType,
        ...(newRequest.documentType === "autre" && {
          customDocumentType: newRequest.customDocumentType
        })
      };

      await axios.post(
        `http://localhost:5000/api/document-requests/student/${student._id}`,
        requestData
      );

      setNewRequest({ documentType: "", customDocumentType: "" });
      setShowNewRequest(false);
      fetchRequests();
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Erreur lors de la création de la demande");
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (requestId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/document-requests/download/${requestId}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Erreur lors du téléchargement du document");
    }
  };

  return (
    <div className="document-request-container">
      {/* Header */}
      <div className="document-request-header">
        <div className="document-request-header-content">
          <div className="document-request-header-inner">
            <div>
              <h1 className="document-request-title">
                Demandes de Documents
              </h1>
              <h5>
                Gérez vos demandes de documents administratifs
              </h5>
              {student && (
                <div className="student-header-info">
                  <p><strong>Étudiant:</strong> {student.Etud_Prénom} {student.Etud_Nom}</p>
                  <p><strong>Numéro:</strong> {student.Etud_Numér} | <strong>Filière:</strong> {student.Etud_Filiere}</p>
                </div>
              )}
            </div>
            <div className="document-request-actions">
              <button
                onClick={() => setShowNewRequest(true)}
                className="document-request-btn document-request-btn-primary"
              >
                Nouvelle Demande
              </button>
              <button
                onClick={onBack}
                className="document-request-btn document-request-btn-secondary"
              >
                Retour
              </button>
              <button
                onClick={onLogout}
                className="document-request-btn document-request-btn-danger"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="document-request-main">
        {/* New Request Modal */}
        {showNewRequest && (
          <div className="document-request-modal">
            <div className="document-request-modal-content">
              <h2 className="document-request-modal-title">Nouvelle Demande de Document</h2>
              <form onSubmit={handleSubmitRequest} className="document-request-modal-form">
                <div className="document-request-modal-group">
                  <label className="document-request-modal-label">
                    Type de Document
                  </label>
                  <select
                    value={newRequest.documentType}
                    onChange={(e) => setNewRequest({ ...newRequest, documentType: e.target.value })}
                    className="document-request-modal-input"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    {documentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {newRequest.documentType === "autre" && (
                  <div className="document-request-modal-group">
                    <label className="document-request-modal-label">
                      Précisez le type de document
                    </label>
                    <input
                      type="text"
                      value={newRequest.customDocumentType}
                      onChange={(e) => setNewRequest({ ...newRequest, customDocumentType: e.target.value })}
                      className="document-request-modal-input"
                      placeholder="Ex: Attestation de stage, Certificat de présence..."
                      required
                    />
                  </div>
                )}

                <div className="document-request-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowNewRequest(false)}
                    className="document-request-modal-btn document-request-modal-btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="document-request-modal-btn document-request-modal-btn-primary"
                  >
                    {loading ? "Envoi..." : "Envoyer la Demande"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Requests List */}
        <div className="document-request-card">
          <div className="document-request-card-header">
            <h2 className="document-request-card-title">Mes Demandes</h2>
          </div>

          <div className="document-request-card-body">
            {requests.length === 0 ? (
              <div className="document-request-empty">
                <div className="document-request-empty-icon">📄</div>
                <h3 className="document-request-empty-title">
                  Aucune demande pour le moment
                </h3>
                <p className="document-request-empty-description">
                  Créez votre première demande de document
                </p>
              </div>
            ) : (
              <div>
                {requests.map((request) => (
                  <div key={request._id} className="document-request-item">
                    <div className="document-request-item-header">
                      <h3 className="document-request-item-title">
                        {request.documentType === "autre" 
                          ? request.customDocumentType 
                          : documentTypes.find(t => t.value === request.documentType)?.label}
                      </h3>
                      <span className={`document-request-item-status ${statusColors[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>
                    <div className="document-request-item-meta">
                      Demandé le {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                    </div>
                    {request.adminNotes && (
                      <div className="document-request-item-notes">
                        <strong>Note de l'administration:</strong> {request.adminNotes}
                      </div>
                    )}
                    {request.rejectionReason && (
                      <div className="document-request-item-notes" style={{color: '#dc2626'}}>
                        <strong>Raison du rejet:</strong> {request.rejectionReason}
                      </div>
                    )}
                    <div className="document-request-item-actions">
                      {request.status === "completed" && request.uploadedDocument && (
                        <button
                          onClick={() => downloadDocument(request._id)}
                          className="btn-download"
                        >
                          Télécharger
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentRequests;
