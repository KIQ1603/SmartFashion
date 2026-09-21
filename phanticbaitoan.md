# PHÂN TÍCH BÀI TOÁN, THIẾT KẾ DATABASE & NGHIỆP VỤ DỮ LIỆU
## Cho hệ thống gợi ý sản phẩm (Recommendation System)

---

## 1. PHÂN TÍCH BÀI TOÁN

### 1.1. Phát biểu bài toán

Cho một tập người dùng `U = {u1, u2, ..., um}` và một tập sản phẩm `I = {i1, i2, ..., in}`. Với mỗi người dùng `u`, hệ thống cần dự đoán và xếp hạng các sản phẩm mà `u` **chưa từng tương tác**, sao cho những sản phẩm được xếp hạng cao nhất có xác suất cao nhất được `u` quan tâm (xem, thêm giỏ hàng, mua) nếu được gợi ý.

Đây là bài toán **Top-N Recommendation** dựa trên **Implicit Feedback** (phản hồi ngầm định) — khác với bài toán rating truyền thống (như Netflix chấm sao 1-5), vì thương mại điện tử quần áo hiếm khi có "rating" tường minh, chỉ có hành vi: xem, click, thêm giỏ, mua, bỏ giỏ.

### 1.2. Tại sao đây là bài toán khó (Challenges) — cần nêu trong khóa luận

1. **Dữ liệu thưa (Sparsity):** một user chỉ tương tác với vài chục/vài trăm sản phẩm trong khi shop có thể có hàng nghìn sản phẩm → ma trận User-Item cực thưa (thường >99% ô trống).
2. **Cold-start:** user mới, sản phẩm mới không có lịch sử.
3. **Implicit feedback mơ hồ:** "xem sản phẩm" không đồng nghĩa "thích" (có thể xem nhầm, xem rồi chê); "không xem" không đồng nghĩa "không thích" (có thể chưa biết đến sản phẩm). Đây là điểm khác biệt căn bản so với rating tường minh và cần được xử lý bằng trọng số (weighting) hợp lý.
3. **Yếu tố thời gian (Temporal dynamics):** sở thích thời trang thay đổi theo mùa, xu hướng — dữ liệu tương tác cũ có thể không còn phản ánh đúng sở thích hiện tại.
4. **Đặc thù ngành thời trang:** sản phẩm có nhiều biến thể (size, màu) của cùng một mẫu — cần quyết định gợi ý ở cấp độ sản phẩm (product) hay biến thể (variant).

### 1.3. Input / Output của bài toán (góc nhìn hệ thống)

| | Mô tả |
|---|---|
| **Input** | `user_id` (hoặc session_id với khách vãng lai) + lịch sử tương tác của user + metadata sản phẩm |
| **Output** | Danh sách top-K `product_id` được sắp xếp theo độ liên quan giảm dần |
| **Ràng buộc** | Thời gian phản hồi < 500ms (trải nghiệm người dùng), loại bỏ sản phẩm hết hàng, không gợi ý lại sản phẩm đã mua gần đây (trừ nhu yếu phẩm — không áp dụng ở đây) |

---

## 2. NGHIỆP VỤ DỮ LIỆU CẦN THU THẬP (DATA REQUIREMENTS)

Đây là phần quan trọng nhất — mô hình AI tốt hay không phụ thuộc 70% vào dữ liệu đầu vào có đủ và đúng nghiệp vụ hay không.

### 2.1. Nhóm dữ liệu hành vi (Behavioral Data) — quan trọng nhất cho Collaborative Filtering

| Hành vi | Trọng số gợi ý (implicit score) | Ghi chú nghiệp vụ |
|---|---|---|
| Xem chi tiết sản phẩm (view) | 1 điểm | Ghi nhận thời gian xem (dwell time) nếu có thể — xem >30s đáng tin hơn xem lướt qua |
| Thêm vào wishlist/yêu thích | 2 điểm | Tín hiệu quan tâm rõ ràng hơn view |
| Thêm vào giỏ hàng | 3 điểm | |
| Bỏ giỏ hàng không mua (cart abandonment) | -1 điểm (giảm nhẹ) | Tín hiệu "cân nhắc nhưng không đủ hấp dẫn" — nhiều đề tài bỏ sót dữ liệu này |
| Mua hàng thành công | 5 điểm | Tín hiệu mạnh nhất |
| Đánh giá sao sau mua (nếu có) | Nhân hệ số theo số sao (1-5) | Kết hợp explicit feedback nếu hệ thống có review |
| Trả hàng/hoàn trả | Trừ điểm mạnh (-3) | Rất quan trọng — tránh gợi ý lại sản phẩm tương tự sản phẩm đã bị trả |

**Nghiệp vụ cần lưu kèm mỗi sự kiện:** `user_id`, `product_id`, `loại hành vi`, `thời gian (timestamp)`, `session_id` (cho khách chưa đăng nhập). Timestamp quan trọng để áp dụng **time-decay** (tương tác gần đây có trọng số cao hơn tương tác cũ).

### 2.2. Nhóm dữ liệu thuộc tính sản phẩm (Content/Item Metadata) — cho Content-Based Filtering

Cần chuẩn hóa nghiệp vụ gán thuộc tính (taxonomy) rõ ràng khi nhập sản phẩm, không để admin nhập tự do:

- **Danh mục (category):** áo, quần, váy, phụ kiện... (dạng cây phân cấp: Category → Sub-category)
- **Thuộc tính mô tả:** màu sắc, chất liệu (cotton, jean, len...), kiểu dáng (form rộng/ôm), mùa (hè/đông), phong cách (basic/streetwear/công sở)
- **Giá & khoảng giá** (dùng để nhóm phân khúc)
- **Thương hiệu**
- **Mô tả văn bản** (dùng TF-IDF nếu muốn phân tích văn bản)
- **Tags** do admin gắn thủ công (bổ trợ khi thuộc tính có cấu trúc chưa đủ)

**Lưu ý nghiệp vụ:** đây chính là phần dễ bị đánh giá "thiếu chiều sâu" nếu chỉ lưu tên + giá + ảnh. Cần thiết kế bảng thuộc tính (attribute) linh hoạt để phục vụ vector hóa sản phẩm sau này.

### 2.3. Nhóm dữ liệu người dùng (User Profile)

- Thông tin nhân khẩu học (nếu thu thập được): giới tính, độ tuổi (khai báo lúc đăng ký) — có thể dùng để gợi ý theo nhóm (demographic-based) khi user hoàn toàn mới.
- Địa chỉ giao hàng (gián tiếp gợi ý theo vùng miền/thời tiết nếu mở rộng).
- Size thường mua (nếu thu thập qua lịch sử đơn hàng) — đặc thù ngành thời trang, giúp lọc bớt sản phẩm không đúng size trước khi gợi ý.

### 2.4. Bảng tổng hợp nghiệp vụ thu thập dữ liệu

| Câu hỏi nghiệp vụ | Trả lời khi thiết kế |
|---|---|
| Thu thập dữ liệu ở đâu? | Sự kiện frontend gửi về API `/interactions` mỗi khi user thao tác |
| Thu thập real-time hay batch? | Ghi real-time vào DB (hoặc queue), nhưng **train** mô hình theo batch định kỳ |
| Dữ liệu khách chưa đăng nhập xử lý sao? | Gắn theo `session_id`, khi đăng nhập thì merge lịch sử session vào `user_id` |
| Dữ liệu cũ bao lâu thì hết giá trị? | Áp dụng time-decay, ví dụ tương tác >90 ngày giảm trọng số theo hàm mũ |
| Làm sao tránh dữ liệu nhiễu (bot, click ảo)? | Lọc IP bất thường, giới hạn số sự kiện/phút từ 1 session (ngoài phạm vi bắt buộc nhưng nên đề cập là hướng mở rộng) |

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

### 3.1. Nhóm bảng nghiệp vụ TMĐT cốt lõi

**`users`**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| email | VARCHAR, unique | |
| password_hash | VARCHAR | bcrypt |
| full_name | VARCHAR | |
| gender | ENUM('male','female','other') | phục vụ demographic-based khi cold-start |
| birth_year | INT | |
| role | ENUM('customer','admin') | |
| created_at | TIMESTAMP | |

**`categories`**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR | |
| parent_id | UUID (FK → categories.id, nullable) | hỗ trợ cây danh mục phân cấp |

**`products`**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR | |
| description | TEXT | dùng cho TF-IDF |
| category_id | UUID (FK) | |
| brand | VARCHAR | |
| base_price | DECIMAL | |
| material | VARCHAR | dùng làm feature Content-Based |
| style_tags | TEXT[] hoặc JSONB | mảng tag: ['basic','streetwear'] |
| season | VARCHAR | |
| status | ENUM('active','out_of_stock','discontinued') | |
| created_at | TIMESTAMP | |

**`product_variants`** *(size, màu — riêng biệt để quản lý tồn kho chính xác)*
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| product_id | UUID (FK) | |
| size | VARCHAR | |
| color | VARCHAR | |
| stock_quantity | INT | |
| sku | VARCHAR | |

**`product_images`**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| product_id | UUID (FK) | |
| image_url | VARCHAR | URL từ R2/Supabase |
| is_primary | BOOLEAN | |

**`orders`**, **`order_items`**, **`carts`**, **`cart_items`** — cấu trúc chuẩn CRUD thương mại điện tử (không đi sâu vì không ảnh hưởng trực tiếp AI, nhưng bắt buộc phải có đầy đủ trong khóa luận).

### 3.2. Nhóm bảng phục vụ RIÊNG cho hệ thống gợi ý — trọng tâm phân tích

**`user_interactions`** *(bảng quan trọng nhất của toàn hệ thống AI)*
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | BIGSERIAL (PK) | |
| user_id | UUID (FK, nullable) | null nếu là khách |
| session_id | VARCHAR | dùng khi user_id null |
| product_id | UUID (FK) | |
| interaction_type | ENUM('view','wishlist','add_to_cart','remove_from_cart','purchase','return') | |
| implicit_score | FLOAT | tính sẵn theo bảng trọng số ở mục 2.1 |
| dwell_time_seconds | INT (nullable) | thời gian xem trang chi tiết, nếu track được |
| created_at | TIMESTAMP | bắt buộc, dùng cho time-decay |

> **Đây là bảng cần index kỹ:** composite index trên `(user_id, created_at)` và `(product_id, created_at)` để truy vấn nhanh khi build ma trận User-Item.

**`product_similarity_cache`** *(tùy chọn, tối ưu hiệu năng)*
| Cột | Kiểu | Ghi chú |
|---|---|---|
| product_id_a | UUID | |
| product_id_b | UUID | |
| similarity_score | FLOAT | kết quả tính sẵn từ Content-Based, tránh tính lại mỗi request |
| updated_at | TIMESTAMP | |

**`user_recommendations_cache`** *(tùy chọn, snapshot kết quả gợi ý)*
| Cột | Kiểu | Ghi chú |
|---|---|---|
| user_id | UUID | |
| product_id | UUID | |
| score | FLOAT | |
| algorithm_used | VARCHAR | 'collaborative' / 'content_based' / 'popularity' — hữu ích để sau này đánh giá A/B test |
| generated_at | TIMESTAMP | |

**`model_training_logs`** *(phục vụ đánh giá thực nghiệm trong khóa luận)*
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID | |
| trained_at | TIMESTAMP | |
| algorithm | VARCHAR | |
| precision_at_k | FLOAT | |
| recall_at_k | FLOAT | |
| rmse | FLOAT | |
| training_data_size | INT | số lượng interaction dùng để train |

> Bảng này rất nên có — vừa phục vụ vận hành thực tế (theo dõi mô hình có đang tốt lên không), vừa là **nguồn số liệu trực tiếp cho chương "Kết quả thực nghiệm"** của khóa luận mà không cần làm thủ công.

### 3.3. Sơ đồ quan hệ tổng quát (mô tả)

```
users ──1:N── user_interactions ──N:1── products ──N:1── categories
  │                                         │
  │                                         ├──1:N── product_variants
  │                                         └──1:N── product_images
  │
  ├──1:N── orders ──1:N── order_items ──N:1── product_variants
  └──1:N── carts ──1:N── cart_items
```

---

## 4. QUY TRÌNH CHUYỂN TỪ DỮ LIỆU THÔ → MÔ HÌNH AI (Data Pipeline)

Đây là phần "phân tích nghiệp vụ dữ liệu để train AI" mà bạn cần trình bày rõ trong khóa luận, gồm 4 bước:

### Bước 1 — Thu thập (Collection)
Ghi mọi sự kiện tương tác vào bảng `user_interactions` qua API real-time.

### Bước 2 — Tiền xử lý (Preprocessing)
- Loại bỏ dữ liệu nhiễu: session bot, click quá nhanh bất thường.
- Chuẩn hóa `implicit_score` theo bảng trọng số, áp dụng time-decay: `score_final = score_goc * e^(-λ * số_ngày_đã_qua)`.
- Xử lý user/product chưa đủ dữ liệu (đưa vào nhánh cold-start thay vì đưa vào tập train).

### Bước 3 — Xây dựng ma trận & Feature
- Với Collaborative Filtering: pivot dữ liệu từ `user_interactions` thành ma trận thưa User-Item (dùng `scipy.sparse` để tiết kiệm bộ nhớ, không dùng ma trận đặc/dense).
- Với Content-Based: vector hóa từng sản phẩm từ bảng `products` (One-Hot cho category/brand/material, TF-IDF cho description).

### Bước 4 — Huấn luyện & Lưu mô hình
- Chạy thuật toán SVD trên ma trận (thư viện `scikit-surprise` hoặc `implicit`).
- Lưu mô hình đã train bằng `joblib`/`pickle` để Recommendation Service load lại khi phục vụ request, không phải train lại mỗi lần gọi API.
- Ghi log kết quả đánh giá vào bảng `model_training_logs`.

---

## 5. CHIẾN LƯỢC GỢI Ý CHO USER LÂU NĂM (DỮ LIỆU ĐÃ TRƯỞNG THÀNH)

Ở mục 2.4 và 4, chiến lược mới dừng ở việc **chọn thuật toán nào** theo độ trưởng thành dữ liệu của user (cold-start → Popularity/Content-Based, đủ dữ liệu → Collaborative). Với user đã dùng lâu, chỉ dùng một mình Collaborative Filtering là chưa đủ — cần phối hợp nhiều nguồn gợi ý để tránh nhàm chán và tăng tính khám phá. Cụ thể gồm 5 thành phần:

**1. Gợi ý theo sở thích tiềm ẩn (Collaborative Filtering – SVD) — thành phần chính**
Thuật toán học "gu" của user dựa trên *toàn bộ* lịch sử tương tác, rồi tìm sản phẩm mà những user có gu tương tự đã thích. Đây là nguồn tạo ra tính **khám phá (serendipity)** — gợi ý được cả sản phẩm user chưa từng xem nhưng có khả năng thích, khác với Content-Based chỉ lặp lại sản phẩm giống cái đã xem.

**2. Gợi ý bổ sung / mua kèm (Frequently Bought Together)**
Phân tích bảng `order_items` để tìm các sản phẩm hay được mua **cùng lúc** trong một đơn hàng (item-item co-occurrence). Ví dụ: user vừa mua áo sơ mi → gợi ý quần tây, thắt lưng thường đi kèm.

**3. Gợi ý theo xu hướng trong danh mục ưa thích (Trending within preferred category)**
Trong nhóm danh mục mà user hay mua (ví dụ "áo thun"), ưu tiên sản phẩm **mới ra mắt** hoặc **đang bán chạy** thuộc danh mục đó, tránh lặp lại mãi các sản phẩm cũ.

**4. Nhắc lại có chọn lọc (Re-engagement)**
Sản phẩm user đã xem/thêm giỏ nhưng chưa mua (implicit_score dương nhưng chưa có `purchase`) — nhắc lại vì đây là tín hiệu quan tâm mạnh, ưu tiên nếu còn hàng hoặc đang giảm giá.

**5. Loại trừ (Negative filtering)**
- Không gợi ý lại sản phẩm đã mua gần đây (trừ nhóm sản phẩm hay mua lặp lại).
- Hạ điểm/loại các sản phẩm cùng loại với sản phẩm user đã **trả hàng** — tín hiệu "không hợp" mạnh hơn cả việc không mua.
- Lọc theo size hay mua (nếu hệ thống lưu được), tránh gợi ý sản phẩm không có size phù hợp.

**Công thức phối trọng đề xuất cho user lâu năm:**

```
Danh sách cuối =
   60-70%  Collaborative Filtering (SVD)         — chủ đạo, tạo khám phá
 + 15-20%  Frequently Bought Together             — bổ sung sản phẩm liên quan
 + 10-15%  Trending trong danh mục ưa thích       — cập nhật xu hướng
 -         loại trừ: đã mua gần đây, cùng loại sản phẩm đã bị trả hàng
```

Đây là điểm quan trọng cần đưa vào khóa luận: **chiến lược gợi ý không cố định một thuật toán mà thay đổi theo "độ trưởng thành" của dữ liệu user** — mới dùng Popularity/Content-Based, lâu năm dùng Collaborative làm chủ đạo kết hợp thêm các tín hiệu phụ ở trên. Đây chính là bản chất đầy đủ của kiến trúc Hybrid.

## 5.1. Chi phí tính toán: Training vs Inference — vì sao không "nặng" như phân tích riêng từng người

Một hiểu lầm phổ biến khi mới tiếp cận Collaborative Filtering là nghĩ hệ thống phải "phân tích riêng từng cá nhân mỗi lần họ vào web", nghe có vẻ rất tốn tài nguyên. Thực tế thuật toán SVD tách rõ 2 giai đoạn với chi phí rất khác nhau:

**Giai đoạn 1 — Training (nặng, nhưng chạy 1 lần cho toàn bộ user cùng lúc, không phải tuần tự từng người)**
SVD nhận **toàn bộ ma trận User-Item** (tất cả user, tất cả sản phẩm) làm input một lần duy nhất, phân rã đồng thời ra hai ma trận nhỏ `U` (đặc trưng ẩn của user) và `V` (đặc trưng ẩn của sản phẩm) cho mọi user/sản phẩm cùng lúc — đây là phép toán đại số tuyến tính trên toàn tập dữ liệu, không lặp thủ công qua từng cá nhân. Bước này tốn tài nguyên (từ vài giây đến vài phút tùy quy mô dữ liệu) nhưng chỉ chạy **định kỳ theo batch** (ví dụ 1 lần/đêm qua cron job, như đã mô tả ở mục 4 — Bước 4), không chạy mỗi lần có người truy cập.

**Giai đoạn 2 — Inference (khi user thực sự vào trang chủ) — rất nhẹ**
Lúc này `U` và `V` đã được train và lưu sẵn (bằng `joblib`/`pickle`). Khi user A vào web, hệ thống chỉ cần lấy **1 hàng có sẵn** trong ma trận `U` (vector đặc trưng của A, đã tính từ lần train trước) nhân với ma trận `V` — một phép nhân ma trận rất nhỏ, mất vài mili-giây. Đây không phải "phân tích lại" gì cả, chỉ là tra cứu + một phép nhân đơn giản.

| | Khi nào chạy | Chi phí | Có "riêng từng cá nhân" không |
|---|---|---|---|
| Training SVD | Batch, định kỳ (đêm) | Nặng, nhưng 1 lần cho toàn bộ user | Không — xử lý cả ma trận cùng lúc |
| Sinh gợi ý cho 1 user | Mỗi lần user request trang chủ | Rất nhẹ (phép nhân vector) | Có vẻ cá nhân hóa, nhưng thực chất là tra cứu kết quả đã tính sẵn |
| Frequently Bought Together | Tính sẵn theo cặp sản phẩm, cache lại | Rất nhẹ khi dùng | Không phụ thuộc từng cá nhân, dùng chung cho mọi user |
| Trending trong danh mục ưa thích | Tính sẵn theo category, cache | Rất nhẹ | Chỉ lọc theo category user hay xem, không phân tích riêng |

**Kết luận:** hệ thống hoàn toàn khả thi cho quy mô đồ án — không hề "nặng" như chạy AI riêng cho từng người mỗi lần họ vào web. Đây cũng chính là lý do các bảng `user_recommendations_cache` và `model_training_logs` (mục 3.2), cùng chiến lược retrain theo batch (mục 4 — Bước 4), được thiết kế sẵn: để tách chi phí tính toán nặng (training) ra khỏi luồng request real-time (inference), đảm bảo thời gian phản hồi < 500ms như ràng buộc đã nêu ở mục 1.3.

---

## 6. TÓM TẮT — CÁC ĐIỂM CẦN NHẤN MẠNH KHI BẢO VỆ

1. Bài toán thuộc dạng **Top-N Recommendation với Implicit Feedback**, khác biệt rõ với bài toán rating tường minh — cần nêu rõ để tránh hội đồng hiểu nhầm bạn làm collaborative filtering "kiểu Netflix" đơn giản.
2. Bảng `user_interactions` là trái tim của toàn hệ thống — thiết kế trọng số (implicit score) và time-decay thể hiện tư duy nghiệp vụ, không chỉ là kỹ thuật thuần túy.
3. Việc tách riêng bảng `product_similarity_cache`, `user_recommendations_cache`, `model_training_logs` thể hiện tư duy tối ưu hiệu năng và có cơ sở dữ liệu để đánh giá thực nghiệm — đây là điểm nhiều đồ án sinh viên bỏ sót.
4. Chiến lược xử lý cold-start dựa trên **lượng dữ liệu hiện có** (switching hybrid) là câu trả lời tốt nhất khi hội đồng hỏi "hệ thống gợi ý gì cho user hoàn toàn mới".
5. Với user lâu năm, hệ thống không dừng ở một mình Collaborative Filtering mà phối hợp thêm Frequently Bought Together, Trending theo danh mục ưa thích, Re-engagement và cơ chế loại trừ — đồng thời cần giải thích rõ được **training (batch, nặng, chạy 1 lần cho cả hệ thống)** khác với **inference (tra cứu nhẹ, theo từng request)**, để tránh hội đồng hiểu nhầm là hệ thống "phân tích AI riêng cho từng người" mỗi lần họ truy cập.
