from typing import Dict, List

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    domain: str
    base: str
    competitors_limit: int = Field(default=10, ge=0, le=20)
    manual_competitors: List[str] = Field(default_factory=list)
    competitors_top_pos: int = Field(default=10, ge=3, le=50)
    top50_competitors_min: int = Field(default=3, ge=1, le=20)
    main_min_pos: int = Field(default=10, ge=1, le=100)
    main_max_pages: int = Field(default=10, ge=1, le=30)
    competitors_max_pages: int = Field(default=5, ge=1, le=20)
    result_limit: int = Field(default=500, ge=50, le=5000)


class AnalyzeResponse(BaseModel):
    analysis_id: int
    domain: str
    competitors: List[str]
    table_data: List[Dict]
    table_pool_data: List[Dict]
    diagnostics: Dict[str, int]
    stage_results: Dict[str, List[Dict]]
