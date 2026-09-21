import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import homepage, similar, train
from app.core.config import settings
from app.schemas.recommend import HealthResponse

app = FastAPI(
    title="SmartFashion Recommendation Service",
    description="Internal service - Content-Based / Collaborative (SVD) / Popularity / Hybrid",
    version="0.1.0",
)

# Về nguyên tắc service này chỉ nên được gọi nội bộ từ Core Backend.
# Mở CORS ở đây chỉ để Admin Dashboard có thể bấm nút "Huấn luyện lại" trực tiếp khi demo/phát triển.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

router_prefix = "/internal/recommend"
app.include_router(homepage.router, prefix=router_prefix, tags=["recommend"])
app.include_router(similar.router, prefix=router_prefix, tags=["recommend"])
app.include_router(train.router, prefix=router_prefix, tags=["train"])


@app.get(f"{router_prefix}/health", response_model=HealthResponse)
def health():
    model_loaded = os.path.exists(os.path.join(settings.model_dir, "svd_model.joblib"))
    return HealthResponse(status="ok", model_loaded=model_loaded)


@app.get("/")
def root():
    return {"service": "recommendation-service", "docs": "/docs"}
