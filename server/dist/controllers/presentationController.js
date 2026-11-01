"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentationController = exports.PresentationController = void 0;
const presentationService_1 = require("../services/presentationService");
class PresentationController {
    async getTemplates(req, res) {
        try {
            const search = req.query.search;
            const category = req.query.category;
            const templates = await presentationService_1.presentationService.getTemplates(search, category);
            res.json({
                success: true,
                count: templates.length,
                data: templates
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải danh sách mẫu trình chiếu',
                error: error.message
            });
        }
    }
    async getTemplateById(req, res) {
        try {
            const { id } = req.params;
            const template = await presentationService_1.presentationService.getTemplateById(id);
            if (!template) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy bộ mẫu trình chiếu với ID: ${id}`
                });
                return;
            }
            res.json({
                success: true,
                data: template
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải thông tin bộ mẫu trình chiếu',
                error: error.message
            });
        }
    }
    async createTemplate(req, res) {
        try {
            const { title, description, category, tags, thumbnailUrl, theme, slides } = req.body;
            if (!title || !category || !slides || !Array.isArray(slides)) {
                res.status(400).json({
                    success: false,
                    message: 'Tiêu đề, danh mục và danh sách slides là bắt buộc'
                });
                return;
            }
            const template = await presentationService_1.presentationService.createTemplate({
                title,
                description: description || '',
                category,
                tags: tags || [],
                thumbnailUrl: thumbnailUrl || '',
                theme: theme || {
                    name: 'Custom Theme',
                    primaryColor: '#3b82f6',
                    secondaryColor: '#10b981',
                    accentColor: '#f59e0b',
                    backgroundColor: '#0f172a',
                    textColor: '#ffffff',
                    fontHeading: 'Inter, sans-serif',
                    fontBody: 'Inter, sans-serif'
                },
                slides
            });
            res.status(201).json({
                success: true,
                message: 'Thêm mẫu trình chiếu mới thành công',
                data: template
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo mẫu trình chiếu',
                error: error.message
            });
        }
    }
    /**
     * LUỒNG SỬ DỤNG MẪU TRÌNH CHIẾU (COPY-ON-WRITE)
     */
    async createPresentationFromTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const { customTitle, author } = req.body;
            const newPres = await presentationService_1.presentationService.createPresentationFromTemplate(templateId, customTitle, author);
            res.status(201).json({
                success: true,
                message: 'Khởi tạo bản trình chiếu mới từ mẫu thành công (bảo vệ nguyên vẹn mẫu gốc)',
                data: newPres
            });
        }
        catch (error) {
            if (error.message.includes('Không tìm thấy mẫu')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Lỗi khi khởi tạo bản trình chiếu từ mẫu',
                error: error.message
            });
        }
    }
    async getUserPresentations(req, res) {
        try {
            const list = await presentationService_1.presentationService.getUserPresentations();
            res.json({
                success: true,
                count: list.length,
                data: list
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải danh sách bài trình chiếu',
                error: error.message
            });
        }
    }
    async getUserPresentationById(req, res) {
        try {
            const { id } = req.params;
            const pres = await presentationService_1.presentationService.getUserPresentationById(id);
            if (!pres) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy bản trình chiếu với ID: ${id}`
                });
                return;
            }
            res.json({
                success: true,
                data: pres
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải thông tin bản trình chiếu',
                error: error.message
            });
        }
    }
    async updateUserPresentation(req, res) {
        try {
            const { id } = req.params;
            const { title, theme, slides } = req.body;
            const updated = await presentationService_1.presentationService.updateUserPresentation(id, {
                ...(title !== undefined && { title }),
                ...(theme !== undefined && { theme }),
                ...(slides !== undefined && { slides })
            });
            res.json({
                success: true,
                message: 'Cập nhật bản trình chiếu thành công',
                data: updated
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật bản trình chiếu',
                error: error.message
            });
        }
    }
    async deleteUserPresentation(req, res) {
        try {
            const { id } = req.params;
            const success = await presentationService_1.presentationService.deleteUserPresentation(id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy bản trình chiếu để xóa với ID: ${id}`
                });
                return;
            }
            res.json({
                success: true,
                message: 'Đã xóa bản trình chiếu thành công'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa bản trình chiếu',
                error: error.message
            });
        }
    }
    /**
     * Ẩn mẫu trình chiếu (soft delete)
     */
    async deactivateTemplate(req, res) {
        try {
            const { id } = req.params;
            const success = await presentationService_1.presentationService.deactivateTemplate(id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy mẫu trình chiếu với ID: ${id}`
                });
                return;
            }
            res.json({
                success: true,
                message: 'Đã ẩn mẫu trình chiếu thành công'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi ẩn mẫu trình chiếu',
                error: error.message
            });
        }
    }
    async exportPptx(req, res) {
        try {
            const { id } = req.params;
            let pres = await presentationService_1.presentationService.getUserPresentationById(id);
            if (!pres) {
                const tpl = await presentationService_1.presentationService.getTemplateById(id);
                if (tpl) {
                    pres = {
                        id: tpl.id,
                        templateId: tpl.id,
                        title: tpl.title,
                        theme: tpl.theme || {
                            name: 'Default',
                            primaryColor: '#3b82f6',
                            secondaryColor: '#10b981',
                            accentColor: '#f59e0b',
                            backgroundColor: '#0f172a',
                            textColor: '#ffffff',
                            fontHeading: 'Inter, sans-serif',
                            fontBody: 'Inter, sans-serif'
                        },
                        slides: tpl.slides,
                        createdAt: tpl.createdAt,
                        lastModified: tpl.updatedAt,
                        author: 'Hệ thống'
                    };
                }
            }
            if (!pres) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy bản trình chiếu với ID: ${id}`
                });
                return;
            }
            const buffer = await presentationService_1.presentationService.exportToPptx(pres);
            const safeFilename = encodeURIComponent(pres.title.replace(/[^\w\s-]/gi, '')) || 'presentation';
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
            res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pptx"`);
            res.send(buffer);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xuất file PPTX',
                error: error.message
            });
        }
    }
}
exports.PresentationController = PresentationController;
exports.presentationController = new PresentationController();
