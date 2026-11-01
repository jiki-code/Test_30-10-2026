"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentationService = exports.PresentationService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const mysql_1 = require("../db/mysql");
const pptxgenjs_1 = __importDefault(require("pptxgenjs"));
class PresentationService {
    /**
     * Lấy danh sách mẫu trình chiếu từ MySQL (hoặc fallback)
     */
    async getTemplates(search, category) {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const templates = await mysql_1.mysqlDb.getTemplates('pptx', category, search);
                if (templates !== null) {
                    return templates;
                }
            }
            catch (err) {
                console.warn('MySQL getPresentationTemplates error, falling back:', err);
            }
        }
        let templates = database_1.db.getPresentationTemplates();
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
     * Lấy chi tiết bộ mẫu trình chiếu
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
        const template = database_1.db.getPresentationTemplateById(id);
        return template || null;
    }
    /**
     * Ẩn mẫu trình chiếu (soft delete: is_active = false)
     * Ở tab trình chiếu cho phép ẩn cả mẫu có is_default = true theo yêu cầu
     */
    async deactivateTemplate(id) {
        database_1.db.removePresentationTemplate(id);
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                return await mysql_1.mysqlDb.deactivateTemplate(id);
            }
            catch (err) {
                console.warn('MySQL deactivateTemplate (pptx) error:', err);
            }
        }
        return true;
    }
    /**
     * Thêm bộ mẫu trình chiếu mới
     */
    async createTemplate(data) {
        const slug = `pres-tpl-${(0, uuid_1.v4)().substring(0, 8)}`;
        const newTemplate = {
            ...data,
            id: slug,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // Ghi vào MySQL trước (nguồn chính)
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const mysqlId = await mysql_1.mysqlDb.createTemplate({
                    docType: 'pptx',
                    name: newTemplate.title,
                    slug: slug,
                    categoryName: newTemplate.category || 'Khác',
                    description: newTemplate.description || '',
                    filePath: `storage/templates/pptx/${slug}.pptx`,
                    thumbnailPath: newTemplate.thumbnailUrl || '',
                    contentHtml: '',
                    contentJson: { theme: newTemplate.theme, slides: newTemplate.slides },
                    pageCount: (newTemplate.slides || []).length || 1,
                    license: 'Người dùng tạo',
                    tags: newTemplate.tags || []
                });
                if (mysqlId) {
                    newTemplate.id = String(mysqlId);
                }
            }
            catch (err) {
                console.warn('MySQL createTemplate (pptx) error:', err);
            }
        }
        // Luôn lưu vào local JSON làm bản backup
        database_1.db.addPresentationTemplate(newTemplate);
        return newTemplate;
    }
    /**
     * LUỒNG SỬ DỤNG MẪU TRÌNH CHIẾU (COPY-ON-WRITE TRÊN MYSQL / DB):
     * Nhân bản toàn bộ cấu trúc theme và mảng slides sang UserPresentation mới.
     * Gán ID mới cho từng slide trong bản sao, bảo vệ dữ liệu gốc tuyệt đối.
     */
    async createPresentationFromTemplate(templateId, customTitle, author = 'Người dùng') {
        const template = await this.getTemplateById(templateId);
        if (!template) {
            throw new Error(`Không tìm thấy mẫu trình chiếu với ID: ${templateId}`);
        }
        // Deep clone danh sách slide và gán ID mới cho từng slide
        const clonedSlides = (template.slides || []).map((s, index) => ({
            ...JSON.parse(JSON.stringify(s)),
            id: `usr-s-${(0, uuid_1.v4)().substring(0, 8)}`,
            slideNumber: index + 1
        }));
        const presId = (0, uuid_1.v4)();
        const finalTitle = customTitle || `${template.title} (Bản làm việc)`;
        const theme = template.theme || {
            name: 'Default',
            primaryColor: '#4f46e5',
            secondaryColor: '#06b6d4',
            accentColor: '#f59e0b',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
            fontHeading: 'Inter, sans-serif',
            fontBody: 'Inter, sans-serif'
        };
        // Lưu vào MySQL nếu active
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const numId = !isNaN(Number(templateId)) ? Number(templateId) : null;
                await mysql_1.mysqlDb.createUserDocument({
                    id: presId,
                    templateId: numId,
                    docType: 'pptx',
                    title: finalTitle,
                    contentJson: { theme, slides: clonedSlides },
                    filePath: `storage/documents/${presId}.pptx`
                });
            }
            catch (err) {
                console.warn('MySQL createUserDocument for PPTX error:', err);
            }
        }
        const newPres = {
            id: presId,
            templateId: template.id,
            templateTitle: template.title,
            title: finalTitle,
            theme: JSON.parse(JSON.stringify(theme)),
            slides: clonedSlides,
            author: author,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        database_1.db.addUserPresentation(newPres);
        return newPres;
    }
    /**
     * Lấy danh sách các bài trình chiếu của người dùng
     */
    async getUserPresentations() {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                const list = await mysql_1.mysqlDb.getUserDocuments('pptx');
                if (list !== null)
                    return list;
            }
            catch (err) {
                console.warn('MySQL getUserPresentations error:', err);
            }
        }
        return database_1.db.getUserPresentations();
    }
    /**
     * Lấy chi tiết bài trình chiếu của người dùng
     */
    async getUserPresentationById(id) {
        return database_1.db.getUserPresentationById(id) || null;
    }
    /**
     * Cập nhật bài trình chiếu
     */
    async updateUserPresentation(id, updates) {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                await mysql_1.mysqlDb.updateUserDocument(id, {
                    title: updates.title,
                    contentJson: updates.slides ? { theme: updates.theme, slides: updates.slides } : undefined
                });
            }
            catch (err) {
                console.warn('MySQL updateUserPresentation error:', err);
            }
        }
        const updated = database_1.db.updateUserPresentation(id, updates);
        if (!updated) {
            throw new Error(`Không tìm thấy bản trình chiếu với ID: ${id}`);
        }
        return updated;
    }
    /**
     * Xóa bản trình chiếu
     */
    async deleteUserPresentation(id) {
        if (mysql_1.mysqlDb.getStatus()) {
            try {
                await mysql_1.mysqlDb.deleteUserDocument(id);
            }
            catch (err) {
                console.warn('MySQL deleteUserPresentation error:', err);
            }
        }
        return database_1.db.deleteUserPresentation(id);
    }
    /**
     * Xuất bài trình chiếu sang file PPTX chuẩn OpenXML bằng pptxgenjs
     */
    async exportToPptx(pres) {
        const pptx = new pptxgenjs_1.default();
        pptx.layout = 'LAYOUT_WIDE'; // 16:9
        pptx.title = pres.title;
        const theme = pres.theme || {
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
            primaryColor: '#3b82f6',
            accentColor: '#f59e0b'
        };
        const cleanHex = (colorStr, fallback = 'FFFFFF') => {
            if (!colorStr)
                return fallback;
            return colorStr.replace('#', '').toUpperCase();
        };
        const bgHex = cleanHex(theme.backgroundColor, '0F172A');
        const textHex = cleanHex(theme.textColor, 'FFFFFF');
        const primaryHex = cleanHex(theme.primaryColor, '3B82F6');
        const accentHex = cleanHex(theme.accentColor, 'F59E0B');
        for (const slideData of (pres.slides || [])) {
            const slide = pptx.addSlide();
            slide.background = { color: slideData.backgroundColor ? cleanHex(slideData.backgroundColor, bgHex) : bgHex };
            if (slideData.layout === 'title') {
                slide.addText(slideData.title, {
                    x: 1.0,
                    y: 2.2,
                    w: '85%',
                    h: 1.8,
                    fontSize: 38,
                    bold: true,
                    color: primaryHex,
                    align: 'center'
                });
                if (slideData.subtitle) {
                    slide.addText(slideData.subtitle, {
                        x: 1.5,
                        y: 4.2,
                        w: '80%',
                        h: 1.2,
                        fontSize: 20,
                        color: textHex,
                        align: 'center'
                    });
                }
            }
            else if (slideData.layout === 'metrics') {
                slide.addText(slideData.title, {
                    x: 0.8,
                    y: 0.6,
                    w: '90%',
                    h: 0.8,
                    fontSize: 28,
                    bold: true,
                    color: primaryHex
                });
                if (slideData.subtitle) {
                    slide.addText(slideData.subtitle, {
                        x: 0.8,
                        y: 1.4,
                        w: '90%',
                        h: 0.5,
                        fontSize: 16,
                        color: textHex
                    });
                }
                if (slideData.metrics && slideData.metrics.length > 0) {
                    const colWidth = 3.6;
                    const startX = 0.8;
                    slideData.metrics.forEach((m, idx) => {
                        const currentX = startX + idx * (colWidth + 0.3);
                        slide.addShape(pptx.ShapeType.rect, {
                            x: currentX,
                            y: 2.3,
                            w: colWidth,
                            h: 3.6,
                            fill: { color: '1E293B' },
                            line: { color: primaryHex, width: 1.5 }
                        });
                        slide.addText(m.value, {
                            x: currentX + 0.2,
                            y: 2.8,
                            w: colWidth - 0.4,
                            h: 1.0,
                            fontSize: 32,
                            bold: true,
                            color: accentHex,
                            align: 'center'
                        });
                        slide.addText(m.label, {
                            x: currentX + 0.2,
                            y: 3.9,
                            w: colWidth - 0.4,
                            h: 0.8,
                            fontSize: 16,
                            bold: true,
                            color: textHex,
                            align: 'center'
                        });
                        slide.addText(m.description, {
                            x: currentX + 0.2,
                            y: 4.8,
                            w: colWidth - 0.4,
                            h: 0.8,
                            fontSize: 13,
                            color: '94A3B8',
                            align: 'center'
                        });
                    });
                }
            }
            else if (slideData.layout === 'two-column') {
                slide.addText(slideData.title, {
                    x: 0.8,
                    y: 0.6,
                    w: '90%',
                    h: 0.8,
                    fontSize: 28,
                    bold: true,
                    color: primaryHex
                });
                if (slideData.subtitle) {
                    slide.addText(slideData.subtitle, {
                        x: 0.8,
                        y: 1.4,
                        w: '90%',
                        h: 0.5,
                        fontSize: 16,
                        color: textHex
                    });
                }
                if (slideData.columnLeft) {
                    const leftItems = slideData.columnLeft.map(text => ({ text: `• ${text}\n`, options: { fontSize: 15, color: textHex, breakLine: true } }));
                    slide.addText(leftItems, {
                        x: 0.8,
                        y: 2.2,
                        w: 5.5,
                        h: 4.5,
                        valign: 'top'
                    });
                }
                if (slideData.columnRight) {
                    const rightItems = slideData.columnRight.map(text => ({ text: `• ${text}\n`, options: { fontSize: 15, color: textHex, breakLine: true } }));
                    slide.addText(rightItems, {
                        x: 6.8,
                        y: 2.2,
                        w: 5.5,
                        h: 4.5,
                        valign: 'top'
                    });
                }
            }
            else {
                slide.addText(slideData.title, {
                    x: 0.8,
                    y: 0.6,
                    w: '90%',
                    h: 0.8,
                    fontSize: 28,
                    bold: true,
                    color: primaryHex
                });
                if (slideData.subtitle) {
                    slide.addText(slideData.subtitle, {
                        x: 0.8,
                        y: 1.4,
                        w: '90%',
                        h: 0.5,
                        fontSize: 16,
                        color: textHex
                    });
                }
                if (slideData.bullets && slideData.bullets.length > 0) {
                    const bulletItems = slideData.bullets.map(b => ({
                        text: `• ${b}\n\n`,
                        options: { fontSize: 17, color: textHex, breakLine: true }
                    }));
                    slide.addText(bulletItems, {
                        x: 0.8,
                        y: 2.2,
                        w: 11.5,
                        h: 4.5,
                        valign: 'top'
                    });
                }
            }
        }
        const output = await pptx.write({ outputType: 'nodebuffer' });
        return output;
    }
}
exports.PresentationService = PresentationService;
exports.presentationService = new PresentationService();
