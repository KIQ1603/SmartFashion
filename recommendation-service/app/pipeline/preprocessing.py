"""
Bước 2 - Tiền xử lý (mục 4 tài liệu phân tích bài toán):
- Chuẩn hoá implicit_score theo bảng trọng số (đã tính sẵn ở Core Backend khi ghi interaction).
- Áp dụng time-decay: score_final = score_goc * e^(-lambda * so_ngay_da_qua).
- Loại các user/sản phẩm có quá ít dữ liệu ra khỏi tập train ma trận (đưa vào nhánh cold-start ở tầng hybrid).
"""
import numpy as np
import pandas as pd

from app.core.config import settings


def apply_time_decay(interactions: pd.DataFrame) -> pd.DataFrame:
    if interactions.empty:
        return interactions

    df = interactions.copy()
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    now = pd.Timestamp.now(tz="UTC")
    days_elapsed = (now - df["created_at"]).dt.total_seconds() / 86400.0
    df["decayed_score"] = df["implicit_score"] * np.exp(-settings.time_decay_lambda * days_elapsed)
    return df


def aggregate_user_item_scores(interactions: pd.DataFrame) -> pd.DataFrame:
    """Gộp nhiều sự kiện cùng user-product thành 1 điểm số duy nhất (tổng decayed_score)."""
    df = apply_time_decay(interactions)
    if df.empty:
        return df
    grouped = df.groupby(["user_id", "product_id"], as_index=False)["decayed_score"].sum()
    return grouped
