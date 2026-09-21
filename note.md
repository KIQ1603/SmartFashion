+ chưa có config banner trang home
+ Chưa có địa chỉ và config địa chỉ, số điện thoại (thông tin cửa hàng,...)
+ phần tất cả sản phẩm có cái mục tròn tròn ấy ( loại sản phẩm ấy ) sẽ có 5 ô tròn . 4 ô là hiện 4 cái loại nhiều sản phẩm nhất. còn 1 ô là dấu + để vào trang mà hiện tát các loại. vì sau sẽ nhiều loại bạn hiểu chứ 
+ cái thương hiệu ấy không cần hiện ở sản phẩm đâu. chỉ cần tên , sao đánh giá và giá cả ( giá để sao cho nhìn thấy rõ tí kiểu chú ý ấy). 
+ giỏ hàng ấy thêm sản phẩm vào rồi khi ấn thì không xem được chi tiết sản phẩm , vậy sao được . Người dùng cần ấn vào xem chi tiết cái đó thế nào mà mình lại cho vào giỏ hàng
+ Huỷ đơn hàng cũng cần lý do và chỉ được Huỷ khi của hàng chưa gói hàng. cửa hàng chuyển sang đã gói hàng xong thì không Huỷ được . 
+ Cần các trạng thái của đơn hàng cho đến khi nhận thành công, có đánh giá của đơn hàng , sản phẩm nữa
+ Cần thêm phần phương thức thanh toán chuyển khoản luôn hay thanh toán khi nhận hàng
+ Cho phép config nhiều địa chỉ như shoppe ấy, xong đặt cái nào chính thì khi đặt đơn cứ add địa chỉ đó vào không bắt ngừoi dùng điền lại nhiều lần. Thiết kế xem khi đặt đơn đầu phải bắt điền ít nhất 1 địa chỉ hoặc khi mới đăng ký thì cũng thông báo là có đặt địa chỉ luôn không 
+ Phần đơn hàng thì có tên đơn, mã đơn, đơn đặt gì chứ ghi đơn hàng sao mà biết 
+  UI chi tiết và đẹp hơn , Ui ngừoi dùng đang quá xấu và đơn điệu 
+  
về UI : 
Bạn là một Senior UI/UX Designer + Senior Frontend Engineer chuyên thiết kế các nền tảng e-commerce thời trang hiện đại.

Tôi đang phát triển website bán quần áo có tên "SmartFashion".

Tôi sẽ cung cấp cho bạn screenshot hoặc source code của từng trang hiện tại.

Nhiệm vụ của bạn là REVIEW → REDESIGN → REFACTOR UI/UX của trang đó để đạt chất lượng production-level.

==================================================
1. MỤC TIÊU THIẾT KẾ
==================================================

SmartFashion là một website thương mại điện tử bán quần áo.

Phong cách tổng thể cần hướng tới:

- Modern
- Minimal
- Fashion editorial
- Premium nhưng không xa xỉ quá mức
- Clean
- Elegant
- Có cảm giác giống một fashion brand thật
- UX rõ ràng
- Không giống admin dashboard
- Không giống template Bootstrap/Ant Design mặc định
- Không sử dụng quá nhiều màu
- Không sử dụng quá nhiều shadow
- Không sử dụng quá nhiều border đậm
- Không để giao diện trở nên trống trải

Tinh thần visual:

"Minimal fashion e-commerce + editorial magazine"

Có thể tham khảo tinh thần của:

- COS
- Uniqlo phiên bản premium
- Zara
- Arket
- Aesop
- các fashion editorial website hiện đại

NHƯNG KHÔNG COPY trực tiếp giao diện của bất kỳ website nào.

Thiết kế phải có identity riêng cho SmartFashion.

==================================================
2. VẤN ĐỀ CẦN GIẢI QUYẾT
==================================================

Khi redesign, đặc biệt chú ý các vấn đề sau:

1. Không để quá nhiều khoảng trắng vô nghĩa.

2. Không được hiểu "minimal" là:
   - bỏ border
   - bỏ background
   - bỏ component
   - để mọi thứ trắng
   - tăng margin quá lớn.

Minimal đúng nghĩa phải có:
   - hierarchy rõ
   - spacing có chủ đích
   - typography tốt
   - alignment chính xác
   - visual rhythm.

3. Các khu vực quan trọng phải được phân tách rõ ràng.

Có thể sử dụng:
- border #E8E6E2
- background section #FAFAF8
- background card #FFFFFF
- subtle divider
- typography hierarchy
- spacing
- container
- card boundary

Không nhất thiết mọi section đều phải có border.

4. Không để toàn bộ trang là một background trắng phẳng.

Có thể dùng:
- off-white
- warm white
- very subtle beige
- light gray
- subtle editorial shapes
- extremely faint typography
- subtle gradient
- abstract geometric details

Nhưng background phải nằm phía sau nội dung và có opacity rất thấp.

5. Không để decoration cạnh tranh với sản phẩm.

Sản phẩm luôn là visual priority cao nhất.

==================================================
3. DESIGN SYSTEM
==================================================

Hãy xây dựng hoặc tuân thủ một design system thống nhất.

-------------------------
COLOR SYSTEM
-------------------------

Primary:

#171717

Secondary text:

#5F6065

Muted:

#8A8A8A

Border:

#E7E5E2

Soft border:

#F0EFED

Background:

#FFFFFF

Warm background:

#FAF9F7

Secondary background:

#F5F4F1

Success:

#2F7D5A

Warning:

#D97706

Error:

#C83C3C

Discount:

#C94B19

Không sử dụng quá 3-4 màu nổi bật trong cùng một màn hình.

Website ưu tiên monochrome + warm neutral.

-------------------------
TYPOGRAPHY
-------------------------

Ưu tiên:

Inter / Geist / Manrope / system-ui

Heading:

font-weight 500-600

Body:

font-weight 400

Không dùng quá nhiều font weight.

Heading phải có hierarchy rõ:

H1:
32-40px desktop

H2:
24-30px

H3:
18-22px

Body:
14-16px

Small:
12-13px

Không sử dụng heading quá lớn nếu nó làm layout trở nên trống.

Fashion editorial typography có thể dùng serif rất hạn chế cho:
- collection title
- decorative text
- campaign label

Ví dụ:

font-family: Georgia, serif;

NHƯNG KHÔNG dùng serif cho toàn bộ website.

-------------------------
SPACING
-------------------------

Sử dụng hệ spacing thống nhất:

4
8
12
16
20
24
32
40
48
64
80

Không tùy tiện dùng:

37px
53px
71px
etc.

Ưu tiên spacing token.

Desktop:

container max-width:
1180-1240px

Side padding:
24-32px

Section spacing:
48-72px

Không để section cách nhau 120-200px nếu không có lý do UX.

Mobile:

padding:
16-20px

section spacing:
32-48px

==================================================
4. CONTAINER & GRID
==================================================

Toàn bộ website phải có một container thống nhất.

Ví dụ:

max-width: 1200px;
margin: auto;
padding-inline: 24px;

Các trang khác nhau phải dùng cùng container.

Không được xảy ra tình trạng:

Header rộng 1200px
Content rộng 1100px
Footer rộng 1300px
Checkout rộng 1000px

trừ khi có lý do thiết kế.

Grid phải có alignment nhất quán.

Các cạnh trái/phải của:
- heading
- breadcrumb
- content
- cards
- toolbar

nên nằm trên cùng một vertical axis.

==================================================
5. BORDER / DIVIDER
==================================================

Một trong những yêu cầu QUAN TRỌNG NHẤT:

Tôi muốn UI có các phần được phân chia rõ ràng.

Nhưng không được biến thành giao diện có quá nhiều box.

Nguyên tắc:

Section lớn:
→ có thể dùng background khác nhau hoặc border-top.

Card:
→ border 1px solid #E7E5E2

Input:
→ border 1px solid #DCDAD6

Active:
→ border hoặc underline rõ hơn.

Divider:
→ #E7E5E2

Không dùng:
- border đen dày
- shadow mạnh
- gradient border
- glassmorphism quá mức.

Border radius:

Small:
6px

Medium:
8-10px

Large:
12-16px

Fashion editorial product image:
có thể dùng radius nhỏ 2-8px thay vì tất cả đều 16px.

Không cần tất cả component đều bo tròn giống nhau.

==================================================
6. CARD DESIGN
==================================================

Card phải có hierarchy.

Không tạo card chỉ để "đóng khung".

Product card:

IMAGE
↓
PRODUCT NAME
↓
RATING / META
↓
PRICE

Nếu có sale:

CURRENT PRICE    OLD PRICE
DISCOUNT BADGE

Card không cần shadow lớn.

Default:

background: transparent hoặc white
border: none

Hover:

image scale 1.02
transition 300-450ms
thêm subtle shadow hoặc border.

Không sử dụng hover animation quá mạnh.

==================================================
7. PRODUCT IMAGE
==================================================

Product image là yếu tố quan trọng nhất của fashion website.

Ưu tiên:

aspect-ratio: 4 / 5

hoặc:

aspect-ratio: 3 / 4

Không để ảnh sản phẩm quá nhỏ.

Ảnh phải:
- rõ
- đồng nhất ratio
- object-fit: cover
- không méo
- không crop mất sản phẩm quan trọng.

Có thể thêm hover:

ảnh 1 → ảnh 2

hoặc:

scale 1.02

hoặc:

quick action.

Không dùng tất cả hiệu ứng cùng lúc.

==================================================
8. BACKGROUND
==================================================

Không dùng background trắng hoàn toàn trên mọi page.

Tạo hierarchy bằng:

BODY:
#FFFFFF

Một số section:

#FAF9F7

Một số editorial section:

#F5F3EF

Có thể sử dụng background decoration:

- oversized text
- thin circle
- geometric line
- subtle radial gradient
- abstract shape

Ví dụ:

"COLLECTION"

"SS / 26"

"SMARTFASHION"

Các chữ này phải:

font-size: 100-220px
opacity: 0.02-0.04
pointer-events: none

Không được ảnh hưởng readability.

Có thể sử dụng các vòng tròn lớn hoặc đường cong mảnh ở background.

Nhưng:

Decoration opacity <= 5%

Mục tiêu:

background có cảm giác thiết kế

NHƯNG người dùng gần như không nhận ra decoration ngay lập tức.

==================================================
9. HEADER
==================================================

Header cần giữ phong cách:

SmartFashion

Tất cả sản phẩm
Áo
Quần

Search

Yêu thích
Đơn hàng
Tài khoản
Đăng xuất
Giỏ hàng

Header phải:

- compact
- clean
- sticky hoặc fixed nếu phù hợp
- border-bottom subtle
- height khoảng 64-72px
- không quá cao.

Desktop:

logo bên trái
navigation kế bên
search ở giữa
user actions bên phải.

Không để header chiếm quá nhiều vertical space.

Mobile:

logo
search/icon
cart
menu

Navigation chuyển thành mobile menu.

==================================================
10. LANDING PAGE
==================================================

Landing page phải có cảm giác như một fashion campaign.

KHÔNG làm:

Hero:
text giữa màn hình
button
background trắng
→ quá trống.

Thay vào đó:

Hero nên có visual composition.

Ví dụ:

LEFT:

SMARTFASHION
Modern essentials
for everyday life.

CTA

RIGHT:

large fashion image

Hoặc:

full-width editorial image

với text overlay rất nhẹ.

Hero có thể dùng:

- 60/40 layout
- 55/45 layout
- asymmetric grid
- editorial image collage

CTA:

"Mua sắm ngay"

"Khám phá bộ sưu tập"

Primary button:
đen

Secondary:
outline

Không quá nhiều CTA.

-------------------------
LANDING SECTIONS
-------------------------

Landing page nên có:

1. Hero

2. Featured categories

3. New arrivals

4. Best sellers

5. Editorial / campaign section

6. Recommendation section

7. Brand statement

8. Footer

Các section phải có visual rhythm.

Không để:

Hero kết thúc
↓
150px trắng
↓
section

Thay bằng:

Hero
↓
48-64px
↓
section.

==================================================
11. CATEGORY / PRODUCT LIST PAGE
==================================================

Trang sản phẩm phải ưu tiên product discovery.

Top:

Breadcrumb

H1:
Sản phẩm

Short description

Sau đó:

CATEGORY CIRCLES

Đặc biệt:

GIỮ NGUYÊN Ý TƯỞNG CÁC VÒNG TRÒN DANH MỤC.

Ví dụ:

○ Áo
○ Áo thun
○ Quần
○ Quần jean
○ Xem tất cả

Các circle phải:

- 90-110px desktop
- circular
- image crop đẹp
- border subtle
- label rõ
- count nhỏ
- hover nhẹ.

Có thể tạo một đường divider mảnh bên dưới category.

Sau đó:

FILTER BAR

[ Bộ lọc ]                 125 sản phẩm     [ Mới nhất ]

Filter bar cần rõ ràng.

Không để toolbar trôi giữa khoảng trắng.

Product grid:

Desktop:
4 columns

Tablet:
3 columns

Mobile:
2 columns

Gap:
16-24px

Product card image:
4:5

==================================================
12. FILTER UX
==================================================

Filter không nên chỉ là button "Bộ lọc".

Khi click:

Desktop:
→ side drawer hoặc filter panel.

Mobile:
→ bottom sheet.

Filter:

Danh mục
Khoảng giá
Size
Màu
Rating
Trạng thái

Có:

Áp dụng
Xóa bộ lọc

Hiển thị số lượng filter đang active.

Ví dụ:

Bộ lọc (3)

==================================================
13. PRODUCT DETAIL
==================================================

Product detail cần ưu tiên:

IMAGE + PRODUCT INFORMATION

Desktop:

LEFT:
large image gallery

RIGHT:
product information

Product name
rating
price
discount
description
color
size
quantity
add to cart
buy now

Không để right side quá dài.

CTA phải rõ:

[ Thêm vào giỏ hàng ]

[ Mua ngay ]

Primary CTA:
black

Secondary:
outline.

Thông tin phụ:

Shipping
Return
Authenticity
Size guide

được gom vào accordion hoặc compact information blocks.

==================================================
14. CHECKOUT PAGE
==================================================

Checkout screenshot hiện tại có vấn đề:

Nội dung chính hơi nhỏ
Khoảng trắng bên dưới quá nhiều
Order summary chưa đủ visual priority.

Redesign:

Desktop:

LEFT 65%

Thông tin giao hàng
Phương thức thanh toán

RIGHT 35%

Đơn hàng của bạn

RIGHT summary nên sticky.

Ví dụ:

--------------------------------
ĐƠN HÀNG CỦA BẠN

Quần jean slimfit
x2                    798.000 ₫

--------------------------------

Tạm tính              798.000 ₫
Phí vận chuyển         30.000 ₫

TỔNG                   828.000 ₫

[ Xác nhận đặt hàng ]
--------------------------------

Address card phải rõ:

○
Trần Thị Bình
0912345678
123 Đường Test, Hà Nội
[Mặc định]

Có border rõ hơn.

Selected state:

border: 1px solid #171717

background: #FAFAF8

==================================================
15. ORDER HISTORY
==================================================

Không nên để danh sách order trở thành một chuỗi box quá lớn nhưng cũng không được quá nhạt.

Mỗi order:

IMAGE | PRODUCT INFORMATION | PRICE | STATUS

Ví dụ:

[IMAGE]

Quần jean slimfit xanh đậm
Mã đơn #9f9b65d7
13/9/2026

                         798.000 ₫
                         ● Chờ xác nhận

Card:

height khoảng 82-100px

padding:
16px

border:
1px solid #E7E5E2

border-radius:
12px

Gap giữa orders:
10-12px

Không cần 30-40px.

Status phải có visual indicator.

Chờ xác nhận:
orange

Đã xác nhận:
blue/green

Đã hủy:
red

Nhưng màu phải muted, không neon.

==================================================
16. ORDER DETAIL
==================================================

Trang:

Đơn hàng #1d070959
Trạng thái: Đã xác nhận

Phải có hierarchy.

Header:

← Quay lại lịch sử đơn hàng

Đơn hàng #1d070959

[ Đã xác nhận ]

Order information:

Product
Variant
Quantity
Price

Sau đó divider.

Summary:

Tạm tính
Phí vận chuyển
Giảm giá
Tổng cộng

Nếu có action:

[ Hủy đơn hàng ]

Button phải đặt gần order status/action area.

Không để button nằm một mình giữa một vùng trắng lớn.

Footer phải được đẩy xuống tự nhiên bằng layout min-height,
không tạo khoảng trắng khổng lồ do content quá ít.

==================================================
17. FOOTER
==================================================

Footer hiện tại khá thấp và nội dung hơi thưa.

Thiết kế:

border-top

background:
#FAF9F7

Container:

4 columns desktop

SmartFashion
Mua sắm
Tài khoản
Liên hệ

Có thể thêm:

newsletter

Theo dõi chúng tôi

copyright

Nhưng không nhồi quá nhiều.

Footer padding:

48-64px

Không để footer content quá xa nhau.

==================================================
18. EMPTY SPACE RULE
==================================================

Đây là yêu cầu cực kỳ quan trọng.

Mỗi khoảng trắng phải có mục đích.

Nếu một page có:

content cao 300px

nhưng viewport cao 1000px

KHÔNG được để:

300px content
↓
500px trắng
↓
footer

Thay vào đó:

- footer nằm cuối viewport
- content container có min-height hợp lý
- hoặc sử dụng layout flex column.

Ví dụ:

min-height: calc(100vh - header - footer)

Nhưng KHÔNG kéo giãn các component.

Footer phải ở cuối trang một cách tự nhiên.

==================================================
19. RESPONSIVE
==================================================

Desktop:

>= 1200

Tablet:

768-1199

Mobile:

<768

Mobile phải được thiết kế riêng,
không chỉ scale desktop xuống.

Product:

Desktop:
4 columns

Tablet:
3 columns

Mobile:
2 columns

Checkout:

Desktop:
2 columns

Mobile:
1 column

Order history:

Desktop:
horizontal row

Mobile:
stacked layout.

Header:

Desktop navigation

Mobile menu.

==================================================
20. MICRO INTERACTIONS
==================================================

Animation phải subtle.

Duration:

150-300ms

Product image:

transform scale(1.02)

Button:

translateY(-1px)

Category:

translateY(-2px)

Page:

fade-in nhẹ nếu phù hợp.

Không dùng:
- bounce
- excessive parallax
- flashy animation
- neon
- glassmorphism nặng.

==================================================
21. ICONS
==================================================

Dùng:

Lucide
Heroicons
SVG

Icon size:

16-20px

Không dùng emoji.

Icon phải cùng stroke style.

==================================================
22. ACCESSIBILITY
==================================================

Đảm bảo:

- contrast đủ
- button có hover/focus
- input có label
- keyboard navigation
- aria-label cho icon button
- image có alt
- focus state rõ.

Không dùng màu làm cách duy nhất để biểu thị trạng thái.

==================================================
23. CODE QUALITY
==================================================

Nếu tôi cung cấp source code:

KHÔNG được rewrite toàn bộ logic nếu không cần.

Ưu tiên:

1. giữ business logic
2. giữ API
3. giữ routing
4. giữ state management
5. giữ data model
6. refactor UI
7. refactor component khi cần.

Không phá chức năng hiện tại.

Nếu project đang dùng:

React + TypeScript
Vite
Tailwind
Ant Design

thì ưu tiên sử dụng stack hiện tại.

Không tự ý chuyển framework.

Nếu đã có component dùng được:
→ reuse.

Không tạo duplicate component nếu có thể tái sử dụng.

==================================================
24. COMPONENT SYSTEM
==================================================

Xây dựng/reuse các component:

Container
Section
Button
IconButton
Input
Select
Badge
Breadcrumb
ProductCard
ProductGrid
CategoryCircle
FilterBar
FilterDrawer
OrderCard
OrderSummary
AddressCard
Footer
Header

Mục tiêu:

UI consistency.

Ví dụ:

ProductCard ở trang home
=
ProductCard ở category page.

Không tạo 2 kiểu product card khác nhau nếu không có lý do.

==================================================
25. VISUAL HIERARCHY
==================================================

Mỗi màn hình phải có:

Primary:
nội dung người dùng cần chú ý nhất.

Secondary:
thông tin hỗ trợ.

Tertiary:
metadata.

Ví dụ product:

PRIMARY:
Product image + name

SECONDARY:
Price

TERTIARY:
Rating / reviews.

Checkout:

PRIMARY:
Confirm order

SECONDARY:
Order summary

TERTIARY:
Additional information.

==================================================
26. FASHION VISUAL LANGUAGE
==================================================

Hãy thêm chất thời trang bằng:

- editorial typography
- asymmetric spacing
- subtle oversized text
- photography-first layout
- thin dividers
- warm neutral palette
- large whitespace có chủ đích
- subtle geometric decoration
- image crops đẹp
- restrained animation.

KHÔNG dùng:

- neon
- gradient tím/xanh
- excessive glassmorphism
- excessive shadows
- dashboard style
- quá nhiều rounded cards
- quá nhiều badge
- quá nhiều màu.

==================================================
27. BACKGROUND ART DIRECTION
==================================================

Background có thể sử dụng một trong các pattern sau:

A.

Warm white + giant faint typography

"SMARTFASHION"

opacity 0.02-0.04

B.

Thin editorial circles

border 1px
opacity 0.05

C.

Subtle radial gradients

opacity rất thấp.

D.

Abstract vertical lines.

E.

Fashion editorial crop/image ở một số section.

Tuyệt đối không làm background:

- quá nổi
- gây nhiễu
- giảm contrast
- cạnh tranh với product image.

==================================================
28. SCREENSHOT REVIEW PROCESS
==================================================

Mỗi khi tôi gửi screenshot:

Bước 1:
Phân tích layout hiện tại.

Bước 2:
Xác định:

- spacing issues
- hierarchy issues
- alignment issues
- border issues
- typography issues
- empty space issues
- responsive issues
- visual consistency issues.

Bước 3:
Đề xuất redesign.

Bước 4:
Implement.

Bước 5:
Kiểm tra lại:

- desktop
- tablet
- mobile
- visual hierarchy
- consistency
- spacing
- accessibility.

==================================================
29. IMPORTANT
==================================================

Đừng chỉ làm giao diện "đẹp".

Hãy ưu tiên:

UX > visual decoration.

Người dùng phải hiểu ngay:

- Tôi đang ở đâu?
- Tôi đang xem cái gì?
- Tôi có thể click vào đâu?
- Tôi phải làm gì tiếp theo?
- Sản phẩm nào quan trọng?
- Giá bao nhiêu?
- Trạng thái đơn hàng là gì?

Mỗi screen phải có một visual focal point.

==================================================
30. FINAL DESIGN TARGET
==================================================

Sau khi redesign, website phải tạo cảm giác:

"Đây là một thương hiệu thời trang thật"

chứ không phải:

"Đây là một template e-commerce."

Visual target:

Clean
Modern
Premium
Editorial
Minimal
Warm
Fashion-oriented
User-friendly

Và đặc biệt:

KHÔNG TRỐNG TRẢI.

Khoảng trắng vẫn phải tồn tại,
nhưng là khoảng trắng có chủ đích.

Các khu vực phải có boundary rõ ràng.

Typography phải tạo hierarchy.

Product phải nổi bật.

Navigation phải rõ.

CTA phải rõ.

==================================================
31. OUTPUT REQUIREMENT
==================================================

Khi hoàn thành mỗi trang:

1. Không giải thích dài dòng.

2. Nêu ngắn gọn:
   - Những vấn đề đã sửa
   - Những component đã thay đổi
   - Những UX improvement chính.

3. Cung cấp code hoàn chỉnh hoặc các file đã chỉnh sửa.

4. Không bỏ chức năng hiện tại.

5. Không thay đổi API/data structure nếu không cần.

6. Không thêm dependency mới nếu có thể giải quyết bằng dependency hiện tại.

7. Đảm bảo code chạy được.

==================================================
32. ĐẶC BIỆT ĐỐI VỚI SMARTFASHION
==================================================

Giữ lại các đặc điểm nhận diện đã có:

- SmartFashion logo/text
- màu đen/trắng/warm neutral
- navigation đơn giản
- category circles trên trang sản phẩm
- product cards
- order history
- checkout
- order detail.

Không loại bỏ category circles.

Các vòng tròn danh mục là một phần nhận diện visual của trang sản phẩm.

Hãy redesign chúng đẹp hơn thay vì thay thế chúng.

==================================================
FINAL INSTRUCTION
==================================================

Hãy suy nghĩ như một Senior UI/UX Designer trước khi code.

Không chỉnh từng element một cách độc lập.

Hãy nhìn toàn bộ page như một composition.

Mỗi page phải có:

HEADER
↓
CONTENT HIERARCHY
↓
PRIMARY ACTION
↓
SUPPORTING INFORMATION
↓
FOOTER

Tất cả phải thuộc cùng một Design System của SmartFashion.

Ưu tiên:

CONSISTENCY
CLARITY
BALANCE
SPACING
VISUAL HIERARCHY
FASHION AESTHETIC
UX

Không chạy theo trend nếu trend làm giảm usability.