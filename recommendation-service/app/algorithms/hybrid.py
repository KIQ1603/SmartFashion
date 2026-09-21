"""
Switching Hybrid: tự động chọn nhánh thuật toán theo "độ trưởng thành dữ liệu" của user
(đặc tả kiến trúc mục 3.3 + phân tích bài toán mục 5).

  - Không có user_id (guest) / user chưa có tương tác nào -> Popularity-based
  - User có 1..N tương tác (N = COLLABORATIVE_MIN_INTERACTIONS) -> Content-Based
    (dựa trên các sản phẩm vừa xem/tương tác gần nhất)
  - User đủ dữ liệu (>= N tương tác) -> Collaborative Filtering (SVD) làm chủ đạo,
    phối thêm 15-20% Trending trong danh mục ưa thích, loại trừ sản phẩm mua gần đây/đã trả hàng.
"""
from __future__ import annotations

from app.algorithms import collaborative, content_based, popularity
from app.core.config import settings
from app.core.db import read_sql


def _recent_viewed_products(user_id: str, limit: int = 5) -> list[str]:
    df = read_sql(
        """
        SELECT product_id FROM user_interactions
        WHERE user_id = %(uid)s AND interaction_type IN ('view','wishlist','add_to_cart')
        ORDER BY created_at DESC LIMIT %(limit)s
        """,
        {"uid": user_id, "limit": limit},
    )
    return df["product_id"].tolist()


def _favorite_category_id(user_id: str) -> str | None:
    df = read_sql(
        """
        SELECT p.category_id, COUNT(*) AS c
        FROM user_interactions ui
        JOIN products p ON p.id = ui.product_id
        WHERE ui.user_id = %(uid)s
        GROUP BY p.category_id
        ORDER BY c DESC
        LIMIT 1
        """,
        {"uid": user_id},
    )
    return df.iloc[0]["category_id"] if not df.empty else None


def _excluded_products(user_id: str) -> set:
    """Loại trừ: đã mua gần đây (30 ngày) hoặc thuộc nhóm đã bị trả hàng (negative filtering - mục 5)."""
    df = read_sql(
        """
        SELECT DISTINCT product_id FROM user_interactions
        WHERE user_id = %(uid)s
          AND (
            (interaction_type = 'purchase' AND created_at >= NOW() - INTERVAL '30 days')
            OR interaction_type = 'return'
          )
        """,
        {"uid": user_id},
    )
    return set(df["product_id"].tolist())


def _trending_in_category(category_id: str | None, top_k: int, exclude: set) -> list[str]:
    if not category_id:
        return []
    df = read_sql(
        """
        SELECT id FROM products
        WHERE category_id = %(cid)s AND status = 'active'
        ORDER BY created_at DESC
        LIMIT %(limit)s
        """,
        {"cid": category_id, "limit": top_k + len(exclude)},
    )
    return [pid for pid in df["id"].tolist() if pid not in exclude][:top_k]


def get_homepage_recommendations(user_id: str | None, top_k: int = None) -> tuple[list[str], str]:
    top_k = top_k or settings.top_k

    if not user_id:
        return popularity.get_popular_products(top_k), "popularity"

    count_df = read_sql(
        "SELECT COUNT(*) AS c FROM user_interactions WHERE user_id = %(uid)s", {"uid": user_id}
    )
    n_interactions = int(count_df.iloc[0]["c"]) if not count_df.empty else 0

    if n_interactions == 0:
        return popularity.get_popular_products(top_k), "popularity"

    if n_interactions < settings.collaborative_min_interactions:
        recent = _recent_viewed_products(user_id)
        ids = content_based.recommend_from_recent_views(recent, top_k)
        if not ids:
            ids = popularity.get_popular_products(top_k)
            return ids, "popularity"
        return ids, "content_based"

    # Đủ dữ liệu -> Hybrid: 70% Collaborative + 20% Trending danh mục ưa thích (mục 5 công thức phối trọng)
    excluded = _excluded_products(user_id)
    n_collab = max(1, round(top_k * 0.8))
    n_trending = top_k - n_collab

    collab_ids = collaborative.recommend_for_user(user_id, n_collab, exclude_ids=excluded)
    if not collab_ids:
        # Model chưa được train / user chưa có trong ma trận -> rơi về content-based
        recent = _recent_viewed_products(user_id)
        ids = content_based.recommend_from_recent_views(recent, top_k)
        return (ids, "content_based") if ids else (popularity.get_popular_products(top_k), "popularity")

    favorite_category = _favorite_category_id(user_id)
    trending_ids = _trending_in_category(favorite_category, n_trending, excluded.union(collab_ids))

    combined = collab_ids + trending_ids
    if len(combined) < top_k:
        combined += [pid for pid in popularity.get_popular_products(top_k) if pid not in combined]
    return combined[:top_k], "hybrid"
