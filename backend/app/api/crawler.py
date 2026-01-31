"""
爬虫 API 路由
支持前后端分离部署：数据通过 API 返回，不依赖文件系统
"""

from fastapi import APIRouter, HTTPException, Header
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


class AddSourceRequest(BaseModel):
    url: str


def parse_source_url(url: str) -> Dict[str, str]:
    """
    解析信源 URL，自动识别平台和用户名
    支持格式：
    - Twitter/X: https://x.com/username, https://twitter.com/username
    - YouTube: https://youtube.com/@channel, https://youtube.com/channel/xxx
    """
    import re
    
    url = url.strip().rstrip('/')
    
    # Twitter/X
    twitter_patterns = [
        r'(?:https?://)?(?:www\.)?(?:x|twitter)\.com/([^/\?]+)',
    ]
    for pattern in twitter_patterns:
        match = re.match(pattern, url, re.IGNORECASE)
        if match:
            username = match.group(1)
            # 过滤掉非用户名的路径
            if username.lower() not in ['home', 'explore', 'notifications', 'messages', 'settings', 'i', 'search']:
                return {
                    "platform": "twitter",
                    "name": username,
                    "url": f"https://x.com/{username}"
                }
    
    # YouTube
    youtube_patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/@([^/\?]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/channel/([^/\?]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/c/([^/\?]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/user/([^/\?]+)',
    ]
    for pattern in youtube_patterns:
        match = re.match(pattern, url, re.IGNORECASE)
        if match:
            channel = match.group(1)
            # 构建标准化的 URL
            if '@' in url:
                normalized_url = f"https://www.youtube.com/@{channel}/videos"
            else:
                normalized_url = f"https://www.youtube.com/channel/{channel}/videos"
            return {
                "platform": "youtube",
                "name": channel,
                "url": normalized_url
            }
    
    raise ValueError("无法识别的 URL 格式，请输入有效的 X (Twitter) 或 YouTube 账号 URL")


def save_sources(sources: Dict[str, List[Dict[str, str]]]) -> None:
    """保存信源配置到文件"""
    sources_path = Path(__file__).parent.parent / "Info_sources" / "sources.json"
    with open(sources_path, "w", encoding="utf-8") as f:
        json.dump(sources, f, ensure_ascii=False, indent=2)


@router.post("/sources")
async def add_source(request: AddSourceRequest):
    """
    添加新信源
    自动识别 URL 类型（Twitter/YouTube）并解析用户名
    """
    try:
        # 解析 URL
        parsed = parse_source_url(request.url)
        platform = parsed["platform"]
        
        # 加载现有配置
        sources = load_sources()
        
        # 检查是否已存在
        existing_urls = [s["url"].lower() for s in sources.get(platform, [])]
        if parsed["url"].lower() in existing_urls:
            raise HTTPException(status_code=400, detail=f"该信源已存在: {parsed['name']}")
        
        # 添加新信源
        if platform not in sources:
            sources[platform] = []
        sources[platform].append({
            "name": parsed["name"],
            "url": parsed["url"]
        })
        
        # 保存配置
        save_sources(sources)
        
        return {
            "success": True,
            "message": f"成功添加 {platform} 信源: {parsed['name']}",
            "source": parsed
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DeleteSourceRequest(BaseModel):
    platform: str  # "twitter" or "youtube"
    name: str


@router.delete("/sources")
async def delete_source(request: DeleteSourceRequest):
    """删除信源"""
    try:
        sources = load_sources()
        platform = request.platform.lower()
        
        if platform not in sources:
            raise HTTPException(status_code=404, detail=f"未找到平台: {platform}")
        
        # 查找并删除
        original_count = len(sources[platform])
        sources[platform] = [
            s for s in sources[platform] 
            if s["name"].lower() != request.name.lower()
        ]
        
        if len(sources[platform]) == original_count:
            raise HTTPException(status_code=404, detail=f"未找到信源: {request.name}")
        
        # 保存配置
        save_sources(sources)
        
        return {
            "success": True,
            "message": f"成功删除 {platform} 信源: {request.name}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "zh"  # 默认翻译为中文


@router.post("/translate")
async def translate_text(
    request: TranslateRequest,
    x_api_key: str = Header(None, alias="X-API-Key")
):
    """
    翻译文本内容
    使用小模型进行快速翻译，优化速度
    """
    from langchain_openai import ChatOpenAI
    try:
        from langchain_core.messages import HumanMessage
    except ImportError:
        from langchain.schema import HumanMessage
    import os
    import re
    
    # 从 Header 获取 API Key，或从环境变量获取
    api_key = x_api_key or os.getenv("SILICONFLOW_API_KEY")
    
    if not api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        # 预处理文本：移除链接，只保留正文内容
        text = request.text
        # 移除 URL
        text = re.sub(r'https?://\S+', '', text)
        # 移除多余空白
        text = re.sub(r'\s+', ' ', text).strip()
        
        # 如果处理后文本为空，直接返回原文
        if not text:
            return {
                "success": True,
                "original": request.text,
                "translated": request.text,
                "target_language": request.target_language
            }
        
        # 使用小模型进行快速翻译
        small_llm = ChatOpenAI(
            model="Qwen/Qwen2.5-7B-Instruct",  # 使用 7B 小模型，速度更快
            openai_api_key=api_key,
            openai_api_base="https://api.siliconflow.cn/v1",
            temperature=0.1,  # 低温度，翻译更准确
            max_tokens=1024,
            request_timeout=30.0,  # 缩短超时时间
        )
        
        # 简化 prompt，减少 token 消耗
        prompt = f"将以下英文翻译成中文，只返回翻译结果：\n{text}"
        
        response = small_llm.invoke([HumanMessage(content=prompt)])
        translated = response.content.strip()
        
        return {
            "success": True,
            "original": request.text,
            "translated": translated,
            "target_language": request.target_language
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
