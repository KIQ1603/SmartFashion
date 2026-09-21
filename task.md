# SmartFashion — Task Tracker

Tổng hợp những gì đã làm và còn thiếu cho đồ án/khóa luận "Xây dựng website thương mại điện tử bán quần áo tích hợp hệ thống gợi ý sản phẩm". Cập nhật lần cuối: 2026-09-03.

Trạng thái hệ thống hiện tại: **6/6 container chạy được qua `docker compose up -d`**, đã verify end-to-end (auth, CRUD, checkout, train model AI) và redesign UI hoàn chỉnh.

---

## ✅ Đã làm

### 1. Core Backend (NestJS + Prisma + PostgreSQL)
- [x] Prisma schema đầy đủ theo thiết kế DB trong `phanticbaitoan.md` (users, products, variants, images, categories, cart, orders, reviews, wishlist, user_interactions, product_similarity_cache, user_recommendations_cache, model_training_logs)
- [x] Migration khởi tạo + seed data mẫu (2 tài khoản demo, 5 danh mục, 5 sản phẩm, interaction mẫu)
- [x] Auth: đăng ký/đăng nhập, JWT access + refresh token (HttpOnly cookie), merge giỏ hàng/interaction của Guest khi đăng nhập, rate limit `/auth/login`
- [x] RBAC: Guest / Customer / Admin theo đúng ma trận phân quyền
- [x] Products: CRUD (admin), filter/sort/pagination, tìm kiếm, đánh giá (chỉ cho phép nếu đã mua)
- [x] Categories: cây phân cấp, CRUD admin
- [x] Cart: theo user hoặc session (Guest), transaction-safe
- [x] Orders: checkout bằng DB transaction (kiểm tra & trừ tồn kho, chống oversell), state machine trạng thái đơn, hủy đơn + hoàn kho
- [x] Interactions: ghi nhận hành vi với trọng số implicit score đúng bảng nghiệp vụ
- [x] Recommendations proxy: gọi Recommendation Service có timeout + fallback Popularity cache Redis khi lỗi
- [x] Admin: dashboard stats, quản lý user, xem log huấn luyện mô hình

### 2. Recommendation Service (FastAPI + scikit-learn)
- [x] Popularity-based (cold-start hoàn toàn)
- [x] Content-Based (TF-IDF + One-Hot + Cosine Similarity)
- [x] Collaborative Filtering (Matrix Factorization qua `TruncatedSVD` — thay thế `scikit-surprise` để tránh phụ thuộc biên dịch C, xem ghi chú trong `collaborative.py`)
- [x] Hybrid switching theo độ trưởng thành dữ liệu user (đúng đặc tả mục 3.3)
- [x] Time-decay + negative filtering (loại trừ đã mua gần đây/đã trả hàng)
- [x] Pipeline train/evaluate: train-test split 80/20, Precision@K, Recall@K, RMSE, ghi log vào `model_training_logs`
- [x] Đã chạy train thử thành công qua API

### 3. Storefront (Next.js 14 + Tailwind)
- [x] Đầy đủ trang: trang chủ, danh sách/chi tiết sản phẩm, giỏ hàng, checkout, đăng nhập/đăng ký, tài khoản, đơn hàng, wishlist, tìm kiếm, danh mục
- [x] **Redesign UI hoàn chỉnh** theo design system Minimalism & Swiss Style (chọn qua skill `ui-ux-pro-max`): palette mono đen-trắng + 1 accent terracotta, font Playfair Display (heading) + Inter (body), icon Phosphor
- [x] Audit + sửa theo skill `redesign-existing-projects`: active/press states, active nav indicator, empty states đồng bộ, skip-to-content, trang 404 tuỳ biến, footer có legal links (privacy/terms — có trang thật, không phải dead link)
- [x] **Trang chủ dựng lại thành landing page thật** (7 section khác layout family nhau, theo skill `design-taste-frontend` dial Variance 6/Motion 4/Density 3): Hero, Stat strip, Curated Collections (masonry bất đối xứng), "Cách AI hoạt động", Bán chạy, Gợi ý cá nhân hóa (nền đảo + badge "Gợi ý AI" trên từng thẻ), CTA đăng ký
- [x] Scroll-reveal có chủ đích (`motion/react`, tôn trọng `prefers-reduced-motion`)
- [x] Đã verify bằng Playwright (không dùng `chrome --headless --screenshot` CLI nữa vì phát hiện lỗi render giả — xem ghi chú trong lịch sử làm việc): không tràn ngang mobile, không trùng nội dung, build production sạch

### 4. Admin Dashboard (React + Vite + Ant Design)
- [x] Dashboard tổng quan (doanh thu, đơn hàng theo trạng thái, bán chạy — biểu đồ `@ant-design/plots`)
- [x] CRUD sản phẩm + quản lý biến thể (size/màu/tồn kho)
- [x] CRUD danh mục (cây phân cấp)
- [x] Quản lý đơn hàng (đổi trạng thái theo state machine)
- [x] Quản lý người dùng (khóa/mở tài khoản)
- [x] Trang hiệu quả mô hình gợi ý (Precision@K/Recall@K theo thời gian + nút retrain thủ công)
- [x] Theme đồng bộ với Storefront (ConfigProvider: accent terracotta, font Inter tự host)

### 5. Hạ tầng
- [x] Docker hóa toàn bộ 4 service + PostgreSQL + Redis, chạy được bằng `docker compose up -d --build`
- [x] Đã xử lý các lỗi thực tế khi container hóa: Prisma + OpenSSL trên Alpine, port nội bộ vs port host, SSR gọi API qua hostname Docker thay vì localhost (chi tiết trong README mục "Xử lý sự cố thường gặp")

---

## ⏳ Còn thiếu / nên làm tiếp

### Ưu tiên cao (ảnh hưởng trực tiếp đến báo cáo/bảo vệ)
- [ ] **Sơ đồ trực quan**: ERD, Use Case Diagram, Sequence Diagram dạng hình vẽ (hiện chỉ có mô tả text trong `phanticbaitoan.md`/`kientruckithuat.md`)
- [ ] **Dữ liệu thật để đánh giá mô hình**: hiện chỉ có 1 user có interaction trong seed data nên `training_data_size` luôn = 0 khi train thử (SVD cần ≥2 user). Cần seed thêm nhiều user + interaction đa dạng để có Precision@K/Recall@K thật cho chương "Kết quả thực nghiệm"
- [ ] Ảnh sản phẩm/danh mục hiện dùng `picsum.photos` (ảnh ngẫu nhiên không liên quan thời trang) — cần thay bằng ảnh thật hoặc ít nhất ảnh đúng chủ đề khi demo/bảo vệ

### Ưu tiên trung bình (chất lượng sản phẩm)
- [ ] Gửi email thật (xác nhận đơn hàng, quên mật khẩu) — hiện chỉ log console
- [ ] Upload ảnh thật qua Object Storage (Cloudflare R2/Supabase) — hiện chưa có form upload
- [ ] Redis session cho giỏ hàng khách vãng lai (hiện dùng DB, đơn giản hơn đề xuất gốc nhưng chưa tối ưu hiệu năng)
- [ ] JWT access token đang lưu `localStorage` (qua Zustand persist) để đơn giản hoá gọi API từ Client Component — nên cân nhắc cookie HttpOnly + BFF proxy nếu triển khai thật (giảm rủi ro XSS)
- [ ] Payment gateway thật (hiện chỉ có COD / chuyển khoản thủ công, không tích hợp cổng thanh toán)
- [ ] Tìm kiếm mới dùng `ILIKE` cơ bản, chưa có full-text/fuzzy search
- [ ] Admin Dashboard: bundle JS ~2.5MB (cảnh báo lúc build), nên code-split; chưa có dark mode; các bảng Products/Orders chưa polish sâu như Storefront

### Ưu tiên thấp (mở rộng, không bắt buộc)
- [ ] Testing: chưa có unit test / e2e test cho cả 4 service
- [ ] CI/CD (GitHub Actions) và deploy production thật (Vercel/Render/Railway/Supabase)
- [ ] SEO: chỉ có metadata global trong `layout.tsx`, chưa có metadata động theo từng sản phẩm/danh mục
- [ ] i18n (đa ngôn ngữ) — hiện chỉ có tiếng Việt
- [ ] Rate limiting mới cấu hình cơ bản, chưa test tải thật
- [ ] Thay `TruncatedSVD` bằng `scikit-surprise`/`implicit` nếu muốn bám 100% thư viện đề xuất gốc trong `kientruckithuat.md`
- [ ] PWA / mobile app riêng — ngoài phạm vi đồ án hiện tại

---

## Cách chạy lại hệ thống

```bash
cd /Users/khoa/project/canhan/SmartFashion
cp .env.example .env   # đổi cổng nếu máy bị trùng 4000/5432/6379
docker compose up -d --build
```

Tài khoản demo: `admin@smartfashion.dev` / `Admin@123` · `customer@smartfashion.dev` / `Customer@123`

Chi tiết đầy đủ (kiến trúc, API, cấu trúc thư mục, troubleshooting) xem [README.md](README.md).
