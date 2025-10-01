const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Admin = require("../models/Admin");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "admin_secret_123";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'notes-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers CSV sont autorisés'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Test route to verify admin routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Admin routes are working!", timestamp: new Date().toISOString() });
});

// Debug: Log when routes are registered
console.log("Admin routes being registered...");
console.log("Available routes:", router.stack.map(r => r.route?.path).filter(Boolean));

router.post(
  "/login",
  [body("email").isEmail(), body("password").isString().isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
      if (!admin) return res.status(401).json({ message: "Identifiants invalides" });

      const ok = await bcrypt.compare(password, admin.passwordHash);
      if (!ok) return res.status(401).json({ message: "Identifiants invalides" });

      const token = jwt.sign({ id: admin._id, role: "admin" }, SECRET, { expiresIn: "2h" });
      res.json({ token, admin: { id: admin._id, email: admin.email, name: admin.name } });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Accès refusé" });
    const admin = await Admin.findById(decoded.id).select("_id email name");
    if (!admin) return res.status(404).json({ message: "Admin introuvable" });
    res.json(admin);
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
});

// Get all students (admin only)
router.get("/students", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Accès refusé" });
    
    const Student = require("../models/Student");
    // Fetch all student data including notes instead of just basic info
    const students = await Student.find({});
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Erreur serveur lors du chargement des étudiants" });
  }
});

// Get single student details (admin only)
router.get("/students/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Accès refusé" });
    
    const Student = require("../models/Student");
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Étudiant introuvable" });
    
    res.json(student);
  } catch (err) {
    console.error("Error fetching student details:", err);
    res.status(500).json({ message: "Erreur serveur lors du chargement des détails de l'étudiant" });
  }
});

// Update student information (admin only)
router.put("/students/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Accès refusé" });
    
    const Student = require("../models/Student");
    const { Etud_Nom, Etud_Email, Etud_Filiere, Etud_Annee, Etud_Niveau, Etud_Groupe } = req.body;
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { 
        Etud_Nom, 
        Etud_Email, 
        Etud_Filiere, 
        Etud_Annee, 
        Etud_Niveau, 
        Etud_Groupe 
      },
      { new: true, runValidators: true }
    );
    
    if (!student) return res.status(404).json({ message: "Étudiant introuvable" });
    
    res.json(student);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ message: "Erreur serveur lors de la modification de l'étudiant" });
  }
});

// Import notes from CSV file (admin only)
router.post("/import-notes", upload.single('csvFile'), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Accès refusé" });
    
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier CSV fourni" });
    }

    const Student = require("../models/Student");
    const results = [];
    const errors = [];
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Parse CSV file manually to handle French characters properly
    let csvData = [];
    
    try {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      console.log('File content preview (first 500 chars):', fileContent.substring(0, 500));
      
      // Manual CSV parsing to handle French characters
      const lines = fileContent.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('Manual parsing headers:', headers);
        
        // Parse data rows manually
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          csvData.push(row);
        }
        console.log('Manual parsing completed, rows:', csvData.length);
      }
    } catch (readError) {
      console.error('Error reading file:', readError);
      return res.status(500).json({ 
        message: "Erreur lors de la lecture du fichier", 
        error: readError.message 
      });
    }
    
    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      // Get student number
      const studentNumber = row['Etud_Numér'];
      if (!studentNumber) {
        errors.push(`Ligne ${i + 2}: Numéro étudiant manquant. Colonnes disponibles: ${Object.keys(row).join(', ')}`);
        errorCount++;
        continue;
      }
      
      try {
        // Create student data object exactly like manual MongoDB import
        const studentData = {
          Etud_Numér: parseInt(studentNumber),
          Etud_Nom: row['Etud_Nom'] || '',
          Etud_Prénom: row['Etud_Prénom'] || '',
          Etud_Naissance: row['Etud_Naissance'] || '',
          Etud_Filiere: row['Etud_Filiere'] || '',
          Etud_Annee: row['Etud_Annee'] || '',
          Etud_Email: row['Etud_Email'] || '',
          Etud_Groupe: row['Etud_Groupe'] || '',
          Etud_Niveau: row['Etud_Niveau'] || '',
          'Result_Note_Ado/20': parseFloat(row['Result_Note_Ado/20']) || 0,
          'Result_Résultat': row['Result_Résultat'] || '',
          // Subject 1
          'Obj1_Type': row['Obj1_Type'] || '',
          'Obj1_Code': row['Obj1_Code'] || '',
          'Obj1_Libellé': row['Obj1_Libellé'] || '',
          'Obj1_Note_Ado/20': parseFloat(row['Obj1_Note_Ado/20']) || 0,
          'Obj1_Résultat': row['Obj1_Résultat'] || '',
          'Obj1_An/Session': row['Obj1_An/Session'] || '',
          'Obj1_PtJury/20': parseFloat(row['Obj1_PtJury/20']) || 0,
          // Subject 2
          'Obj2_Type': row['Obj2_Type'] || '',
          'Obj2_Code': row['Obj2_Code'] || '',
          'Obj2_Libellé': row['Obj2_Libellé'] || '',
          'Obj2_Note_Ado/20': parseFloat(row['Obj2_Note_Ado/20']) || 0,
          'Obj2_Résultat': row['Obj2_Résultat'] || '',
          'Obj2_An/Session': row['Obj2_An/Session'] || '',
          'Obj2_PtJury/20': parseFloat(row['Obj2_PtJury/20']) || 0,
          // Subject 3
          'Obj3_Type': row['Obj3_Type'] || '',
          'Obj3_Code': row['Obj3_Code'] || '',
          'Obj3_Libellé': row['Obj3_Libellé'] || '',
          'Obj3_Note_Ado/20': parseFloat(row['Obj3_Note_Ado/20']) || 0,
          'Obj3_Résultat': row['Obj3_Résultat'] || '',
          'Obj3_An/Session': row['Obj3_An/Session'] || '',
          'Obj3_PtJury/20': parseFloat(row['Obj3_PtJury/20']) || 0,
          // Subject 4
          'Obj4_Type': row['Obj4_Type'] || '',
          'Obj4_Code': row['Obj4_Code'] || '',
          'Obj4_Libellé': row['Obj4_Libellé'] || '',
          'Obj4_Note_Ado/20': parseFloat(row['Obj4_Note_Ado/20']) || 0,
          'Obj4_Résultat': row['Obj4_Résultat'] || '',
          'Obj4_An/Session': row['Obj4_An/Session'] || '',
          'Obj4_PtJury/20': parseFloat(row['Obj4_PtJury/20']) || 0,
          // Subject 5
          'Obj5_Type': row['Obj5_Type'] || '',
          'Obj5_Code': row['Obj5_Code'] || '',
          'Obj5_Libellé': row['Obj5_Libellé'] || '',
          'Obj5_Note_Ado/20': parseFloat(row['Obj5_Note_Ado/20']) || 0,
          'Obj5_Résultat': row['Obj5_Résultat'] || '',
          'Obj5_An/Session': row['Obj5_An/Session'] || '',
          'Obj5_PtJury/20': parseFloat(row['Obj5_PtJury/20']) || 0,
          // Subject 6
          'Obj6_Type': row['Obj6_Type'] || '',
          'Obj6_Code': row['Obj6_Code'] || '',
          'Obj6_Libellé': row['Obj6_Libellé'] || '',
          'Obj6_Note_Ado/20': parseFloat(row['Obj6_Note_Ado/20']) || 0,
          'Obj6_Résultat': row['Obj6_Résultat'] || '',
          'Obj6_An/Session': row['Obj6_An/Session'] || '',
          'Obj6_PtJury/20': parseFloat(row['Obj6_PtJury/20']) || 0,
          // Subject 7
          'Obj7_Type': row['Obj7_Type'] || '',
          'Obj7_Code': row['Obj7_Code'] || '',
          'Obj7_Libellé': row['Obj7_Libellé'] || '',
          'Obj7_Note_Ado/20': parseFloat(row['Obj7_Note_Ado/20']) || 0,
          'Obj7_Résultat': row['Obj7_Résultat'] || '',
          'Obj7_An/Session': row['Obj7_An/Session'] || '',
          'Obj7_PtJury/20': parseFloat(row['Obj7_PtJury/20']) || 0,
          // Subject 8
          'Obj8_Type': row['Obj8_Type'] || '',
          'Obj8_Code': row['Obj8_Code'] || '',
          'Obj8_Libellé': row['Obj8_Libellé'] || '',
          'Obj8_Note_Ado/20': parseFloat(row['Obj8_Note_Ado/20']) || 0,
          'Obj8_Résultat': row['Obj8_Résultat'] || '',
          'Obj8_An/Session': row['Obj8_An/Session'] || '',
          'Obj8_PtJury/20': parseFloat(row['Obj8_PtJury/20']) || 0,
          // Subject 9
          'Obj9_Type': row['Obj9_Type'] || '',
          'Obj9_Code': row['Obj9_Code'] || '',
          'Obj9_Libellé': row['Obj9_Libellé'] || '',
          'Obj9_Note_Ado/20': parseFloat(row['Obj9_Note_Ado/20']) || 0,
          'Obj9_Résultat': row['Obj9_Résultat'] || '',
          'Obj9_An/Session': row['Obj9_An/Session'] || '',
          'Obj9_PtJury/20': parseFloat(row['Obj9_PtJury/20']) || 0,
          // Subject 10
          'Obj10_Type': row['Obj10_Type'] || '',
          'Obj10_Code': row['Obj10_Code'] || '',
          'Obj10_Libellé': row['Obj10_Libellé'] || '',
          'Obj10_Note_Ado/20': parseFloat(row['Obj10_Note_Ado/20']) || 0,
          'Obj10_Résultat': row['Obj10_Résultat'] || '',
          'Obj10_An/Session': row['Obj10_An/Session'] || '',
          'Obj10_PtJury/20': parseFloat(row['Obj10_PtJury/20']) || 0,
          // Subject 11
          'Obj11_Type': row['Obj11_Type'] || '',
          'Obj11_Code': row['Obj11_Code'] || '',
          'Obj11_Libellé': row['Obj11_Libellé'] || '',
          'Obj11_Note_Ado/20': parseFloat(row['Obj11_Note_Ado/20']) || 0,
          'Obj11_Résultat': row['Obj11_Résultat'] || '',
          'Obj11_An/Session': row['Obj11_An/Session'] || '',
          'Obj11_PtJury/20': parseFloat(row['Obj11_PtJury/20']) || 0,
          // Subject 12
          'Obj12_Type': row['Obj12_Type'] || '',
          'Obj12_Code': row['Obj12_Code'] || '',
          'Obj12_Libellé': row['Obj12_Libellé'] || '',
          'Obj12_Note_Ado/20': parseFloat(row['Obj12_Note_Ado/20']) || 0,
          'Obj12_Résultat': row['Obj12_Résultat'] || '',
          'Obj12_An/Session': row['Obj12_An/Session'] || '',
          'Obj12_PtJury/20': parseFloat(row['Obj12_PtJury/20']) || 0,
          // Subject 13
          'Obj13_Type': row['Obj13_Type'] || '',
          'Obj13_Code': row['Obj13_Code'] || '',
          'Obj13_Libellé': row['Obj13_Libellé'] || '',
          'Obj13_Note_Ado/20': parseFloat(row['Obj13_Note_Ado/20']) || 0,
          'Obj13_Résultat': row['Obj13_Résultat'] || '',
          'Obj13_An/Session': row['Obj13_An/Session'] || '',
          'Obj13_PtJury/20': parseFloat(row['Obj13_PtJury/20']) || 0,
          // Subject 14
          'Obj14_Type': row['Obj14_Type'] || '',
          'Obj14_Code': row['Obj14_Code'] || '',
          'Obj14_Libellé': row['Obj14_Libellé'] || '',
          'Obj14_Note_Ado/20': parseFloat(row['Obj14_Note_Ado/20']) || 0,
          'Obj14_Résultat': row['Obj14_Résultat'] || '',
          'Obj14_An/Session': row['Obj14_An/Session'] || '',
          'Obj14_PtJury/20': parseFloat(row['Obj14_PtJury/20']) || 0
        };
        
        console.log(`Processing student ${studentNumber}:`, studentData);
        
        // Check if student already exists
        const existingStudent = await Student.findOne({ Etud_Numér: parseInt(studentNumber) });
        
        if (existingStudent) {
          // Update existing student
          await Student.findOneAndUpdate(
            { Etud_Numér: parseInt(studentNumber) },
            studentData,
            { new: true, upsert: false }
          );
          updatedCount++;
          results.push(`Étudiant ${studentNumber} mis à jour`);
        } else {
          // Create new student
          const newStudent = new Student(studentData);
          await newStudent.save();
          importedCount++;
          results.push(`Étudiant ${studentNumber} créé`);
        }
        
      } catch (error) {
        console.error(`Error processing student ${studentNumber}:`, error);
        errors.push(`Ligne ${i + 2}: Erreur lors du traitement - ${error.message}`);
        errorCount++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Import terminé",
      importedCount,
      updatedCount,
      errorCount,
      totalProcessed: csvData.length,
      results: results.slice(0, 10), // Show first 10 results
      errors: errors.slice(0, 10), // Show first 10 errors
      hasMoreResults: results.length > 10,
      hasMoreErrors: errors.length > 10
    });

  } catch (err) {
    console.error('Import error:', err);
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token invalide" });
    }
    res.status(500).json({ message: "Erreur serveur lors de l'import" });
  }
});

module.exports = router;


