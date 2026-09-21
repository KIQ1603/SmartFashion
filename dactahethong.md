# ĐẶC TẢ HỆ THỐNG: ROLE, TÍNH NĂNG, LUỒNG NGHIỆP VỤ, API & CẤU TRÚC THƯ MỤC
## Website Thương mại điện tử bán quần áo tích hợp hệ thống gợi ý sản phẩm

---

## 1. VAI TRÒ NGƯỜI DÙNG (ROLES) & PHÂN QUYỀN

| Role | Mô tả | Quyền hạn chính |
|---|---|---|
| **Guest (Khách vãng lai)** | Chưa đăng nhập | Xem sản phẩm, tìm kiếm, thêm giỏ hàng (session), xem gợi ý theo Popularity-based |
| **Customer (Khách hàng)** | Đã đăng ký/đăng nhập | Tất cả quyền Guest + đặt hàng, xem lịch sử đơn, wishlist, đánh giá sản phẩm, nhận gợi ý cá nhân hóa (Collaborative/Content-Based) |
| **Admin (Quản trị viên)** | Quản lý hệ thống | Quản lý sản phẩm/danh mục, quản lý đơn hàng, quản lý người dùng, xem thống kê/báo cáo, xem hiệu quả mô hình gợi ý |
| **(Tùy chọn mở rộng) Staff/Sales** | Nhân viên bán hàng | Xử lý đơn hàng, xác nhận giao hàng — quyền hạn hẹp hơn Admin |

**Ma trận phân quyền (RBAC) tóm tắt:**

| Chức năng | Guest | Customer | Admin |
|---|---|---|---|
| Xem sản phẩm/tìm kiếm | ✔ | ✔ | ✔ |
| Xem gợi ý sản phẩm | ✔ (popularity) | ✔ (cá nhân hóa) | ✔ |
| Thêm giỏ hàng | ✔ (session) | ✔ | — |
| Đặt hàng | ✘ (yêu cầu đăng nhập) | ✔ | — |
| Đánh giá sản phẩm | ✘ | ✔ (đã mua) | — |
| CRUD sản phẩm/danh mục | ✘ | ✘ | ✔ |
| Quản lý đơn hàng (đổi trạng thái) | ✘ | ✘ | ✔ |
| Quản lý người dùng | ✘ | ✘ | ✔ |
| Xem báo cáo/thống kê & hiệu quả AI | ✘ | ✘ | ✔ |

---

## 2. DANH SÁCH TÍNH NĂNG THEO TỪNG TRANG (FEATURE LIST)

### 2.1. Storefront (Customer-facing)

| Trang | Tính năng |
|---|---|
| **Trang chủ** | Banner khuyến mãi, danh mục nổi bật, "Sản phẩm bán chạy", khối gợi ý cá nhân hóa "Có thể bạn sẽ thích" |
| **Trang danh sách sản phẩm / danh mục** | Lọc theo giá/màu/size/thương hiệu, sắp xếp (giá, mới nhất, bán chạy), phân trang, khối "Xu hướng trong danh mục này" |
| **Trang tìm kiếm** | Tìm theo từ khóa, gợi ý từ khóa (autocomplete), lọc kết quả |
| **Trang chi tiết sản phẩm** | Thông tin sản phẩm, chọn size/màu, thêm giỏ hàng/wishlist, đánh giá & bình luận, khối "Sản phẩm tương tự" (Content-Based) và "Thường được mua cùng" (Frequently Bought Together) |
| **Giỏ hàng** | Xem/sửa số lượng, xóa sản phẩm, áp mã giảm giá, tính tổng tiền |
| **Thanh toán (Checkout)** | Nhập/chọn địa chỉ giao hàng, chọn phương thức thanh toán, xác nhận đơn |
| **Tài khoản cá nhân** | Cập nhật thông tin, đổi mật khẩu, sổ địa chỉ |
| **Lịch sử đơn hàng** | Danh sách đơn, chi tiết đơn, theo dõi trạng thái giao hàng, hủy đơn (nếu chưa xử lý) |
| **Wishlist** | Danh sách sản phẩm yêu thích |
| **Đăng ký/Đăng nhập** | Form đăng ký, đăng nhập, quên mật khẩu |

### 2.2. Admin Dashboard

| Trang | Tính năng |
|---|---|
| **Dashboard tổng quan** | Thống kê doanh thu, đơn hàng theo thời gian, sản phẩm bán chạy (biểu đồ) |
| **Quản lý sản phẩm** | CRUD sản phẩm, quản lý biến thể (size/màu/tồn kho), upload ảnh, gán danh mục/tag/thuộc tính |
| **Quản lý danh mục** | CRUD danh mục (dạng cây phân cấp) |
| **Quản lý đơn hàng** | Danh sách đơn, đổi trạng thái, xem chi tiết, xử lý hoàn trả |
| **Quản lý người dùng** | Danh sách khách hàng, khóa/mở tài khoản |
| **Quản lý đánh giá** | Duyệt/ẩn đánh giá vi phạm |
| **Báo cáo hiệu quả gợi ý** | Xem Precision@K/Recall@K theo thời gian, log lần train gần nhất (đọc từ `model_training_logs`) |

---

## 3. LUỒNG NGHIỆP VỤ CHÍNH (USER FLOWS)

### 3.1. Luồng mua hàng (Purchase Flow)

```
Xem trang chủ / tìm kiếm
        │
        ▼
Xem chi tiết sản phẩm ──► (ghi nhận interaction: view)
        │
        ▼
Chọn size/màu → Thêm vào giỏ ──► (ghi nhận interaction: add_to_cart)
        │
        ▼
Xem giỏ hàng → Áp mã giảm giá (nếu có)
        │
        ▼
[Guest?] ──Yes──► Yêu cầu đăng nhập/đăng ký
        │No (đã đăng nhập)
        ▼
Nhập địa chỉ giao hàng → Chọn phương thức thanh toán
        │
        ▼
Xác nhận đặt hàng ──► Backend: kiểm tra tồn kho (transaction) → trừ kho → tạo order
        │
        ▼
        ├─► (ghi nhận interaction: purchase, điểm cao nhất)
        └─► Gửi email xác nhận đơn hàng
```

### 3.2. Luồng đăng ký/đăng nhập & merge session

```
Khách vãng lai tương tác (xem, thêm giỏ) ──► lưu theo session_id
        │
        ▼
Đăng ký/Đăng nhập thành công
        │
        ▼
Backend: merge dữ liệu interactions/cart theo session_id vào user_id
        │
        ▼
Cấp JWT (access token) + Refresh token (HttpOnly cookie)
```

### 3.3. Luồng sinh gợi ý sản phẩm (đã mô tả kỹ ở tài liệu kiến trúc — tóm tắt lại)

```
Request trang (chủ/chi tiết SP) kèm user_id (nếu có)
        │
        ▼
Core Backend gọi Recommendation Service
        │
        ▼
Kiểm tra độ trưởng thành dữ liệu user → chọn nhánh thuật toán
(Popularity / Content-Based / Collaborative + các thành phần phụ)
        │
        ▼
Trả về danh sách product_id → Core Backend enrich dữ liệu → Frontend hiển thị
```

### 3.4. Luồng quản trị: Admin thêm sản phẩm mới

```
Admin đăng nhập → vào Quản lý sản phẩm → Thêm mới
        │
        ▼
Nhập thông tin: tên, mô tả, giá, danh mục, thuộc tính (màu/chất liệu/style tags), upload ảnh
        │
        ▼
Backend lưu vào `products`, `product_variants`, `product_images`
        │
        ▼
Sản phẩm mới → chưa có interaction → được xử lý theo nhánh cold-start (Content-Based) cho đến khi có đủ dữ liệu
```

### 3.5. Luồng đánh giá & retrain mô hình (vận hành nền)

```
Cron job (định kỳ, ví dụ 2h sáng)
        │
        ▼
Lấy dữ liệu mới từ `user_interactions`
        │
        ▼
Tiền xử lý (lọc nhiễu, tính implicit_score, time-decay)
        │
        ▼
Train lại SVD → đánh giá Precision@K/Recall@K trên tập test
        │
        ▼
Lưu mô hình mới (joblib) + ghi log vào `model_training_logs`
        │
        ▼
Recommendation Service load mô hình mới cho các request tiếp theo
```

---

## 4. DANH SÁCH API THEO TỪNG TRANG (API SPECIFICATION)

> Quy ước: base URL Core Backend `/api/v1`, Recommendation Service nội bộ `/internal/recommend`.

### 4.1. Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký tài khoản |
| POST | `/auth/login` | Đăng nhập, trả JWT |
| POST | `/auth/refresh` | Cấp lại access token từ refresh token |
| POST | `/auth/logout` | Đăng xuất, thu hồi refresh token |
| POST | `/auth/forgot-password` | Gửi email khôi phục mật khẩu |

### 4.2. Sản phẩm & Danh mục (Storefront)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/products` | Danh sách sản phẩm, hỗ trợ query filter/sort/pagination |
| GET | `/products/:id` | Chi tiết sản phẩm |
| GET | `/products/:id/similar` | Sản phẩm tương tự (Content-Based, gọi nội bộ Recommendation Service) |
| GET | `/products/:id/frequently-bought-together` | Sản phẩm hay mua kèm |
| GET | `/categories` | Danh sách danh mục (dạng cây) |
| GET | `/search?q=` | Tìm kiếm sản phẩm |

### 4.3. Gợi ý cá nhân hóa
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/recommendations/homepage` | Gợi ý trang chủ (kèm JWT nếu có, fallback popularity nếu lỗi) |
| GET | `/recommendations/trending?category_id=` | Xu hướng theo danh mục |
| POST | `/interactions` | Ghi nhận hành vi (view/wishlist/add_to_cart/purchase...) |

### 4.4. Giỏ hàng & Đặt hàng
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/cart` | Xem giỏ hàng hiện tại |
| POST | `/cart/items` | Thêm sản phẩm vào giỏ |
| PATCH | `/cart/items/:id` | Cập nhật số lượng |
| DELETE | `/cart/items/:id` | Xóa khỏi giỏ |
| POST | `/orders` | Tạo đơn hàng (checkout) |
| GET | `/orders` | Lịch sử đơn hàng của user |
| GET | `/orders/:id` | Chi tiết đơn hàng |
| PATCH | `/orders/:id/cancel` | Hủy đơn (nếu còn cho phép) |

### 4.5. Tài khoản
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/users/me` | Thông tin cá nhân |
| PATCH | `/users/me` | Cập nhật thông tin |
| GET/POST | `/users/me/addresses` | Sổ địa chỉ |
| GET/POST | `/users/me/wishlist` | Wishlist |
| POST | `/products/:id/reviews` | Đánh giá sản phẩm |

### 4.6. Admin
| Method | Endpoint | Mô tả |
|---|---|---|
| POST/PATCH/DELETE | `/admin/products` | CRUD sản phẩm |
| POST/PATCH/DELETE | `/admin/categories` | CRUD danh mục |
| GET | `/admin/orders` | Danh sách đơn (toàn hệ thống) |
| PATCH | `/admin/orders/:id/status` | Đổi trạng thái đơn |
| GET | `/admin/users` | Danh sách người dùng |
| PATCH | `/admin/users/:id/status` | Khóa/mở tài khoản |
| GET | `/admin/dashboard/stats` | Thống kê doanh thu, đơn hàng |
| GET | `/admin/recommendation-metrics` | Precision@K/Recall@K từ `model_training_logs` |

### 4.7. Recommendation Service (nội bộ, Core Backend gọi)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/internal/recommend/homepage/:user_id` | Trả danh sách product_id gợi ý |
| GET | `/internal/recommend/similar/:product_id` | Content-Based similarity |
| POST | `/internal/recommend/train` | Trigger huấn luyện lại mô hình (gọi từ cron job) |
| GET | `/internal/recommend/health` | Health check cho cơ chế fallback |

---

## 5. CẤU TRÚC THƯ MỤC DỰ ÁN (FOLDER STRUCTURE)

### 5.1. Frontend Storefront (Next.js)

```
storefront/
├── app/
│   ├── (shop)/
│   │   ├── page.tsx                  # Trang chủ
│   │   ├── products/
│   │   │   ├── [slug]/page.tsx       # Chi tiết sản phẩm
│   │   │   └── page.tsx              # Danh sách sản phẩm
│   │   ├── categories/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   └── search/page.tsx
│   ├── (account)/
│   │   ├── profile/page.tsx
│   │   ├── orders/page.tsx
│   │   └── wishlist/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── layout.tsx
├── components/
│   ├── product/                      # ProductCard, ProductGallery...
│   ├── recommendation/               # RecommendationCarousel...
│   ├── cart/
│   └── common/                       # Header, Footer, Button...
├── lib/
│   ├── api/                          # hàm gọi API (axios/fetch wrapper)
│   ├── hooks/                        # custom hooks (useCart, useAuth...)
│   └── utils/
├── store/                            # Zustand store (cart, auth)
├── types/                            # TypeScript types/interfaces
└── public/
```

### 5.2. Admin Dashboard (React + Vite)

```
admin-dashboard/
├── src/
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Products/
│   │   ├── Categories/
│   │   ├── Orders/
│   │   ├── Users/
│   │   └── RecommendationMetrics/
│   ├── components/
│   ├── services/                     # gọi API admin
│   ├── store/
│   └── App.tsx
```

### 5.3. Core Backend (NestJS ví dụ — Spring Boot tương tự theo package)

```
core-backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── strategies/           # JWT strategy
│   │   ├── users/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── interactions/             # ghi nhận & forward sang AI service
│   │   ├── recommendations/          # gọi Recommendation Service (HTTP client)
│   │   └── admin/
│   ├── common/
│   │   ├── guards/                   # RolesGuard, JwtAuthGuard
│   │   ├── interceptors/
│   │   └── filters/                  # exception filter
│   ├── config/
│   └── main.ts
├── prisma/ (hoặc typeorm/entities)   # schema, migrations
└── test/
```

### 5.4. Recommendation Service (Python + FastAPI)

```
recommendation-service/
├── app/
│   ├── main.py                       # khởi tạo FastAPI app
│   ├── api/
│   │   ├── homepage.py               # endpoint /internal/recommend/homepage
│   │   ├── similar.py
│   │   └── train.py
│   ├── core/
│   │   ├── config.py
│   │   └── db.py                     # kết nối PostgreSQL
│   ├── algorithms/
│   │   ├── collaborative.py          # SVD (scikit-surprise / implicit)
│   │   ├── content_based.py          # TF-IDF, cosine similarity
│   │   ├── popularity.py
│   │   └── hybrid.py                 # logic switching hybrid
│   ├── pipeline/
│   │   ├── preprocessing.py          # lọc nhiễu, time-decay
│   │   ├── build_matrix.py           # build ma trận User-Item
│   │   └── evaluate.py               # Precision@K, Recall@K, RMSE
│   ├── models_store/                 # file .pkl mô hình đã train
│   └── schemas/                      # Pydantic models
├── scripts/
│   └── cron_train.py                 # script chạy định kỳ
└── requirements.txt
```

### 5.5. Hạ tầng chung

```
project-root/
├── storefront/
├── admin-dashboard/
├── core-backend/
├── recommendation-service/
├── docker-compose.yml                # gộp tất cả service + PostgreSQL + Redis
└── docs/                             # tài liệu khóa luận, sơ đồ ERD, API docs
```

---

## 6. TỔNG KẾT — CÁC PHẦN ĐÃ ĐỦ CHO KHÓA LUẬN

| Nội dung | Đã có ở tài liệu |
|---|---|
| Kiến trúc tổng thể, công nghệ, lý do chọn | File "Kiến trúc kỹ thuật chi tiết" |
| Thuật toán gợi ý, cách hoạt động, đánh giá | File "Kiến trúc kỹ thuật chi tiết" (mục 3) |
| Phân tích bài toán, nghiệp vụ dữ liệu, thiết kế DB | File "Phân tích bài toán, DB & nghiệp vụ dữ liệu" |
| Chiến lược gợi ý cho user lâu năm, chi phí training/inference | File "Phân tích bài toán..." (mục 5, 5.1) |
| Role & phân quyền, feature từng trang, luồng nghiệp vụ, API, cấu trúc thư mục | **File này** |

Với 3 file này, bạn đã có đủ nội dung khung cho các chương: Cơ sở lý thuyết, Phân tích thiết kế hệ thống, Xây dựng hệ thống. Phần còn thiếu (nếu muốn hoàn thiện 100% để viết báo cáo) là: **sơ đồ trực quan** (ERD, Use Case Diagram, Sequence Diagram dạng hình vẽ) và **wireframe/UI mockup** — có thể làm riêng khi bạn cần.
