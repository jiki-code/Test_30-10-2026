import { Router } from 'express';
import { documentController } from '../controllers/documentController';

const router = Router();

// Templates routes
router.get('/templates', (req, res) => documentController.getTemplates(req, res));
router.get('/templates/:id', (req, res) => documentController.getTemplateById(req, res));
router.post('/templates', (req, res) => documentController.createTemplate(req, res));
router.delete('/templates/:id', (req, res) => documentController.deactivateTemplate(req, res));

// Luồng sử dụng mẫu (Copy-on-write clone)
router.post('/from-template/:templateId', (req, res) => documentController.createDocumentFromTemplate(req, res));

// User documents routes (tài liệu cá nhân của người dùng)
router.get('/my-documents', (req, res) => documentController.getUserDocuments(req, res));
router.get('/my-documents/:id', (req, res) => documentController.getUserDocumentById(req, res));
router.put('/my-documents/:id', (req, res) => documentController.updateUserDocument(req, res));
router.delete('/my-documents/:id', (req, res) => documentController.deleteUserDocument(req, res));

// Export DOCX
router.get('/my-documents/:id/export/docx', (req, res) => documentController.exportDocx(req, res));

export default router;
