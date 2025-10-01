const mongoose = require("mongoose");

const DocumentRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        "attestation_scolarite",
        "releve_notes", 
        "attestation_reussite",
        "certificat_scolarite",
        "attestation_inscription",
        "releve_notes_officiel",
        "autre"
      ]
    },
    customDocumentType: {
      type: String,
      required: function() {
        return this.documentType === "autre";
      }
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending"
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    completionDate: {
      type: Date
    },
    adminNotes: {
      type: String,
      default: ""
    },
    uploadedDocument: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      uploadedAt: Date
    },
    rejectionReason: {
      type: String
    }
  },
  { timestamps: true }
);

// Add indexes for better performance
DocumentRequestSchema.index({ student: 1, status: 1 });
DocumentRequestSchema.index({ documentType: 1 });
DocumentRequestSchema.index({ requestDate: -1 });

module.exports = mongoose.model("DocumentRequest", DocumentRequestSchema);
