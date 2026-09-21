"""
Script chạy định kỳ (vd: cron 2h sáng mỗi ngày - đặc tả mục 3.5) để retrain mô hình
mà không cần gọi qua HTTP. Có thể lên lịch bằng cron hệ điều hành hoặc Celery beat:

    0 2 * * *  cd /app && python scripts/cron_train.py >> /var/log/sf_train.log 2>&1

Hoặc gọi trực tiếp endpoint nội bộ: POST /internal/recommend/train
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.api.train import train  # noqa: E402


if __name__ == "__main__":
    result = train()
    print(f"[cron_train] {result}")
