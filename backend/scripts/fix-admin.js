const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("../models/Admin");

async function fixAdmin() {
  try {
    console.log("🔧 Correction du mot de passe admin...");
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connexion MongoDB réussie");

    // Supprimer l'admin existant et en créer un nouveau
    await Admin.deleteMany({});
    console.log("🗑️  Anciens admins supprimés");

    // Créer un nouvel admin avec un mot de passe simple
    const passwordHash = await bcrypt.hash("admin123", 10);
    const admin = await Admin.create({
      email: "admin@ecole.ma",
      passwordHash: passwordHash,
      name: "Administrateur"
    });
    
    console.log("✅ Nouvel admin créé:");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Mot de passe: admin123");
    console.log("👤 Nom:", admin.name);

    // Vérifier que le mot de passe fonctionne
    const testPassword = await bcrypt.compare("admin123", admin.passwordHash);
    console.log("🧪 Test mot de passe:", testPassword ? "✅ OK" : "❌ Échec");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnexion MongoDB");
  }
}

fixAdmin();
