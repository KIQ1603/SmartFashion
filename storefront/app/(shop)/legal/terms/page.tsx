export default function TermsPage() {
  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <h1 className="section-heading mb-8">Điều khoản dịch vụ</h1>
      <div className="max-w-measure space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          SmartFashion là sản phẩm demo phục vụ mục đích đồ án/khóa luận tốt nghiệp. Các điều
          khoản dưới đây mang tính minh họa, không ràng buộc pháp lý thực tế.
        </p>
        <div>
          <h2 className="mb-2 font-medium text-foreground">Đặt hàng & thanh toán</h2>
          <p>
            Đơn hàng chuyển sang trạng thái "Chờ xác nhận" ngay sau khi đặt và có thể hủy trong
            thời gian này. Sau khi được xác nhận, đơn hàng đi vào quy trình xử lý và không thể tự
            hủy trên hệ thống.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-medium text-foreground">Đổi trả</h2>
          <p>
            Sản phẩm được hỗ trợ đổi trả trong 7 ngày kể từ khi nhận hàng nếu còn nguyên tem mác,
            chưa qua sử dụng.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-medium text-foreground">Tài khoản</h2>
          <p>Người dùng chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</p>
        </div>
      </div>
    </div>
  );
}
