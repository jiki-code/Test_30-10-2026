import request from 'supertest';
import app from '../src/app';
import { db } from '../src/db/database';

describe('Office Template Suite API Tests', () => {
  beforeEach(() => {
    // Reset DB về trạng thái chuẩn trước mỗi test suite
    db.resetToSeeds();
  });

  describe('Health Check', () => {
    it('GET /api/health should return status healthy', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('SẢN PHẨM 1: THƯ VIỆN MẪU VĂN BẢN (Document Templates)', () => {
    it('GET /api/documents/templates should return at least 5 sample templates', async () => {
      const res = await request(app).get('/api/documents/templates');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('GET /api/documents/templates with category filter should filter correctly', async () => {
      const categoryParam = encodeURIComponent('Hợp đồng');
      const res = await request(app).get(`/api/documents/templates?category=${categoryParam}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].category).toBe('Hợp đồng');
    });

    it('GET /api/documents/templates with search query should search by title or tag', async () => {
      const searchParam = encodeURIComponent('Lao động');
      const res = await request(app).get(`/api/documents/templates?search=${searchParam}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/documents/templates/:id should return 404 for non-existent template', async () => {
      const res = await request(app).get('/api/documents/templates/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('LUỒNG SỬ DỤNG MẪU: POST /api/documents/from-template/:templateId should clone without mutating template', async () => {
      const templates = db.getDocumentTemplates();
      const targetTemplate = templates[0];
      const originalTemplateHtml = targetTemplate.contentHtml;

      // Tạo tài liệu mới từ template
      const res = await request(app)
        .post(`/api/documents/from-template/${targetTemplate.id}`)
        .send({ customTitle: 'Hợp Đồng Lao Động Thử Việc' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const createdDoc = res.body.data;
      expect(createdDoc.id).toBeDefined();
      expect(createdDoc.id).not.toBe(targetTemplate.id);
      expect(createdDoc.title).toBe('Hợp Đồng Lao Động Thử Việc');
      expect(createdDoc.contentHtml).toBe(originalTemplateHtml);

      // Chỉnh sửa tài liệu mới của user
      const updateRes = await request(app)
        .put(`/api/documents/my-documents/${createdDoc.id}`)
        .send({
          title: 'Hợp Đồng Đã Chỉnh Sửa',
          contentHtml: '<p>Nội dung mới hoàn toàn</p>'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.contentHtml).toBe('<p>Nội dung mới hoàn toàn</p>');

      // KIỂM TRA MẪU GỐC: KHÔNG ĐƯỢC THAY ĐỔI!
      const originalCheck = db.getDocumentTemplateById(targetTemplate.id);
      expect(originalCheck).toBeDefined();
      expect(originalCheck?.contentHtml).toBe(originalTemplateHtml);
      expect(originalCheck?.title).toBe(targetTemplate.title);
    });

    it('GET /api/documents/my-documents/:id/export/docx should export valid docx mime-type', async () => {
      // Tạo một doc trước
      const templates = db.getDocumentTemplates();
      const createRes = await request(app)
        .post(`/api/documents/from-template/${templates[0].id}`)
        .send();
      const docId = createRes.body.data.id;

      // Xuất DOCX
      const exportRes = await request(app).get(`/api/documents/my-documents/${docId}/export/docx`);
      expect(exportRes.status).toBe(200);
      expect(exportRes.header['content-type']).toContain('officedocument.wordprocessingml.document');
    });
  });

  describe('SẢN PHẨM 2: THƯ VIỆN MẪU TRÌNH CHIẾU (Presentation Templates)', () => {
    it('GET /api/presentations/templates should return at least 3 presentation templates with slide lists', async () => {
      const res = await request(app).get('/api/presentations/templates');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      // Mỗi template phải có danh sách slide xem trước
      const firstTpl = res.body.data[0];
      expect(Array.isArray(firstTpl.slides)).toBe(true);
      expect(firstTpl.slides.length).toBeGreaterThan(0);
      expect(firstTpl.slides[0].title).toBeDefined();
    });

    it('LUỒNG SỬ DỤNG MẪU: POST /api/presentations/from-template/:templateId should clone presentation independently', async () => {
      const templates = db.getPresentationTemplates();
      const targetTemplate = templates[0];
      const originalSlideCount = targetTemplate.slides.length;
      const originalFirstSlideTitle = targetTemplate.slides[0].title;

      // Tạo trình chiếu mới từ template
      const res = await request(app)
        .post(`/api/presentations/from-template/${targetTemplate.id}`)
        .send({ customTitle: 'My Startup Pitch Final 2026' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const createdPres = res.body.data;
      expect(createdPres.id).not.toBe(targetTemplate.id);
      expect(createdPres.slides.length).toBe(originalSlideCount);
      // Các slide của user phải có id mới
      expect(createdPres.slides[0].id).not.toBe(targetTemplate.slides[0].id);

      // Thêm slide mới vào bài của user
      const updatedSlides = [
        ...createdPres.slides,
        {
          id: 'user-new-slide-extra',
          slideNumber: createdPres.slides.length + 1,
          title: 'Slide Người Dùng Thêm Mới',
          layout: 'bullet',
          bullets: ['Điểm mới 1', 'Điểm mới 2']
        }
      ];

      const updateRes = await request(app)
        .put(`/api/presentations/my-presentations/${createdPres.id}`)
        .send({
          title: 'Pitch Đã Chỉnh Sửa',
          slides: updatedSlides
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.slides.length).toBe(originalSlideCount + 1);

      // KIỂM TRA MẪU GỐC: KHÔNG BỊ THAY ĐỔI SỐ LƯỢNG SLIDE VÀ NỘI DUNG!
      const originalCheck = db.getPresentationTemplateById(targetTemplate.id);
      expect(originalCheck?.slides.length).toBe(originalSlideCount);
      expect(originalCheck?.slides[0].title).toBe(originalFirstSlideTitle);
    });

    it('GET /api/presentations/:id/export/pptx should export valid pptx mime-type', async () => {
      const templates = db.getPresentationTemplates();
      const exportRes = await request(app).get(`/api/presentations/${templates[0].id}/export/pptx`);
      expect(exportRes.status).toBe(200);
      expect(exportRes.header['content-type']).toContain('officedocument.presentationml.presentation');
    });
  });
});
