import { useEffect, useState } from 'react';
import { Button, Card, Table, message } from 'antd';
import { Line } from '@ant-design/plots';
import axios from 'axios';
import { api } from '@/services/api';

interface LogRow {
  id: string;
  trainedAt: string;
  algorithm: string;
  precisionAtK: number | null;
  recallAtK: number | null;
  rmse: number | null;
  trainingDataSize: number;
}

const REC_SERVICE_URL = import.meta.env.VITE_REC_SERVICE_URL || 'http://localhost:8000';

export default function RecommendationMetricsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [training, setTraining] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/admin/recommendation-metrics');
      setLogs(data);
    } catch {
      message.error('Không tải được lịch sử huấn luyện.');
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function retrain() {
    setTraining(true);
    try {
      await axios.post(`${REC_SERVICE_URL}/internal/recommend/train`);
      message.success('Đã huấn luyện lại mô hình.');
      load();
    } catch (err: any) {
      message.error('Không thể gọi Recommendation Service. Kiểm tra service đã chạy chưa.');
    } finally {
      setTraining(false);
    }
  }

  const chartData = logs
    .slice()
    .reverse()
    .flatMap((l) => [
      { trainedAt: new Date(l.trainedAt).toLocaleDateString('vi-VN'), value: l.precisionAtK, metric: 'Precision@K' },
      { trainedAt: new Date(l.trainedAt).toLocaleDateString('vi-VN'), value: l.recallAtK, metric: 'Recall@K' },
    ])
    .filter((d) => d.value !== null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Hiệu quả mô hình gợi ý</h2>
        <Button type="primary" loading={training} onClick={retrain}>
          Huấn luyện lại (Retrain)
        </Button>
      </div>

      <Card title="Precision@K / Recall@K theo thời gian" style={{ marginBottom: 24 }}>
        {chartData.length > 0 ? (
          <Line data={chartData} xField="trainedAt" yField="value" seriesField="metric" height={280} />
        ) : (
          <p>Chưa có dữ liệu huấn luyện. Bấm "Huấn luyện lại" để chạy lần đầu.</p>
        )}
      </Card>

      <Table
        rowKey="id"
        dataSource={logs}
        columns={[
          { title: 'Thời điểm huấn luyện', dataIndex: 'trainedAt', render: (v) => new Date(v).toLocaleString('vi-VN') },
          { title: 'Thuật toán', dataIndex: 'algorithm' },
          { title: 'Precision@K', dataIndex: 'precisionAtK', render: (v) => (v != null ? v.toFixed(3) : '-') },
          { title: 'Recall@K', dataIndex: 'recallAtK', render: (v) => (v != null ? v.toFixed(3) : '-') },
          { title: 'RMSE', dataIndex: 'rmse', render: (v) => (v != null ? v.toFixed(3) : '-') },
          { title: 'Số lượng interaction', dataIndex: 'trainingDataSize' },
        ]}
      />
    </div>
  );
}
