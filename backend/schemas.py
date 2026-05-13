from typing import Dict, List

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    domain: str
    base: str
    competitors_limit: int = Field(default=10, ge=0, le=20)
    manual_competitors: List[str] = Field(default_factory=list)
    excluded_competitors: List[str] = Field(default_factory=list)
    competitors_top_pos: int = Field(default=10, ge=3, le=50)
    top50_competitors_min: int = Field(default=3, ge=1, le=20)
    main_min_pos: int = Field(default=10, ge=1, le=100)
    main_max_pages: int = Field(default=10, ge=1, le=30)
    competitors_max_pages: int = Field(default=5, ge=1, le=20)
    result_limit: int = Field(default=500, ge=50, le=5000)
    serp_queries: List[str] = Field(default_factory=list, max_length=10)
    serp_region_id: int = Field(default=213, ge=1)
    serp_top_number: int = Field(default=10, ge=1)


class SerpSummary(BaseModel):
    queries_total: int = 0
    successful_queries: int = 0
    failed_queries: int = 0
    domains_collected: int = 0
    excluded_stoplist: int = 0
    added_new: int = 0


class AnalyzeResponse(BaseModel):
    analysis_id: int
    domain: str
    competitors: List[str]
    competitor_sources: Dict[str, str] = Field(default_factory=dict)
    table_data: List[Dict]
    table_pool_data: List[Dict]
    diagnostics: Dict[str, int]
    stage_results: Dict[str, List[Dict]]
    serp_summary: SerpSummary = Field(default_factory=SerpSummary)
    serp_progress: List[str] = Field(default_factory=list)


class HistoryItem(BaseModel):
    id: int
    domain: str
    base: str
    created_at: str
    rows_count: int


class ServiceWishBase(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class ServiceWishCreate(ServiceWishBase):
    pass


class ServiceWishUpdate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class ServiceWishToggle(BaseModel):
    is_done: bool


class ServiceWishOut(BaseModel):
    id: int
    text: str
    is_done: bool
    created_at: str
    updated_at: str
