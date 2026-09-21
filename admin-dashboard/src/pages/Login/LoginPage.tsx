import { Button, Card, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form] = Form.useForm();

  async function onFinish(values: { email: string; password: string }) {
    try {
      const { data } = await api.post('/auth/login', values);
      if (data.user.role !== 'admin') {
        message.error('Tài khoản này không có quyền quản trị.');
        return;
      }
      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Đăng nhập thất bại.');
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
      <div style={{ width: 380 }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#18181B', letterSpacing: '-0.01em' }}>SmartFashion</div>
          <div style={{ fontSize: 13, color: '#71717A', marginTop: 2 }}>Trang quản trị</div>
        </div>
        <Card variant="borderless" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="admin@smartfashion.dev" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
              <Input.Password placeholder="Admin@123" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Đăng nhập
            </Button>
          </Form>
        </Card>
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#A1A1AA' }}>
          Demo: admin@smartfashion.dev / Admin@123
        </p>
      </div>
    </div>
  );
}
