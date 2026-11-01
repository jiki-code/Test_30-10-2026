"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = exports.DocumentService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const mysql_1 = require("../db/mysql");
const docx_1 = require("docx");
class DocumentService {
    /**
     * Lấy danh sách các mẫu văn bản từ MySQL (hoặc fallback DB)
     */
    async getTemplates(search, category) {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const templates = await mysql_1.mysqlDb.getTemplates('docx', category, search);
                if (templates !== null) {
                    return templates;
                }
            }
            catch (err) {
                console.warn('MySQL getTemplates error, falling back to local store:', err);
            }
        }
        // Fallback nếu MySQL chưa kết nối
        let templates = database_1.db.getDocumentTemplates();
        if (category && category.trim() !== '' && category.toLowerCase() !== 'all' && category !== 'Tất cả') {
            templates = templates.filter(t => t.category.toLowerCase() === category.toLowerCase());
        }
        if (search && search.trim() !== '') {
            const q = search.toLowerCase().trim();
            templates = templates.filter(t => t.title.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q) ||
                t.tags.some(tag => tag.toLowerCase().includes(q)));
        }
        return templates;
    }
    /**
     * Lấy chi tiết một mẫu văn bản
     */
    async getTemplateById(id) {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const template = await mysql_1.mysqlDb.getTemplateById(id);
                if (template)
                    return template;
            }
            catch (err) {
                console.warn('MySQL getTemplateById error, fallback:', err);
            }
        }
        const template = database_1.db.getDocumentTemplateById(id);
        return template || null;
    }
    /**
     * Ẩn mẫu văn bản (soft delete: is_active = false)
     */
    async deactivateTemplate(id) {
        // Xóa khỏi local JSON trước
        database_1.db.removeDocumentTemplate(id);
        // Set is_active = 0 trên MySQL
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                return await mysql_1.mysqlDb.deactivateTemplate(id);
            }
            catch (err) {
                console.warn('MySQL deactivateTemplate error:', err);
            }
        }
        return true;
    }
    /**
     * Thêm mẫu văn bản mới
     */
    async createTemplate(data) {
        const slug = `doc-tpl-${(0, uuid_1.v4)().substring(0, 8)}`;
        const newTemplate = {
            ...data,
            id: slug,
            isDefault: false,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // Ghi vào MySQL trước (nguồn chính)
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const mysqlId = await mysql_1.mysqlDb.createTemplate({
                    docType: 'docx',
                    name: newTemplate.title,
                    slug: slug,
                    categoryName: newTemplate.category || 'Khác',
                    description: newTemplate.description || '',
                    filePath: `storage/templates/docx/${slug}.docx`,
                    thumbnailPath: newTemplate.thumbnailUrl || '',
                    contentHtml: newTemplate.contentHtml || '',
                    contentJson: newTemplate.contentJson,
                    pageCount: 1,
                    license: 'Người dùng tạo',
                    tags: newTemplate.tags || []
                });
                // Cập nhật id = MySQL id để GET sẽ trả về đúng bản ghi
                if (mysqlId) {
                    newTemplate.id = String(mysqlId);
                }
            }
            catch (err) {
                console.warn('MySQL createTemplate (docx) error:', err);
            }
        }
        // Luôn lưu vào local JSON làm bản backup
        database_1.db.addDocumentTemplate(newTemplate);
        return newTemplate;
    }
    /**
     * LUỒNG SỬ DỤNG MẪU (COPY-ON-WRITE TRÊN MYSQL / DB):
     * Nhân bản nội dung từ template gốc sang một UserDocument độc lập.
     * File template gốc tuyệt đối không bị thay đổi.
     */
    async createDocumentFromTemplate(templateId, customTitle, author = 'Người dùng') {
        const template = await this.getTemplateById(templateId);
        if (!template) {
            throw new Error(`Không tìm thấy mẫu văn bản với ID: ${templateId}`);
        }
        const docId = (0, uuid_1.v4)();
        const finalTitle = customTitle || `${template.title} (Bản làm việc)`;
        // Lưu vào MySQL nếu active
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const numId = !isNaN(Number(templateId)) ? Number(templateId) : null;
                await mysql_1.mysqlDb.createUserDocument({
                    id: docId,
                    templateId: numId,
                    docType: 'docx',
                    title: finalTitle,
                    contentHtml: template.contentHtml,
                    filePath: `storage/documents/${docId}.docx`
                });
            }
            catch (err) {
                console.warn('MySQL createUserDocument error:', err);
            }
        }
        // Luôn đồng bộ vào local DB để đảm bảo tính sẵn sàng
        const newDoc = {
            id: docId,
            templateId: template.id,
            templateTitle: template.title,
            title: finalTitle,
            contentHtml: template.contentHtml,
            contentJson: template.contentJson ? JSON.parse(JSON.stringify(template.contentJson)) : undefined,
            author: author,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        database_1.db.addUserDocument(newDoc);
        return newDoc;
    }
    /**
     * Lấy danh sách tài liệu cá nhân của người dùng
     */
    async getUserDocuments() {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const docs = await mysql_1.mysqlDb.getUserDocuments('docx');
                if (docs !== null)
                    return docs;
            }
            catch (err) {
                console.warn('MySQL getUserDocuments error:', err);
            }
        }
        return database_1.db.getUserDocuments();
    }
    /**
     * Lấy chi tiết tài liệu cá nhân
     */
    async getUserDocumentById(id) {
        return database_1.db.getUserDocumentById(id) || null;
    }
    /**
     * Cập nhật tài liệu cá nhân
     */
    async updateUserDocument(id, updates) {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                await mysql_1.mysqlDb.updateUserDocument(id, {
                    title: updates.title,
                    contentHtml: updates.contentHtml
                });
            }
            catch (err) {
                console.warn('MySQL updateUserDocument error:', err);
            }
        }
        const updated = database_1.db.updateUserDocument(id, updates);
        if (!updated) {
            throw new Error(`Không tìm thấy tài liệu với ID: ${id}`);
        }
        return updated;
    }
    /**
     * Xóa tài liệu cá nhân
     */
    async deleteUserDocument(id) {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                await mysql_1.mysqlDb.deleteUserDocument(id);
            }
            catch (err) {
                console.warn('MySQL deleteUserDocument error:', err);
            }
        }
        return database_1.db.deleteUserDocument(id);
    }
    /**
     * Xuất tài liệu sang định dạng DOCX chuẩn OpenXML
     */
    async exportToDocx(title, htmlContent) {
        const paragraphs = [];
        paragraphs.push(new docx_1.Paragraph({
            text: title,
            heading: docx_1.HeadingLevel.HEADING_1,
            spacing: { after: 300 }
        }));
        const cleanLines = htmlContent
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .split(/<\/(?:p|h1|h2|h3|h4|h5|li|tr|div)>/i);
        for (const rawLine of cleanLines) {
            const stripped = rawLine.replace(/<[^>]+>/g, '').trim();
            if (!stripped)
                continue;
            let isHeading = false;
            let headingLvl = docx_1.HeadingLevel.HEADING_3;
            if (rawLine.includes('<h1')) {
                isHeading = true;
                headingLvl = docx_1.HeadingLevel.HEADING_1;
            }
            else if (rawLine.includes('<h2')) {
                isHeading = true;
                headingLvl = docx_1.HeadingLevel.HEADING_2;
            }
            else if (rawLine.includes('<h3')) {
                isHeading = true;
                headingLvl = docx_1.HeadingLevel.HEADING_3;
            }
            paragraphs.push(new docx_1.Paragraph({
                text: stripped,
                heading: isHeading ? headingLvl : undefined,
                bullet: rawLine.includes('<li') ? { level: 0 } : undefined,
                spacing: { after: 120 }
            }));
        }
        const doc = new docx_1.Document({
            sections: [{ properties: {}, children: paragraphs }]
        });
        return await docx_1.Packer.toBuffer(doc);
    }
}
exports.DocumentService = DocumentService;
exports.documentService = new DocumentService();
