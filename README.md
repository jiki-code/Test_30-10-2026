# OFFICE TEMPLATE SUITE (VĂN PHÒNG SỐ)
### Báo Cáo & Mã Nguồn Bài Kiểm Tra Tuyển Dụng Fullstack Developer
**Ứng viên:** Tran Anh Kiet / Fullstack Developer  
**Ngày thực hiện:** 31/10/2026  
**Công nghệ chính:** React 18, TypeScript, Tailwind CSS, Tiptap, Express.js, docx, pptxgenjs, Jest.

---

## I. TỔNG QUAN GIẢI PHÁP

Dự án được xây dựng dưới dạng một **Nền tảng Văn phòng Số Tích hợp (All-in-One Office Template Suite)** bao gồm đầy đủ hai sản phẩm thử nghiệm theo đề bài:
1. **Sản phẩm 1: Thư viện mẫu văn bản** (Document Template Library - Rich Text & Word/DOCX).
2. **Sản phẩm 2: Thư viện mẫu trình chiếu** (Presentation Template Library - Slide Deck & PowerPoint/PPTX).

Ứng dụng có giao diện hiện đại phong cách Microsoft Office 365 / Notion / Canva, cung cấp trải nghiệm mượt mà từ khâu tìm kiếm, xem trước toàn diện đến chỉnh sửa trực tiếp trên trình duyệt và tải file văn phòng tiêu chuẩn.


---

## II. KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ

### 1. Kiến trúc phân tầng (Clean Layered Architecture)
- **Frontend Layer:** Single Page Application (SPA) phát triển bằng React 18, TypeScript, Tailwind CSS, Lucide Icons, Headless Tiptap Rich Text Editor.
- **Backend Layer:** RESTful API phát triển bằng Node.js, Express, TypeScript với cấu trúc phân tách rõ rệt: `routes`, `controllers`, `services`, `models`, `db`.
- **Database Layer (MySQL 8.0+):** 
  - Hệ cơ sở dữ liệu quan hệ **MySQL 8.0+** (Database: `template_library` | `utf8mb4`).
  - Gồm 6 bảng chuẩn hóa quan hệ theo đúng schema thiết kế:
    - `categories`: Quản lý danh mục theo `doc_type` (`docx`, `pptx`, `xlsx`).
    - `templates`: Quản lý mẫu chuẩn (chỉ đọc, khóa an toàn, hash checksum).
    - `template_previews`: Quản lý ảnh xem trước từng slide/trang.
    - `tags` & `template_tags`: Hệ thống thẻ phân loại nhiều-nhiều.
    - `documents`: Bản sao độc lập do người dùng tạo từ mẫu (UUID v4, gắn với `session_token`).
    - `document_revisions`: Quản lý lịch sử chỉnh sửa tài liệu.
  - Hỗ trợ file cấu hình Docker Compose `docker-compose.yml` và script nạp DDL `template_library.sql`.
- **Format Compilers:**
  - `docx`: Sinh file OpenXML Word Document chuẩn.
  - `pptxgenjs`: Sinh file OpenXML PowerPoint Presentation chuẩn.

### 2. Mô hình Dữ liệu (Data Models)
```typescript
// Mẫu văn bản gốc
interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  contentHtml: string;
  version: number;
  isOfficial: boolean;
}

// Bản sao tài liệu của người dùng
interface UserDocument {
  id: string; // UUID mới độc lập
  templateId: string;
  templateTitle?: string;
  title: string;
  contentHtml: string;
  author: string;
  createdAt: string;
  lastModified: string;
}

// Bộ mẫu slide
interface PresentationTemplate {
  id: string;
  title: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
  slides: SlideItem[];
}
```

### 3. Cơ chế Copy-on-Write (Bản quyền & Toàn vẹn dữ liệu)
Hệ thống phân tách tuyệt đối giữa **Master Templates (Dữ liệu khuôn mẫu)** và **User Artifacts (Sản phẩm người dùng)**:
- Khi người dùng thao tác *"Dùng mẫu này"*, API thực hiện Deep Clone toàn bộ cây nội dung và gán ID mới.
- Mọi thao tác chỉnh sửa, thêm slide, xóa đoạn văn bản chỉ tác động vào bản ghi cá nhân trong bảng `UserDocument` / `UserPresentation`.
- Template gốc được thiết lập ở trạng thái bất biến (Immutable / Read-Only). Tính năng này được kiểm thử tự động đạt 100% qua Jest test suite.

### 4. Danh sách Thư viện Bên thứ ba & Giấy phép (Licenses)
| Thư viện | Mục đích | Giấy phép |
| :--- | :--- | :--- |
| **React 18** | UI Framework xây dựng giao diện ứng dụng | MIT License |
| **TypeScript** | Định kiểu tĩnh an toàn cho codebases | Apache 2.0 |
| **Tailwind CSS** | Thiết kế giao diện hiện đại chuẩn Utility-first | MIT License |
| **@tiptap/react** | Trình soạn thảo văn bản Rich Text headless | MIT License |
| **docx** | Tạo & biên dịch file Microsoft Word (.docx OpenXML) | MIT License |
| **pptxgenjs** | Tạo & biên dịch file Microsoft PowerPoint (.pptx OpenXML) | MIT License |
| **Express** | Web Framework phát triển RESTful API | MIT License |
| **Lucide React** | Bộ icon giao diện hiện đại | ISC License |
| **Jest & Supertest** | Bộ công cụ kiểm thử tự động API | MIT License |

---

## III. HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ

### Yêu cầu hệ thống:
- **Node.js**: Phiên bản 18 trở lên (khuyến nghị 18.x hoặc 20.x).
- **npm**: Phiên bản 9.x hoặc 10.x.

### 1. Cài đặt toàn bộ dependencies (Chỉ 1 lệnh)
```bash
npm run install:all
```
*(Hoặc `cd server && npm install && cd ../client && npm install`)*

---

### 2. Khởi động ứng dụng

#### Lựa chọn A: Chế độ Production Tích Hợp (Khuyên dùng - Nhanh gọn nhất)
Hệ thống đã hỗ trợ Express phục vụ trực tiếp bản build của Client:
```bash
npm run build
npm run start --prefix server
```
👉 Mở trình duyệt truy cập: **`http://localhost:5001`**

#### Lựa chọn B: Chế độ Development (Chạy đồng thời Hot-Reload)
Lệnh root tự động chạy song song cả Server (cổng 5001) và Vite Client (cổng 5173):
```bash
npm run dev
```
👉 Mở trình duyệt truy cập: **`http://localhost:5173`**

---

### 3. Chạy Kiểm Thử Tự Động (Run Tests)
Hệ thống bao gồm 10 bài test tích hợp kiểm tra mọi luồng:
```bash
npm run test
```
*Kết quả mong đợi: `PASS tests/api.test.ts - 10 passed, 10 total`.*

---

### 4. Đặt lại Dữ liệu Mẫu (Reset / Re-seed Data)
Bất kỳ khi nào muốn khôi phục lại kho mẫu về ban đầu:
```bash
npm run seed
```

---

## IV. DANH SÁCH RESTFUL API HIỆN CÓ

Hệ thống cung cấp hệ thống RESTful API hoàn chỉnh chạy trên **Base URL:** `http://localhost:5001/api`. Chi tiết đặc tả schema và mẫu payload xem thêm tại [`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md).

### 1. Kiểm tra trạng thái hệ thống (Health Check)
| Method | Endpoint | Mô tả & Chức năng |
| :--- | :--- | :--- |
| `GET` | `/health` | Kiểm tra trạng thái hoạt động (uptime, status) của Backend API |

---

### 2. Quản lý Mẫu Văn Bản (Document Templates)
| Method | Endpoint | Tham số / Body | Mô tả & Chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/documents/templates` | Query: `search`, `category` | Lấy danh sách mẫu văn bản (hỗ trợ tìm kiếm từ khóa và lọc theo danh mục) |
| `GET` | `/documents/templates/:id` | Path: `id` | Xem chi tiết nội dung mẫu văn bản (toàn bộ nội dung HTML chuẩn) |
| `POST` | `/documents/templates` | Body: `title`, `category`, `contentHtml`, `tags`, `thumbnailUrl`, `description` | Thêm mẫu văn bản mới vào kho thư viện |
| `DELETE` | `/documents/templates/:id` | Path: `id` | Ẩn/Hủy kích hoạt mẫu văn bản (Soft delete: `is_active = false`) |

---

### 3. Quản lý Tài Liệu Cá Nhân & Xuất File Word (User Documents & Export)
| Method | Endpoint | Tham số / Body | Mô tả & Chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/documents/from-template/:templateId` | Path: `templateId`<br>Body: `customTitle`, `author` *(optional)* | **Copy-on-Write**: Tạo bản sao tài liệu độc lập từ mẫu gốc (bảo vệ nguyên vẹn mẫu) |
| `GET` | `/documents/my-documents` | - | Lấy danh sách tài liệu cá nhân đã lưu của người dùng |
| `GET` | `/documents/my-documents/:id` | Path: `id` | Xem chi tiết tài liệu cá nhân theo ID |
| `PUT` | `/documents/my-documents/:id` | Path: `id`<br>Body: `title`, `contentHtml`, `contentJson` | Lưu / cập nhật nội dung tài liệu người dùng đã chỉnh sửa |
| `DELETE` | `/documents/my-documents/:id` | Path: `id` | Xóa vĩnh viễn tài liệu cá nhân của người dùng |
| `GET` | `/documents/my-documents/:id/export/docx` | Path: `id` | **Xuất file DOCX**: Biên dịch HTML sang file Microsoft Word tiêu chuẩn |

---

### 4. Quản lý Mẫu Trình Chiếu (Presentation Templates)
| Method | Endpoint | Tham số / Body | Mô tả & Chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/presentations/templates` | Query: `search`, `category` | Lấy danh sách bộ mẫu trình chiếu (kèm thông số theme màu sắc và danh sách slide) |
| `GET` | `/presentations/templates/:id` | Path: `id` | Xem chi tiết bộ mẫu slide theo ID (danh sách từng slide, cấu hình layout, font, màu) |
| `POST` | `/presentations/templates` | Body: `title`, `category`, `slides`, `theme`, `tags`, `thumbnailUrl`, `description` | Thêm bộ mẫu trình chiếu mới vào kho thư viện |
| `DELETE` | `/presentations/templates/:id` | Path: `id` | Ẩn/Hủy kích hoạt bộ mẫu trình chiếu (Soft delete) |

---

### 5. Quản lý Trình Chiếu Cá Nhân & Xuất File PowerPoint (User Presentations & Export)
| Method | Endpoint | Tham số / Body | Mô tả & Chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/presentations/from-template/:templateId` | Path: `templateId`<br>Body: `customTitle`, `author` *(optional)* | **Copy-on-Write**: Nhân bản sâu bộ slide độc lập từ mẫu gốc (cấp ID slide mới) |
| `GET` | `/presentations/my-presentations` | - | Lấy danh sách bài trình chiếu cá nhân đã lưu của người dùng |
| `GET` | `/presentations/my-presentations/:id` | Path: `id` | Xem chi tiết bài trình chiếu cá nhân theo ID |
| `PUT` | `/presentations/my-presentations/:id` | Path: `id`<br>Body: `title`, `theme`, `slides` | Cập nhật nội dung slide, đổi layout, màu nền, thứ tự slide |
| `DELETE` | `/presentations/my-presentations/:id` | Path: `id` | Xóa vĩnh viễn bài trình chiếu cá nhân của người dùng |
| `GET` | `/presentations/:id/export/pptx` | Path: `id` | **Xuất file PPTX**: Biên dịch bài trình chiếu sang file Microsoft PowerPoint tiêu chuẩn |

---

## V. ĐÁNH GIÁ MỨC ĐỘ HOÀN THÀNH & GIỚI HẠN KỸ THUẬT

### 1. Danh sách những phần ĐÃ HOÀN THÀNH (100% Yêu Cầu Đề Bài):
- [x] **Sản phẩm 1 (Thư viện mẫu văn bản):**
  - Giao diện dạng lưới có thumbnail, danh mục, mô tả ngắn.
  - Tìm kiếm toàn văn và lọc theo danh mục chuẩn xác.
  - Cửa sổ xem trước trang giấy A4 toàn văn kèm chế độ xem in.
  - Luồng sử dụng mẫu Copy-on-Write, tạo tài liệu mới độc lập không sửa file gốc.
  - Tích hợp trình soạn thảo Tiptap Rich Text (Headings, Bold, Italic, Tables, Lists, Align...).
  - Xuất file **DOCX chuẩn Microsoft Word** và HTML.
  - Có sẵn 6 mẫu văn bản chuẩn doanh nghiệp phong phú.
  - Nút thêm mẫu văn bản mới không cần viết lại giao diện.
- [x] **Sản phẩm 2 (Thư viện mẫu trình chiếu):**
  - Giao diện danh sách bộ template slide kèm thumbnail và color theme dots.
  - Tìm kiếm và lọc danh mục bộ trình chiếu.
  - Slide Deck Preview: Xem chi tiết từng slide trong bộ (thumbnail bên trái, slide to 16:9 ở giữa, điều hướng Next/Prev).
  - Luồng sử dụng mẫu nhân bản bộ slide độc lập với template gốc.
  - Trình soạn thảo slide WYSIWYG tích hợp: Sửa trực tiếp text, đổi bố cục layout, đổi màu nền slide, ghi chú diễn giả, thêm/xóa/đổi thứ tự slide.
  - Chế độ **Trình chiếu Toàn màn hình (Fullscreen Presentation Mode)** với phím tắt điều hướng.
  - Xuất file **PPTX chuẩn Microsoft PowerPoint**.
  - Có sẵn 4 bộ template slide cao cấp.
  - Nút thêm bộ slide mới không cần viết lại giao diện.
- [x] **Chất lượng kỹ thuật & Kiến trúc:**
  - TypeScript an toàn kiểu dữ liệu 100% trên cả client và server.
  - Kiến trúc phân lớp Clean Architecture, mã nguồn sáng sủa, dễ bảo trì.
  - Bộ kiểm thử tự động Jest & Supertest đạt 100% Pass.
  - Tài liệu bàn giao chi tiết: `README.md`, `docs/ARCHITECTURE.md`, `docs/API_SPECIFICATION.md`, `docs/WALKTHROUGH_DEMO.md`.

### 2. Giới hạn kỹ thuật hiện tại & Hướng mở rộng tiếp theo:
- **Giới hạn chuyển đổi kiểu dáng phức tạp trong DOCX:** Bộ chuyển đổi HTML-to-DOCX hiện hỗ trợ các thành phần cơ bản (tiêu đề, đoạn văn, danh sách, chữ in đậm/nghiêng). Các layout bảng biểu lồng nhau nhiều cấp độ phức tạp có thể cần thêm module chuyển đổi nâng cao qua thư viện `html-docx-js` hoặc template docx AST chuyên dụng.
- **Cộng tác nhiều người dùng:** Phiên bản hiện tại lưu trữ độc lập theo phiên người dùng. Hướng mở rộng tiếp theo là tích hợp giao thức WebSocket (Yjs / Liveblocks) để hỗ trợ cộng tác thời gian thực (Real-time Co-editing) như Google Docs.

---

## VI. TỔNG KẾT BÀN GIAO

Toàn bộ mã nguồn, cấu trúc dữ liệu và tài liệu kỹ thuật đã sẵn sàng phục vụ cho việc kiểm thử và đánh giá. Dự án đảm bảo khả năng chạy thử thực tế ngay lập tức với độ ổn định cao.

*Trân trọng cảm ơn Ban Tuyển Dụng đã dành thời gian xem xét bài làm!*
