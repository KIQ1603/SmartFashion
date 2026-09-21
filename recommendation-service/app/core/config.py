import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(protected_namespaces=("settings_",))

    database_url_sync: str = os.getenv(
        "DATABASE_URL_SYNC",
        "postgresql://smartfashion:smartfashion@localhost:5432/smartfashion",
    )
    model_dir: str = os.getenv("MODEL_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "models_store"))

    # Ngưỡng số lượng interaction để coi 1 user là "đủ trưởng thành dữ liệu" -> dùng Collaborative Filtering
    # (đặc tả mục 3.3 - "User cũ, đủ dữ liệu (>10 tương tác)")
    collaborative_min_interactions: int = int(os.getenv("COLLABORATIVE_MIN_INTERACTIONS", 10))
    content_based_min_interactions: int = int(os.getenv("CONTENT_BASED_MIN_INTERACTIONS", 1))

    # Số chiều tiềm ẩn (latent factors) cho SVD - đặc tả kiến trúc mục 3.2 đề xuất 20-50
    svd_latent_factors: int = int(os.getenv("SVD_LATENT_FACTORS", 20))

    # time-decay lambda: score_final = score_goc * e^(-lambda * so_ngay_da_qua)
    time_decay_lambda: float = float(os.getenv("TIME_DECAY_LAMBDA", 0.01))

    top_k: int = int(os.getenv("TOP_K", 12))


settings = Settings()
