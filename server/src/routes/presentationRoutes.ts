import { Router } from 'express';
import { presentationController } from '../controllers/presentationController';

const router = Router();

// Presentation templates routes
router.get('/templates', (req, res) => presentationController.getTemplates(req, res));
router.get('/templates/:id', (req, res) => presentationController.getTemplateById(req, res));
router.post('/templates', (req, res) => presentationController.createTemplate(req, res));
router.delete('/templates/:id', (req, res) => presentationController.deactivateTemplate(req, res));

// Luồng sử dụng mẫu trình chiếu (Copy-on-write clone)
router.post('/from-template/:templateId', (req, res) => presentationController.createPresentationFromTemplate(req, res));

// User presentations routes (trình chiếu cá nhân của người dùng)
router.get('/my-presentations', (req, res) => presentationController.getUserPresentations(req, res));
router.get('/my-presentations/:id', (req, res) => presentationController.getUserPresentationById(req, res));
router.put('/my-presentations/:id', (req, res) => presentationController.updateUserPresentation(req, res));
router.delete('/my-presentations/:id', (req, res) => presentationController.deleteUserPresentation(req, res));

// Export PPTX
router.get('/:id/export/pptx', (req, res) => presentationController.exportPptx(req, res));

export default router;
