const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const DocumentRequest = require("../models/DocumentRequest");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/documents");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow PDF files
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

// Middleware to verify student authentication
const verifyStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    req.student = student;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Middleware to verify admin authentication
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token manquant" });
    }
    
    const token = authHeader.split(" ")[1];
    const jwt = require("jsonwebtoken");
    const SECRET = process.env.ADMIN_JWT_SECRET;
    
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    const { adminId } = req.params;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Verify that the token admin ID matches the requested admin ID
    if (decoded.id !== adminId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Student routes

// Middleware to verify student from JWT token
const verifyStudentFromToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token manquant" });
    }
    
    const token = authHeader.split(" ")[1];
    const jwt = require("jsonwebtoken");
    const SECRET = process.env.STUDENT_JWT_SECRET;
    
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== "student") {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    const student = await Student.findById(decoded.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    req.student = student;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all document requests for current student (using JWT token)
router.get("/student/me", verifyStudentFromToken, async (req, res) => {
  try {
    const requests = await DocumentRequest.find({ student: req.student._id })
      .populate("student", "Etud_Numér Etud_Nom Etud_Prénom Etud_Naissance Etud_Filiere email")
      .sort({ requestDate: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new document request for current student
router.post("/student/me", verifyStudentFromToken, async (req, res) => {
  try {
    const { documentType, customDocumentType } = req.body;
    
    const request = new DocumentRequest({
      student: req.student._id,
      documentType,
      customDocumentType: documentType === 'autre' ? customDocumentType : undefined
    });
    
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all document requests for a student
router.get("/student/:studentId", verifyStudent, async (req, res) => {
  try {
    const requests = await DocumentRequest.find({ student: req.student._id })
      .sort({ requestDate: -1 })
      .populate("student", "Etud_Numér Etud_Nom Etud_Prénom Etud_Naissance Etud_Filiere email");
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a new document request
router.post("/student/:studentId", [
  verifyStudent,
  body("documentType").isIn([
    "attestation_scolarite",
    "releve_notes", 
    "attestation_reussite",
    "certificat_scolarite",
    "attestation_inscription",
    "releve_notes_officiel",
    "autre"
  ]).withMessage("Invalid document type"),
  body("customDocumentType").optional().isLength({ min: 3, max: 100 }).withMessage("Custom document type must be 3-100 characters")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentType, customDocumentType } = req.body;

    // Validate custom document type if document type is "autre"
    if (documentType === "autre" && !customDocumentType) {
      return res.status(400).json({ message: "Custom document type is required when document type is 'autre'" });
    }

    const documentRequest = new DocumentRequest({
      student: req.student._id,
      documentType,
      customDocumentType: documentType === "autre" ? customDocumentType : undefined
    });

    await documentRequest.save();
    await documentRequest.populate("student", "Etud_Numér Etud_Nom Etud_Prénom Etud_Naissance Etud_Filiere email");

    res.status(201).json(documentRequest);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get a specific document request for a student
router.get("/student/:studentId/:requestId", verifyStudent, async (req, res) => {
  try {
    const request = await DocumentRequest.findOne({
      _id: req.params.requestId,
      student: req.student._id
    }).populate("student", "Etud_Numér Etud_Nom Etud_Prénom Etud_Naissance Etud_Filiere email");

    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Admin routes

// Get all document requests (admin view)
router.get("/admin/:adminId", verifyAdmin, async (req, res) => {
  try {
    const { 
      status, 
      documentType, 
      page = 1, 
      limit = 10,
      search,
      sortBy = "requestDate",
      sortOrder = "desc"
    } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (documentType) filter.documentType = documentType;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    let query = DocumentRequest.find(filter)
      .populate("student", "Etud_Numér Etud_Nom Etud_Prénom Etud_Naissance Etud_Filiere email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Apply search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = query.or([
        { 'student.Etud_Nom': searchRegex },
        { 'student.Etud_Prénom': searchRegex },
        { 'student.Etud_Numér': searchRegex },
        { 'student.Etud_Filiere': searchRegex }
      ]);
    }

    const requests = await query;
    const total = await DocumentRequest.countDocuments(filter);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update document request status
router.patch("/admin/:adminId/:requestId", [
  verifyAdmin,
  body("status").isIn(["pending", "processing", "completed", "rejected"]).withMessage("Invalid status"),
  body("adminNotes").optional().isLength({ max: 500 }).withMessage("Admin notes must be less than 500 characters"),
  body("rejectionReason").optional().isLength({ max: 500 }).withMessage("Rejection reason must be less than 500 characters")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, adminNotes, rejectionReason } = req.body;
    const request = await DocumentRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    request.status = status;
    if (adminNotes) request.adminNotes = adminNotes;
    if (rejectionReason) request.rejectionReason = rejectionReason;
    
    if (status === "completed") {
      request.completionDate = new Date();
    }

    await request.save();
    await request.populate("student", "Etud_Numér Etud_Nom Etud_Prénom Etud_Naissance Etud_Filiere email");

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Upload document for a request
router.post("/admin/:adminId/:requestId/upload", [
  verifyAdmin,
  upload.single("document")
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const request = await DocumentRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    // Update the request with uploaded document info
    request.uploadedDocument = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date()
    };
    request.status = "completed";
    request.completionDate = new Date();

    await request.save();
    await request.populate("student", "Etud_Numér Etud_Nom Etud_Prénom Etud_Naissance Etud_Filiere email");

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Download document
router.get("/download/:requestId", async (req, res) => {
  try {
    const request = await DocumentRequest.findById(req.params.requestId);
    if (!request || !request.uploadedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    const filePath = request.uploadedDocument.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, request.uploadedDocument.originalName);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get document request statistics
router.get("/admin/:adminId/stats", verifyAdmin, async (req, res) => {
  try {
    const stats = await DocumentRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const documentTypeStats = await DocumentRequest.aggregate([
      {
        $group: {
          _id: "$documentType",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusStats: stats,
      documentTypeStats: documentTypeStats
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
