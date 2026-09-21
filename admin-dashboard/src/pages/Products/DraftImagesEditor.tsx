import { useState } from 'react';
import { Button, Select, Tag, Tooltip, Upload, message } from 'antd';
import { DeleteOutlined, StarFilled, UploadOutlined } from '@ant-design/icons';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { api } from '@/services/api';

export interface DraftImage {
  imageUrl: string;
  color?: string;
}

/**
 * Ảnh sản phẩm khi TẠO sản phẩm mới - cùng lý do với DraftVariantsEditor: chưa có id thật nên
 * giữ ở state, gửi kèm 1 lần lúc tạo. Ảnh đầu tiên trong danh sách mặc định là ảnh đại diện
 * (khớp quy tắc phía backend createProduct) - không cho chọn tay ở bước này, sau khi lưu có thể
 * đổi lại qua ImageManager (chế độ sửa). Tải file thật lên Cloudinary qua backend ngay khi chọn
 * ảnh (chưa cần product id vì endpoint upload-image độc lập với sản phẩm).
 */
export default function DraftImagesEditor({ images, colors, onChange }: { images: DraftImage[]; colors: string[]; onChange: (v: DraftImage[]) => void }) {
  const [color, setColor] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  async function uploadImage({ file }: UploadRequestOption) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file as File);
      const { data } = await api.post('/admin/products/upload-image', body);
      onChange([...images, { imageUrl: data.imageUrl, color }]);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không tải được ảnh lên.');
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 16 }}>
      <h4 style={{ marginBottom: 4 }}>Ảnh sản phẩm</h4>
      <p style={{ fontSize: 12.5, color: '#71717A', marginTop: 0, marginBottom: 12 }}>
        Ảnh đầu tiên là ảnh đại diện. Gắn màu để ảnh tự đổi khi khách chọn đúng màu đó.
      </p>

      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          {images.map((img, index) => (
            <div key={img.imageUrl + index} style={{ width: 92 }}>
              <div
                style={{
                  position: 'relative',
                  width: 92,
                  height: 115,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: index === 0 ? '2px solid #18181B' : '1px solid #E4E4E7',
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
                {index === 0 && (
                  <Tooltip title="Ảnh đại diện">
                    <StarFilled style={{ color: '#F59E0B', fontSize: 13 }} />
                  </Tooltip>
                )}
                <Tooltip title="Xóa ảnh">
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
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
        <Upload accept="image/*" showUploadList={false} customRequest={uploadImage} disabled={uploading}>
          <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
            Tải ảnh lên
          </Button>
        </Upload>
      </div>
      {colors.length === 0 && (
        <p style={{ fontSize: 12.5, color: '#A1A1AA', marginTop: 6 }}>Thêm biến thể (size/màu) ở trên trước để có thể gắn ảnh riêng theo màu.</p>
      )}
    </div>
  );
}
