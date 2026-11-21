# Quy tắc cho Copilot – dự án Skill_Network
- Tài liệu gốc: PROJECT_SPEC.md. Luôn tuân theo; không thêm tính năng ngoài phạm vi.
- Backend: Node.js + Express (CommonJS), MySQL 8 qua mysql2/promise, truy vấn tham số hóa `?`. KHÔNG ghép chuỗi SQL.
- Frontend: HTML/CSS/JavaScript thuần (ES module) + Chart.js. KHÔNG dùng React/Vite/Bootstrap.
- AI: Gemini (@google/genai) chỉ gọi từ backend; ép JSON bằng responseMimeType + responseSchema; kiểm tra JSON ở server; KHÔNG tự động rơi về dữ liệu mock khi AI lỗi.
- Lỗi trả về dạng { message, code } với mã HTTP đúng. Không log bí mật.
- Chèn dữ liệu vào DOM bằng textContent, không innerHTML.
- Mật khẩu bcrypt cost 10; JWT 24 giờ; bí mật chỉ trong .env.
- Làm từng Phase theo PROJECT_SPEC.md mục 13; sau mỗi Phase tự chạy thử và báo kết quả.
- Nếu thiếu thông tin hoặc có mâu thuẫn, hãy hỏi lại thay vì suy đoán.
