const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Atlas connecté avec succès"))
  .catch((err) => console.error("Erreur de connexion MongoDB Atlas:", err));

const studentRoutes = require("./routes/student");
const adminRoutes = require("./routes/admin");
const documentRequestRoutes = require("./routes/documentRequest");

app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/document-requests", documentRequestRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Serveur démarré sur le port ${process.env.PORT}`);
});