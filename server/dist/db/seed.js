"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
console.log('🔄 Đang khởi tạo lại cơ sở dữ liệu mẫu...');
database_1.db.resetToSeeds();
console.log('✅ Đã nạp thành công:');
console.log(` - ${database_1.db.getDocumentTemplates().length} Mẫu văn bản chuẩn (Document Templates)`);
console.log(` - ${database_1.db.getPresentationTemplates().length} Bộ mẫu trình chiếu chuẩn (Presentation Templates)`);
console.log('🚀 Dữ liệu sẵn sàng phục vụ kiểm thử!');
