"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const router = (0, express_1.Router)();
// Templates routes
router.get('/templates', (req, res) => documentController_1.documentController.getTemplates(req, res));
router.get('/templates/:id', (req, res) => documentController_1.documentController.getTemplateById(req, res));
router.post('/templates', (req, res) => documentController_1.documentController.createTemplate(req, res));
router.delete('/templates/:id', (req, res) => documentController_1.documentController.deactivateTemplate(req, res));
// Luồng sử dụng mẫu (Copy-on-write clone)
router.post('/from-template/:templateId', (req, res) => documentController_1.documentController.createDocumentFromTemplate(req, res));
// User documents routes (tài liệu cá nhân của người dùng)
router.get('/my-documents', (req, res) => documentController_1.documentController.getUserDocuments(req, res));
router.get('/my-documents/:id', (req, res) => documentController_1.documentController.getUserDocumentById(req, res));
router.put('/my-documents/:id', (req, res) => documentController_1.documentController.updateUserDocument(req, res));
router.delete('/my-documents/:id', (req, res) => documentController_1.documentController.deleteUserDocument(req, res));
// Export DOCX
router.get('/my-documents/:id/export/docx', (req, res) => documentController_1.documentController.exportDocx(req, res));
exports.default = router;
