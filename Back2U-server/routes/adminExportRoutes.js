const express = require("express");
const PDFDocument = require("pdfkit");
const verifyIdToken = require("../middleware/verifyFirebase");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

function getDb(req) {
  return req.app.locals.db;
}

/**
 * GET /admin/export/resolved-items-pdf
 * Admin-only PDF export
 */
router.get(
  "/export/resolved-items-pdf",
  verifyIdToken,
  adminOnly,
  async (req, res) => {
    try {
      const db = getDb(req);

      const resolvedItems = await db
        .collection("items")
        .find({ status: "Resolved" })
        .sort({ resolvedAt: -1 })
        .toArray();

      const doc = new PDFDocument({ margin: 40, size: "A4" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=resolved-items-report-${Date.now()}.pdf`
      );

      doc.pipe(res);

      // ===== PDF CONTENT =====
      doc.fontSize(20).text("Back2U – Resolved Items Report", {
        align: "center",
      });

      doc.moveDown();
      doc.fontSize(12).text(`Generated at: ${new Date().toLocaleString()}`);
      doc.moveDown();

      doc.fontSize(14).text(`Total Resolved Items: ${resolvedItems.length}`);
      doc.moveDown();

      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      resolvedItems.forEach((item, index) => {
        doc
          .fontSize(12)
          .text(`${index + 1}. ${item.title}`, { continued: false });

        doc.fontSize(10).text(`Category: ${item.category || "N/A"}`);
        doc.text(`Location: ${item.locationText || item.location || "N/A"}`);
        doc.text(
          `Resolved At: ${
            item.resolvedAt
              ? new Date(item.resolvedAt).toLocaleDateString()
              : "N/A"
          }`
        );

        doc.moveDown(0.5);
      });

      doc.end();
    } catch (err) {
      console.error("PDF export error:", err);
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF report",
      });
    }
  }
);

module.exports = router;
