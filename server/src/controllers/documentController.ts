import { Request, Response } from 'express';
import { documentService } from '../services/documentService';

export class DocumentController {
  public async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string;
      const category = req.query.category as string;
      const templates = await documentService.getTemplates(search, category);
      res.json({
        success: true,
        count: templates.length,
        data: templates
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách mẫu văn bản',
        error: error.message
      });
    }
  }

  public async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = await documentService.getTemplateById(id);
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thông tin mẫu văn bản',
        error: error.message
      });
    }
  }

  public async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, category, tags, thumbnailUrl, contentHtml } = req.body;
      if (!title || !category || !contentHtml) {
        res.status(400).json({
          success: false,
          message: 'Tiêu đề, danh mục và nội dung HTML là bắt buộc'
        });
        return;
      }

      const template = await documentService.createTemplate({
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
    } catch (error: any) {
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
  public async createDocumentFromTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const { customTitle, author } = req.body;

      const newDoc = await documentService.createDocumentFromTemplate(templateId, customTitle, author);

      res.status(201).json({
        success: true,
        message: 'Khởi tạo tài liệu mới từ mẫu thành công (bảo vệ nguyên vẹn mẫu gốc)',
        data: newDoc
      });
    } catch (error: any) {
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

  public async getUserDocuments(req: Request, res: Response): Promise<void> {
    try {
      const docs = await documentService.getUserDocuments();
      res.json({
        success: true,
        count: docs.length,
        data: docs
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách tài liệu cá nhân',
        error: error.message
      });
    }
  }

  public async getUserDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await documentService.getUserDocumentById(id);
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải tài liệu',
        error: error.message
      });
    }
  }

  public async updateUserDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, contentHtml, contentJson } = req.body;
      const updated = await documentService.updateUserDocument(id, {
        ...(title !== undefined && { title }),
        ...(contentHtml !== undefined && { contentHtml }),
        ...(contentJson !== undefined && { contentJson })
      });
      res.json({
        success: true,
        message: 'Cập nhật tài liệu thành công',
        data: updated
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật tài liệu',
        error: error.message
      });
    }
  }

  public async deleteUserDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await documentService.deleteUserDocument(id);
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
    } catch (error: any) {
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
  public async deactivateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await documentService.deactivateTemplate(id);
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi ẩn mẫu văn bản',
        error: error.message
      });
    }
  }

  public async exportDocx(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await documentService.getUserDocumentById(id);
      if (!doc) {
        res.status(404).json({
          success: false,
          message: `Không tìm thấy tài liệu với ID: ${id}`
        });
        return;
      }

      const buffer = await documentService.exportToDocx(doc.title, doc.contentHtml);
      const safeFilename = encodeURIComponent(doc.title.replace(/[^\w\s-]/gi, '')) || 'document';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xuất file DOCX',
        error: error.message
      });
    }
  }
}

export const documentController = new DocumentController();
