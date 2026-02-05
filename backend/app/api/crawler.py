"""
爬虫 API 路由
支持前后端分离部署：数据通过 API 返回，不依赖文件系统
支持后台异步爬取，用户无需等待
"""

from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncio
from pathlib import Path
from datetime import datetime

from ..services.crawler_service import (
    crawl_all_twitter,
    crawl_all_youtube,
    crawl_all_overseas,
    crawl_twitter_source,
    crawl_youtube_source,
    save_twitter_data,
    save_youtube_data,
    extract_unique_authors,
    save_authors_data,
    load_sources,
    CRAWL_DATA_BASE_PATH
)

router = APIRouter(prefix="/crawler", tags=["crawler"])

# 内存缓存 - 用于前后端分离部署时存储爬取数据
_data_cache: Dict[str, Any] = {
    "twitter": None,
    "youtube": None
}

# 爬取任务状态
_crawl_tasks: Dict[str, Dict[str, Any]] = {}

def get_task_id():
    """生成任务ID"""
    return datetime.now().strftime("%Y%m%d%H%M%S%f")


class CrawlResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    task_id: Optional[str] = None


async def background_crawl_all(task_id: str):
    """后台执行全量爬取"""
    _crawl_tasks[task_id] = {
        "status": "running",
        "started_at": datetime.now().isoformat(),
        "progress": "开始爬取..."
    }

    try:
        result = await crawl_all_overseas()
        twitter_count = result.get("twitter", {}).get("total_posts", 0)
        youtube_count = result.get("youtube", {}).get("total_videos", 0)
        # 更新缓存
        _data_cache["twitter"] = result.get("twitter", {}).get("data")
        _data_cache["youtube"] = result.get("youtube", {}).get("data")

        _crawl_tasks[task_id] = {
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "result": f"Twitter {twitter_count} posts, YouTube {youtube_count} videos"
        }
        print(f"[Crawler] Background crawl completed: Twitter={twitter_count}, YouTube={youtube_count}")
    except Exception as e:
        _crawl_tasks[task_id] = {
            "status": "failed",
            "error": str(e),
            "failed_at": datetime.now().isoformat()
        }
        print(f"[Crawler] Background crawl FAILED: {e}")


async def background_crawl_single_source(source: Dict[str, str], platform: str):
    """后台爬取单个信源并合并到现有数据"""
    try:
        print(f"[Background] Crawling {platform} source: {source['name']}")

        if platform == "twitter":
            result = await crawl_twitter_source(source)
            new_items = result.get("items", [])

            # 更新 sources.json 中的名称和username为真实信息
            if result.get("source_name") or result.get("author_info"):
                try:
                    current_sources = load_sources()
                    for s in current_sources.get("twitter", []):
                        if s["url"] == source.get("url"):
                            if result.get("source_name"):
                                s["name"] = result["source_name"]
                            if result.get("author_info") and result["author_info"].get("username"):
                                s["username"] = result["author_info"]["username"]
                            break
                    save_sources(current_sources)
                except Exception:
                    pass

            # 读取现有数据
            filepath = CRAWL_DATA_BASE_PATH / "twitter" / "posts.json"
            existing_data = {"items": []}
            if filepath.exists():
                with open(filepath, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)

            if new_items:
                # 合并新数据（去重 + 补充缺失字段如 quoted_tweet）
                existing_map = {item["id"]: item for item in existing_data.get("items", [])}
                for item in new_items:
                    if item["id"] not in existing_map:
                        existing_data["items"].append(item)
                    else:
                        # 补充已有推文缺失的 quoted_tweet 字段
                        existing_item = existing_map[item["id"]]
                        if item.get("quoted_tweet") and not existing_item.get("quoted_tweet"):
                            existing_item["quoted_tweet"] = item["quoted_tweet"]

                # 按时间排序
                existing_data["items"].sort(key=lambda x: x.get("created_at", ""), reverse=True)
                existing_data["total_count"] = len(existing_data["items"])
                existing_data["scraped_at"] = datetime.now().isoformat()
                existing_data.pop("sources", None)  # 清理历史遗留的 sources 字段

                # 保存
                filepath.parent.mkdir(parents=True, exist_ok=True)
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(existing_data, f, ensure_ascii=False, indent=2)

                # 更新缓存
                _data_cache["twitter"] = existing_data

                print(f"[Background] Added {len(new_items)} new tweets from {result.get('source_name', source['name'])}")

            # 更新作者信息（保留已有的 0 推文账号信息）
            source_author_infos = []
            if result.get("author_info"):
                source_author_infos.append(result["author_info"])
            try:
                auth_path = CRAWL_DATA_BASE_PATH / "twitter" / "authors.json"
                if auth_path.exists():
                    with open(auth_path, "r", encoding="utf-8") as f:
                        source_author_infos.extend(json.load(f).get("authors", []))
            except Exception:
                pass

            authors = extract_unique_authors(existing_data.get("items", []), source_author_infos)
            save_authors_data(authors)

        elif platform == "youtube":
            result = await crawl_youtube_source(source)
            new_items = result.get("items", [])
            
            if new_items:
                filepath = CRAWL_DATA_BASE_PATH / "youtube" / "videos.json"
                existing_data = {"items": [], "sources": []}
                if filepath.exists():
                    with open(filepath, "r", encoding="utf-8") as f:
                        existing_data = json.load(f)
                
                existing_ids = {item["id"] for item in existing_data.get("items", [])}
                for item in new_items:
                    if item["id"] not in existing_ids:
                        existing_data["items"].append(item)
                
                source_names = {s["name"] for s in existing_data.get("sources", [])}
                if result["source_name"] not in source_names:
                    existing_data["sources"].append({
                        "name": result["source_name"],
                        "channel_name": result.get("channel_name"),
                        "count": len(new_items)
                    })
                
                existing_data["total_count"] = len(existing_data["items"])
                existing_data["scraped_at"] = datetime.now().isoformat()
                
                filepath.parent.mkdir(parents=True, exist_ok=True)
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(existing_data, f, ensure_ascii=False, indent=2)
                
                _data_cache["youtube"] = existing_data
                
                print(f"[Background] Added {len(new_items)} new videos from {source['name']}")
    
    except Exception as e:
        print(f"[Background] Error crawling {source['name']}: {e}")


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
async def crawl_all_sources(background_tasks: BackgroundTasks, async_mode: bool = False):
    """
    爬取所有海外信源（Twitter + YouTube）
    async_mode=True 时后台执行，立即返回
    """
    if async_mode:
        task_id = get_task_id()
        _crawl_tasks[task_id] = {
            "status": "pending",
            "started_at": datetime.now().isoformat()
        }
        background_tasks.add_task(background_crawl_all, task_id)
        return CrawlResponse(
            success=True,
            message="爬取任务已在后台启动",
            task_id=task_id
        )
    
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


@router.get("/crawl/status/{task_id}")
async def get_crawl_status(task_id: str):
    """查询爬取任务状态"""
    if task_id in _crawl_tasks:
        return {"success": True, "task": _crawl_tasks[task_id]}
    return {"success": False, "message": "Task not found"}


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
async def add_source(request: AddSourceRequest, background_tasks: BackgroundTasks):
    """
    添加新信源
    自动识别 URL 类型（Twitter/YouTube）并解析用户名
    添加后立即获取基本账号信息，然后在后台爬取完整内容
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
        new_source = {
            "name": parsed["name"],
            "url": parsed["url"]
        }
        # Twitter信源添加username字段
        if platform == "twitter":
            from ..services.crawler_service import extract_username_from_url
            username = extract_username_from_url(new_source["url"])
            if username:
                new_source["username"] = username
        sources[platform].append(new_source)

        # 保存配置
        save_sources(sources)

        # 立即获取基本账号信息（快速返回给前端）
        account_info = None
        if platform == "twitter":
            try:
                from ..services.crawler_service import fetch_twitter_user_tweets, extract_username_from_url
                username = extract_username_from_url(new_source["url"])
                if username:
                    # 获取用户信息（使用短超时）
                    raw_data = await fetch_twitter_user_tweets(username, timeout=10)
                    if raw_data and raw_data.get("status") == "success":
                        tweets = raw_data.get("data", {}).get("tweets", [])
                        # 遍历推文查找匹配的作者信息（包括转推）
                        for tweet in tweets:
                            author = tweet.get("author", {})
                            author_username = author.get("userName") or ""
                            if author_username.lower() == username.lower():
                                # 提取profile_bio中的description
                                profile_bio = author.get("profileBio") or author.get("profile_bio") or {}
                                description = profile_bio.get("description", "") if isinstance(profile_bio, dict) else str(profile_bio) if profile_bio else ""

                                account_info = {
                                    "username": author.get("userName"),
                                    "name": author.get("name"),
                                    "avatar": author.get("profilePicture"),
                                    "followers": author.get("followers", 0),
                                    "verified": author.get("isBlueVerified", False),
                                    "description": description.strip(),
                                    "platform": "twitter"
                                }
                                break

                        if account_info:
                            # 更新 sources.json 中的名称为真实显示名称，并确保username字段存在
                            real_name = account_info.get("name")
                            real_username = account_info.get("username")
                            if (real_name and real_name != new_source["name"]) or (real_username and real_username != new_source.get("username")):
                                new_source["name"] = real_name or new_source["name"]
                                new_source["username"] = real_username or new_source.get("username")
                                sources = load_sources()
                                for s in sources.get(platform, []):
                                    if s["url"] == parsed["url"]:
                                        s["name"] = real_name or s["name"]
                                        s["username"] = real_username or s.get("username")
                                        break
                                save_sources(sources)
                                print(f"[Add Source] Updated source info: {parsed['name']} -> {real_name} (@{real_username})")

                            # 立即更新 authors.json，让前端可以立即看到
                            try:
                                authors_filepath = CRAWL_DATA_BASE_PATH / "twitter" / "authors.json"
                                authors_filepath.parent.mkdir(parents=True, exist_ok=True)

                                existing_authors = []
                                if authors_filepath.exists():
                                    with open(authors_filepath, "r", encoding="utf-8") as f:
                                        data = json.load(f)
                                        existing_authors = data.get("authors", [])

                                # 检查是否已存在，避免重复
                                author_exists = False
                                for i, existing in enumerate(existing_authors):
                                    if existing.get("username") == account_info["username"]:
                                        # 更新现有记录
                                        existing_authors[i] = account_info
                                        author_exists = True
                                        break

                                if not author_exists:
                                    existing_authors.append(account_info)

                                # 保存更新后的作者列表
                                output = {
                                    "platform": "twitter",
                                    "updated_at": datetime.now().isoformat(),
                                    "total_count": len(existing_authors),
                                    "authors": existing_authors
                                }
                                with open(authors_filepath, "w", encoding="utf-8") as f:
                                    json.dump(output, f, ensure_ascii=False, indent=2)

                                print(f"[Add Source] Immediately saved author info for @{username}")
                            except Exception as e:
                                print(f"[Add Source] Failed to save author info: {e}")
            except Exception as e:
                print(f"[Add Source] Failed to fetch immediate account info: {e}")

        # 后台异步爬取新添加的信源的完整内容
        background_tasks.add_task(background_crawl_single_source, new_source, platform)

        return {
            "success": True,
            "message": f"成功添加 {platform} 信源: {parsed['name']}",
            "source": parsed,
            "account_info": account_info,  # 立即返回账号信息
            "crawling": True
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
    """删除信源（支持通过name、username或URL匹配）"""
    try:
        sources = load_sources()
        platform = request.platform.lower()

        if platform not in sources:
            raise HTTPException(status_code=404, detail=f"未找到平台: {platform}")

        # 查找并删除（支持多种匹配方式）
        original_count = len(sources[platform])
        search_name = request.name.lower().strip()

        # 调试日志
        print(f"[Delete] Trying to delete: platform={platform}, name={request.name}")
        print(f"[Delete] Searching for: {search_name}")

        def should_delete(source: dict) -> bool:
            """判断是否应该删除该信源"""
            # 方式1: 完全匹配name
            if source.get("name", "").lower() == search_name:
                print(f"[Delete] OK Matched by name: {source.get('name')}")
                return True

            # 方式2: 完全匹配username
            if source.get("username", "").lower() == search_name:
                print(f"[Delete] OK Matched by username: {source.get('username')}")
                return True

            # 方式3: 从URL提取username并匹配
            url = source.get("url", "")
            if url:
                # 提取URL中的username: https://x.com/fortnow -> fortnow
                url_parts = url.rstrip('/').split('/')
                if url_parts:
                    url_username = url_parts[-1].lower()
                    if url_username == search_name:
                        print(f"[Delete] OK Matched by URL username: {url_username}")
                        return True

            print(f"[Delete] X No match: name={source.get('name')}, username={source.get('username')}")
            return False

        # 过滤掉需要删除的信源
        sources[platform] = [s for s in sources[platform] if not should_delete(s)]

        if len(sources[platform]) == original_count:
            available = [f"{s.get('name')} (@{s.get('username', 'N/A')})" for s in load_sources()[platform]]
            raise HTTPException(
                status_code=404,
                detail=f"未找到信源: {request.name}。可用信源: {', '.join(available[:5])}"
            )

        # 保存配置
        save_sources(sources)

        print(f"[Delete] OK Successfully deleted: {request.name}")

        return {
            "success": True,
            "message": f"成功删除 {platform} 信源: {request.name}"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
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
    """获取已爬取的 Twitter 数据 - 优先读取文件（保证最新），备选内存缓存"""
    try:
        data = None
        source = None

        # 1. 优先读取文件（确保拿到最新数据）
        filepath = CRAWL_DATA_BASE_PATH / "twitter" / "posts.json"
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            _data_cache["twitter"] = data  # 同步更新缓存
            source = "file"
        elif _data_cache.get("twitter"):
            # 2. 文件不存在时回退到内存缓存（线上部署场景）
            data = _data_cache["twitter"]
            source = "cache"

        if data is None:
            return {"success": True, "data": None, "message": "No data available. Please run crawler first."}

        # 3. 同时返回 authors 信息（解决线上环境前端无法访问静态文件的问题）
        authors = None
        authors_filepath = CRAWL_DATA_BASE_PATH / "twitter" / "authors.json"
        if authors_filepath.exists():
            with open(authors_filepath, "r", encoding="utf-8") as f:
                authors_data = json.load(f)
                authors = authors_data.get("authors", [])

        return {
            "success": True,
            "data": data,
            "authors": authors,
            "source": source
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/youtube")
async def get_youtube_data():
    """获取已爬取的 YouTube 数据 - 优先读取文件（保证最新），备选内存缓存"""
    try:
        # 1. 优先读取文件（确保拿到最新数据）
        filepath = CRAWL_DATA_BASE_PATH / "youtube" / "videos.json"
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            _data_cache["youtube"] = data  # 同步更新缓存
            return {
                "success": True,
                "data": data,
                "source": "file"
            }

        # 2. 文件不存在时回退到内存缓存（线上部署场景）
        if _data_cache.get("youtube"):
            return {
                "success": True,
                "data": _data_cache["youtube"],
                "source": "cache"
            }

        return {"success": True, "data": None, "message": "No data available. Please run crawler first."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 爬虫配置管理 API ====================

class CrawlerConfigModel(BaseModel):
    """爬虫配置模型"""
    auto_crawl_enabled: bool
    interval_seconds: int
    last_crawl_time: Optional[str] = None


class UpdateConfigRequest(BaseModel):
    """更新配置请求模型"""
    auto_crawl_enabled: Optional[bool] = None
    interval_seconds: Optional[int] = None


@router.get("/config")
async def get_crawler_config():
    """
    获取当前爬虫配置

    返回:
    - auto_crawl_enabled: 是否启用自动爬虫
    - interval_seconds: 爬取间隔（秒）
    - interval_hours: 爬取间隔（小时，便于前端展示）
    - last_crawl_time: 上次爬取时间
    """
    try:
        from ..services.config_service import CrawlerConfigService

        config = CrawlerConfigService.get_config_with_computed_fields()

        return {
            "success": True,
            "config": config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/config")
async def update_crawler_config(request: UpdateConfigRequest):
    """
    更新爬虫配置

    参数:
    - auto_crawl_enabled: 可选，是否启用自动爬虫
    - interval_seconds: 可选，爬取间隔（秒），范围：3600-86400（1-24小时）

    返回:
    - success: 是否成功
    - message: 状态消息
    - config: 更新后的配置
    """
    try:
        from ..services.config_service import CrawlerConfigService

        # 构建更新字典
        updates = {}

        if request.auto_crawl_enabled is not None:
            updates["auto_crawl_enabled"] = request.auto_crawl_enabled

        if request.interval_seconds is not None:
            # 验证间隔范围（1小时到24小时）
            if request.interval_seconds < 3600 or request.interval_seconds > 86400:
                raise HTTPException(
                    status_code=400,
                    detail="间隔时间必须在 3600-86400 秒之间（1-24小时）"
                )
            updates["interval_seconds"] = request.interval_seconds

        if not updates:
            raise HTTPException(status_code=400, detail="没有提供任何更新字段")

        # 更新配置并应用到运行中的任务
        config = await CrawlerConfigService.update_and_apply(updates)

        # 构建响应消息
        message_parts = []
        if "auto_crawl_enabled" in updates:
            status = "已启用" if updates["auto_crawl_enabled"] else "已禁用"
            message_parts.append(f"自动爬虫{status}")
        if "interval_seconds" in updates:
            hours = updates["interval_seconds"] / 3600
            message_parts.append(f"爬取间隔已设置为 {hours} 小时")

        message = "配置已更新：" + "，".join(message_parts)

        # 添加计算字段
        config["interval_hours"] = config["interval_seconds"] / 3600.0

        return {
            "success": True,
            "message": message,
            "config": config
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
