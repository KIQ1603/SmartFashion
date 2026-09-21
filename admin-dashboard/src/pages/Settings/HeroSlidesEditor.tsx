import { useState } from 'react';
import { Button, Form, Input, Upload, message } from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { api } from '@/services/api';

/** Nhận value/onChange chuẩn Ant Form.Item - tải file thật lên Cloudinary qua endpoint dùng
 * chung với ảnh sản phẩm (POST /admin/products/upload-image), không phải dán URL tay. */
function HeroImageUpload({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload({ file }: UploadRequestOption) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file as File);
      const { data } = await api.post('/admin/products/upload-image', body);
      onChange?.(data.imageUrl);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không tải được ảnh lên.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        style={{
          width: 200,
          height: 112,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 8,
          border: '1px solid #E4E4E7',
          background: '#FAFAFA',
        }}
      >
        {value && <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <Upload accept="image/*" showUploadList={false} customRequest={handleUpload} disabled={uploading}>
        <Button size="small" icon={<UploadOutlined />} loading={uploading}>
          {value ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </Button>
      </Upload>
    </div>
  );
}

/**
 * Danh sách slide hero trang chủ - thay cho 1 banner tĩnh trước đây. Admin toàn quyền thêm/xoá/sửa
 * từng slide (ảnh thật + tiêu đề + mô tả + nút CTA). Bỏ trống toàn bộ thì storefront tự dùng slide
 * mặc định + sản phẩm nổi bật (xem HomePage phía storefront) - không bắt buộc phải cấu hình.
 */
export default function HeroSlidesEditor() {
  return (
    <Form.List name="heroSlides">
      {(fields, { add, remove }) => (
        <>
          {fields.length === 0 && (
            <p style={{ fontSize: 12.5, color: '#71717A', marginBottom: 16 }}>
              Chưa có slide nào - trang chủ sẽ tự dùng nội dung mặc định kèm sản phẩm nổi bật.
            </p>
          )}
          {fields.map((field, index) => (
            <div key={field.key} style={{ border: '1px solid #E4E4E7', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <strong style={{ fontSize: 13.5 }}>Slide {index + 1}</strong>
                <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                  Xóa
                </Button>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <Form.Item name={[field.name, 'imageUrl']} rules={[{ required: true, message: 'Cần tải ảnh lên' }]} noStyle>
                  <HeroImageUpload />
                </Form.Item>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Form.Item name={[field.name, 'title']} label="Tiêu đề chính" rules={[{ required: true, message: 'Cần tiêu đề' }]} style={{ marginBottom: 12 }}>
                    <Input placeholder="Bộ sưu tập Thu Đông 2026" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'subtitle']} label="Mô tả phụ" style={{ marginBottom: 12 }}>
                    <Input.TextArea rows={2} placeholder="Phong cách tối giản, chất liệu bền vững." />
                  </Form.Item>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Form.Item name={[field.name, 'ctaText']} label="Chữ trên nút" style={{ flex: 1, marginBottom: 0 }}>
                      <Input placeholder="Mua sắm ngay" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'ctaHref']} label="Nút dẫn tới đường dẫn" style={{ flex: 1, marginBottom: 0 }}>
                      <Input placeholder="/products" />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => add({ title: '', subtitle: '', ctaText: 'Mua sắm ngay', ctaHref: '/products' })}
          >
            Thêm slide
          </Button>
        </>
      )}
    </Form.List>
  );
}
