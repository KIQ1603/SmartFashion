"""
Content-Based Filtering.
Vector hoá sản phẩm bằng TF-IDF (mô tả văn bản) + One-Hot (category/brand/material/style_tags),
sau đó tính Cosine Similarity - đúng đặc tả kiến trúc kỹ thuật mục 3.1.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import OneHotEncoder

from app.core.db import fetch_products


def _build_feature_matrix(products: pd.DataFrame):
    tfidf = TfidfVectorizer(max_features=500, stop_words=None)
    description = products["description"].fillna("") + " " + products["name"].fillna("")
    text_matrix = tfidf.fit_transform(description)

    cat_cols = products[["category_name", "brand", "material", "season"]].fillna("unknown")
    encoder = OneHotEncoder(handle_unknown="ignore")
    cat_matrix = encoder.fit_transform(cat_cols)

    # style_tags: mảng text -> gộp thành 1 chuỗi rồi one-hot hoá qua TF-IDF nhỏ (đa nhãn)
    tags_text = products["style_tags"].apply(lambda tags: " ".join(tags) if isinstance(tags, list) else "")
    tags_tfidf = TfidfVectorizer(max_features=100)
    tags_matrix = tags_tfidf.fit_transform(tags_text)

    price = products[["base_price"]].astype(float).to_numpy()
    price_norm = (price - price.min()) / (price.max() - price.min() + 1e-9)

    feature_matrix = hstack([text_matrix, cat_matrix, tags_matrix, csr_matrix(price_norm)]).tocsr()
    return feature_matrix


def get_similar_products(product_id: str, top_k: int = 8) -> list[str]:
    products = fetch_products()
    if products.empty or product_id not in products["id"].values:
        return []

    feature_matrix = _build_feature_matrix(products)
    idx = products.index[products["id"] == product_id][0]

    sims = cosine_similarity(feature_matrix[idx], feature_matrix).flatten()
    order = np.argsort(-sims)
    order = [i for i in order if products.iloc[i]["id"] != product_id][:top_k]
    return products.iloc[order]["id"].tolist()


def recommend_from_recent_views(product_ids_viewed: list[str], top_k: int = 12) -> list[str]:
    """User mới có vài lượt xem -> gợi ý các sản phẩm tương tự sản phẩm vừa xem (đặc tả mục 3.3)."""
    products = fetch_products()
    if products.empty:
        return []
    feature_matrix = _build_feature_matrix(products)

    id_to_idx = {pid: i for i, pid in enumerate(products["id"])}
    seed_idx = [id_to_idx[pid] for pid in product_ids_viewed if pid in id_to_idx]
    if not seed_idx:
        return []

    seed_vector = feature_matrix[seed_idx].mean(axis=0)
    seed_vector = np.asarray(seed_vector)
    sims = cosine_similarity(seed_vector, feature_matrix).flatten()
    order = np.argsort(-sims)
    order = [i for i in order if products.iloc[i]["id"] not in product_ids_viewed][:top_k]
    return products.iloc[order]["id"].tolist()
