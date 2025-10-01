const axios = require("axios");

async function testLogins() {
  const baseURL = "http://localhost:5000/api";
  
  console.log("🧪 Test des connexions...\n");

  // Test connexion admin
  console.log("👨‍💼 Test connexion admin...");
  try {
    const adminResponse = await axios.post(`${baseURL}/admin/login`, {
      email: "admin@ecole.ma",
      password: "admin123"
    });
    console.log("✅ Connexion admin réussie:", adminResponse.data.admin.email);
  } catch (error) {
    console.log("❌ Erreur connexion admin:", error.response?.data?.message || error.message);
  }

  // Test connexion étudiant
  console.log("\n👨‍🎓 Test connexion étudiant...");
  try {
    const studentResponse = await axios.post(`${baseURL}/students/login`, {
      Etud_Numér: 24628096,
      Etud_Naissance: "06/03/2005"
    });
    console.log("✅ Connexion étudiant réussie:", studentResponse.data.student.Etud_Nom);
  } catch (error) {
    console.log("❌ Erreur connexion étudiant:", error.response?.data?.message || error.message);
  }

  // Test avec un autre étudiant
  console.log("\n👨‍🎓 Test connexion étudiant 2...");
  try {
    const studentResponse2 = await axios.post(`${baseURL}/students/login`, {
      Etud_Numér: 24628099,
      Etud_Naissance: "11/04/2005"
    });
    console.log("✅ Connexion étudiant 2 réussie:", studentResponse2.data.student.Etud_Nom);
  } catch (error) {
    console.log("❌ Erreur connexion étudiant 2:", error.response?.data?.message || error.message);
  }
}

testLogins().catch(console.error);
