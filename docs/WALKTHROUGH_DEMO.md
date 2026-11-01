# KỊCH BẢN CHẠY THỬ VÀ REVIEW ĐÁNH GIÁ (DEMO & WALKTHROUGH GUIDE)
## Hướng Dẫn Kiểm Thử Thực Tế Cho Người Đánh Giá

Tài liệu này hướng dẫn người đánh giá kiểm tra toàn bộ luồng hoạt động thực tế của hai sản phẩm: **Thư Viện Mẫu Văn Bản** và **Thư Viện Mẫu Trình Chiếu**.

---

## 1. Chuẩn Bị Môi Trường & Khởi Động Ứng Dụng

Ứng dụng đã được tích hợp toàn diện. Bạn có thể khởi động toàn bộ hệ thống bằng 1 trong 2 cách:

### Cách 1: Khởi động bản Production Build tích hợp (Nhanh nhất - 1 lệnh duy nhất)
```bash
npm run build
npm run start --prefix server
```
Truy cập trình duyệt: **`http://localhost:5001`**

### Cách 2: Khởi động chế độ Development (Hot-Reloading song song)
```bash
npm run dev
```
Truy cập trình duyệt: **`http://localhost:5173`** (Client Vite tự động proxy API sang `localhost:5001`).

---

## 2. Kịch Bản Kiểm Thử SẢN PHẨM 1: THƯ VIỆN MẪU VĂN BẢN

### Bước 1: Khám phá thư viện & Lọc danh mục
- Mở tab **"Mẫu Văn Bản"** trên thanh điều hướng.
- Kiểm tra danh sách hiển thị: Có 6 mẫu văn bản thử nghiệm thực tế (Hợp đồng lao động, Biên bản họp, Báo cáo tiến độ tuần, Đơn xin nghỉ phép, Tờ trình dự án, Thư mời nhận việc).
- Nhấp chọn các danh mục trên thanh filter: **Hợp đồng**, **Nhân sự**, **Biên bản**, **Báo cáo**, **Dự án** để kiểm tra tính năng lọc.
- Thử gõ vào ô tìm kiếm: `"Lao động"` hoặc `"Bảo mật"` để kiểm tra kết quả tìm kiếm thời gian thực.

### Bước 2: Xem trước mẫu toàn văn (Preview Modal)
- Bấm vào nút **"Xem trước"** trên mẫu *"Hợp Đồng Lao Động Chuẩn"*.
- Modal xuất hiện hiển thị bản xem trước dưới dạng trang giấy A4 với định dạng bảng biểu, tiêu đề và các điều khoản pháp lý.
- Thử bấm nút máy in **(Print)** để kiểm tra tính năng xem trước bản in.

### Bước 3: Khởi tạo tài liệu mới & Chỉnh sửa (Copy-on-Write)
- Bấm nút **"Sử dụng mẫu này"** ngay trên Modal xem trước hoặc trên Card mẫu.
- Hệ thống nhân bản tài liệu và tự động chuyển sang **Trình soạn thảo văn bản Tích hợp (Document Editor)**.
- Kiểm tra: Tiêu đề tài liệu được đặt mặc định là *"Hợp Đồng Lao Động Chuẩn (Bản làm việc)"*.
- Thử chỉnh sửa nội dung văn bản:
  - Thay đổi mức lương trong bảng thành `45,000,000 VNĐ`.
  - Bôi đen một đoạn text và đổi định dạng (In đậm, In nghiêng, Đổi màu hoặc Căn giữa).
  - Đổi tiêu đề tài liệu thành: *"Hợp Đồng Thử Việc - Kỹ Sư Cao Cấp"*.
- Bấm nút **"Lưu tài liệu"** (Thông báo *"Đã lưu!"* hiển thị).

### Bước 4: Kiểm chứng tính toàn vẹn của Mẫu Gốc (Không bị sửa file gốc)
- Bấm nút **"← Quay lại thư viện"**.
- Mở lại xem trước mẫu *"Hợp Đồng Lao Động Chuẩn"*.
- **Kết quả:** Mẫu gốc vẫn giữ nguyên 100% mức lương cũ `35,000,000 VNĐ` và tiêu đề gốc ban đầu. File gốc hoàn toàn không bị ảnh hưởng!

### Bước 5: Xuất tài liệu ra file DOCX chuẩn Microsoft Word
- Vào tab **"Tài Liệu Của Tôi"**, mở lại tài liệu vừa tạo.
- Bấm nút **"Tải DOCX"**.
- Trình duyệt tải về file `.docx`. Bạn có thể mở file này trực tiếp trên Microsoft Word, Office 365 hoặc Google Docs để kiểm tra định dạng Heading, Bảng biểu và chữ in đậm/in nghiêng được bảo toàn nguyên vẹn.

---

## 3. Kịch Bản Kiểm Thử SẢN PHẨM 2: THƯ VIỆN MẪU TRÌNH CHIẾU

### Bước 1: Khám phá thư viện slide & Xem trước bộ slide (Deck Preview)
- Nhấp vào tab **"Mẫu Trình Chiếu"** trên thanh điều hướng.
- Kiểm tra danh sách: Có 4 bộ template slide cao cấp (Startup Pitch Deck, Báo cáo Kết quả Kinh doanh Q3, Đào tạo Onboarding Nhân sự, Kiến trúc Kỹ thuật Hệ thống).
- Nhấp vào nút **"Xem bộ slide"** trên bộ *"Startup Pitch Deck"*.
- Cửa sổ Preview xuất hiện:
  - Cột bên trái hiển thị danh sách tất cả các slide trong bộ.
  - Khung chính giữa hiển thị slide to theo tỷ lệ Widescreen 16:9 với màu sắc chủ đạo.
  - Bấm nút **Mũi tên Trái / Phải** hoặc click vào từng thumbnail bên trái để xem qua các slide khác nhau (Title, Bài toán, Giải pháp hai cột, Thẻ số liệu tăng trưởng, Kêu gọi vốn).

### Bước 2: Khởi tạo bản trình chiếu & Chỉnh sửa tương tác (Slide Editor)
- Bấm nút **"Sử dụng bộ slide này"**.
- Hệ thống nhân bản bộ slide và chuyển thẳng sang **Trình soạn thảo trình chiếu (Presentation Editor)**.
- Thử nghiệm các thao tác biên tập slide:
  - **Click trực tiếp vào tiêu đề** slide để sửa chữ (VD: Sửa *"NEXUS OFFICE AI"* thành *"MY STARTUP AI 2026"*).
  - Sửa các thẻ số liệu tăng trưởng (Metrics) hoặc các gạch đầu dòng.
  - Thử bấm **"Bố cục Slide (Layout)"** ở cột bên phải để đổi bố cục sang dạng *Thẻ số liệu* hoặc *So sánh 2 cột*.
  - Thử bấm đổi **"Màu Nền Slide"** ở bảng màu bên phải.
  - Bấm nút **"+" (Thêm slide mới)** ở cột bên trái để chèn thêm một slide mới vào bài.
  - Bấm nút **"Di chuyển lên/xuống"** để đổi thứ tự slide.
- Bấm nút **"Lưu bài"** (Hiển thị thông báo *"Đã lưu!"*).

### Bước 3: Chế độ Trình Chiếu Toàn Màn Hình (Slideshow Mode)
- Bấm nút **"Trình chiếu"** (Icon Play xanh lá cây).
- Màn hình chuyển sang chế độ trình chiếu chuyên nghiệp toàn màn hình:
  - Nhấn phím **Mũi tên Phải (→)** hoặc **Phím Cách (Spacebar)** để chuyển sang slide tiếp theo.
  - Nhấn phím **Mũi tên Trái (←)** để quay lại slide trước.
  - Nhấn phím **Escape (Esc)** hoặc bấm *"Thoát (Esc)"* trên thanh điều khiển nổi để kết thúc trình chiếu.

### Bước 4: Xuất bài trình chiếu sang file PPTX chuẩn Microsoft PowerPoint
- Bấm nút **"Tải PPTX"**.
- Trình duyệt tải về file `.pptx`. Mở file trên Microsoft PowerPoint hoặc Keynote để kiểm chứng các slide được tạo chuẩn xác với đầy đủ hình khối và màu sắc theme.

---

## 4. Kiểm Thử Khả Năng Mở Rộng: Thêm Mẫu Mới Không Cần Viết Lại Giao Diện

- Bấm nút **"Thêm Mẫu Mới"** (Góc phải thanh điều hướng).
- Một modal xuất hiện cho phép:
  - Chọn thêm **Mẫu Văn Bản** hoặc **Mẫu Trình Chiếu**.
  - Nhập tên mẫu, danh mục mới, mô tả, ảnh thumbnail và nội dung ban đầu.
- Bấm **"Lưu Mẫu Mới"**.
- **Kết quả:** Thư viện lập tức cập nhật và hiển thị mẫu mới này ngay trên giao diện mà không cần reload trang hay sửa bất kỳ dòng mã nguồn nào.

---

## 5. Chạy Bài Kiểm Thử Tự Động (Automated Test Suite)

Trong terminal, chạy lệnh kiểm thử tự động của Jest:
```bash
npm run test
```
Toàn bộ 10 bài test tích hợp (Integration Tests) kiểm tra các luồng API, tìm kiếm, lọc danh mục, cơ chế Copy-on-Write và xuất DOCX/PPTX sẽ chạy và trả về **PASS 100%**.
