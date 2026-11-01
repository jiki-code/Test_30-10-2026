"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const presentationController_1 = require("../controllers/presentationController");
const router = (0, express_1.Router)();
// Presentation templates routes
router.get('/templates', (req, res) => presentationController_1.presentationController.getTemplates(req, res));
router.get('/templates/:id', (req, res) => presentationController_1.presentationController.getTemplateById(req, res));
router.post('/templates', (req, res) => presentationController_1.presentationController.createTemplate(req, res));
router.delete('/templates/:id', (req, res) => presentationController_1.presentationController.deactivateTemplate(req, res));
// Luồng sử dụng mẫu trình chiếu (Copy-on-write clone)
router.post('/from-template/:templateId', (req, res) => presentationController_1.presentationController.createPresentationFromTemplate(req, res));
// User presentations routes (trình chiếu cá nhân của người dùng)
router.get('/my-presentations', (req, res) => presentationController_1.presentationController.getUserPresentations(req, res));
router.get('/my-presentations/:id', (req, res) => presentationController_1.presentationController.getUserPresentationById(req, res));
router.put('/my-presentations/:id', (req, res) => presentationController_1.presentationController.updateUserPresentation(req, res));
router.delete('/my-presentations/:id', (req, res) => presentationController_1.presentationController.deleteUserPresentation(req, res));
// Export PPTX
router.get('/:id/export/pptx', (req, res) => presentationController_1.presentationController.exportPptx(req, res));
exports.default = router;
