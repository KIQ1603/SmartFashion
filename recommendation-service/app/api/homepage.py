from fastapi import APIRouter
from app.algorithms import hybrid
from app.schemas.recommend import RecommendResponse

router = APIRouter()


@router.get("/homepage/{user_id}", response_model=RecommendResponse)
def homepage(user_id: str):
    product_ids, algorithm = hybrid.get_homepage_recommendations(user_id)
    return RecommendResponse(user_id=user_id, product_ids=product_ids, algorithm=algorithm)
