// frontend/src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Login from "./Login";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import StudentManagement from "./StudentManagement";
import StudentDetail from "./StudentDetail";
import StudentNotesView from "./StudentNotesView";
import Notes from "./Notes";
import NotFound from "./NotFound";
import SelectFiliere from "./SelectFiliere";
import NotesImport from "./NotesImport";
import DocumentRequests from "./DocumentRequests";
import AdminDocumentRequests from "./AdminDocumentRequests";


function App() {
  const [studentData, setStudentData] = useState(null); // infos globales étudiant
  const [selectedFiliere, setSelectedFiliere] = useState(null); // filière choisie
  const [adminData, setAdminData] = useState(null); // infos admin
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:5000/api/students/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setStudentData(res.data))
        .catch(() => {
          localStorage.removeItem("token");
          setStudentData(null); // Clear student data on token error
        });
    }

    
  }, []);

  // Validate admin token on load
  useEffect(() => {
    const aToken = localStorage.getItem("adminToken");
    if (aToken) {
      axios
        .get("http://localhost:5000/api/admin/me", {
          headers: { Authorization: `Bearer ${aToken}` },
        })
        .then((res) => setAdminData(res.data))
        .catch(() => {
          localStorage.removeItem("adminToken");
          setAdminData(null);
        });
    } else {
      setAdminData(null);
    }
  }, []);

  return (
    <Routes>
      {/* Student Login Page */}
      <Route
        path="/"
        element={
          !studentData ? (
            <Login setStudentData={setStudentData} />
          ) : (
            <Navigate to="/select-filiere" />
          )
        }
      />

      {/* Admin Login */}
      <Route
        path="/admin"
        element={
          !adminData ? (
            <AdminLogin onLoggedIn={(admin) => setAdminData(admin)} />
          ) : (
            <Navigate to="/admin/dashboard" />
          )
        }
      />

      {/* Admin Dashboard (protected) */}
      <Route
        path="/admin/dashboard"
        element={adminData ? <AdminDashboard onLogout={() => setAdminData(null)} /> : <Navigate to="/admin" />}
      />

      {/* Student Management (protected) */}
      <Route
        path="/admin/students"
        element={adminData ? <StudentManagement onLogout={() => setAdminData(null)} /> : <Navigate to="/admin" />}
      />

      {/* Student Detail (protected) */}
      <Route
        path="/admin/students/:id"
        element={adminData ? <StudentDetail onLogout={() => setAdminData(null)} /> : <Navigate to="/admin" />}
      />

      {/* Student Notes View (protected) */}
      <Route
        path="/admin/students/:id/notes"
        element={adminData ? <StudentNotesView onLogout={() => setAdminData(null)} /> : <Navigate to="/admin" />}
      />

      {/* Notes Import (protected) */}
      <Route
        path="/admin/import-notes"
        element={adminData ? <NotesImport onLogout={() => setAdminData(null)} /> : <Navigate to="/admin" />}
      />

      {/* Admin Document Requests (protected) */}
      <Route
        path="/admin/document-requests"
        element={adminData ? <AdminDocumentRequests onLogout={() => setAdminData(null)} /> : <Navigate to="/admin" />}
      />

      {/* Select Filière */}
      <Route
        path="/select-filiere"
        element={
          studentData ? (
            <SelectFiliere
              student={studentData}
              onSelect={(filiere) => {
                setSelectedFiliere(filiere);
                navigate("/notes");
              }}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* Notes */}
      <Route
        path="/notes"
        element={
          studentData && selectedFiliere ? (
            <Notes
              student={studentData}
              filiere={selectedFiliere}
              onLogout={() => {
                localStorage.removeItem("token");
                setStudentData(null);
                setSelectedFiliere(null);
                navigate("/");
              }}
              onBack={() => {
                setSelectedFiliere(null);
                navigate("/select-filiere");
              }}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* Student Document Requests */}
      <Route
        path="/document-requests"
        element={
          studentData ? (
            <DocumentRequests
              student={studentData}
              onLogout={() => {
                localStorage.removeItem("token");
                setStudentData(null);
                setSelectedFiliere(null);
                navigate("/");
              }}
              onBack={() => navigate("/select-filiere")}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      
        
      

      


      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;