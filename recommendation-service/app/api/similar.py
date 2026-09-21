from fastapi import APIRouter
from app.algorithms import content_based
from app.schemas.recommend import SimilarResponse

router = APIRouter()


@router.get("/similar/{product_id}", response_model=SimilarResponse)
def similar(product_id: str):
    product_ids = content_based.get_similar_products(product_id)
    return SimilarResponse(product_id=product_id, product_ids=product_ids)
