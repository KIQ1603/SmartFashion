export default function PrivacyPage() {
  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <h1 className="section-heading mb-8">Chính sách bảo mật</h1>
      <div className="max-w-measure space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          SmartFashion là sản phẩm demo phục vụ mục đích đồ án/khóa luận tốt nghiệp, không phải
          website thương mại thật. Nội dung dưới đây minh họa cấu trúc một chính sách bảo mật tiêu
          chuẩn cho website thương mại điện tử.
        </p>
        <div>
          <h2 className="mb-2 font-medium text-foreground">Dữ liệu thu thập</h2>
          <p>
            Hệ thống ghi nhận thông tin tài khoản (họ tên, email), địa chỉ giao hàng, lịch sử đơn
            hàng và hành vi tương tác sản phẩm (xem, thêm giỏ, mua) để vận hành và cải thiện chất
            lượng gợi ý sản phẩm.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-medium text-foreground">Mục đích sử dụng</h2>
          <p>
            Dữ liệu hành vi được dùng để huấn luyện mô hình gợi ý (Collaborative Filtering /
            Content-Based), không chia sẻ cho bên thứ ba ngoài phạm vi vận hành hệ thống.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-medium text-foreground">Quyền của người dùng</h2>
          <p>Bạn có thể yêu cầu chỉnh sửa hoặc xóa thông tin tài khoản trong trang Tài khoản cá nhân.</p>
        </div>
      </div>
    </div>
  );
}
