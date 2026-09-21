"""
Bước 4 - Đánh giá mô hình: Precision@K, Recall@K, RMSE.
Chia dữ liệu Train (80%) / Test (20%), huấn luyện trên Train, so sánh với Test
- đúng đặc tả kiến trúc kỹ thuật mục 3.4.
"""
import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD

from app.core.config import settings
from app.pipeline.build_matrix import build_user_item_matrix


def train_test_split_interactions(scored: pd.DataFrame, test_ratio: float = 0.2, seed: int = 42):
    if scored.empty:
        return scored, scored

    rng = np.random.default_rng(seed)
    scored = scored.sample(frac=1, random_state=seed).reset_index(drop=True)

    # Chỉ đưa vào tập test những user có >= 2 tương tác, để vẫn còn ít nhất 1 tương tác trong train
    counts = scored.groupby("user_id")["product_id"].transform("count")
    eligible = scored[counts >= 2]
    not_eligible = scored[counts < 2]

    n_test = int(len(eligible) * test_ratio)
    test = eligible.iloc[:n_test]
    train = pd.concat([eligible.iloc[n_test:], not_eligible])
    return train, test


def evaluate_svd(train_df: pd.DataFrame, test_df: pd.DataFrame, top_k: int = None):
    top_k = top_k or settings.top_k

    matrix, user_index, item_index = build_user_item_matrix(train_df)
    if matrix is None or matrix.shape[0] < 2 or matrix.shape[1] < 2 or test_df.empty:
        return {"precision_at_k": None, "recall_at_k": None, "rmse": None}

    n_components = max(1, min(settings.svd_latent_factors, min(matrix.shape) - 1))
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_factors = svd.fit_transform(matrix)
    item_factors = svd.components_.T

    # ---- Precision@K / Recall@K ----
    test_by_user = test_df.groupby("user_id")["product_id"].apply(set)
    train_by_user = train_df.groupby("user_id")["product_id"].apply(set)

    idx_to_item = {v: k for k, v in item_index.items()}

    precisions, recalls = [], []
    for user_id, relevant in test_by_user.items():
        if user_id not in user_index:
            continue
        u_idx = user_index[user_id]
        scores = user_factors[u_idx] @ item_factors.T
        order = np.argsort(-scores)

        already_seen = train_by_user.get(user_id, set())
        recommended = []
        for idx in order:
            pid = idx_to_item.get(idx)
            if not pid or pid in already_seen:
                continue
            recommended.append(pid)
            if len(recommended) >= top_k:
                break

        hits = len(set(recommended) & relevant)
        precisions.append(hits / max(len(recommended), 1))
        recalls.append(hits / max(len(relevant), 1))

    # ---- RMSE (trên các cặp user-item mà cả hai đều xuất hiện trong tập train) ----
    squared_errors = []
    for _, row in test_df.iterrows():
        uid, pid, actual = row["user_id"], row["product_id"], row["decayed_score"]
        if uid in user_index and pid in item_index:
            pred = user_factors[user_index[uid]] @ item_factors[item_index[pid]]
            squared_errors.append((pred - actual) ** 2)

    rmse = float(np.sqrt(np.mean(squared_errors))) if squared_errors else None

    return {
        "precision_at_k": float(np.mean(precisions)) if precisions else None,
        "recall_at_k": float(np.mean(recalls)) if recalls else None,
        "rmse": rmse,
    }
