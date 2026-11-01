import { db } from './database';

console.log('🔄 Đang khởi tạo lại cơ sở dữ liệu mẫu...');
db.resetToSeeds();
console.log('✅ Đã nạp thành công:');
console.log(` - ${db.getDocumentTemplates().length} Mẫu văn bản chuẩn (Document Templates)`);
console.log(` - ${db.getPresentationTemplates().length} Bộ mẫu trình chiếu chuẩn (Presentation Templates)`);
console.log('🚀 Dữ liệu sẵn sàng phục vụ kiểm thử!');
