const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("../models/Admin");
const Student = require("../models/Student");

async function diagnose() {
  try {
    console.log("🔍 Diagnostic de la base de données...");
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connexion MongoDB réussie");

    // Vérifier les admins
    const adminCount = await Admin.countDocuments();
    console.log(`📊 Nombre d'admins: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log("⚠️  Aucun admin trouvé. Création d'un admin par défaut...");
      const passwordHash = await bcrypt.hash("admin123", 10);
      const admin = await Admin.create({
        email: "admin@ecole.ma",
        passwordHash: passwordHash,
        name: "Administrateur"
      });
      console.log("✅ Admin créé:", admin.email, "Mot de passe: admin123");
    } else {
      const admins = await Admin.find().select("email name");
      console.log("👥 Admins existants:", admins);
    }

    // Vérifier les étudiants
    const studentCount = await Student.countDocuments();
    console.log(`📊 Nombre d'étudiants: ${studentCount}`);
    
    if (studentCount === 0) {
      console.log("⚠️  Aucun étudiant trouvé. Création d'un étudiant de test...");
      const testStudent = await Student.create({
        Etud_Numér: 12345,
        Etud_Nom: "Test",
        Etud_Prénom: "Étudiant",
        Etud_Naissance: "01/01/2000",
        Etud_Filiere: "Informatique",
        Etud_Annee: "2024",
        Etud_Email: "test@ecole.ma",
        Etud_Groupe: "A",
        Etud_Niveau: "1",
        'Result_Note_Ado/20': 15.5,
        'Result_Résultat': "Admis"
      });
      console.log("✅ Étudiant de test créé:", testStudent.Etud_Numér);
    } else {
      const sampleStudents = await Student.find().limit(3).select("Etud_Numér Etud_Nom Etud_Prénom Etud_Naissance");
      console.log("👥 Échantillon d'étudiants:", sampleStudents);
    }

    console.log("\n🎯 Informations de connexion:");
    console.log("👨‍💼 Admin: admin@ecole.ma / admin123");
    console.log("👨‍🎓 Étudiant: 12345 / 01/01/2000");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnexion MongoDB");
  }
}

diagnose();
