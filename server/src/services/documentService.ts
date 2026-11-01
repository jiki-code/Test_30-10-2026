import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { mysqlDb } from '../db/mysql';
import { DocumentTemplate, UserDocument } from '../models/types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export class DocumentService {
  /**
   * Lấy danh sách các mẫu văn bản từ MySQL (hoặc fallback DB)
   */
  public async getTemplates(search?: string, category?: string): Promise<DocumentTemplate[]> {
    if (mysqlDb.getStatus()) {
      try {
        const templates = await mysqlDb.getTemplates('docx', category, search);
        if (templates !== null) {
          return templates as DocumentTemplate[];
        }
      } catch (err) {
        console.warn('MySQL getTemplates error, falling back to local store:', err);
      }
    }

    // Fallback nếu MySQL chưa kết nối
    let templates = db.getDocumentTemplates();

    if (category && category.trim() !== '' && category.toLowerCase() !== 'all' && category !== 'Tất cả') {
      templates = templates.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      templates = templates.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    return templates;
  }

  /**
   * Lấy chi tiết một mẫu văn bản
   */
  public async getTemplateById(id: string): Promise<DocumentTemplate | null> {
    if (mysqlDb.getStatus()) {
      try {
        const template = await mysqlDb.getTemplateById(id);
        if (template) return template as DocumentTemplate;
      } catch (err) {
        console.warn('MySQL getTemplateById error, fallback:', err);
      }
    }

    const template = db.getDocumentTemplateById(id);
    return template || null;
  }

  /**
   * Ẩn mẫu văn bản (soft delete: is_active = false)
   */
  public async deactivateTemplate(id: string): Promise<boolean> {
    // Xóa khỏi local JSON trước
    db.removeDocumentTemplate(id);

    // Set is_active = 0 trên MySQL
    if (mysqlDb.getStatus()) {
      try {
        return await mysqlDb.deactivateTemplate(id);
      } catch (err) {
        console.warn('MySQL deactivateTemplate error:', err);
      }
    }
    return true;
  }

  /**
   * Thêm mẫu văn bản mới
   */
  public async createTemplate(data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<DocumentTemplate> {
    const slug = `doc-tpl-${uuidv4().substring(0, 8)}`;
    const newTemplate: DocumentTemplate = {
      ...data,
      id: slug,
      isDefault: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Ghi vào MySQL trước (nguồn chính)
    if (mysqlDb.getStatus()) {
      try {
        const mysqlId = await mysqlDb.createTemplate({
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
      } catch (err) {
        console.warn('MySQL createTemplate (docx) error:', err);
      }
    }

    // Luôn lưu vào local JSON làm bản backup
    db.addDocumentTemplate(newTemplate);
    return newTemplate;
  }

  /**
   * LUỒNG SỬ DỤNG MẪU (COPY-ON-WRITE TRÊN MYSQL / DB):
   * Nhân bản nội dung từ template gốc sang một UserDocument độc lập.
   * File template gốc tuyệt đối không bị thay đổi.
   */
  public async createDocumentFromTemplate(templateId: string, customTitle?: string, author: string = 'Người dùng'): Promise<UserDocument> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Không tìm thấy mẫu văn bản với ID: ${templateId}`);
    }

    const docId = uuidv4();
    const finalTitle = customTitle || `${template.title} (Bản làm việc)`;

    // Lưu vào MySQL nếu active
    if (mysqlDb.getStatus()) {
      try {
        const numId = !isNaN(Number(templateId)) ? Number(templateId) : null;
        await mysqlDb.createUserDocument({
          id: docId,
          templateId: numId,
          docType: 'docx',
          title: finalTitle,
          contentHtml: template.contentHtml,
          filePath: `storage/documents/${docId}.docx`
        });
      } catch (err) {
        console.warn('MySQL createUserDocument error:', err);
      }
    }

    // Luôn đồng bộ vào local DB để đảm bảo tính sẵn sàng
    const newDoc: UserDocument = {
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

    db.addUserDocument(newDoc);
    return newDoc;
  }

  /**
   * Lấy danh sách tài liệu cá nhân của người dùng
   */
  public async getUserDocuments(): Promise<UserDocument[]> {
    if (mysqlDb.getStatus()) {
      try {
        const docs = await mysqlDb.getUserDocuments('docx');
        if (docs && docs.length > 0) return docs as UserDocument[];
      } catch (err) {
        console.warn('MySQL getUserDocuments error:', err);
      }
    }
    return db.getUserDocuments();
  }

  /**
   * Lấy chi tiết tài liệu cá nhân
   */
  public async getUserDocumentById(id: string): Promise<UserDocument | null> {
    return db.getUserDocumentById(id) || null;
  }

  /**
   * Cập nhật tài liệu cá nhân
   */
  public async updateUserDocument(id: string, updates: Partial<UserDocument>): Promise<UserDocument> {
    if (mysqlDb.getStatus()) {
      try {
        await mysqlDb.updateUserDocument(id, {
          title: updates.title,
          contentHtml: updates.contentHtml
        });
      } catch (err) {
        console.warn('MySQL updateUserDocument error:', err);
      }
    }

    const updated = db.updateUserDocument(id, updates);
    if (!updated) {
      throw new Error(`Không tìm thấy tài liệu với ID: ${id}`);
    }
    return updated;
  }

  /**
   * Xóa tài liệu cá nhân
   */
  public async deleteUserDocument(id: string): Promise<boolean> {
    if (mysqlDb.getStatus()) {
      try {
        await mysqlDb.deleteUserDocument(id);
      } catch (err) {
        console.warn('MySQL deleteUserDocument error:', err);
      }
    }
    return db.deleteUserDocument(id);
  }

  /**
   * Xuất tài liệu sang định dạng DOCX chuẩn OpenXML
   */
  public async exportToDocx(title: string, htmlContent: string): Promise<Buffer> {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 }
      })
    );

    const cleanLines = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .split(/<\/(?:p|h1|h2|h3|h4|h5|li|tr|div)>/i);

    for (const rawLine of cleanLines) {
      const stripped = rawLine.replace(/<[^>]+>/g, '').trim();
      if (!stripped) continue;

      let isHeading = false;
      let headingLvl: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_3;
      if (rawLine.includes('<h1')) {
        isHeading = true;
        headingLvl = HeadingLevel.HEADING_1;
      } else if (rawLine.includes('<h2')) {
        isHeading = true;
        headingLvl = HeadingLevel.HEADING_2;
      } else if (rawLine.includes('<h3')) {
        isHeading = true;
        headingLvl = HeadingLevel.HEADING_3;
      }

      paragraphs.push(
        new Paragraph({
          text: stripped,
          heading: isHeading ? headingLvl : undefined,
          bullet: rawLine.includes('<li') ? { level: 0 } : undefined,
          spacing: { after: 120 }
        })
      );
    }

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }]
    });

    return await Packer.toBuffer(doc);
  }
}

export const documentService = new DocumentService();
