const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const SECRET = process.env.JWT_SECRET || "secret123"; // à sécuriser

// Login route
router.post(
  "/login",
  [
    body("Etud_Numér").isNumeric().withMessage("Numéro invalide"),
    body("Etud_Naissance").isString().withMessage("Date invalide"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { Etud_Numér, Etud_Naissance } = req.body;

    try {
      const student = await Student.findOne({ Etud_Numér, Etud_Naissance });

      if (!student)
        return res.status(401).json({ message: "Numéro ou date incorrecte" });

      const token = jwt.sign(
        { Etud_Numér: student.Etud_Numér, id: student._id },
        SECRET,
        { expiresIn: "2h" }
      );

      res.json({ student, token });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// Route sécurisée pour récupérer les données
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    const student = await Student.findOne({ Etud_Numér: decoded.Etud_Numér });
    if (!student) return res.status(404).json({ message: "Étudiant introuvable" });
    res.json(student);
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
});

router.get("/filieres", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    const filieres = await Student.find({ Etud_Numér: decoded.Etud_Numér })
      .select("_id Etud_Annee Etud_Filiere");

    const mapped = filieres.map(f => ({
      _id: f._id,
      Etud_Annee: f.Etud_Annee || "2024",
      Etud_Filiere: f.Etud_Filiere || "Inconnue"
    }));

    res.json(mapped);
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
});

// Récupérer une fiche complète (notes) par identifiant, sécurisée par token
router.get("/record/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    const { id } = req.params;

    // Assure que l'utilisateur ne peut accéder qu'à ses propres enregistrements
    const record = await Student.findOne({ _id: id, Etud_Numér: decoded.Etud_Numér });
    if (!record) return res.status(404).json({ message: "Fiche introuvable" });

    res.json(record);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token invalide" });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});



module.exports = router;