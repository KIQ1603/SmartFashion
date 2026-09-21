from __future__ import annotations

import pandas as pd
from sqlalchemy import create_engine

from app.core.config import settings

engine = create_engine(settings.database_url_sync, pool_pre_ping=True)


def read_sql(query: str, params: dict | None = None) -> pd.DataFrame:
    return pd.read_sql(query, engine, params=params)


def fetch_interactions() -> pd.DataFrame:
    """Đọc dữ liệu thô từ bảng user_interactions (bước 1 - Thu thập, mục 4 tài liệu phân tích bài toán)."""
    return read_sql(
        """
        SELECT user_id, session_id, product_id, interaction_type, implicit_score, created_at
        FROM user_interactions
        WHERE user_id IS NOT NULL
        """
    )


def fetch_products() -> pd.DataFrame:
    return read_sql(
        """
        SELECT p.id, p.name, p.description, p.category_id, c.name AS category_name,
               p.brand, p.base_price, p.material, p.style_tags, p.season, p.status,
               p.created_at
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'active'
        """
    )


def fetch_user_interaction_counts() -> pd.DataFrame:
    return read_sql(
        """
        SELECT user_id, COUNT(*) AS n_interactions
        FROM user_interactions
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        """
    )
