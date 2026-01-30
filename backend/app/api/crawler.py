"""
爬虫 API 路由
支持前后端分离部署：数据通过 API 返回，不依赖文件系统
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
from pathlib import Path

from ..services.crawler_service import (
    crawl_all_twitter,
    crawl_all_youtube,
    crawl_all_overseas,
    load_sources,
    CRAWL_DATA_BASE_PATH
)

router = APIRouter(prefix="/crawler", tags=["crawler"])

# 内存缓存 - 用于前后端分离部署时存储爬取数据
_data_cache: Dict[str, Any] = {
    "twitter": None,
    "youtube": None
}


class CrawlResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


@router.post("/crawl/twitter", response_model=CrawlResponse)
async def crawl_twitter_sources():
    """爬取所有 Twitter 信源"""
    try:
        result = await crawl_all_twitter()
        # 同时更新内存缓存
        _data_cache["twitter"] = result.get("data")
        return CrawlResponse(
            success=True,
            message=f"Twitter crawl complete: {result.get('total_posts', 0)} posts",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawl/youtube", response_model=CrawlResponse)
async def crawl_youtube_sources():
    """爬取所有 YouTube 频道"""
    try:
        result = await crawl_all_youtube()
        _data_cache["youtube"] = result.get("data")
        return CrawlResponse(
            success=True,
            message=f"YouTube crawl complete: {result.get('total_videos', 0)} videos",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawl/all", response_model=CrawlResponse)
async def crawl_all_sources():
    """爬取所有海外信源（Twitter + YouTube）"""
    try:
        result = await crawl_all_overseas()
        twitter_count = result.get("twitter", {}).get("total_posts", 0)
        youtube_count = result.get("youtube", {}).get("total_videos", 0)
        # 更新缓存
        _data_cache["twitter"] = result.get("twitter", {}).get("data")
        _data_cache["youtube"] = result.get("youtube", {}).get("data")
        return CrawlResponse(
            success=True,
            message=f"Crawl complete: Twitter {twitter_count} posts, YouTube {youtube_count} videos",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sources")
async def get_configured_sources():
    """获取配置的信源列表"""
    try:
        sources = load_sources()
        return {
            "success": True,
            "sources": sources,
            "twitter_count": len(sources.get("twitter", [])),
            "youtube_count": len(sources.get("youtube", []))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/twitter")
async def get_twitter_data():
    """获取已爬取的 Twitter 数据 - 先检查缓存，再读取文件"""
    try:
        # 1. 先检查内存缓存
        if _data_cache.get("twitter"):
            return {
                "success": True,
                "data": _data_cache["twitter"],
                "source": "cache"
            }
        
        # 2. 尝试读取文件
        filepath = CRAWL_DATA_BASE_PATH / "twitter" / "posts.json"
        
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            _data_cache["twitter"] = data  # 更新缓存
            return {
                "success": True,
                "data": data,
                "source": "file"
            }
        
        return {"success": True, "data": None, "message": "No data available. Please run crawler first."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/youtube")
async def get_youtube_data():
    """获取已爬取的 YouTube 数据 - 先检查缓存，再读取文件"""
    try:
        # 1. 先检查内存缓存
        if _data_cache.get("youtube"):
            return {
                "success": True,
                "data": _data_cache["youtube"],
                "source": "cache"
            }
        
        # 2. 尝试读取文件
        filepath = CRAWL_DATA_BASE_PATH / "youtube" / "videos.json"
        
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            _data_cache["youtube"] = data
            return {
                "success": True,
                "data": data,
                "source": "file"
            }
        
        return {"success": True, "data": None, "message": "No data available. Please run crawler first."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
