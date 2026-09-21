import uuid

from fastapi import APIRouter
from sqlalchemy import text

from app.algorithms.collaborative import train_svd
from app.core.db import engine, fetch_interactions
from app.pipeline.evaluate import evaluate_svd, train_test_split_interactions
from app.pipeline.preprocessing import aggregate_user_item_scores
from app.schemas.recommend import TrainResponse

router = APIRouter()


def _log_training_run(algorithm: str, metrics: dict, training_data_size: int):
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO model_training_logs
                    (id, trained_at, algorithm, precision_at_k, recall_at_k, rmse, training_data_size)
                VALUES
                    (:id, NOW(), :algorithm, :precision_at_k, :recall_at_k, :rmse, :training_data_size)
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "algorithm": algorithm,
                "precision_at_k": metrics.get("precision_at_k"),
                "recall_at_k": metrics.get("recall_at_k"),
                "rmse": metrics.get("rmse"),
                "training_data_size": training_data_size,
            },
        )


@router.post("/train", response_model=TrainResponse)
def train():
    """
    Chạy toàn bộ pipeline (mục 4 tài liệu phân tích bài toán):
    Thu thập -> Tiền xử lý -> Train/Test split -> Đánh giá -> Huấn luyện trên toàn bộ dữ liệu -> Lưu model + log.
    Được gọi từ cron job định kỳ (scripts/cron_train.py) hoặc thủ công qua endpoint này.
    """
    interactions = fetch_interactions()
    scored = aggregate_user_item_scores(interactions)

    if scored.empty:
        return TrainResponse(
            algorithm="collaborative_svd",
            training_data_size=0,
            message="Chưa có đủ dữ liệu interaction để huấn luyện mô hình.",
        )

    train_df, test_df = train_test_split_interactions(scored)
    metrics = evaluate_svd(train_df, test_df)

    # Huấn luyện lại model cuối cùng trên TOÀN BỘ dữ liệu (không chỉ tập train) để phục vụ inference
    _, training_data_size = train_svd(scored)

    _log_training_run("collaborative_svd", metrics, training_data_size)

    return TrainResponse(
        algorithm="collaborative_svd",
        precision_at_k=metrics.get("precision_at_k"),
        recall_at_k=metrics.get("recall_at_k"),
        rmse=metrics.get("rmse"),
        training_data_size=training_data_size,
        message="Huấn luyện hoàn tất.",
    )
