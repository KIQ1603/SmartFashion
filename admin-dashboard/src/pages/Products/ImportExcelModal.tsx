import { useState } from 'react';
import { Alert, Button, Modal, Table, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { api } from '@/services/api';

interface ImportResult {
  created: number;
  createdNames: string[];
  errors: { row: number; reason: string }[];
}

// Khớp đúng bảng hướng dẫn ở sheet "Hướng dẫn" của file mẫu backend sinh ra (products.service.ts
// IMPORT_GUIDE) - hiện ngay trong modal để không bắt admin phải tải file mới biết cột nào bắt buộc.
const GUIDE: { col: string; required: string; note: string }[] = [
  { col: 'Tên sản phẩm', required: 'Có', note: 'Các dòng cùng tên + cùng danh mục gộp thành 1 sản phẩm nhiều biến thể' },
  { col: 'Danh mục', required: 'Có', note: 'Phải trùng đúng tên 1 danh mục đã có sẵn (vd: "Áo thun")' },
  { col: 'Giá', required: 'Có', note: 'Số, đơn vị VNĐ, lớn hơn 0' },
  { col: 'Giá gốc', required: 'Không', note: 'Chỉ nhập nếu sản phẩm đang giảm giá' },
  { col: 'Mô tả / Thương hiệu / Chất liệu / Mùa', required: 'Không', note: 'Chỉ cần điền ở dòng đầu tiên của mỗi sản phẩm' },
  { col: 'Tags', required: 'Không', note: 'Nhiều tag cách nhau bằng dấu phẩy' },
  { col: 'Size / Màu', required: 'Có', note: 'Mỗi dòng là 1 biến thể riêng (size + màu)' },
  { col: 'Tồn kho', required: 'Có', note: 'Số lượng tồn kho của riêng biến thể đó' },
  { col: 'SKU', required: 'Có', note: 'Không được trùng SKU đã có trong hệ thống' },
  { col: 'Ảnh (URL)', required: 'Không', note: 'Có thể để trống, thêm ảnh sau ở màn Sửa sản phẩm - nếu điền, ảnh tự gắn đúng màu ở dòng đó' },
];

export default function ImportExcelModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const res = await api.get('/admin/products/import-template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-nhap-san-pham.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('Không tải được file mẫu.');
    } finally {
      setDownloading(false);
    }
  }

  async function handleImport() {
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.warning('Chọn file Excel trước đã.');
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      const { data } = await api.post<ImportResult>('/admin/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.created > 0) {
        message.success(`Đã nhập ${data.created} sản phẩm.`);
        onImported();
      }
      if (data.errors.length === 0) setFileList([]);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Không nhập được file - kiểm tra lại định dạng file.');
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setFileList([]);
    setResult(null);
    onClose();
  }

  return (
    <Modal
      title="Nhập sản phẩm từ Excel"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={760}
      styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 6 } }}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Mỗi dòng trong file là 1 biến thể (size + màu). Các dòng cùng tên sản phẩm + cùng danh mục sẽ tự gộp thành 1 sản phẩm nhiều biến thể."
        action={
          <Button size="small" icon={<DownloadOutlined />} loading={downloading} onClick={downloadTemplate}>
            Tải file mẫu
          </Button>
        }
      />

      <Table
        size="small"
        rowKey="col"
        dataSource={GUIDE}
        pagination={false}
        style={{ marginBottom: 16 }}
        columns={[
          { title: 'Cột', dataIndex: 'col', width: 200 },
          { title: 'Bắt buộc?', dataIndex: 'required', width: 90 },
          { title: 'Ghi chú', dataIndex: 'note' },
        ]}
      />

      <Upload.Dragger
        fileList={fileList}
        beforeUpload={() => false}
        onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
        onRemove={() => setFileList([])}
        accept=".xlsx,.xls"
        maxCount={1}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Kéo thả hoặc bấm để chọn file .xlsx</p>
      </Upload.Dragger>

      <Button type="primary" style={{ marginTop: 12 }} loading={importing} onClick={handleImport} block>
        Nhập sản phẩm
      </Button>

      {result && (
        <div style={{ marginTop: 20 }}>
          {result.created > 0 && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 12 }}
              message={`Đã tạo thành công ${result.created} sản phẩm: ${result.createdNames.join(', ')}`}
            />
          )}
          {result.errors.length > 0 && (
            <>
              <Alert type="error" showIcon style={{ marginBottom: 8 }} message={`${result.errors.length} dòng/sản phẩm bị bỏ qua do lỗi - sửa file rồi nhập lại:`} />
              <Table
                size="small"
                rowKey={(r) => `${r.row}-${r.reason}`}
                dataSource={result.errors}
                pagination={false}
                columns={[
                  { title: 'Dòng', dataIndex: 'row', width: 80, render: (v: number) => (v > 0 ? v : '—') },
                  { title: 'Lý do', dataIndex: 'reason' },
                ]}
              />
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
