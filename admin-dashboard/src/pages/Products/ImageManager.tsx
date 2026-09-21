import { useState } from 'react';
import { Button, Select, Tag, Tooltip, Upload, message } from 'antd';
import { DeleteOutlined, StarFilled, StarOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { api } from '@/services/api';

interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  color?: string | null;
}

/**
 * Quản lý ảnh sản phẩm - ảnh chung (không gắn màu) hoặc ảnh riêng theo từng màu biến thể (đổi
 * ảnh minh họa ở storefront khi khách chọn màu tương ứng). Tải file thật lên Cloudinary qua
 * backend (POST /admin/products/upload-image) rồi mới lưu URL trả về - không còn dán URL tay.
 */
export default function ImageManager({
  productId,
  images,
  colors,
  onChange,
}: {
  productId: string;
  images: ProductImage[];
  colors: string[];
  onChange: () => void;
}) {
  const [color, setColor] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function uploadImage({ file }: UploadRequestOption) {
    setSaving(true);
    try {
      const body = new FormData();
      body.append('file', file as File);
      const { data } = await api.post('/admin/products/upload-image', body);
      await api.post(`/admin/products/${productId}/images`, { imageUrl: data.imageUrl, color });
      message.success('Đã thêm ảnh.');
      onChange();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không tải được ảnh lên.');
    } finally {
      setSaving(false);
    }
  }

  async function setPrimary(id: string) {
    try {
      await api.patch(`/admin/product-images/${id}/primary`);
      onChange();
    } catch {
      message.error('Không đặt được ảnh đại diện.');
    }
  }

  async function removeImage(id: string) {
    try {
      await api.delete(`/admin/product-images/${id}`);
      message.success('Đã xóa ảnh.');
      onChange();
    } catch {
      message.error('Không xóa được ảnh.');
    }
  }

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 16 }}>
      <h4 style={{ marginBottom: 4 }}>Ảnh sản phẩm</h4>
      <p style={{ fontSize: 12.5, color: '#71717A', marginTop: 0, marginBottom: 12 }}>
        Ảnh không chọn màu sẽ dùng chung cho toàn bộ sản phẩm. Gắn màu để ảnh tự đổi khi khách chọn đúng màu đó.
      </p>

      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          {images.map((img) => (
            <div key={img.id} style={{ width: 92 }}>
              <div
                style={{
                  position: 'relative',
                  width: 92,
                  height: 115,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: img.isPrimary ? '2px solid #18181B' : '1px solid #E4E4E7',
                }}
              >
                <img src={img.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {img.color && (
                  <Tag color="blue" style={{ position: 'absolute', top: 4, left: 4, marginInlineEnd: 0, fontSize: 11 }}>
                    {img.color}
                  </Tag>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4 }}>
                <Tooltip title={img.isPrimary ? 'Ảnh đại diện' : 'Đặt làm ảnh đại diện'}>
                  <Button
                    size="small"
                    type="text"
                    icon={img.isPrimary ? <StarFilled style={{ color: '#F59E0B' }} /> : <StarOutlined />}
                    onClick={() => !img.isPrimary && setPrimary(img.id)}
                  />
                </Tooltip>
                <Tooltip title="Xóa ảnh">
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeImage(img.id)} />
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Select
          allowClear
          placeholder="Màu (tùy chọn)"
          value={color}
          onChange={setColor}
          style={{ width: 150 }}
          options={colors.map((c) => ({ value: c, label: c }))}
          disabled={colors.length === 0}
        />
        <Upload accept="image/*" showUploadList={false} customRequest={uploadImage} disabled={saving}>
          <Button type="primary" icon={<UploadOutlined />} loading={saving}>
            Tải ảnh lên
          </Button>
        </Upload>
      </div>
      {colors.length === 0 && (
        <p style={{ fontSize: 12.5, color: '#A1A1AA', marginTop: 6 }}>
          Thêm biến thể (size/màu) ở dưới trước để có thể gắn ảnh riêng theo màu.
        </p>
      )}
    </div>
  );
}
