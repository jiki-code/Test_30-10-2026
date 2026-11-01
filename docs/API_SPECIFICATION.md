# TÀI LIỆU ĐẶC TẢ API (API SPECIFICATION)
## Office Template Suite - Document & Presentation Library

Hệ thống cung cấp chuẩn RESTful API cho hai sản phẩm chính: **Thư viện Mẫu Văn Bản (Document Templates)** và **Thư viện Mẫu Trình Chiếu (Presentation Templates)**, cùng các dịch vụ bản sao tài liệu người dùng và xuất định dạng Microsoft Office chuẩn (DOCX, PPTX).

- **Base URL (Development & Production):** `http://localhost:5001/api`
- **Content-Type:** `application/json`
- **Định dạng phản hồi chung:**
  ```json
  {
    "success": true,
    "message": "Thông điệp phản hồi (nếu có)",
    "data": { ... },
    "count": 10 // Khi trả về danh sách mảng
  }
  ```

---

## 1. Module Mẫu Văn Bản (Document Templates)

### 1.1 Lấy danh sách mẫu văn bản
- **Endpoint:** `GET /documents/templates`
- **Query Parameters:**
  - `search` (string, optional): Tìm kiếm theo tiêu đề, mô tả hoặc tag.
  - `category` (string, optional): Lọc theo danh mục (`Hợp đồng`, `Nhân sự`, `Biên bản`, `Báo cáo`, `Dự án`).
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "count": 6,
    "data": [
      {
        "id": "doc-tpl-001",
        "title": "Hợp Đồng Lao Động Chuẩn",
        "description": "Mẫu hợp đồng lao động xác định thời hạn theo Bộ luật Lao động Việt Nam hiện hành...",
        "category": "Hợp đồng",
        "tags": ["Lao động", "Nhân sự", "Pháp lý", "Hợp đồng"],
        "thumbnailUrl": "https://images.unsplash.com/...",
        "version": 1,
        "isOfficial": true,
        "createdAt": "2026-01-15T08:00:00Z",
        "updatedAt": "2026-03-20T10:30:00Z"
      }
    ]
  }
  ```

### 1.2 Xem chi tiết mẫu văn bản (Toàn văn nội dung)
- **Endpoint:** `GET /documents/templates/:id`
- **Response 200 OK:** Trả về đầy đủ `contentHtml` và siêu dữ liệu của mẫu.
- **Response 404 Not Found:** Nếu không tìm thấy ID mẫu.

### 1.3 Thêm mẫu văn bản mới vào thư viện
- **Endpoint:** `POST /documents/templates`
- **Request Body:**
  ```json
  {
    "title": "Bản Cam Kết Bảo Mật Thông Tin (NDA)",
    "description": "Thỏa thuận bảo vệ dữ liệu bí mật giữa hai doanh nghiệp đối tác.",
    "category": "Hợp đồng",
    "tags": ["NDA", "Bảo mật", "Pháp lý"],
    "thumbnailUrl": "https://...",
    "contentHtml": "<h1>THỎA THUẬN BẢO MẬT (NDA)</h1><p>Nội dung...</p>"
  }
  ```
- **Response 201 Created:** Trả về mẫu mới được lưu với ID phát sinh tự động.

### 1.4 Khởi tạo tài liệu mới từ mẫu (Copy-on-Write)
- **Endpoint:** `POST /documents/from-template/:templateId`
- **Mô tả:** Nhân bản toàn bộ nội dung từ mẫu gốc sang một bản ghi `UserDocument` độc lập. Mẫu gốc ở trạng thái Read-Only không bị thay đổi.
- **Request Body (Optional):**
  ```json
  {
    "customTitle": "Hợp Đồng Lao Động - Nguyễn Văn An",
    "author": "Người dùng"
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "success": true,
    "message": "Khởi tạo tài liệu mới từ mẫu thành công (bảo vệ nguyên vẹn mẫu gốc)",
    "data": {
      "id": "e9b25f13-7e23-4560-91a5-827c813a3755",
      "templateId": "doc-tpl-001",
      "templateTitle": "Hợp Đồng Lao Động Chuẩn",
      "title": "Hợp Đồng Lao Động - Nguyễn Văn An",
      "contentHtml": "<h1>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>...",
      "createdAt": "2026-10-31T02:30:00.000Z",
      "lastModified": "2026-10-31T02:30:00.000Z",
      "author": "Người dùng"
    }
  }
  ```

### 1.5 Cập nhật và lưu tài liệu người dùng
- **Endpoint:** `PUT /documents/my-documents/:id`
- **Request Body:**
  ```json
  {
    "title": "Hợp Đồng Lao Động - Đã Hoàn Thiện",
    "contentHtml": "<h1>Nội dung đã chỉnh sửa qua trình soạn thảo...</h1>"
  }
  ```
- **Response 200 OK:** Bản ghi sau khi cập nhật với trường `lastModified` mới.

### 1.6 Xuất tài liệu ra file DOCX chuẩn Microsoft Word
- **Endpoint:** `GET /documents/my-documents/:id/export/docx`
- **Response Headers:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `Content-Disposition: attachment; filename="Hop-Dong-Lao-Dong.docx"`
- **Response Body:** File nhị phân `.docx` chuẩn OpenXML.

---

## 2. Module Mẫu Trình Chiếu (Presentation Templates)

### 2.1 Lấy danh sách bộ mẫu trình chiếu
- **Endpoint:** `GET /presentations/templates`
- **Query Parameters:**
  - `search` (string, optional): Tìm kiếm theo tiêu đề hoặc tag.
  - `category` (string, optional): Lọc theo danh mục (`Startup Pitch`, `Kinh doanh`, `Đào tạo`, `Công nghệ`).
- **Response 200 OK:** Trả về danh sách bộ template kèm danh sách slide và thông số Theme (màu chủ đạo, font chữ).

### 2.2 Xem chi tiết bộ mẫu trình chiếu (kèm toàn bộ danh sách slide)
- **Endpoint:** `GET /presentations/templates/:id`
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "data": {
      "id": "pres-tpl-001",
      "title": "Startup Pitch Deck (Gọi Vốn Đầu Tư Hạt Giống)",
      "category": "Startup Pitch",
      "theme": {
        "name": "Modern Tech Indigo",
        "primaryColor": "#4f46e5",
        "secondaryColor": "#06b6d4",
        "accentColor": "#f59e0b",
        "backgroundColor": "#0f172a",
        "textColor": "#ffffff"
      },
      "slides": [
        {
          "id": "s1-1",
          "slideNumber": 1,
          "title": "NEXUS OFFICE AI",
          "subtitle": "Định hình lại tương lai năng suất văn phòng...",
          "layout": "title"
        },
        {
          "id": "s1-2",
          "slideNumber": 2,
          "title": "BÀI TOÁN THỊ TRƯỜNG",
          "layout": "bullet",
          "bullets": [ ... ]
        }
      ]
    }
  }
  ```

### 2.3 Khởi tạo bản trình chiếu mới từ mẫu (Copy-on-Write)
- **Endpoint:** `POST /presentations/from-template/:templateId`
- **Mô tả:** Nhân bản sâu cấu trúc theme và toàn bộ mảng slides, cấp phát ID slide mới độc lập. Mẫu gốc được bảo vệ nguyên trạng.
- **Response 201 Created:** Trả về `UserPresentation` mới.

### 2.4 Cập nhật nội dung bản trình chiếu (Thêm, sửa, đổi vị trí slide)
- **Endpoint:** `PUT /presentations/my-presentations/:id`
- **Request Body:**
  ```json
  {
    "title": "Bài Thuyết Trình Gọi Vốn Series A",
    "slides": [
      {
        "id": "usr-s-101",
        "slideNumber": 1,
        "title": "Tiêu đề mới",
        "layout": "title",
        "backgroundColor": "#0f172a"
      }
    ]
  }
  ```
- **Response 200 OK:** Cập nhật thành công.

### 2.5 Xuất bài trình chiếu ra file PPTX chuẩn Microsoft PowerPoint
- **Endpoint:** `GET /presentations/:id/export/pptx`
- **Response Headers:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation`
  - `Content-Disposition: attachment; filename="presentation.pptx"`
- **Response Body:** File nhị phân `.pptx` chuẩn OpenXML (mở trực tiếp trên Microsoft PowerPoint, Google Slides, Apple Keynote).

---

## 3. Mã Lỗi Chuẩn Hóa (Error Codes)
- `400 Bad Request`: Thiếu dữ liệu bắt buộc (tiêu đề, nội dung).
- `404 Not Found`: Không tìm thấy mẫu hoặc tài liệu cá nhân với ID yêu cầu.
- `500 Internal Server Error`: Lỗi máy chủ nội bộ (kèm thông điệp chi tiết khi bật cờ dev).
