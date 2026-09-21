"""
Popularity-based recommendation.
Dùng cho: Guest / user hoàn toàn mới (cold-start) - đặc tả mục 3.3.
"""
import pandas as pd

from app.core.db import read_sql


def get_popular_products(top_k: int = 12, days: int = 7) -> list[str]:
    """Sản phẩm bán chạy / xem nhiều nhất trong N ngày gần đây."""
    df: pd.DataFrame = read_sql(
        """
        SELECT product_id, SUM(implicit_score) AS score
        FROM user_interactions
        WHERE created_at >= NOW() - (INTERVAL '1 day' * %(days)s)
        GROUP BY product_id
        ORDER BY score DESC
        LIMIT %(limit)s
        """,
        {"days": days, "limit": top_k},
    )
    if df.empty:
        # Chưa có interaction nào (hệ thống mới tinh) -> lấy sản phẩm mới nhất
        df = read_sql(
            "SELECT id AS product_id FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT %(limit)s",
            {"limit": top_k},
        )
    return df["product_id"].tolist()
