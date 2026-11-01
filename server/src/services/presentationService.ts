import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { mysqlDb } from '../db/mysql';
import { PresentationTemplate, UserPresentation, SlideItem } from '../models/types';
import pptxgen from 'pptxgenjs';

export class PresentationService {
  /**
   * Lấy danh sách mẫu trình chiếu từ MySQL (hoặc fallback)
   */
  public async getTemplates(search?: string, category?: string): Promise<PresentationTemplate[]> {
    if (mysqlDb.getStatus()) {
      try {
        const templates = await mysqlDb.getTemplates('pptx', category, search);
        if (templates !== null) {
          return templates as PresentationTemplate[];
        }
      } catch (err) {
        console.warn('MySQL getPresentationTemplates error, falling back:', err);
      }
    }

    let templates = db.getPresentationTemplates();

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
   * Lấy chi tiết bộ mẫu trình chiếu
   */
  public async getTemplateById(id: string): Promise<PresentationTemplate | null> {
    if (mysqlDb.getStatus()) {
      try {
        const template = await mysqlDb.getTemplateById(id);
        if (template) return template as PresentationTemplate;
      } catch (err) {
        console.warn('MySQL getTemplateById error, fallback:', err);
      }
    }

    const template = db.getPresentationTemplateById(id);
    return template || null;
  }

  /**
   * Ẩn mẫu trình chiếu (soft delete: is_active = false)
   * Ở tab trình chiếu cho phép ẩn cả mẫu có is_default = true theo yêu cầu
   */
  public async deactivateTemplate(id: string): Promise<boolean> {
    db.removePresentationTemplate(id);

    if (mysqlDb.getStatus()) {
      try {
        return await mysqlDb.deactivateTemplate(id);
      } catch (err) {
        console.warn('MySQL deactivateTemplate (pptx) error:', err);
      }
    }
    return true;
  }

  /**
   * Thêm bộ mẫu trình chiếu mới
   */
  public async createTemplate(data: Omit<PresentationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<PresentationTemplate> {
    const slug = `pres-tpl-${uuidv4().substring(0, 8)}`;
    const newTemplate: PresentationTemplate = {
      ...data,
      id: slug,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Ghi vào MySQL trước (nguồn chính)
    if (mysqlDb.getStatus()) {
      try {
        const mysqlId = await mysqlDb.createTemplate({
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
      } catch (err) {
        console.warn('MySQL createTemplate (pptx) error:', err);
      }
    }

    // Luôn lưu vào local JSON làm bản backup
    db.addPresentationTemplate(newTemplate);
    return newTemplate;
  }

  /**
   * LUỒNG SỬ DỤNG MẪU TRÌNH CHIẾU (COPY-ON-WRITE TRÊN MYSQL / DB):
   * Nhân bản toàn bộ cấu trúc theme và mảng slides sang UserPresentation mới.
   * Gán ID mới cho từng slide trong bản sao, bảo vệ dữ liệu gốc tuyệt đối.
   */
  public async createPresentationFromTemplate(templateId: string, customTitle?: string, author: string = 'Người dùng'): Promise<UserPresentation> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Không tìm thấy mẫu trình chiếu với ID: ${templateId}`);
    }

    // Deep clone danh sách slide và gán ID mới cho từng slide
    const clonedSlides: SlideItem[] = (template.slides || []).map((s, index) => ({
      ...JSON.parse(JSON.stringify(s)),
      id: `usr-s-${uuidv4().substring(0, 8)}`,
      slideNumber: index + 1
    }));

    const presId = uuidv4();
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
    if (mysqlDb.getStatus()) {
      try {
        const numId = !isNaN(Number(templateId)) ? Number(templateId) : null;
        await mysqlDb.createUserDocument({
          id: presId,
          templateId: numId,
          docType: 'pptx',
          title: finalTitle,
          contentJson: { theme, slides: clonedSlides },
          filePath: `storage/documents/${presId}.pptx`
        });
      } catch (err) {
        console.warn('MySQL createUserDocument for PPTX error:', err);
      }
    }

    const newPres: UserPresentation = {
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

    db.addUserPresentation(newPres);
    return newPres;
  }

  /**
   * Lấy danh sách các bài trình chiếu của người dùng
   */
  public async getUserPresentations(): Promise<UserPresentation[]> {
    if (mysqlDb.getStatus()) {
      try {
        const list = await mysqlDb.getUserDocuments('pptx');
        if (list && list.length > 0) return list as UserPresentation[];
      } catch (err) {
        console.warn('MySQL getUserPresentations error:', err);
      }
    }
    return db.getUserPresentations();
  }

  /**
   * Lấy chi tiết bài trình chiếu của người dùng
   */
  public async getUserPresentationById(id: string): Promise<UserPresentation | null> {
    return db.getUserPresentationById(id) || null;
  }

  /**
   * Cập nhật bài trình chiếu
   */
  public async updateUserPresentation(id: string, updates: Partial<UserPresentation>): Promise<UserPresentation> {
    if (mysqlDb.getStatus()) {
      try {
        await mysqlDb.updateUserDocument(id, {
          title: updates.title,
          contentJson: updates.slides ? { theme: updates.theme, slides: updates.slides } : undefined
        });
      } catch (err) {
        console.warn('MySQL updateUserPresentation error:', err);
      }
    }

    const updated = db.updateUserPresentation(id, updates);
    if (!updated) {
      throw new Error(`Không tìm thấy bản trình chiếu với ID: ${id}`);
    }
    return updated;
  }

  /**
   * Xóa bản trình chiếu
   */
  public async deleteUserPresentation(id: string): Promise<boolean> {
    if (mysqlDb.getStatus()) {
      try {
        await mysqlDb.deleteUserDocument(id);
      } catch (err) {
        console.warn('MySQL deleteUserPresentation error:', err);
      }
    }
    return db.deleteUserPresentation(id);
  }

  /**
   * Xuất bài trình chiếu sang file PPTX chuẩn OpenXML bằng pptxgenjs
   */
  public async exportToPptx(pres: UserPresentation | PresentationTemplate): Promise<Buffer> {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE'; // 16:9
    pptx.title = pres.title;

    const theme = pres.theme || {
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      primaryColor: '#3b82f6',
      accentColor: '#f59e0b'
    };

    const cleanHex = (colorStr?: string, fallback: string = 'FFFFFF'): string => {
      if (!colorStr) return fallback;
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
      } else if (slideData.layout === 'metrics') {
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
      } else if (slideData.layout === 'two-column') {
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
      } else {
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
    return output as Buffer;
  }
}

export const presentationService = new PresentationService();
