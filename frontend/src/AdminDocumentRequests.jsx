import { useState, useEffect } from "react";
import axios from "axios";

const AdminDocumentRequests = ({ onLogout }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    documentType: ""
  });
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', message: string }

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3500);
  };

  const documentTypes = [
    { value: "attestation_scolarite", label: "Attestation de Scolarité" },
    { value: "releve_notes", label: "Relevé des Notes" },
    { value: "attestation_reussite", label: "Attestation de Réussite" },
    { value: "certificat_scolarite", label: "Certificat de Scolarité" },
    { value: "attestation_inscription", label: "Attestation d'Inscription" },
    { value: "releve_notes_officiel", label: "Relevé des Notes Officiel" },
    { value: "autre", label: "Autre" }
  ];

  const statusOptions = [
    { value: "", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "processing", label: "En cours" },
    { value: "completed", label: "Terminé" },
    { value: "rejected", label: "Rejeté" }
  ];

  // Get admin ID from token
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setAdminId(payload.id);
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  }, []);

  // Fetch requests
  const fetchRequests = async () => {
    if (!adminId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.documentType) params.append("documentType", filters.documentType);

      const response = await axios.get(
        `http://localhost:5000/api/document-requests/admin/${adminId}?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = response.data.requests || response.data;
      setRequests(data);
      if (Array.isArray(data)) {
        showToast("info", `${data.length} demande(s) chargée(s)`);
      }
    } catch (error) {
      setError("Erreur lors du chargement des demandes");
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [adminId, filters]);

  const handleStatusChange = async (requestId, status, notes = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(
        `http://localhost:5000/api/document-requests/admin/${adminId}/${requestId}`,
        { status, adminNotes: notes, rejectionReason: status === "rejected" ? rejectionReason : undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchRequests();
      setShowStatusModal(false);
      setShowRejectModal(false);
      setRejectionReason("");
      setAdminNotes("");
      const label = getStatusLabel(status);
      showToast("success", `Statut mis à jour: ${label}`);
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("error", "Erreur lors de la mise à jour du statut");
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedRequest) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("document", uploadFile);
      
      await axios.post(
        `http://localhost:5000/api/document-requests/admin/${adminId}/${selectedRequest._id}/upload`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      fetchRequests();
      setShowUploadModal(false);
      setUploadFile(null);
      setSelectedRequest(null);
      showToast("success", "Document uploadé avec succès");
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast("error", "Échec de l'upload du document");
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (request, status) => {
    setSelectedRequest(request);
    setNewStatus(status);
    if (status === "rejected") {
      setShowRejectModal(true);
    } else {
      setShowStatusModal(true);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "document-request-status-pending",
      processing: "document-request-status-processing", 
      completed: "document-request-status-completed",
      rejected: "document-request-status-rejected"
    };
    return badges[status] || "document-request-status-pending";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "En attente",
      processing: "En cours",
      completed: "Terminé",
      rejected: "Rejeté"
    };
    return labels[status] || status;
  };

  const getDocumentTypeLabel = (type) => {
    const typeObj = documentTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="document-request-container">
        <div className="document-request-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-request-container admin-doc-requests">
      <div className="document-request-header">
        <div className="header-grid">
        
          <div className="header-left">
          <button onClick={() => window.history.back()} className="filter-back-btn">
        ← Retour
        </button>          </div>
          <h1 className="header-title">Gestion des Demandes de Documents</h1>
          <div className="header-right">
            
            <button onClick={onLogout} className="logout-btn">Déconnexion</button>
          </div>
        </div>
      </div>

      <div className="document-request-main">
        {/* Filters */}
        <div className="document-request-filters advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="filter-select"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Type de document</label>
              <select
                value={filters.documentType}
                onChange={(e) => setFilters({...filters, documentType: e.target.value})}
                className="filter-select"
              >
                <option value="">Tous les types</option>
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-actions">
              <button onClick={() => setFilters({status: "", documentType: ""})} className="filter-reset-btn">
                Réinitialiser
              </button>
              
              
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="document-request-results">
          {error && (
            <div className="document-request-error">
              <p>{error}</p>
            </div>
          )}

          {requests.length === 0 ? (
            <div className="document-request-empty">
              <p>Aucune demande trouvée</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "document-request-grid" : "document-request-list"}>
              {requests.map((request) => (
                <div key={request._id} className={`document-request-card ${viewMode === 'list' ? 'list-layout' : ''}`}>
                  <div className="request-header">
                    <div className="request-info">
                      <h3>{getDocumentTypeLabel(request.documentType)}</h3>
                      <span className={`document-request-status ${getStatusBadge(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <div className="request-date">
                      {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {request.student && (
                    <div className="student-info-card">
                      <h4>Informations de l'étudiant:</h4>
                      <div className="student-details-grid">
                        <div className="student-detail-item">
                          <p><strong>Numéro:</strong> {request.student.Etud_Numér || 'Non disponible'}</p>
                          <p><strong>Nom:</strong> {request.student.Etud_Nom || 'Non disponible'}</p>
                          <p><strong>Prénom:</strong> {request.student.Etud_Prénom || 'Non disponible'}</p>
                        </div>
                        <div className="student-detail-item">
                          <p><strong>Date de naissance:</strong> {request.student.Etud_Naissance || 'Non disponible'}</p>
                          <p><strong>Filière:</strong> {request.student.Etud_Filiere || 'Non disponible'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="request-info">
                    {request.customDocumentType && (
                      <p><strong>Type personnalisé:</strong> {request.customDocumentType}</p>
                    )}
                    {request.adminNotes && (
                      <p><strong>Notes admin:</strong> {request.adminNotes}</p>
                    )}
                    {request.rejectionReason && (
                      <p><strong>Raison du rejet:</strong> {request.rejectionReason}</p>
                    )}
                    {request.uploadedDocument && (
                      <p><strong>Document uploadé:</strong> {request.uploadedDocument.filename}</p>
                    )}
                  </div>

                  <div className="request-actions">
                    {request.status === "pending" && (
                      <>
                        <button
                          onClick={() => openStatusModal(request, "processing")}
                          className="document-request-item-btn document-request-btn-primary"
                        >
                          ⏳ Marquer en cours
                        </button>
                        <button
                          onClick={() => openStatusModal(request, "rejected")}
                          className="document-request-item-btn document-request-btn-danger"
                        >
                          ❌ Rejeter
                        </button>
                      </>
                    )}
                    {request.status === "processing" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowUploadModal(true);
                          }}
                          className="document-request-item-btn document-request-btn-success"
                        >
                          📤 Upload PDF
                        </button>
                        <button
                          onClick={() => openStatusModal(request, "rejected")}
                          className="document-request-item-btn document-request-btn-danger"
                        >
                          ❌ Rejeter
                        </button>
                      </>
                    )}
                    {request.status === "rejected" && (
                      <button
                        onClick={() => openStatusModal(request, "processing")}
                        className="document-request-item-btn document-request-btn-primary"
                      >
                        🔄 Réactiver
                      </button>
                    )}
                    {request.uploadedDocument && (
                      <button
                        onClick={() => window.open(`http://localhost:5000/api/document-requests/download/${request._id}`, '_blank')}
                        className="document-request-item-btn document-request-btn-info"
                      >
                        📥 Télécharger
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="document-request-modal">
          <div className="modal-content">
            <h3>Changer le statut</h3>
            <p>Changer le statut vers: <strong>{getStatusLabel(newStatus)}</strong></p>
            <textarea
              placeholder="Notes administratives (optionnel)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="modal-textarea"
            />
            <div className="modal-actions">
              <button
                onClick={() => handleStatusChange(selectedRequest._id, newStatus, adminNotes)}
                className="document-request-btn-primary"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="document-request-btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="document-request-modal">
          <div className="modal-content">
            <h3>Rejeter la demande</h3>
            <textarea
              placeholder="Raison du rejet (obligatoire)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="modal-textarea"
              required
            />
            <div className="modal-actions">
              <button
                onClick={() => handleStatusChange(selectedRequest._id, "rejected", rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="document-request-btn-danger"
              >
                Rejeter
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="document-request-btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="document-request-modal">
          <div className="modal-content">
            <h3>Uploader un document</h3>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="modal-file-input"
            />
            <div className="modal-actions">
              <button
                onClick={handleFileUpload}
                disabled={!uploadFile || loading}
                className="document-request-btn-success"
              >
                {loading ? "Upload en cours..." : "Uploader"}
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="document-request-btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className={`toast ${toast.type ? `toast-${toast.type}` : ''}`} role="status" aria-live="polite">
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)} aria-label="Fermer">×</button>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentRequests;