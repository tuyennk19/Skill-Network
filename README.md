# Skill_Network

LMS đánh giá năng lực nghề nghiệp bằng tình huống tự luận và AI, theo đặc tả trong [PROJECT_SPEC.MD](./PROJECT_SPEC.MD).

## Yêu cầu

- Node.js 20 trở lên và npm
- MySQL 8
- Gemini API key để chấm bài thật (không cần cho health check)

## Cài đặt và chạy

1. Tạo database và tài khoản MySQL riêng cho ứng dụng. Không dùng tài khoản `root` khi chạy ứng dụng.
2. Sao chép `backend/.env.example` thành `backend/.env` và điền thông tin MySQL cùng `JWT_SECRET` ngẫu nhiên dài ít nhất 32 ký tự. Không commit file `.env`.
3. Tạo cấu trúc database mới bằng `backend/db/schema.sql`. Nếu database đã có schema cũ, chạy migration `backend/db/migrations/001_add_course_demo_flag.sql` một lần trước khi seed.
4. Tại thư mục `backend`, chạy:

   ```powershell
   npm install
   npm run seed
   npm run dev
   ```

5. Mở `http://localhost:<PORT>/api/health` (mặc định trong `.env.example` là `3000`).

Tài khoản demo chỉ dùng cho môi trường phát triển: `admin@skillnetwork.local` / `Admin@123` và `student@skillnetwork.local` / `Student@123`.

## Kiểm tra Gemini

Điền `GEMINI_API_KEY` trong `backend/.env`, sau đó tự chạy lệnh sau trong thư mục `backend` để gửi một yêu cầu kiểm tra tối thiểu tới Gemini:

```powershell
npm run ai:check
```

Lệnh chỉ in trạng thái và thời gian phản hồi; không in API key hoặc nội dung phản hồi.

Để chạy năm bài mẫu đánh giá năng lực với tiêu chí trong DB, chạy `npm run ai:test` từ `backend`. Khi `MOCK_AI=false`, lệnh gửi bốn bài không bị anti-cheat chặn tới Gemini; bài chèn lệnh được chặn cục bộ. Kết quả chỉ in điểm và trạng thái, không in câu trả lời hay phản hồi thô của AI; nếu một bài lỗi thì các bài còn lại vẫn được kiểm tra. Nếu `MOCK_AI=true`, kết quả là dữ liệu mô phỏng và không xác nhận khả năng nhận diện bài lạc đề của Gemini.

## Kết quả mẫu khi AI gián đoạn

Đặt `DEMO_ON_AI_FAILURE=true` để frontend nhận kết quả mẫu khi Gemini mất kết nối, key chưa cấu hình hoặc trả dữ liệu không hợp lệ. Kết quả mẫu:

- Hiển thị trên trang báo cáo cùng nhãn rõ là dữ liệu không lưu.
- Không tạo bản ghi trong `assessments`, `assessment_scores` hoặc `recommendations`.
- Không xuất hiện trong lịch sử đánh giá.

Đặt `DEMO_ON_AI_FAILURE=false` để giữ nguyên xử lý lỗi AI theo mã HTTP thay vì trả kết quả mô phỏng.

## API hiện có

Các endpoint dùng tiền tố `/api`; endpoint cần đăng nhập gửi `Authorization: Bearer <token>`.

| Phương thức | Endpoint | Quyền |
| --- | --- | --- |
| GET | `/health` | Công khai |
| POST | `/auth/register`, `/auth/login` | Công khai |
| GET, PATCH | `/auth/me` | Đã đăng nhập |
| GET | `/tracks`, `/courses`, `/courses/:id` | Công khai |
| GET | `/cases`, `/cases/random`, `/cases/:id` | Đã đăng nhập |
| POST | `/assessments` | Học viên; tối đa 5 lần/phút |
| GET | `/assessments/history`, `/assessments/:id` | Đã đăng nhập; chi tiết chỉ chủ sở hữu |
| GET, POST, PUT, DELETE | `/admin/tracks`, `/admin/tracks/:id` | Admin |
| POST, PUT, DELETE | `/admin/tracks/:trackId/criteria`, `/admin/criteria/:id` | Admin |
| GET, POST, PUT, DELETE | `/admin/cases`, `/admin/cases/:id` | Admin |
| GET, POST, PUT, DELETE | `/admin/courses`, `/admin/courses/:id` | Admin |
| GET | `/admin/assessments`, `/admin/assessments/:id`, `/admin/stats` | Admin |

Chạy kiểm thử backend bằng `npm test` trong thư mục `backend`. Test không tự gọi Gemini; API nộp bài dùng Gemini thật khi `MOCK_AI=false` và cấu hình key hợp lệ.

## Collection Postman

Mở file `backend/Skill_Network.postman_collection.json` trong Postman. Collection dùng biến:

- `baseUrl`: địa chỉ server, ví dụ `http://localhost:3000`
- `token`: JWT của học viên sau khi đăng nhập
- `adminToken`: JWT của tài khoản admin sau khi đăng nhập

Khi tạo dữ liệu mới bằng Admin, nên chạy luồng: đăng nhập Admin → tạo/tải ngành → thêm tiêu chí → thêm tình huống → thêm khóa học. Sau đó đăng nhập học viên, lấy tình huống ngẫu nhiên và nộp bài để xác minh luồng liên kết dữ liệu.

## Cấu trúc thư mục

```text
Skill_Network/
  backend/
    db/                 # schema, seed và migration
    scripts/            # kiểm tra Gemini và bài đánh giá mẫu
    src/
      config/           # biến môi trường và MySQL
      controllers/      # xử lý HTTP
      middlewares/      # JWT, phân quyền, validate, lỗi
      models/           # truy vấn MySQL
      routes/           # endpoint Express
      services/         # Gemini, mock AI, gợi ý khóa học
      validators/       # schema Zod
    tests/              # unit test Node.js
  frontend/
    css/                # giao diện dùng chung
    js/pages/           # JavaScript từng trang
    admin/              # trang quản trị
  PROJECT_SPEC.MD
```

## Các giai đoạn

Tiến độ và yêu cầu của từng giai đoạn được mô tả trong `PROJECT_SPEC.MD`, mục 13. Thực hiện đúng thứ tự; API, giao diện và kiểm thử sẽ được bổ sung lần lượt.
