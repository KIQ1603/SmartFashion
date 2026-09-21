import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { api } from '@/services/api';
import HeroSlidesEditor from './HeroSlidesEditor';

interface HeroSlide {
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

interface Settings {
  heroSlides?: HeroSlide[];
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
}

/**
 * Cấu hình toàn site - banner trang chủ, thông tin liên hệ cửa hàng, tài khoản nhận chuyển
 * khoản. Để trống field nào thì storefront tự ẩn hẳn phần đó (không hiện placeholder/dữ liệu giả)
 * - xem SiteSetting/SettingsService phía backend.
 */
export default function SettingsPage() {
  const [form] = Form.useForm<Settings>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<Settings>('/settings')
      .then(({ data }) => form.setFieldsValue(data))
      .catch(() => message.error('Không tải được cấu hình.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api.patch('/admin/settings', values);
      message.success('Đã lưu cấu hình.');
    } catch {
      message.error('Không lưu được cấu hình.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#18181B' }}>Cài đặt trang web</h2>
        <p style={{ margin: '4px 0 0', color: '#71717A' }}>Banner trang chủ, thông tin liên hệ cửa hàng và tài khoản nhận chuyển khoản.</p>
      </div>

      <Form form={form} layout="vertical" disabled={loading}>
        <Card title="Banner trang chủ" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: '#71717A', marginTop: -8, marginBottom: 16 }}>
            Mỗi slide 1 ảnh + tiêu đề riêng, trang chủ tự chuyển lần lượt qua từng slide.
          </p>
          <HeroSlidesEditor />
        </Card>

        <Card title="Thông tin cửa hàng" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: '#71717A', marginTop: -8, marginBottom: 16 }}>
            Hiện ở chân trang (footer) - để trống mục nào thì mục đó không hiện ra, không hiện dữ liệu giả.
          </p>
          <Form.Item name="storeAddress" label="Địa chỉ cửa hàng">
            <Input placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="storePhone" label="Số điện thoại" style={{ flex: 1 }}>
              <Input placeholder="0901234567" />
            </Form.Item>
            <Form.Item name="storeEmail" label="Email liên hệ" style={{ flex: 1 }}>
              <Input placeholder="hotro@smartfashion.dev" />
            </Form.Item>
          </div>
        </Card>

        <Card title="Tài khoản nhận chuyển khoản" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: '#71717A', marginTop: -8, marginBottom: 16 }}>
            Hiện cho khách ở bước thanh toán khi chọn "Chuyển khoản ngân hàng" - để trống thì khách sẽ không thấy được thông tin chuyển khoản.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="bankName" label="Ngân hàng" style={{ flex: 1 }}>
              <Input placeholder="Vietcombank" />
            </Form.Item>
            <Form.Item name="bankAccountNumber" label="Số tài khoản" style={{ flex: 1 }}>
              <Input placeholder="0123456789" />
            </Form.Item>
            <Form.Item name="bankAccountHolder" label="Chủ tài khoản" style={{ flex: 1 }}>
              <Input placeholder="CONG TY SMARTFASHION" />
            </Form.Item>
          </div>
        </Card>

        <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          Lưu cài đặt
        </Button>
      </Form>
    </div>
  );
}
