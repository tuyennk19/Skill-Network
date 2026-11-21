INSERT INTO career_tracks (code, name, description, is_active)
VALUES (
  'sales_b2b',
  'Bán hàng B2B',
  'Đánh giá năng lực xử lý tình huống bán hàng giữa doanh nghiệp với doanh nghiệp.',
  1
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO track_criteria
  (track_id, code, name, description, rubric_low, rubric_mid, rubric_high, sort_order)
VALUES
  ((SELECT id FROM career_tracks WHERE code = 'sales_b2b'), 'empathy', 'Đồng cảm',
   'Khả năng nhận diện và phản hồi nhu cầu, cảm xúc của khách hàng.',
   'Bỏ qua cảm xúc/nhu cầu của khách',
   'Ghi nhận vấn đề nhưng chung chung',
   'Nhận diện đúng nhu cầu, phản hồi cảm xúc cụ thể', 1),
  ((SELECT id FROM career_tracks WHERE code = 'sales_b2b'), 'objectionHandling', 'Xử lý phản đối',
   'Khả năng làm rõ và giải quyết phản đối của khách hàng.',
   'Phản bác hoặc bỏ qua phản đối',
   'Có trả lời nhưng thiếu dẫn chứng',
   'Làm rõ lý do, đưa dẫn chứng, chuyển phản đối thành cơ hội', 2),
  ((SELECT id FROM career_tracks WHERE code = 'sales_b2b'), 'logicalReasoning', 'Giải quyết logic',
   'Khả năng lập luận có cấu trúc, căn cứ và số liệu.',
   'Lập luận rời rạc, thiếu căn cứ',
   'Có cấu trúc cơ bản, vài khoảng trống',
   'Lập luận chặt chẽ, có số liệu/so sánh', 3),
  ((SELECT id FROM career_tracks WHERE code = 'sales_b2b'), 'communicationTone', 'Giọng điệu giao tiếp',
   'Mức độ chuyên nghiệp và phù hợp của cách giao tiếp.',
   'Thiếu chuyên nghiệp, quá suồng sã/gay gắt',
   'Lịch sự nhưng chưa phù hợp ngữ cảnh',
   'Chuyên nghiệp, tự tin, phù hợp đối tượng', 4),
  ((SELECT id FROM career_tracks WHERE code = 'sales_b2b'), 'closingSkill', 'Năng lực chốt sale',
   'Khả năng thống nhất hành động tiếp theo và tạo cam kết.',
   'Không có bước tiếp theo',
   'Có đề xuất nhưng chưa rõ cam kết',
   'Đề xuất hành động rõ, có mốc thời gian, tạo cam kết', 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  rubric_low = VALUES(rubric_low),
  rubric_mid = VALUES(rubric_mid),
  rubric_high = VALUES(rubric_high),
  sort_order = VALUES(sort_order);

INSERT INTO career_tracks (code, name, description, is_active)
VALUES (
  'marketing',
  'Digital Marketing',
  'Phát triển chiến lược, nội dung và đo lường hiệu quả các chiến dịch marketing số.',
  1
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO track_criteria
  (track_id, code, name, description, rubric_low, rubric_mid, rubric_high, sort_order)
VALUES
  ((SELECT id FROM career_tracks WHERE code = 'marketing'), 'audienceInsight', 'Thấu hiểu insight khách hàng',
   'Khả năng phân tích dữ liệu để xác định động cơ và rào cản của khách hàng.',
   'Không nghiên cứu khách hàng, chỉ đưa ra giả định chung chung.',
   'Mô tả được nhóm khách hàng và nhu cầu cơ bản nhưng thiếu bằng chứng.',
   'Rút ra insight cụ thể từ dữ liệu và liên hệ rõ với động cơ, rào cản của khách hàng.', 1),
  ((SELECT id FROM career_tracks WHERE code = 'marketing'), 'campaignStrategy', 'Chiến lược chiến dịch',
   'Khả năng kết nối mục tiêu, đối tượng, kênh và chỉ số đo lường.',
   'Mục tiêu, đối tượng và kênh rời rạc, không có chỉ số đo lường.',
   'Có mục tiêu và lựa chọn kênh phù hợp cơ bản nhưng KPI hoặc ngân sách chưa rõ.',
   'Liên kết mục tiêu, phân khúc, hành trình, kênh, ngân sách và KPI đo lường được.', 2),
  ((SELECT id FROM career_tracks WHERE code = 'marketing'), 'contentCreativity', 'Sáng tạo nội dung',
   'Khả năng tạo thông điệp phù hợp insight, khác biệt và nhất quán thương hiệu.',
   'Nội dung chung chung, không phù hợp đối tượng hoặc thiếu lời kêu gọi hành động.',
   'Nội dung phù hợp chủ đề nhưng điểm khác biệt và thông điệp chưa rõ.',
   'Thông điệp độc đáo, nhất quán với insight và thương hiệu, có định dạng cùng lời kêu gọi phù hợp.', 3),
  ((SELECT id FROM career_tracks WHERE code = 'marketing'), 'dataAnalytics', 'Phân tích dữ liệu',
   'Khả năng chọn KPI, diễn giải kết quả và đề xuất tối ưu có căn cứ.',
   'Không chọn chỉ số phù hợp hoặc kết luận không dựa trên dữ liệu.',
   'Theo dõi một số chỉ số nhưng giải thích tác động và nguyên nhân còn hạn chế.',
   'Chọn KPI đúng mục tiêu, đọc xu hướng, kiểm chứng giả thuyết và đề xuất tối ưu có căn cứ.', 4),
  ((SELECT id FROM career_tracks WHERE code = 'marketing'), 'digitalOptimization', 'Tối ưu kênh số',
   'Khả năng phối hợp và tối ưu kênh số theo hành trình khách hàng.',
   'Chọn kênh theo cảm tính, không xét chuyển đổi hay hành trình khách hàng.',
   'Chọn được kênh phù hợp nhưng chưa phối hợp và tối ưu xuyên suốt hành trình.',
   'Phối hợp kênh theo hành trình, tối ưu nhắm chọn và chuyển đổi dựa trên thử nghiệm, dữ liệu.', 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  rubric_low = VALUES(rubric_low),
  rubric_mid = VALUES(rubric_mid),
  rubric_high = VALUES(rubric_high),
  sort_order = VALUES(sort_order);

INSERT INTO cases (track_id, title, scenario, difficulty)
SELECT t.id, 'Khách hàng doanh nghiệp chê giá cao',
       'Giám đốc mua hàng công ty sản xuất 200 nhân viên nói phần mềm quản lý kho của bạn đắt gấp 1,5 lần đối thủ và muốn hoãn quyết định sang quý sau. Hãy trình bày cách xử lý.',
       'Trung bình'
FROM career_tracks t
WHERE t.code = 'sales_b2b'
  AND NOT EXISTS (
    SELECT 1 FROM cases c
    WHERE c.track_id = t.id AND c.title = 'Khách hàng doanh nghiệp chê giá cao'
  );

INSERT INTO cases (track_id, title, scenario, difficulty)
SELECT t.id, 'Khách im lặng sau buổi demo',
       'Sau buổi demo thành công, khách hàng doanh nghiệp không phản hồi trong 2 tuần. Hãy viết kế hoạch tiếp cận lại, làm rõ nhu cầu và đề xuất bước tiếp theo.',
       'Trung bình'
FROM career_tracks t
WHERE t.code = 'sales_b2b'
  AND NOT EXISTS (
    SELECT 1 FROM cases c
    WHERE c.track_id = t.id AND c.title = 'Khách im lặng sau buổi demo'
  );

INSERT INTO cases (track_id, title, scenario, difficulty)
SELECT t.id, 'Người ra quyết định khác người dùng',
       'Trưởng phòng kỹ thuật thích sản phẩm nhưng Giám đốc tài chính phản đối khoản đầu tư. Hãy trình bày cách thuyết phục các bên liên quan và thống nhất bước tiếp theo.',
       'Trung bình'
FROM career_tracks t
WHERE t.code = 'sales_b2b'
  AND NOT EXISTS (
    SELECT 1 FROM cases c
    WHERE c.track_id = t.id AND c.title = 'Người ra quyết định khác người dùng'
  );

INSERT INTO courses (title, description, level, duration_hours, is_demo)
SELECT 'Lắng nghe chủ động trong bán hàng',
       'Thực hành lắng nghe, đặt câu hỏi và xác nhận nhu cầu khách hàng.',
       'Cơ bản', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Lắng nghe chủ động trong bán hàng');

INSERT INTO courses (title, description, level, duration_hours, is_demo)
SELECT 'Kỹ thuật xử lý từ chối của khách hàng B2B',
       'Phân tích nguyên nhân từ chối và phản hồi phản đối có căn cứ.',
       'Trung cấp', 5, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Kỹ thuật xử lý từ chối của khách hàng B2B');

INSERT INTO courses (title, description, level, duration_hours, is_demo)
SELECT 'Xây dựng lập luận bán hàng dựa trên dữ liệu',
       'Sử dụng số liệu và so sánh để trình bày giá trị giải pháp.',
       'Trung cấp', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Xây dựng lập luận bán hàng dựa trên dữ liệu');

INSERT INTO courses (title, description, level, duration_hours, is_demo)
SELECT 'Giao tiếp chuyên nghiệp qua email và cuộc gọi',
       'Rèn luyện cách giao tiếp rõ ràng, lịch sự và phù hợp với khách hàng doanh nghiệp.',
       'Cơ bản', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Giao tiếp chuyên nghiệp qua email và cuộc gọi');

INSERT INTO courses (title, description, level, duration_hours, is_demo)
SELECT 'Chốt deal: từ đề xuất đến cam kết',
       'Lập kế hoạch hành động tiếp theo và thống nhất cam kết với khách hàng.',
       'Trung cấp', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Chốt deal: từ đề xuất đến cam kết');

INSERT INTO courses (title, description, level, duration_hours, is_demo)
SELECT 'Đàm phán giá và giá trị',
       'Thực hành đàm phán dựa trên tổng giá trị và lợi ích đầu tư.',
       'Nâng cao', 6, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Đàm phán giá và giá trị');

INSERT INTO courses (title, description, level, duration_hours, is_demo)
SELECT 'Xây dựng niềm tin với người ra quyết định',
       'Xác định mối quan tâm của các bên liên quan và xây dựng sự đồng thuận.',
       'Nâng cao', 5, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Xây dựng niềm tin với người ra quyết định');

INSERT INTO courses (title, description, level, duration_hours, is_demo)
SELECT 'Tư duy khách hàng – đặt câu hỏi khám phá nhu cầu',
       'Khám phá bối cảnh, ưu tiên và tiêu chí ra quyết định của khách hàng.',
       'Cơ bản', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Tư duy khách hàng – đặt câu hỏi khám phá nhu cầu');

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

INSERT IGNORE INTO course_criteria (course_id, criterion_id)
SELECT c.id, tc.id FROM courses c
JOIN track_criteria tc ON tc.track_id = (SELECT id FROM career_tracks WHERE code = 'sales_b2b')
WHERE c.title = 'Lắng nghe chủ động trong bán hàng' AND tc.code = 'empathy';

INSERT IGNORE INTO course_criteria (course_id, criterion_id)
SELECT c.id, tc.id FROM courses c
JOIN track_criteria tc ON tc.track_id = (SELECT id FROM career_tracks WHERE code = 'sales_b2b')
WHERE c.title = 'Kỹ thuật xử lý từ chối của khách hàng B2B' AND tc.code = 'objectionHandling';

INSERT IGNORE INTO course_criteria (course_id, criterion_id)
SELECT c.id, tc.id FROM courses c
JOIN track_criteria tc ON tc.track_id = (SELECT id FROM career_tracks WHERE code = 'sales_b2b')
WHERE c.title = 'Xây dựng lập luận bán hàng dựa trên dữ liệu' AND tc.code = 'logicalReasoning';

INSERT IGNORE INTO course_criteria (course_id, criterion_id)
SELECT c.id, tc.id FROM courses c
JOIN track_criteria tc ON tc.track_id = (SELECT id FROM career_tracks WHERE code = 'sales_b2b')
WHERE c.title = 'Giao tiếp chuyên nghiệp qua email và cuộc gọi' AND tc.code = 'communicationTone';

INSERT IGNORE INTO course_criteria (course_id, criterion_id)
SELECT c.id, tc.id FROM courses c
JOIN track_criteria tc ON tc.track_id = (SELECT id FROM career_tracks WHERE code = 'sales_b2b')
WHERE c.title = 'Chốt deal: từ đề xuất đến cam kết' AND tc.code = 'closingSkill';

INSERT IGNORE INTO course_criteria (course_id, criterion_id)
SELECT c.id, tc.id FROM courses c
JOIN track_criteria tc ON tc.track_id = (SELECT id FROM career_tracks WHERE code = 'sales_b2b')
WHERE c.title = 'Đàm phán giá và giá trị' AND tc.code IN ('objectionHandling', 'logicalReasoning');

INSERT IGNORE INTO course_criteria (course_id, criterion_id)
SELECT c.id, tc.id FROM courses c
JOIN track_criteria tc ON tc.track_id = (SELECT id FROM career_tracks WHERE code = 'sales_b2b')
WHERE c.title = 'Xây dựng niềm tin với người ra quyết định' AND tc.code IN ('empathy', 'closingSkill');

INSERT IGNORE INTO course_criteria (course_id, criterion_id)
SELECT c.id, tc.id FROM courses c
JOIN track_criteria tc ON tc.track_id = (SELECT id FROM career_tracks WHERE code = 'sales_b2b')
WHERE c.title = 'Tư duy khách hàng – đặt câu hỏi khám phá nhu cầu'
  AND tc.code IN ('empathy', 'logicalReasoning');
