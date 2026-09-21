from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class RecommendResponse(BaseModel):
    user_id: Optional[str] = None
    product_ids: List[str]
    algorithm: str


class SimilarResponse(BaseModel):
    product_id: str
    product_ids: List[str]
    algorithm: str = "content_based"


class TrainResponse(BaseModel):
    algorithm: str
    precision_at_k: Optional[float] = None
    recall_at_k: Optional[float] = None
    rmse: Optional[float] = None
    training_data_size: int
    message: str


class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    model_loaded: bool
