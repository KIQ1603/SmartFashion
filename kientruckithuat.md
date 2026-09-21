# KIẾN TRÚC KỸ THUẬT CHI TIẾT
## Website Thương mại điện tử bán quần áo tích hợp hệ thống gợi ý sản phẩm

---

## 1. TỔNG QUAN KIẾN TRÚC

Hệ thống được thiết kế theo mô hình **Microservices tối giản (Minimal Microservices)** — tách riêng phần lõi thương mại điện tử (Core E-commerce) và phần trí tuệ nhân tạo (AI Recommendation) thành hai service độc lập, thay vì gộp chung vào một monolith.

**Lý do tách riêng:**
- Hai service có đặc thù công nghệ khác nhau hoàn toàn: Core Backend cần tối ưu cho giao dịch (transaction, consistency), còn AI service cần tối ưu cho tính toán số học (numeric computation), thư viện Python/ML.
- Cho phép scale độc lập: khi lượng người dùng tăng, có thể nhân bản (scale) riêng Recommendation Service mà không ảnh hưởng Core Backend.
- Dễ bảo trì, huấn luyện lại mô hình AI mà không cần deploy lại toàn bộ hệ thống.
- Thể hiện tư duy kiến trúc hiện đại, phù hợp để bảo vệ khóa luận (điểm cộng về mặt học thuật lẫn kỹ thuật).

**Nhược điểm cần lưu ý (nên trình bày trong phần "Hạn chế" của báo cáo):** độ trễ mạng giữa các service, độ phức tạp khi triển khai (phải chạy nhiều service cùng lúc), cần xử lý lỗi khi một service down.

---

## 2. CHI TIẾT CÔNG NGHỆ TỪNG TẦNG

### 2.1. Client Layer — Tầng giao diện

| Thành phần | Công nghệ | Lý do chọn |
|---|---|---|
| Customer Storefront | **Next.js 14 (App Router) + Tailwind CSS** | Next.js hỗ trợ Server-Side Rendering (SSR) và Static Site Generation (SSG) giúp trang sản phẩm được index tốt bởi Google (SEO), quan trọng với website bán hàng. Tailwind giúp code CSS nhanh, nhất quán, dễ maintain. |
| Admin Dashboard | **React (Vite) + Ant Design** | Không cần SEO nên không cần SSR. Ant Design có sẵn Table, Form, Modal, Chart giúp dựng nhanh giao diện quản trị (CRUD sản phẩm, đơn hàng, thống kê) mà không tốn thời gian thiết kế UI từ đầu — phù hợp với thời lượng làm khóa luận có giới hạn. |
| State Management | **Zustand hoặc React Query** | Zustand quản lý state cục bộ (giỏ hàng) đơn giản hơn Redux. React Query xử lý cache dữ liệu từ API (danh sách sản phẩm, gợi ý) tự động, giảm số lần gọi API thừa. |

### 2.2. Core Business Layer — Backend thương mại điện tử

**Công nghệ đề xuất: Node.js (NestJS) hoặc Java Spring Boot**

| Tiêu chí | Node.js (NestJS) | Java Spring Boot |
|---|---|---|
| Tốc độ phát triển | Nhanh hơn, phù hợp đồ án thời gian ngắn | Chậm hơn, nhiều boilerplate |
| Hệ sinh thái | Cùng ngôn ngữ JS với Frontend, dễ đồng bộ | Hệ sinh thái enterprise mạnh (bảo mật, transaction) |
| Hiệu năng khi tải cao | Tốt với I/O bất đồng bộ, hạn chế với CPU-bound | Tốt hơn với xử lý nặng, đa luồng thực sự |
| Đề xuất | **Nên chọn nếu deadline gấp, team quen JS/TS** | **Nên chọn nếu muốn thể hiện kiến thức OOP, Enterprise pattern (thường được đánh giá cao trong khóa luận CNTT truyền thống)** |

**Chức năng đảm nhiệm:**
- Xác thực & phân quyền: **JWT (JSON Web Token)** kèm **Refresh Token**. Access token hết hạn ngắn (15 phút), refresh token dài hơn (7 ngày) lưu trong HttpOnly Cookie để chống XSS.
- Quản lý giỏ hàng: lưu tạm trong Redis (session) đối với khách chưa đăng nhập, đồng bộ vào Database khi đăng nhập.
- Quản lý đơn hàng: áp dụng **State Machine** cho trạng thái đơn hàng (Pending → Confirmed → Shipping → Delivered/Cancelled) để tránh chuyển trạng thái sai logic.
- Quản lý kho: dùng transaction (ACID) khi trừ số lượng tồn kho lúc đặt hàng, tránh oversell khi nhiều người mua cùng lúc.

### 2.3. AI & Recommendation Layer — Hệ thống gợi ý

**Công nghệ: Python + FastAPI + Scikit-learn/Surprise (giai đoạn đầu) hoặc PyTorch (nếu mở rộng Deep Learning)**

**Lý do chọn FastAPI thay vì Flask/Django:**
- Hỗ trợ **async/await** native, xử lý nhiều request đồng thời tốt hơn Flask.
- Tự động sinh **OpenAPI/Swagger docs**, thuận tiện khi Core Backend cần biết cấu trúc API để tích hợp.
- Tích hợp **Pydantic** validate dữ liệu đầu vào/ra chặt chẽ — quan trọng khi hai service khác ngôn ngữ giao tiếp với nhau.

### 2.4. Data & Storage Layer

| Thành phần | Công nghệ | Lý do |
|---|---|---|
| Relational DB | **PostgreSQL** | Hỗ trợ tốt cho dữ liệu quan hệ phức tạp (đơn hàng, sản phẩm, biến thể size/màu), có JSONB nếu cần lưu thuộc tính động, hỗ trợ index mạnh cho truy vấn lọc sản phẩm. |
| Cache Layer | **Redis** | Cache kết quả gợi ý (giảm tải cho AI service), lưu session giỏ hàng, cache sản phẩm hot. Giúp giảm độ trễ đáng kể khi được đánh giá về hiệu năng. |
| Object Storage | **Cloudflare R2 / Supabase Storage** | Không tốn phí egress (R2), tương thích API S3, tách biệt tài nguyên tĩnh khỏi server chính giúp giảm tải băng thông. |
| Message Queue (tùy chọn nâng cao) | **RabbitMQ** | Dùng khi muốn xử lý bất đồng bộ việc ghi log tương tác người dùng (không chặn luồng chính), hoặc gửi email xác nhận đơn hàng. |

---

## 3. THUẬT TOÁN GỢI Ý SẢN PHẨM — PHẦN LÕI CỦA ĐỀ TÀI

Đây là phần quan trọng nhất, thể hiện đóng góp học thuật của khóa luận. Đề xuất áp dụng **mô hình Hybrid (kết hợp)** thay vì chỉ một kỹ thuật đơn lẻ, vì dữ liệu thực tế của một website mới thường ít, dễ gặp vấn đề "cold-start".

### 3.1. Content-Based Filtering (Lọc theo nội dung)

**Cách hoạt động:**
1. Mỗi sản phẩm được biểu diễn thành vector đặc trưng (feature vector) dựa trên thuộc tính: loại quần áo, màu sắc, chất liệu, giá, thương hiệu, tags mô tả.
2. Dùng kỹ thuật **TF-IDF** (nếu có mô tả văn bản) hoặc **One-Hot Encoding** (với thuộc tính rời rạc) để số hóa các thuộc tính này.
3. Khi người dùng xem/mua một sản phẩm A, hệ thống tính **Cosine Similarity** giữa vector của A và tất cả sản phẩm khác, trả về top-N sản phẩm gần giống nhất.

**Ưu điểm:** hoạt động tốt ngay cả khi sản phẩm mới chưa có ai tương tác (giải quyết cold-start cho sản phẩm mới).
**Nhược điểm:** chỉ gợi ý sản phẩm "giống" cái đã xem, thiếu tính khám phá (không gợi ý được sản phẩm khác loại mà người dùng có thể thích).

### 3.2. Collaborative Filtering (Lọc cộng tác)

**Cách hoạt động — sử dụng Matrix Factorization (cụ thể: thuật toán SVD - Singular Value Decomposition hoặc ALS - Alternating Least Squares):**

1. Xây dựng **ma trận tương tác User-Item**: hàng là user, cột là sản phẩm, giá trị là điểm số ngầm định (implicit rating) suy ra từ hành vi: xem = 1 điểm, thêm giỏ hàng = 3 điểm, mua = 5 điểm.
2. Ma trận này rất thưa (sparse) vì mỗi user chỉ tương tác với một phần nhỏ sản phẩm. Thuật toán **SVD** phân rã ma trận gốc `R (m x n)` thành hai ma trận nhỏ hơn: `U (m x k)` đại diện đặc trưng ẩn của user, và `V (n x k)` đại diện đặc trưng ẩn của sản phẩm, với `k` là số chiều tiềm ẩn (latent factors, thường chọn 20-50).
3. Dự đoán mức độ quan tâm của user đến sản phẩm chưa tương tác bằng tích vô hướng: `predicted_score = U_user · V_item`.
4. Sắp xếp giảm dần theo điểm dự đoán, lấy top-K làm danh sách gợi ý.

**Thư viện triển khai:** `scikit-surprise` (dễ dùng, phù hợp đồ án) hoặc `implicit` (tối ưu hơn cho dữ liệu implicit feedback như thương mại điện tử).

**Ưu điểm:** phát hiện được sở thích tiềm ẩn, gợi ý đa dạng hơn Content-Based.
**Nhược điểm:** không hoạt động được với user mới/sản phẩm mới chưa có dữ liệu tương tác (cold-start).

### 3.3. Xử lý Cold-Start — điểm bắt buộc phải có trong khóa luận

| Tình huống | Giải pháp |
|---|---|
| **User mới** (chưa đăng nhập/chưa có lịch sử) | Gợi ý theo **Popularity-based**: sản phẩm bán chạy nhất, xem nhiều nhất trong 7 ngày gần đây. |
| **User mới có vài lượt xem** | Chuyển sang **Content-Based**: dựa trên sản phẩm vừa xem để gợi ý sản phẩm tương tự. |
| **User cũ, đủ dữ liệu (>10 tương tác)** | Dùng **Collaborative Filtering (SVD)** vì độ chính xác cao hơn khi đủ dữ liệu. |
| **Sản phẩm mới chưa ai mua** | Chỉ dùng **Content-Based** để đưa vào gợi ý cho user có sản phẩm tương tự trong lịch sử. |

Đây chính là bản chất của **mô hình Hybrid**: kết hợp có điều kiện (switching hybrid) — hệ thống tự động chọn thuật toán phù hợp dựa trên lượng dữ liệu hiện có của user/sản phẩm đó.

### 3.4. Cách đánh giá độ chính xác mô hình

Để có căn cứ khoa học khi bảo vệ khóa luận, cần đánh giá bằng các chỉ số:

- **Precision@K**: trong K sản phẩm gợi ý, bao nhiêu % thực sự được user quan tâm (click/mua) sau đó.
- **Recall@K**: trong tất cả sản phẩm user thực sự thích, hệ thống gợi ý đúng được bao nhiêu %.
- **RMSE (Root Mean Squared Error)**: đo sai số giữa điểm dự đoán và điểm thực tế (dùng khi test offline với tập dữ liệu chia train/test).

**Cách thực hiện:** chia dữ liệu tương tác thành tập Train (80%) và Test (20%), huấn luyện mô hình trên Train, dự đoán và so sánh với Test để tính các chỉ số trên. Đây là phần thực nghiệm quan trọng cần có trong chương "Kết quả thực nghiệm" của khóa luận.

---

## 4. LUỒNG DỮ LIỆU CHI TIẾT (DATA FLOW)

### 4.1. Luồng gợi ý sản phẩm ở trang chủ

```
[User] → [Next.js Frontend]
              │ (1) GET /api/homepage (kèm JWT nếu đã đăng nhập)
              ▼
     [Core Backend - NestJS/Spring Boot]
              │ (2) Nếu có user_id → gọi nội bộ
              ▼
     [Recommendation Service - FastAPI]
              │ (3) Truy vấn User_Interactions từ PostgreSQL
              │ (4) Kiểm tra: user có đủ dữ liệu không?
              │     - Đủ → chạy SVD (Collaborative)
              │     - Ít → chạy Content-Based
              │     - Không có → trả về Popularity-based
              │ (5) Cache kết quả vào Redis (TTL 30 phút)
              ▼
     [Core Backend] ← (6) trả về danh sách product_id
              │ (7) Truy vấn PostgreSQL lấy chi tiết sản phẩm
              │     (tên, giá, ảnh từ R2/Supabase)
              ▼
     [Next.js Frontend] ← (8) render "Có thể bạn sẽ thích"
```

### 4.2. Luồng ghi nhận hành vi người dùng

```
User click/xem/thêm giỏ hàng sản phẩm
       ▼
Frontend gửi event → Core Backend (API /interactions)
       ▼
Core Backend ghi vào bảng User_Interactions (PostgreSQL)
       ▼
(Định kỳ - Cron job hàng đêm) Recommendation Service
đọc dữ liệu mới → huấn luyện lại mô hình SVD (retrain)
→ lưu mô hình đã train (dùng pickle/joblib) để dùng cho lần dự đoán tiếp theo
```

**Lý do retrain định kỳ (batch) thay vì real-time:** huấn luyện lại Matrix Factorization cho toàn bộ dữ liệu tốn tài nguyên tính toán, không phù hợp chạy mỗi lần có tương tác mới. Retrain theo lịch (ví dụ 2h sáng mỗi ngày) là cách tiếp cận phổ biến và khả thi cho quy mô đồ án.

### 4.3. Xử lý khi Recommendation Service gặp lỗi (Fallback)

Để hệ thống không bị "treo" trang chủ nếu AI service down, Core Backend cần:
- Đặt **timeout** khi gọi Recommendation Service (ví dụ 500ms).
- Nếu timeout hoặc lỗi → tự động fallback trả về danh sách sản phẩm bán chạy (Popularity-based) đã cache sẵn trong Redis.

Đây là chi tiết nhỏ nhưng thể hiện tư duy thiết kế hệ thống chịu lỗi (fault-tolerant), thường được đánh giá cao khi phản biện.

---

## 5. BẢO MẬT

| Vấn đề | Giải pháp |
|---|---|
| Xác thực | JWT (access + refresh token), mật khẩu hash bằng **bcrypt** |
| Phân quyền | RBAC (Role-Based Access Control): phân biệt role `customer` / `admin` ở middleware |
| Chống SQL Injection | Dùng ORM (TypeORM/Prisma cho Node, Hibernate cho Java) với prepared statement, không nối chuỗi SQL thủ công |
| Chống XSS | Sanitize input, lưu refresh token trong HttpOnly Cookie |
| Rate Limiting | Giới hạn số request/phút trên API đăng nhập để chống brute-force (dùng middleware như `express-rate-limit`) |
| HTTPS | Bắt buộc khi deploy production |

---

## 6. TRIỂN KHAI (DEPLOYMENT)

- **Docker hóa từng service**: Frontend, Core Backend, Recommendation Service, PostgreSQL, Redis mỗi thành phần một container, quản lý bằng **Docker Compose** cho môi trường phát triển/demo bảo vệ đồ án.
- **CI/CD cơ bản**: dùng GitHub Actions để tự động chạy test và build khi push code — không bắt buộc nhưng là điểm cộng.
- **Môi trường triển khai thực tế** (nếu deploy demo online): Frontend trên Vercel (tối ưu cho Next.js), Backend + AI Service trên VPS hoặc Render/Railway, Database trên Supabase/Neon (PostgreSQL managed miễn phí ở mức nhỏ).

---

## 7. TỔNG HỢP STACK CÔNG NGHỆ

| Tầng | Công nghệ |
|---|---|
| Frontend Storefront | Next.js 14, Tailwind CSS, React Query |
| Frontend Admin | React (Vite), Ant Design |
| Core Backend | NestJS (Node.js) hoặc Spring Boot (Java) |
| AI Service | Python, FastAPI, Scikit-learn/Surprise |
| Database | PostgreSQL |
| Cache | Redis |
| Object Storage | Cloudflare R2 / Supabase Storage |
| Xác thực | JWT + bcrypt |
| Containerization | Docker, Docker Compose |
| Thuật toán gợi ý | Hybrid: Popularity-based + Content-Based (Cosine Similarity/TF-IDF) + Collaborative Filtering (SVD) |

---

## 8. GỢI Ý HƯỚNG TRÌNH BÀY TRONG BÁO CÁO KHÓA LUẬN

1. **Chương Cơ sở lý thuyết**: trình bày lý thuyết Recommendation System, so sánh Content-Based vs Collaborative vs Hybrid, lý thuyết SVD/Matrix Factorization (có công thức toán học).
2. **Chương Phân tích thiết kế hệ thống**: sơ đồ kiến trúc (như mục 1), sơ đồ luồng dữ liệu (mục 4), ERD (Entity-Relationship Diagram) cho database, Use Case Diagram.
3. **Chương Xây dựng và triển khai**: mô tả công nghệ (mục 2), cách cài đặt thuật toán (mục 3), một số đoạn code minh họa quan trọng (không cần toàn bộ).
4. **Chương Kết quả thực nghiệm**: bảng số liệu Precision@K, Recall@K so sánh giữa các phương pháp (Content-Based riêng lẻ vs Collaborative riêng lẻ vs Hybrid) để chứng minh Hybrid tốt hơn — đây là phần "đóng góp khoa học" mà hội đồng sẽ quan tâm nhất.
5. **Chương Kết luận**: hạn chế (ví dụ chưa test với dữ liệu lớn thực tế, retrain batch chưa phải real-time) và hướng phát triển (Deep Learning-based recommendation, real-time streaming với Kafka).
