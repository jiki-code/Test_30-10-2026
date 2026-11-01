# TÀI LIỆU KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)
## Office Template Suite - Văn Phòng Số Đa Năng

---

## 1. Tổng Quan Kiến Trúc (Architectural Overview)

Hệ thống được thiết kế theo mô hình **Phân lớp Hướng Dịch vụ (Layered Clean Architecture)**, đảm bảo tính phân tách trách nhiệm (Separation of Concerns), an toàn dữ liệu, tính mô-đun hóa cao và sẵn sàng mở rộng cho các định dạng văn phòng khác trong tương lai (bảng tính XLSX, biểu mẫu PDF Form).

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (SPA - React 18)                 │
│  ┌────────────────────────┐  ┌───────────────────────────────┐  │
│  │ Document Workspace     │  │ Presentation Workspace        │  │
│  │ - Template Catalog     │  │ - Deck Preview (Thumbnails)   │  │
│  │ - Full-page A4 Preview │  │ - 16:9 WYSIWYG Slide Canvas   │  │
│  │ - Tiptap Rich Editor   │  │ - Fullscreen Presentation     │  │
│  └────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ RESTful API (JSON / HTTP)
┌────────────────────────────────▼────────────────────────────────┐
│               API GATEWAY & BACKEND LAYER (Node.js/TS)          │
│  ┌────────────────────────┐  ┌───────────────────────────────┐  │
│  │ Document Controller    │  │ Presentation Controller       │  │
│  │ - Query & Category     │  │ - Deck Browser & Filter       │  │
│  │ - Copy-on-Write Clone  │  │ - Slide Tree Deep Cloner      │  │
│  │ - DOCX OpenXML Pack    │  │ - PPTX OpenXML Generator      │  │
│  └────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Repository Pattern
┌────────────────────────────────▼────────────────────────────────┐
│                   PERSISTENCE LAYER (Atomic DB)                 │
│  ┌────────────────────────┐  ┌───────────────────────────────┐  │
│  │ Template Master Store  │  │ User Workspace Storage        │  │
│  │ (Immutable / Read-only)│  │ (Isolated per document)       │  │
│  └────────────────────────┘  └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Nguyên Lý Copy-On-Write (Bảo Vệ Template Gốc Tuyệt Đối)

Một trong những yêu cầu cốt lõi của đề bài là: **"Việc tạo tài liệu mới không được làm thay đổi file template gốc"**.

### Cơ chế hoạt động:
1. **Phân tách thực thể dữ liệu (Entity Segregation):**
   - `DocumentTemplate` / `PresentationTemplate`: Đại diện cho **Khuôn mẫu chuẩn (Golden Standard Master Data)**. Được bảo vệ ở trạng thái **Chỉ Đọc (Read-Only)** đối với luồng làm việc của người dùng thông thường.
   - `UserDocument` / `UserPresentation`: Đại diện cho **Bản ghi làm việc cá nhân của người dùng**. Mỗi bản ghi có UUID định danh riêng, phiên bản riêng và lịch sử sửa đổi độc lập.

2. **Quy trình Nhân bản (Cloning Flow):**
   ```
   [User chọn "Dùng mẫu này"]
              │
              ▼
   [Load Template Master by ID] ──(Read-Only Lock)──> [Template Gốc KHÔNG ĐỔI]
              │
              ▼
   [Deep Copy Data Payload]
              │
              ├─> Sinh ID mới (UUID v4)
              ├─> Gán nhãn Title: "{Template Title} (Bản làm việc)"
              ├─> Sao chép nội dung HTML / Slide Array độc lập
              └─> Cấp phát ID mới cho từng slide (Slide UUID)
              │
              ▼
   [Lưu vào User Storage Collection]
              │
              ▼
   [Mở Trình Soạn Thảo với ID Người Dùng]
   ```

3. **Kiểm chứng tính toàn vẹn (Integrity Verification):**
   - Đã được bao phủ 100% trong bài kiểm thử tự động tại `server/tests/api.test.ts`. Test case thực hiện tạo bản sao, thực hiện cập nhật toàn bộ nội dung của bản sao thành chuỗi ký tự mới, sau đó kiểm tra lại bản ghi template gốc trong cơ sở dữ liệu để đảm bảo hash/chuỗi gốc không hề bị thay đổi.

---

## 3. Công Nghệ Biên Dịch & Xuất Định Dạng Microsoft Office (DOCX / PPTX)

Hệ thống cung cấp giải pháp xuất file theo chuẩn **Office Open XML (OOXML - ISO/IEC 29500)**:

### 3.1 Xuất văn bản DOCX:
- Sử dụng thư viện `docx` (Node.js/TypeScript).
- Trình phân tích cú pháp (Parser) chuyển đổi cấu trúc cây HTML / Rich Text của trình soạn thảo thành các thành phần OpenXML: `Paragraph`, `HeadingLevel` (H1, H2, H3), `TextRun` (in đậm, in nghiêng, gạch chân), danh sách bullet points và cấu trúc bảng `Table`.
- Dữ liệu trả về qua luồng nhị phân `application/vnd.openxmlformats-officedocument.wordprocessingml.document` với tên file tải về được mã hóa an toàn.

### 3.2 Xuất bài trình chiếu PPTX:
- Sử dụng thư viện `pptxgenjs` (High-Performance Presentation Engine).
- Tỷ lệ khung hình: Widescreen 16:9 (`LAYOUT_WIDE`).
- Engine tự động duyệt qua từng slide trong bản trình chiếu của người dùng và chuyển đổi theo đúng layout:
  - **Slide tiêu đề:** Title to, subtitle căn giữa, đường viền màu nhấn thương hiệu.
  - **Slide số liệu (Key Metrics):** Tạo các shape thẻ card riêng biệt, số liệu phóng to đậm nét kèm mô tả chi tiết.
  - **Slide so sánh hai cột:** Tách thành hai text container độc lập bên trái và phải.
  - **Slide gạch đầu dòng:** Căn lề bullet point chuẩn xác.
- File đầu ra tương thích 100% với: Microsoft PowerPoint 2016-2024, Office 365, Google Slides, LibreOffice Impress và Apple Keynote.

---

## 4. Quản Lý Trạng Thái & Trải Nghiệm Người Dùng (Frontend State & UX)

- **SPA Không Cần Tải Lại Trang:** Khởi tạo tức thì, chuyển trang không độ trễ.
- **Tiptap Headless Rich Text Engine:** Cung cấp trải nghiệm soạn thảo mượt mà, đầy đủ phím tắt văn phòng tiêu chuẩn (`Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+Z`, `Ctrl+Y`).
- **Interactive Slide Editor:** Người dùng có thể click trực tiếp vào tiêu đề, phụ đề, gạch đầu dòng và số liệu để chỉnh sửa theo thời gian thực (WYSIWYG), thay đổi màu sắc bảng màu theme theo ngữ cảnh và bổ sung ghi chú diễn giả (Speaker Notes).
- **Chế độ Trình chiếu Toàn màn hình (Presentation Slideshow Mode):** Tích hợp điều khiển bàn phím (Mũi tên Trái / Phải, Phím Cách, Phím Escape) và thanh điều khiển nổi (Floating Presenter Toolbar).

---

## 5. Chiến Lược Xử Lý Lỗi & Khả Năng Chống Chịu (Fault Tolerance)

1. **Khởi tạo dữ liệu tự hành (Self-healing Seed):** Khi database file chưa tồn tại hoặc bị xóa, hệ thống tự động khởi tạo cơ sở dữ liệu mẫu với 6 template văn bản và 4 bộ template trình chiếu.
2. **Atomic Writes:** Thao tác ghi dữ liệu bảo đảm tính toàn vẹn (atomic write sync) tránh tình trạng file bị corrupt khi tắt server đột ngột.
3. **Empty States & Loading Skeletons:** Mọi màn hình tìm kiếm đều có giao diện phản hồi trạng thái chờ và trạng thái không tìm thấy dữ liệu kèm nút "Đặt lại bộ lọc" thân thiện.
4. **Validation Layer:** Kiểm tra kiểu dữ liệu và trường bắt buộc trước khi xử lý nghiệp vụ, trả về mã lỗi HTTP chuẩn mực (400, 404, 500).

---

## 6. Hướng Mở Rộng Trong Tương Lai (Roadmap)

1. **Tích hợp Lưu trữ Đám mây (Cloud Storage Driver):**
   - Đã cấu hình theo mô hình Repository Pattern, có thể thay thế File DB bằng PostgreSQL + AWS S3 / Google Cloud Storage chỉ trong 1 file cấu hình Adapter.
2. **Cộng tác Thời gian thực (Real-time Collaboration):**
   - Tích hợp Yjs (CRDT) qua WebSocket giúp nhiều người dùng có thể cùng chỉnh sửa văn bản hoặc bộ slide cùng một lúc.
3. **Mở rộng Thư viện Mẫu Bảng Tính (Spreadsheet / XLSX):**
   - Bổ sung thư viện mẫu bảng tính kế toán, bảng lương, báo cáo tài chính sử dụng `exceljs` hoặc Canvas Datagrid.
4. **Trợ lý AI Soạn Thảo (AI Copilot):**
   - Tích hợp LLM để tự động điền thông tin vào mẫu văn bản (auto-fill placeholder) hoặc sinh nội dung slide tự động từ dàn ý văn bản.
