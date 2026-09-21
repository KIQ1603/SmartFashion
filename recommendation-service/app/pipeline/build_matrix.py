"""
Bước 3 - Xây dựng ma trận User-Item thưa (scipy.sparse), không dùng ma trận đặc (dense)
để tiết kiệm bộ nhớ - đúng đặc tả phân tích bài toán mục 4, Bước 3.
"""
import pandas as pd
from scipy.sparse import csr_matrix


def build_user_item_matrix(scored: pd.DataFrame):
    if scored.empty:
        return None, {}, {}

    user_ids = scored["user_id"].unique().tolist()
    item_ids = scored["product_id"].unique().tolist()
    user_index = {uid: i for i, uid in enumerate(user_ids)}
    item_index = {pid: i for i, pid in enumerate(item_ids)}

    rows = scored["user_id"].map(user_index)
    cols = scored["product_id"].map(item_index)
    values = scored["decayed_score"]

    matrix = csr_matrix((values, (rows, cols)), shape=(len(user_ids), len(item_ids)))
    return matrix, user_index, item_index
