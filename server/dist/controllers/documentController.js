"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentController = exports.DocumentController = void 0;
const documentService_1 = require("../services/documentService");
class DocumentController {
    async getTemplates(req, res) {
        try {
            const search = req.query.search;
            const category = req.query.category;
            const templates = await documentService_1.documentService.getTemplates(search, category);
            res.json({
                success: true,
                count: templates.length,
                data: templates
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải danh sách mẫu văn bản',
                error: error.message
            });
        }
    }
    async getTemplateById(req, res) {
        try {
            const { id } = req.params;
            const template = await documentService_1.documentService.getTemplateById(id);
            if (!template) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy mẫu văn bản với ID: ${id}`
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
                message: 'Lỗi khi tải thông tin mẫu văn bản',
                error: error.message
            });
        }
    }
    async createTemplate(req, res) {
        try {
            const { title, description, category, tags, thumbnailUrl, contentHtml } = req.body;
            if (!title || !category || !contentHtml) {
                res.status(400).json({
                    success: false,
                    message: 'Tiêu đề, danh mục và nội dung HTML là bắt buộc'
                });
                return;
            }
            const template = await documentService_1.documentService.createTemplate({
                title,
                description: description || '',
                category,
                tags: tags || [],
                thumbnailUrl: thumbnailUrl || '',
                contentHtml,
                isOfficial: false
            });
            res.status(201).json({
                success: true,
                message: 'Thêm mẫu văn bản mới thành công',
                data: template
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo mẫu văn bản',
                error: error.message
            });
        }
    }
    /**
     * LUỒNG SỬ DỤNG MẪU (COPY-ON-WRITE)
     */
    async createDocumentFromTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const { customTitle, author } = req.body;
            const newDoc = await documentService_1.documentService.createDocumentFromTemplate(templateId, customTitle, author);
            res.status(201).json({
                success: true,
                message: 'Khởi tạo tài liệu mới từ mẫu thành công (bảo vệ nguyên vẹn mẫu gốc)',
                data: newDoc
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
                message: 'Lỗi khi khởi tạo tài liệu từ mẫu',
                error: error.message
            });
        }
    }
    async getUserDocuments(req, res) {
        try {
            const docs = await documentService_1.documentService.getUserDocuments();
            res.json({
                success: true,
                count: docs.length,
                data: docs
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải danh sách tài liệu cá nhân',
                error: error.message
            });
        }
    }
    async getUserDocumentById(req, res) {
        try {
            const { id } = req.params;
            const doc = await documentService_1.documentService.getUserDocumentById(id);
            if (!doc) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy tài liệu với ID: ${id}`
                });
                return;
            }
            res.json({
                success: true,
                data: doc
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải tài liệu',
                error: error.message
            });
        }
    }
    async updateUserDocument(req, res) {
        try {
            const { id } = req.params;
            const { title, contentHtml, contentJson } = req.body;
            const updated = await documentService_1.documentService.updateUserDocument(id, {
                ...(title !== undefined && { title }),
                ...(contentHtml !== undefined && { contentHtml }),
                ...(contentJson !== undefined && { contentJson })
            });
            res.json({
                success: true,
                message: 'Cập nhật tài liệu thành công',
                data: updated
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật tài liệu',
                error: error.message
            });
        }
    }
    async deleteUserDocument(req, res) {
        try {
            const { id } = req.params;
            const success = await documentService_1.documentService.deleteUserDocument(id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy tài liệu để xóa với ID: ${id}`
                });
                return;
            }
            res.json({
                success: true,
                message: 'Đã xóa tài liệu thành công'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa tài liệu',
                error: error.message
            });
        }
    }
    /**
     * Ẩn mẫu văn bản (soft delete: is_active = false)
     */
    async deactivateTemplate(req, res) {
        try {
            const { id } = req.params;
            const success = await documentService_1.documentService.deactivateTemplate(id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy mẫu văn bản với ID: ${id}`
                });
                return;
            }
            res.json({
                success: true,
                message: 'Đã ẩn mẫu văn bản thành công'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi ẩn mẫu văn bản',
                error: error.message
            });
        }
    }
    async exportDocx(req, res) {
        try {
            const { id } = req.params;
            const doc = await documentService_1.documentService.getUserDocumentById(id);
            if (!doc) {
                res.status(404).json({
                    success: false,
                    message: `Không tìm thấy tài liệu với ID: ${id}`
                });
                return;
            }
            const buffer = await documentService_1.documentService.exportToDocx(doc.title, doc.contentHtml);
            const safeFilename = encodeURIComponent(doc.title.replace(/[^\w\s-]/gi, '')) || 'document';
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
            res.send(buffer);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xuất file DOCX',
                error: error.message
            });
        }
    }
}
exports.DocumentController = DocumentController;
exports.documentController = new DocumentController();
