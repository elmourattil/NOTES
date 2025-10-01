import { Home, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');  // Retour à la page d'accueil
  };

  return (
    <div className="not-found-container" >
      <div className="not-found-content">
        <div className="not-found-icon" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={64} />
        </div>
        
        <div className="not-found-text" style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "6rem", margin: 0 }}>404</h1>
          <h2>Page non trouvée</h2>
          <p>
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <button
          onClick={handleGoHome}
          className="home-button"
          
        >
          <Home size={20} />
          <span>Retour à l'accueil</span>
        </button>
      </div>
    </div>
  );
}

export default NotFound;
