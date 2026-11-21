ALTER TABLE courses
  ADD COLUMN is_demo TINYINT(1) NOT NULL DEFAULT 0;

UPDATE courses
SET is_demo = 1
WHERE title IN (
  'Lắng nghe chủ động trong bán hàng',
  'Kỹ thuật xử lý từ chối của khách hàng B2B',
  'Xây dựng lập luận bán hàng dựa trên dữ liệu',
  'Giao tiếp chuyên nghiệp qua email và cuộc gọi',
  'Chốt deal: từ đề xuất đến cam kết',
  'Đàm phán giá và giá trị',
  'Xây dựng niềm tin với người ra quyết định',
  'Tư duy khách hàng – đặt câu hỏi khám phá nhu cầu'
);
