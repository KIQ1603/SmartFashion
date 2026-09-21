# SmartFashion

Website thương mại điện tử bán quần áo tích hợp hệ thống gợi ý sản phẩm (Đồ án/Khóa luận tốt nghiệp).

Thiết kế bám sát 3 tài liệu trong repo:
- [dactahethong.md](dactahethong.md) — role/phân quyền, feature từng trang, luồng nghiệp vụ, API, cấu trúc thư mục
- [kientruckithuat.md](kientruckithuat.md) — kiến trúc tổng thể, công nghệ, thuật toán gợi ý
- [phanticbaitoan.md](phanticbaitoan.md) — phân tích bài toán, thiết kế DB, nghiệp vụ dữ liệu

## Kiến trúc

```
storefront (Next.js 14)        admin-dashboard (React+Vite+AntD)
        │                                │
        └───────────────┬────────────────┘
                         ▼
              core-backend (NestJS + Prisma)
                    │            │
                    │            └──HTTP (timeout+fallback)──► recommendation-service (FastAPI)
                    ▼                                                  │
               PostgreSQL  ◄───────────────────────────────────────────┘
                    │
                  Redis (cache gợi ý, session giỏ hàng)
```

- **storefront/** — Next.js 14 (App Router) + Tailwind: trang chủ, danh sách/chi tiết sản phẩm, giỏ hàng, checkout, tài khoản, wishlist, đăng nhập/đăng ký.
- **admin-dashboard/** — React (Vite) + Ant Design: dashboard doanh thu, CRUD sản phẩm/danh mục, quản lý đơn hàng/người dùng, biểu đồ hiệu quả mô hình gợi ý.
- **core-backend/** — NestJS + Prisma + PostgreSQL: auth (JWT + refresh token), sản phẩm, giỏ hàng, đơn hàng (transaction chống oversell), interactions, proxy gọi Recommendation Service với timeout + fallback popularity.
- **recommendation-service/** — FastAPI + scikit-learn: Popularity / Content-Based (TF-IDF + Cosine Similarity) / Collaborative Filtering (Matrix Factorization) / Hybrid switching theo độ trưởng thành dữ liệu user, cùng pipeline train/evaluate (Precision@K, Recall@K, RMSE).

## Chạy thử (Docker Compose)

```bash
cp .env.example .env
docker compose up -d --build
```

- Storefront: http://localhost:3000
- Admin Dashboard: http://localhost:5173 (đăng nhập bằng tài khoản admin bên dưới)
- Core Backend Swagger-free REST API: http://localhost:4000/api/v1
- Recommendation Service (Swagger UI): http://localhost:8000/docs

Lần chạy đầu tiên, `core-backend` tự động `prisma migrate deploy` + `prisma db seed` để tạo schema và dữ liệu mẫu (2 danh mục cha, 5 danh mục con, 5 sản phẩm, 2 tài khoản).

**Tài khoản demo:**
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@smartfashion.dev | Admin@123 |
| Customer | customer@smartfashion.dev | Customer@123 |

**Huấn luyện mô hình gợi ý lần đầu:** vào Admin Dashboard → "Hiệu quả gợi ý" → bấm **Huấn luyện lại**, hoặc gọi trực tiếp:
```bash
curl -X POST http://localhost:8000/internal/recommend/train
```
(Cũng có thể lên lịch cron bằng `recommendation-service/scripts/cron_train.py`, xem mục 3.5 `dactahethong.md`.)

> **Cổng bị trùng?** Nếu máy bạn đã có sẵn service chiếm cổng 4000/5432/6379, đổi `CORE_BACKEND_PORT` / `POSTGRES_PORT` / `REDIS_PORT` trong `.env` sang cổng khác rồi `docker compose up -d` lại — không cần sửa code, chỉ container-side port (4000 nội bộ) là cố định, chỉ cổng phía host là đổi được.

## Xử lý sự cố thường gặp (đã gặp và fix khi dựng repo này)

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `core-backend` log lỗi `Could not parse schema engine response` / `could not locate the Query Engine` | Prisma engine cần OpenSSL, base image `node:20-alpine` không có sẵn, hoặc sai `binaryTargets` (musl-openssl-1.1 vs 3.0) | Đã thêm `apk add openssl libssl3` vào `core-backend/Dockerfile` + khai báo rõ `binaryTargets` trong `prisma/schema.prisma` |
| `docker compose up` báo `No migration found`, seed lỗi vì bảng chưa tồn tại | Repo mới chưa có thư mục `prisma/migrations` | Đã chạy `npx prisma migrate dev --name init` một lần để tạo migration; từ nay `prisma migrate deploy` trong `docker-entrypoint` sẽ tự áp dụng |
| Đổi cổng trong `.env` nhưng app trong container vẫn không nghe đúng cổng (curl bị `Connection reset`) | `env_file: .env` nạp luôn `CORE_BACKEND_PORT` (biến dùng cho mapping cổng phía host) vào bên trong container, khiến `main.ts` nghe nhầm cổng | `docker-compose.yml` đã ghim cứng `CORE_BACKEND_PORT: 4000` trong mục `environment` của service `core-backend` để tách biệt cổng nội bộ container và cổng phía host |
| Trang `/products`, `/products/[slug]` ở Storefront lỗi 500 `fetch failed ECONNREFUSED` khi chạy qua Docker | Server Component (SSR, chạy **trong** container) gọi `NEXT_PUBLIC_API_URL=http://localhost:...` — nhưng "localhost" trong container là chính nó, không phải `core-backend` | Tách 2 biến: `NEXT_PUBLIC_API_URL` (cho trình duyệt) và `INTERNAL_API_URL=http://core-backend:4000/api/v1` (cho SSR) trong `lib/api/client.ts` + `docker-compose.yml` |
| `docker build` cho `recommendation-service` "treo" không thấy log | Dockerfile ban đầu có `apt-get update` để cài `gcc libpq-dev`, môi trường build không cho phép truy cập mirror Debian | Bỏ hẳn `apt-get` — `psycopg2-binary`, `scipy`, `scikit-learn`... đều có sẵn wheel nhị phân, không cần biên dịch |

## Chạy dev không dùng Docker

```bash
# 1. Postgres + Redis (chỉ 2 service này cần Docker, hoặc cài local)
docker compose up -d postgres redis

# 2. Core Backend
cd core-backend && npm install
npx prisma migrate deploy && npx prisma db seed
npm run start:dev            # http://localhost:4000

# 3. Recommendation Service
cd recommendation-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Storefront
cd storefront && npm install && npm run dev     # http://localhost:3000

# 5. Admin Dashboard
cd admin-dashboard && npm install && npm run dev # http://localhost:5173
```

## Đã hoàn thiện

- Auth: đăng ký/đăng nhập, JWT access + refresh token (HttpOnly cookie), merge giỏ hàng/interactions của Guest (session_id) vào tài khoản khi đăng nhập.
- RBAC: Guest / Customer / Admin theo đúng ma trận phân quyền trong `dactahethong.md`.
- Sản phẩm: CRUD (admin), danh mục cây phân cấp, biến thể size/màu/tồn kho, lọc/sắp xếp/phân trang, tìm kiếm, đánh giá (chỉ cho phép nếu đã mua).
- Giỏ hàng & đơn hàng: giỏ hàng theo user/session, checkout bằng transaction (kiểm tra & trừ tồn kho, tránh oversell), state machine trạng thái đơn hàng, hủy đơn, hoàn kho khi hủy.
- Ghi nhận hành vi (`user_interactions`) với trọng số implicit score đúng bảng nghiệp vụ (view=1, wishlist=2, add_to_cart=3, remove_from_cart=-1, purchase=5, return=-3).
- Recommendation Service: Popularity / Content-Based (TF-IDF + One-Hot + Cosine Similarity) / Collaborative Filtering (Matrix Factorization qua `TruncatedSVD`, thay thế `scikit-surprise` để tránh phụ thuộc biên dịch C — xem ghi chú trong `collaborative.py`) / Hybrid switching theo số lượng interaction, kèm time-decay và negative filtering (loại trừ đã mua gần đây/đã trả hàng).
- Pipeline train/evaluate: train-test split 80/20, Precision@K, Recall@K, RMSE, ghi log vào `model_training_logs` — dữ liệu trực tiếp cho chương "Kết quả thực nghiệm" của khóa luận.
- Cơ chế fault-tolerant: Core Backend gọi Recommendation Service có timeout (500ms) + fallback Popularity cache trong Redis nếu AI service lỗi/timeout.
- Admin Dashboard: thống kê doanh thu/đơn hàng (biểu đồ), CRUD sản phẩm + biến thể, CRUD danh mục, quản lý đơn hàng (đổi trạng thái theo state machine), khóa/mở người dùng, biểu đồ Precision@K/Recall@K theo thời gian + nút retrain thủ công.
- Storefront: SSR cho trang chủ/danh sách/chi tiết sản phẩm (SEO), khối gợi ý cá nhân hóa, sản phẩm tương tự, thường mua cùng, giỏ hàng, checkout, lịch sử đơn hàng, wishlist.

## Còn thiếu / hướng phát triển tiếp

Đúng như tổng kết ở mục 6 `dactahethong.md`, phần khung đã đủ cho các chương Cơ sở lý thuyết / Phân tích thiết kế / Xây dựng hệ thống. Các phần sau **chưa làm** trong lần dựng này, nên bổ sung trước khi bảo vệ:

1. **Sơ đồ trực quan**: ERD, Use Case Diagram, Sequence Diagram (hình vẽ) — hiện chỉ có ở dạng mô tả text trong `phanticbaitoan.md`/`kientruckithuat.md`.
2. **Wireframe/UI mockup** thiết kế trước khi code (hiện đang code thẳng theo mô tả tính năng).
3. **Gửi email thật** (xác nhận đơn hàng, quên mật khẩu) — hiện chỉ log ra console (`auth.service.ts`, `orders.service.ts`).
4. **Redis session cho giỏ hàng khách vãng lai** — hiện giỏ hàng Guest đã lưu DB theo `session_id` (đơn giản hơn), chưa dùng Redis như đề xuất trong `kientruckithuat.md` mục 2.2 (có thể tối ưu sau nếu cần benchmark hiệu năng).
5. **Object Storage thật** (Cloudflare R2/Supabase) — ảnh sản phẩm hiện dùng URL mẫu `picsum.photos`, chưa có upload thật.
6. **CI/CD** (GitHub Actions) và **deploy production** (Vercel/Render/Railway/Supabase) — hiện chỉ có Docker Compose cho môi trường dev/demo.
7. Rate limiting mới áp dụng cơ bản (Throttler toàn cục + giới hạn riêng cho `/auth/login`), chưa test tải thật.
8. Thay `TruncatedSVD` bằng `scikit-surprise`/`implicit` nếu muốn bám sát 100% thư viện đề xuất trong tài liệu kiến trúc (xem ghi chú trong `recommendation-service/app/algorithms/collaborative.py`).
9. JWT access token hiện lưu ở `localStorage` (qua Zustand persist) để đơn giản hoá gọi API từ Client Component — nên cân nhắc chuyển hẳn sang cơ chế cookie HttpOnly + BFF proxy nếu triển khai thật (giảm rủi ro XSS).

## Cấu trúc thư mục

Xem chi tiết ở mục 5 `dactahethong.md`. Tóm tắt:

```
SmartFashion/
├── storefront/            # Next.js 14 - Customer facing
├── admin-dashboard/        # React + Vite + AntD - Admin
├── core-backend/            # NestJS + Prisma - REST API chính
├── recommendation-service/  # FastAPI - AI gợi ý sản phẩm
├── docker-compose.yml
├── .env.example
└── docs (*.md + image.png)  # đặc tả / kiến trúc / phân tích bài toán gốc
```
