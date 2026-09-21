import { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Breadcrumb, Dropdown, Badge } from 'antd';
import {
  DashboardOutlined,
  SkinOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  TeamOutlined,
  BarChartOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  TagsOutlined,
  SettingOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { api } from '@/services/api';

const { Sider, Header, Content } = Layout;

const items = [
  { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' },
  { key: '/products', icon: <SkinOutlined />, label: 'Quản lý Sản phẩm' },
  { key: '/categories', icon: <AppstoreOutlined />, label: 'Danh mục' },
  { key: '/attributes', icon: <TagsOutlined />, label: 'Thuộc tính' },
  { key: '/orders', icon: <ShoppingOutlined />, label: 'Đơn hàng' },
  { key: '/discount-codes', icon: <GiftOutlined />, label: 'Mã giảm giá' },
  { key: '/users', icon: <TeamOutlined />, label: 'Khách hàng' },
  { key: '/recommendation-metrics', icon: <BarChartOutlined />, label: 'Hiệu quả gợi ý' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Cài đặt' },
];

const BREADCRUMB_LABEL: Record<string, string> = {
  '/': 'Tổng quan',
  '/products': 'Sản phẩm',
  '/categories': 'Danh mục',
  '/attributes': 'Thuộc tính',
  '/orders': 'Đơn hàng',
  '/discount-codes': 'Mã giảm giá',
  '/users': 'Khách hàng',
  '/recommendation-metrics': 'Hiệu quả gợi ý',
  '/settings': 'Cài đặt',
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clear } = useAuthStore();
  const [pendingOrders, setPendingOrders] = useState(0);

  // Badge chuông thông báo là số đơn "Chờ xác nhận" thật (cần admin xử lý), lấy từ endpoint dashboard
  // đã có sẵn - không phải icon trang trí không có dữ liệu đứng sau.
  useEffect(() => {
    api
      .get('/admin/dashboard/stats')
      .then(({ data }) => {
        const pending = data.ordersByStatus?.find((s: { status: string; count: number }) => s.status === 'pending');
        setPendingOrders(pending?.count || 0);
      })
      .catch(() => {});
  }, [location.pathname]);

  return (
    // height:100vh + overflow:hidden ở khối ngoài cùng - trước đây chỉ có minHeight nên khi nội
    // dung Content dài hơn màn hình, cả trang (kể cả Sider/Header) cuộn theo luôn. Giờ chỉ Content
    // tự cuộn bên trong, Sider/Header đứng yên tại chỗ như 1 khung ứng dụng thật.
    <Layout style={{ height: '100vh', overflow: 'hidden', background: '#F3F4F6' }}>
      {/* Sider "nổi" kiểu dynamic island - viền bo tròn + hở khoảng cách quanh 4 cạnh thay vì áp
          sát mép trái/trên/dưới màn hình như trước, không cần rộng/cao hết màn. */}
      <Sider
        width={248}
        style={{
          background: '#fff',
          margin: 16,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 4px 24px -10px rgba(24,24,27,0.14)',
          height: 'calc(100vh - 32px)',
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, borderBottom: '1px solid #F3F4F6' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #18181B, #52525B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            S
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#18181B', letterSpacing: '-0.02em' }}>
            SmartFashion
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ padding: '16px 12px', border: 'none' }}
        />
      </Sider>

      <Layout style={{ background: '#F3F4F6', height: '100vh', overflow: 'hidden' }}>
        {/* Header nổi cùng kiểu với Sider - hở phía trên thay vì áp sát mép màn hình, bo tròn hết
            4 góc (không phải chỉ đứng chung khối chữ nhật với Sider như trước). */}
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInline: 24,
            height: 64,
            margin: '16px 16px 0 0',
            borderRadius: 20,
            boxShadow: '0 4px 24px -10px rgba(24,24,27,0.14)',
          }}
        >
          <Breadcrumb items={[{ title: 'Trang chủ' }, { title: BREADCRUMB_LABEL[location.pathname] || '' }]} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Badge count={pendingOrders} size="small" offset={[-2, 2]}>
              <BellOutlined
                style={{ fontSize: 19, color: '#4B5563', cursor: 'pointer' }}
                title={pendingOrders > 0 ? `${pendingOrders} đơn chờ xác nhận` : 'Không có đơn chờ xử lý'}
                onClick={() => navigate('/orders')}
              />
            </Badge>
            <Dropdown
              menu={{
                items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true }],
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    clear();
                    navigate('/login');
                  }
                },
              }}
              trigger={['click']}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingLeft: 20, borderLeft: '1px solid #E5E7EB' }}>
                <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181B' }}>{user?.fullName}</div>
                  <div style={{ fontSize: 12, color: '#71717A' }}>Quản trị viên</div>
                </div>
                <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#18181B' }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content tự cuộn riêng (overflowY), chiều cao = 100vh trừ header (64px) + các khoảng hở
            (16px trên header, 16px giữa header/content, 24px padding dưới) - Sider/Header không
            còn bị kéo theo nữa. Bỏ maxWidth 1280 cũ - bảng dữ liệu (sản phẩm, đơn hàng...) giờ dùng
            hết chiều rộng thật có, không bị bó hẹp giữa màn hình rộng. */}
        <Content style={{ padding: 24, marginTop: 16, height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
