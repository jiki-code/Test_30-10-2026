-- =====================================================================
-- Thư viện mẫu tài liệu văn phòng (DOCX / PPTX / mở rộng XLSX)
-- MySQL 8.0+ | utf8mb4
-- Chạy:  mysql -u root -p --default-character-set=utf8mb4 < template_library.sql
-- =====================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_results = utf8mb4;

DROP DATABASE IF EXISTS template_library;
CREATE DATABASE template_library
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE template_library;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ---------------------------------------------------------------------
-- 1. CATEGORIES: danh mục (theo từng loại tài liệu)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doc_type    ENUM('docx','pptx','xlsx') NOT NULL,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_category_type_slug (doc_type, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. TEMPLATES: mẫu gốc (chỉ đọc, không bao giờ bị sửa bởi người dùng)
--    file_path / thumbnail_path là đường dẫn TƯƠNG ĐỐI trong storage,
--    client không bao giờ được gửi đường dẫn này lên server.
-- ---------------------------------------------------------------------
CREATE TABLE templates (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doc_type        ENUM('docx','pptx','xlsx') NOT NULL,
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(220) NOT NULL UNIQUE,
  category_id     INT UNSIGNED NOT NULL,
  description     VARCHAR(500) NOT NULL DEFAULT '',
  file_path       VARCHAR(500) NOT NULL,
  thumbnail_path  VARCHAR(500) NOT NULL,
  content_html    MEDIUMTEXT NULL,                        -- Nội dung HTML mẫu văn bản
  content_json    JSON NULL,                              -- Cấu trúc slides / theme của trình chiếu
  page_count      SMALLINT UNSIGNED NOT NULL DEFAULT 1,   -- số trang / số slide
  file_size       BIGINT UNSIGNED NULL,
  checksum_sha256 CHAR(64) NULL,                          -- kiểm chứng file gốc không bị đổi
  license         VARCHAR(100) NULL,                      -- nguồn / giấy phép mẫu
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  is_default      TINYINT(1) NOT NULL DEFAULT 0,          -- Mẫu mặc định của hệ thống (không cho xóa)
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_template_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT,
  KEY idx_template_type_cat (doc_type, category_id, is_active),
  FULLTEXT KEY ft_template_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. TEMPLATE_PREVIEWS: ảnh xem trước từng trang / slide
-- ---------------------------------------------------------------------
CREATE TABLE template_previews (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id  INT UNSIGNED NOT NULL,
  page_number  SMALLINT UNSIGNED NOT NULL,
  image_path   VARCHAR(500) NOT NULL,
  caption      VARCHAR(200) NULL,
  CONSTRAINT fk_preview_template FOREIGN KEY (template_id)
    REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE KEY uq_preview_page (template_id, page_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. TAGS + TEMPLATE_TAGS (nhiều-nhiều)
-- ---------------------------------------------------------------------
CREATE TABLE tags (
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE template_tags (
  template_id  INT UNSIGNED NOT NULL,
  tag_id       INT UNSIGNED NOT NULL,
  PRIMARY KEY (template_id, tag_id),
  CONSTRAINT fk_tt_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  CONSTRAINT fk_tt_tag      FOREIGN KEY (tag_id)      REFERENCES tags(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. DOCUMENTS: bản sao do người dùng tạo từ template
--    Độc lập hoàn toàn với file template gốc.
--    user_id để NULL trong MVP (chưa có đăng nhập); dùng session_token
--    để gắn tài liệu với trình duyệt hiện tại.
-- ---------------------------------------------------------------------
CREATE TABLE documents (
  id             CHAR(36) PRIMARY KEY,                 -- UUID, tránh đoán ID
  template_id    INT UNSIGNED NULL,                    -- giữ lại dù template bị xóa
  doc_type       ENUM('docx','pptx','xlsx') NOT NULL,
  title          VARCHAR(200) NOT NULL,
  file_path      VARCHAR(500) NOT NULL DEFAULT '',     -- storage/documents/<uuid>.<ext>
  content_html   MEDIUMTEXT NULL,                      -- nội dung editor (DOCX)
  content_json   JSON NULL,                            -- nội dung slides / theme (PPTX)
  status         ENUM('draft','saved','deleted') NOT NULL DEFAULT 'draft',
  session_token  VARCHAR(64) NULL,
  user_id        INT UNSIGNED NULL,
  file_size      BIGINT UNSIGNED NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_template FOREIGN KEY (template_id)
    REFERENCES templates(id) ON DELETE SET NULL,
  KEY idx_document_session (session_token, status),
  KEY idx_document_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. DOCUMENT_REVISIONS (tùy chọn): lịch sử lưu, phục vụ undo / audit
-- ---------------------------------------------------------------------
CREATE TABLE document_revisions (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id  CHAR(36) NOT NULL,
  revision_no  INT UNSIGNED NOT NULL,
  content_html MEDIUMTEXT NULL,
  file_path    VARCHAR(500) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rev_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY uq_revision (document_id, revision_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DỮ LIỆU MẪU (TIẾNG VIỆT CHUẨN UTF-8 ĐẦY ĐỦ DẤU)
-- =====================================================================

-- Danh mục
INSERT INTO categories (doc_type, name, slug, sort_order) VALUES
  ('docx', 'Hành chính',   'hanh-chinh',   1),
  ('docx', 'Kinh doanh',   'kinh-doanh',   2),
  ('docx', 'Nhân sự',      'nhan-su',      3),
  ('docx', 'Giáo dục',     'giao-duc',     4),
  ('pptx', 'Kinh doanh',   'kinh-doanh',   1),
  ('pptx', 'Giáo dục',     'giao-duc',     2),
  ('pptx', 'Sáng tạo',     'sang-tao',     3);

-- Mẫu DOCX (>= 5)
INSERT INTO templates
  (doc_type, name, slug, category_id, description, file_path, thumbnail_path, content_html, page_count, license)
VALUES
  ('docx', 'Công văn hành chính', 'cong-van-hanh-chinh',
    (SELECT id FROM categories WHERE doc_type='docx' AND slug='hanh-chinh'),
    'Mẫu công văn chuẩn thể thức với quốc hiệu, tiêu ngữ, số hiệu và nơi nhận.',
    'templates/docx/cong-van-hanh-chinh/template.docx',
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    '<h1 style="text-align:center;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1><p style="text-align:center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p><p style="text-align:center;">------------------------</p><h2 style="text-align:center;color:#185abd;">CÔNG VĂN HÀNH CHÍNH</h2><p>Kính gửi: Các cơ quan ban ngành và đối tác chiến lược...</p>',
    1, 'Tự tạo - CC0'),

  ('docx', 'Hợp đồng dịch vụ', 'hop-dong-dich-vu',
    (SELECT id FROM categories WHERE doc_type='docx' AND slug='kinh-doanh'),
    'Hợp đồng cung cấp dịch vụ giữa hai bên với các điều khoản cơ bản.',
    'templates/docx/hop-dong-dich-vu/template.docx',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
    '<h1 style="text-align:center;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1><h2 style="text-align:center;color:#185abd;">HỢP ĐỒNG CUNG CẤP DỊCH VỤ</h2><p>Hôm nay, ngày ... tháng ... năm 2026, chúng tôi gồm có Bên A và Bên B...</p>',
    3, 'Tự tạo - CC0'),

  ('docx', 'Báo cáo kinh doanh quý', 'bao-cao-kinh-doanh-quy',
    (SELECT id FROM categories WHERE doc_type='docx' AND slug='kinh-doanh'),
    'Báo cáo kết quả kinh doanh có bảng số liệu, mục tiêu và kế hoạch kỳ tới.',
    'templates/docx/bao-cao-kinh-doanh-quy/template.docx',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
    '<h1 style="color:#185abd;">BÁO CÁO KẾT QUẢ KINH DOANH QUÝ</h1><p>Tổng kết doanh thu đạt 118% kế hoạch, lợi nhuận trước thuế tăng trưởng 28%.</p>',
    2, 'Tự tạo - CC0'),

  ('docx', 'Sơ yếu lý lịch / CV', 'so-yeu-ly-lich-cv',
    (SELECT id FROM categories WHERE doc_type='docx' AND slug='nhan-su'),
    'Mẫu CV một trang gọn gàng, có mục kinh nghiệm, học vấn và kỹ năng.',
    'templates/docx/so-yeu-ly-lich-cv/template.docx',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    '<h1>CURRICULUM VITAE - SƠ YẾU LÝ LỊCH</h1><h3>1. Thông tin cá nhân</h3><p>Họ và tên: [Họ tên ứng viên] | Vị trí ứng tuyển: Senior Software Engineer</p>',
    1, 'Tự tạo - CC0'),

  ('docx', 'Đơn xin nghỉ phép', 'don-xin-nghi-phep',
    (SELECT id FROM categories WHERE doc_type='docx' AND slug='nhan-su'),
    'Đơn xin nghỉ phép gửi quản lý trực tiếp, có phần xác nhận phê duyệt.',
    'templates/docx/don-xin-nghi-phep/template.docx',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    '<h1 style="text-align:center;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1><h2 style="text-align:center;color:#d83b01;">ĐƠN XIN NGHỈ PHÉP</h2><p>Kính gửi Ban Giám Đốc và Trưởng phòng nhân sự...</p>',
    1, 'Tự tạo - CC0'),

  ('docx', 'Giáo án bài giảng', 'giao-an-bai-giang',
    (SELECT id FROM categories WHERE doc_type='docx' AND slug='giao-duc'),
    'Giáo án theo cấu trúc mục tiêu, chuẩn bị, tiến trình dạy học, đánh giá.',
    'templates/docx/giao-an-bai-giang/template.docx',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
    '<h1>GIÁO ÁN BÀI GIẢNG ĐIỆN TỬ</h1><h3>I. Mục tiêu bài học</h3><p>Học viên nắm vững cấu trúc hệ thống và cách thức vận hành...</p>',
    2, 'Tự tạo - CC0');

-- Bộ mẫu PPTX (>= 3)
INSERT INTO templates
  (doc_type, name, slug, category_id, description, file_path, thumbnail_path, content_json, page_count, license)
VALUES
  ('pptx', 'Pitch Deck Khởi nghiệp', 'pitch-deck-khoi-nghiep',
    (SELECT id FROM categories WHERE doc_type='pptx' AND slug='kinh-doanh'),
    'Bộ slide gọi vốn: vấn đề, giải pháp, thị trường, mô hình kinh doanh, đội ngũ.',
    'templates/pptx/pitch-deck-khoi-nghiep/template.pptx',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
    '{"theme": {"primaryColor": "#4f46e5", "secondaryColor": "#06b6d4", "accentColor": "#f59e0b", "backgroundColor": "#0f172a", "textColor": "#ffffff"}, "slides": [{"id": "s1", "slideNumber": 1, "title": "PITCH DECK KHỞI NGHIỆP", "subtitle": "Định hình lại tương lai văn phòng thông minh", "layout": "title"}, {"id": "s2", "slideNumber": 2, "title": "BÀI TOÁN THỊ TRƯỜNG", "subtitle": "Doanh nghiệp lãng phí thời gian tạo mẫu thủ công", "layout": "bullet", "bullets": ["82% nhân sự mất 4-6 giờ/tuần format tài liệu", "Dễ làm hỏng file gốc", "Thiếu tính đồng bộ"]}, {"id": "s3", "slideNumber": 3, "title": "CHỈ SỐ TĂNG TRƯỞNG", "subtitle": "Thành tựu đạt được", "layout": "metrics", "metrics": [{"label": "Doanh nghiệp", "value": "250+", "description": "Tăng trưởng 45% MoM"}, {"label": "Tài liệu tạo mới", "value": "1.2M", "description": "Tiết kiệm 300,000h"}]}]}',
    6, 'Tự tạo - CC0'),

  ('pptx', 'Bài giảng điện tử', 'bai-giang-dien-tu',
    (SELECT id FROM categories WHERE doc_type='pptx' AND slug='giao-duc'),
    'Bộ slide bài giảng với mục tiêu, nội dung chính, ví dụ, bài tập và tổng kết.',
    'templates/pptx/bai-giang-dien-tu/template.pptx',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
    '{"theme": {"primaryColor": "#059669", "secondaryColor": "#0d9488", "accentColor": "#fbbf24", "backgroundColor": "#064e3b", "textColor": "#ffffff"}, "slides": [{"id": "s1", "slideNumber": 1, "title": "CHƯƠNG TRÌNH ĐÀO TẠO NHẬP MÔN", "subtitle": "Hội nhập văn hóa doanh nghiệp", "layout": "title"}, {"id": "s2", "slideNumber": 2, "title": "GIÁ TRỊ CỐT LÕI", "layout": "two-column", "columnLeft": ["Sứ mệnh kiến tạo sản phẩm đỉnh cao", "Giải phóng sức lao động trí tuệ"], "columnRight": ["Chính trực trong mọi quan hệ", "Khách hàng là trung tâm"]}]}',
    5, 'Tự tạo - CC0'),

  ('pptx', 'Portfolio Sáng tạo', 'portfolio-sang-tao',
    (SELECT id FROM categories WHERE doc_type='pptx' AND slug='sang-tao'),
    'Bộ slide giới thiệu dự án thiết kế với bố cục hình ảnh lớn, tối giản.',
    'templates/pptx/portfolio-sang-tao/template.pptx',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    '{"theme": {"primaryColor": "#8b5cf6", "secondaryColor": "#ec4899", "accentColor": "#3b82f6", "backgroundColor": "#18181b", "textColor": "#ffffff"}, "slides": [{"id": "s1", "slideNumber": 1, "title": "PORTFOLIO THIẾT KẾ & KIẾN TRÚC", "subtitle": "Bộ sưu tập các dự án công nghệ tiêu biểu", "layout": "title"}, {"id": "s2", "slideNumber": 2, "title": "NGUYÊN TẮC THIẾT KẾ", "layout": "bullet", "bullets": ["Tối giản và trực quan", "Copy-on-Write bảo vệ nguyên bản", "Tương thích chuẩn OpenXML"]}]}',
    5, 'Tự tạo - CC0');

-- Ảnh xem trước
INSERT INTO template_previews (template_id, page_number, image_path, caption)
SELECT id, 1, thumbnail_path, 'Trang xem trước' FROM templates;

-- Tags
INSERT INTO tags (name) VALUES
  ('công văn'), ('hợp đồng'), ('báo cáo'), ('cv'), ('nghỉ phép'),
  ('giáo án'), ('gọi vốn'), ('bài giảng'), ('portfolio'), ('tối giản')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO template_tags (template_id, tag_id)
SELECT t.id, g.id FROM (
  SELECT 'cong-van-hanh-chinh' s, 'công văn' tag UNION ALL
  SELECT 'hop-dong-dich-vu',        'hợp đồng' UNION ALL
  SELECT 'bao-cao-kinh-doanh-quy',  'báo cáo'  UNION ALL
  SELECT 'so-yeu-ly-lich-cv',       'cv'       UNION ALL
  SELECT 'so-yeu-ly-lich-cv',       'tối giản' UNION ALL
  SELECT 'don-xin-nghi-phep',       'nghỉ phép' UNION ALL
  SELECT 'giao-an-bai-giang',       'giáo án'  UNION ALL
  SELECT 'pitch-deck-khoi-nghiep',  'gọi vốn'  UNION ALL
  SELECT 'bai-giang-dien-tu',       'bài giảng' UNION ALL
  SELECT 'portfolio-sang-tao',      'portfolio' UNION ALL
  SELECT 'portfolio-sang-tao',      'tối giản'
) x
JOIN templates t ON t.slug = x.s
JOIN tags g      ON g.name = x.tag
ON DUPLICATE KEY UPDATE template_id=template_id;
