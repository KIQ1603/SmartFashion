"""
Collaborative Filtering bằng Matrix Factorization.

Ghi chú kỹ thuật: tài liệu kiến trúc đề xuất scikit-surprise/implicit (SVD/ALS cổ điển).
Bản triển khai này dùng sklearn.decomposition.TruncatedSVD - cùng bản chất toán học
(phân rã ma trận R (m x n) ~ U (m x k) . V (n x k)^T bằng SVD/ALS), nhưng chạy thẳng
trên scipy.sparse mà không cần biên dịch thư viện C ngoài (surprise/implicit khó cài
trên một số môi trường) - phù hợp quy mô đồ án, có thể thay thế bằng `implicit` sau này
mà không đổi kiến trúc tổng thể.
"""
from __future__ import annotations

import os
from dataclasses import dataclass

import joblib
import numpy as np
from sklearn.decomposition import TruncatedSVD

from app.core.config import settings
from app.core.db import fetch_interactions
from app.pipeline.build_matrix import build_user_item_matrix
from app.pipeline.preprocessing import aggregate_user_item_scores

MODEL_PATH = os.path.join(settings.model_dir, "svd_model.joblib")


@dataclass
class SvdModel:
    user_factors: np.ndarray
    item_factors: np.ndarray
    user_index: dict
    item_index: dict
    item_ids_ordered: list


def train_svd(scored_df=None) -> tuple[SvdModel, int]:
    """Giai đoạn Training (nặng, chạy batch 1 lần cho toàn bộ user - mục 5.1 tài liệu phân tích bài toán)."""
    if scored_df is None:
        interactions = fetch_interactions()
        scored_df = aggregate_user_item_scores(interactions)

    matrix, user_index, item_index = build_user_item_matrix(scored_df)
    if matrix is None or matrix.shape[0] < 2 or matrix.shape[1] < 2:
        return None, 0

    n_components = min(settings.svd_latent_factors, min(matrix.shape) - 1)
    n_components = max(n_components, 1)
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_factors = svd.fit_transform(matrix)  # U (m x k)
    item_factors = svd.components_.T  # V (n x k)

    item_ids_ordered = [None] * len(item_index)
    for pid, idx in item_index.items():
        item_ids_ordered[idx] = pid

    model = SvdModel(
        user_factors=user_factors,
        item_factors=item_factors,
        user_index=user_index,
        item_index=item_index,
        item_ids_ordered=item_ids_ordered,
    )

    os.makedirs(settings.model_dir, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return model, len(scored_df)


def load_model() -> SvdModel | None:
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)


def recommend_for_user(user_id: str, top_k: int = 12, exclude_ids: set | None = None) -> list[str]:
    """Giai đoạn Inference (nhẹ - chỉ tra cứu 1 hàng có sẵn rồi nhân ma trận, mục 5.1)."""
    model = load_model()
    if model is None or user_id not in model.user_index:
        return []

    exclude_ids = exclude_ids or set()
    u_idx = model.user_index[user_id]
    scores = model.user_factors[u_idx] @ model.item_factors.T  # predicted_score = U_user . V_item

    order = np.argsort(-scores)
    result = []
    for idx in order:
        pid = model.item_ids_ordered[idx]
        if pid in exclude_ids:
            continue
        result.append(pid)
        if len(result) >= top_k:
            break
    return result


def user_interaction_count(user_id: str, scored_df) -> int:
    if scored_df is None or scored_df.empty:
        return 0
    return int((scored_df["user_id"] == user_id).sum())
