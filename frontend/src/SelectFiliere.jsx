import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SelectFiliere({ onSelect }) {
  const navigate = useNavigate();
  const [filieres, setFilieres] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get("http://localhost:5000/api/students/filieres", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setFilieres(res.data))
    .catch(() => alert("Erreur lors du chargement des filières"));
  }, []);

  const handleSelect = (id) => {
    const token = localStorage.getItem("token");
    axios.get(`http://localhost:5000/api/students/record/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => onSelect(res.data))
    .catch(() => alert("Erreur lors du chargement de la fiche"));
  };

  return (
    <div className="select-filiere-container">
      <div className="select-filiere-card">
        <h2>Choisissez votre filière / année</h2>
        <div className="filiere-buttons">
          {filieres.map(f => (
            <button
              key={f._id}
              className="filiere-button"
              onClick={() => handleSelect(f._id)}
            >
              {f.Etud_Annee} - {f.Etud_Filiere}
            </button>
          ))}
        </div>
        <div className="filiere-buttons">
          <button
            className="filiere-button"
            onClick={() => navigate("/document-requests")}
          >
            📄 Demandes de Documents
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectFiliere;
