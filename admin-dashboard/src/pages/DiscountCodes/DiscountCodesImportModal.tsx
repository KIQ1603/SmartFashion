import { useState } from 'react';
import { Alert, Button, Modal, Table, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { api } from '@/services/api';

interface ImportResult {
  created: number;
  createdCodes: string[];
  errors: { row: number; reason: string }[];
}

// Khớp đúng IMPORT_GUIDE ở discount-codes.service.ts - hiện ngay trong modal, không bắt admin
// phải tải file mới biết cột nào bắt buộc (cùng khuôn mẫu với nhập sản phẩm).
const GUIDE: { col: string; required: string; note: string }[] = [
  { col: 'Mã', required: 'Có', note: 'Không phân biệt hoa/thường, tự động viết hoa. Không được trùng mã đã có.' },
  { col: 'Loại (percentage/fixed)', required: 'Có', note: '"percentage" = giảm theo %, "fixed" = giảm số tiền cố định' },
  { col: 'Giá trị', required: 'Có', note: 'percentage: nhập số % (vd 10 = giảm 10%). fixed: nhập số tiền VNĐ' },
  { col: 'Đơn tối thiểu', required: 'Không', note: 'Đơn hàng phải đạt số tiền này mới áp mã được' },
  { col: 'Giảm tối đa', required: 'Không', note: 'Chỉ áp dụng cho loại percentage - chặn trần số tiền giảm' },
  { col: 'Số lượt dùng tối đa', required: 'Không', note: 'Tổng số lần mã được dùng trên toàn hệ thống' },
  { col: 'Ngày bắt đầu / Ngày hết hạn', required: 'Không', note: 'Định dạng YYYY-MM-DD' },
  { col: 'Mô tả', required: 'Không', note: 'Ghi chú nội bộ, khách không nhìn thấy' },
];

export default function DiscountCodesImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const res = await api.get('/admin/discount-codes/import-template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-nhap-ma-giam-gia.xlsx';
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
      const { data } = await api.post<ImportResult>('/admin/discount-codes/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.created > 0) {
        message.success(`Đã tạo ${data.created} mã giảm giá.`);
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
      title="Nhập mã giảm giá từ Excel"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={720}
      styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 6 } }}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Mỗi dòng trong file là 1 mã giảm giá."
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
        Nhập mã giảm giá
      </Button>

      {result && (
        <div style={{ marginTop: 20 }}>
          {result.created > 0 && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 12 }}
              message={`Đã tạo thành công ${result.created} mã: ${result.createdCodes.join(', ')}`}
            />
          )}
          {result.errors.length > 0 && (
            <>
              <Alert type="error" showIcon style={{ marginBottom: 8 }} message={`${result.errors.length} dòng bị bỏ qua do lỗi - sửa file rồi nhập lại:`} />
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
