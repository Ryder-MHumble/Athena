"""
海外信源爬虫服务
- Twitter: 使用 twitterapi.io API
- YouTube: 使用 FireCrawl 解析频道页面
"""

import os
import json
import re
import httpx
import subprocess
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

# API 配置
TWITTER_API_URL = "https://api.twitterapi.io/twitter/user/last_tweets"
TWITTER_API_KEY = "new1_7590bc837c4d4104ada0ef3419ab7d6c"
FIRECRAWL_API_URL = "https://firecrawl.ihainan.me/v1/scrape"

# 数据保存路径 - 保存到 public 目录，前端可直接访问
CRAWL_DATA_BASE_PATH = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "crawl-data"


def load_sources() -> Dict[str, List[Dict[str, str]]]:
    """加载信源配置"""
    sources_path = Path(__file__).parent.parent / "Info_sources" / "sources.json"
    with open(sources_path, "r", encoding="utf-8") as f:
        return json.load(f)


# ==================== Twitter 爬虫 ====================

def extract_username_from_url(url: str) -> Optional[str]:
    """从 Twitter URL 中提取用户名"""
    # 匹配 https://x.com/username 或 https://twitter.com/username
    match = re.search(r'(?:x\.com|twitter\.com)/([a-zA-Z0-9_]+)(?:/|$)', url)
    return match.group(1) if match else None


async def fetch_twitter_user_tweets(username: str, max_pages: int = 3, timeout: int = 60) -> Optional[Dict[str, Any]]:
    """
    使用 twitterapi.io 获取用户最近的推文（支持分页）
    
    参数:
        username: Twitter 用户名
        max_pages: 最大获取页数，每页 20 条（默认 3 页 = 60 条）
        timeout: 请求超时时间（秒）
    
    API 文档: https://docs.twitterapi.io/api-reference/endpoint/get_user_last_tweets
    - 每页固定返回 20 条推文
    - 通过 cursor 参数进行分页
    """
    all_tweets = []
    cursor = ""  # 首页 cursor 为空字符串
    page = 0
    
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            while page < max_pages:
                page += 1
                
                # 构建请求参数
                params = {"userName": username}
                if cursor:  # 非首页需要传 cursor
                    params["cursor"] = cursor
                
                response = await client.get(
                    TWITTER_API_URL,
                    params=params,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": TWITTER_API_KEY
                    }
                )
                
                if response.status_code != 200:
                    print(f"[Twitter API] Failed @{username} page {page}: HTTP {response.status_code}")
                    break
                
                data = response.json()
                
                if data.get("status") != "success":
                    print(f"[Twitter API] Error @{username} page {page}: {data.get('message', 'Unknown error')}")
                    break
                
                # 获取本页推文（API 直接返回 tweets，不是嵌套在 data 里）
                page_tweets = data.get("tweets", [])
                if not page_tweets:
                    break
                    
                all_tweets.extend(page_tweets)
                print(f"[Twitter API] @{username} page {page}: got {len(page_tweets)} tweets (total: {len(all_tweets)})")
                
                # 检查是否有下一页（API 直接返回，不是嵌套在 data 里）
                has_next = data.get("has_next_page", False)
                next_cursor = data.get("next_cursor", "")
                
                if not has_next or not next_cursor:
                    break
                    
                cursor = next_cursor
        
        if all_tweets:
            # 返回合并后的数据（保持原有格式）
            return {
                "status": "success",
                "data": {
                    "tweets": all_tweets,
                    "has_next_page": False,  # 已获取完指定页数
                    "next_cursor": cursor
                }
            }
        return None
                
    except httpx.TimeoutException:
        print(f"[Twitter API] Timeout @{username} after {timeout}s")
        # 如果已获取部分数据，仍然返回
        if all_tweets:
            return {
                "status": "success",
                "data": {"tweets": all_tweets, "has_next_page": True, "next_cursor": cursor}
            }
        return None
    except Exception as e:
        print(f"[Twitter API] Error @{username}: {str(e)}")
        if all_tweets:
            return {
                "status": "success", 
                "data": {"tweets": all_tweets, "has_next_page": True, "next_cursor": cursor}
            }
        return None


def transform_twitter_data(raw_data: Dict[str, Any], source_name: str) -> List[Dict[str, Any]]:
    """
    将 Twitter API 返回的数据转换为统一格式
    """
    items = []
    
    if raw_data.get("status") != "success" or not raw_data.get("data"):
        return items
    
    tweets = raw_data.get("data", {}).get("tweets", [])
    
    for tweet in tweets:
        # 跳过转推
        if tweet.get("retweeted_tweet"):
            continue
            
        author = tweet.get("author", {})
        
        item = {
            "id": tweet.get("id"),
            "url": tweet.get("url"),
            "text": tweet.get("text", ""),
            "platform": "twitter",
            "source_name": source_name,
            "author": {
                "username": author.get("userName"),
                "name": author.get("name"),
                "avatar": author.get("profilePicture"),
                "followers": author.get("followers", 0),
                "verified": author.get("isBlueVerified", False)
            },
            "stats": {
                "likes": tweet.get("likeCount", 0),
                "retweets": tweet.get("retweetCount", 0),
                "replies": tweet.get("replyCount", 0),
                "views": tweet.get("viewCount", 0),
                "quotes": tweet.get("quoteCount", 0),
                "bookmarks": tweet.get("bookmarkCount", 0)
            },
            "created_at": tweet.get("createdAt"),
            "scraped_at": datetime.now().isoformat()
        }
        
        # 提取媒体信息
        extended_entities = tweet.get("extendedEntities", {})
        media = extended_entities.get("media", [])
        if media:
            item["media"] = [{
                "type": m.get("type"),
                "url": m.get("media_url_https")
            } for m in media]
        
        items.append(item)
    
    return items


async def crawl_twitter_source(source: Dict[str, str]) -> Dict[str, Any]:
    """爬取单个 Twitter 信源"""
    username = extract_username_from_url(source["url"])
    if not username:
        return {
            "source_name": source["name"],
            "source_url": source["url"],
            "error": "无法从URL提取用户名",
            "items": []
        }
    
    raw_data = await fetch_twitter_user_tweets(username)
    if not raw_data:
        return {
            "source_name": source["name"],
            "source_url": source["url"],
            "username": username,
            "error": "API请求失败",
            "items": []
        }
    
    items = transform_twitter_data(raw_data, source["name"])
    
    return {
        "source_name": source["name"],
        "source_url": source["url"],
        "username": username,
        "platform": "twitter",
        "scraped_at": datetime.now().isoformat(),
        "items": items
    }


def extract_unique_authors(all_tweets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """从推文列表中提取唯一的作者信息"""
    authors_map: Dict[str, Dict[str, Any]] = {}
    
    for tweet in all_tweets:
        author = tweet.get("author", {})
        username = author.get("username")
        if not username:
            continue
        
        # 如果该作者已存在，更新为粉丝数更多的版本（更新的数据）
        existing = authors_map.get(username)
        if existing:
            if author.get("followers", 0) > existing.get("followers", 0):
                authors_map[username] = {
                    "username": username,
                    "name": author.get("name"),
                    "avatar": author.get("avatar"),
                    "followers": author.get("followers", 0),
                    "verified": author.get("verified", False),
                    "platform": "twitter"
                }
        else:
            authors_map[username] = {
                "username": username,
                "name": author.get("name"),
                "avatar": author.get("avatar"),
                "followers": author.get("followers", 0),
                "verified": author.get("verified", False),
                "platform": "twitter"
            }
    
    # 按粉丝数排序
    authors = list(authors_map.values())
    authors.sort(key=lambda x: x.get("followers", 0), reverse=True)
    return authors


def save_authors_data(authors: List[Dict[str, Any]]) -> str:
    """保存作者信息到 authors.json"""
    platform_dir = CRAWL_DATA_BASE_PATH / "twitter"
    platform_dir.mkdir(parents=True, exist_ok=True)
    
    filepath = platform_dir / "authors.json"
    
    output = {
        "platform": "twitter",
        "updated_at": datetime.now().isoformat(),
        "total_count": len(authors),
        "authors": authors
    }
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    return str(filepath)


def save_twitter_data(sources_data: List[Dict[str, Any]]) -> str:
    """保存 Twitter 数据 - 直接覆盖文件"""
    # 合并所有推文
    all_tweets = []
    for source in sources_data:
        for item in source.get("items", []):
            all_tweets.append(item)
    
    # 按时间排序
    all_tweets.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # 保存到文件 - 固定文件名，每次覆盖
    platform_dir = CRAWL_DATA_BASE_PATH / "twitter"
    platform_dir.mkdir(parents=True, exist_ok=True)
    
    filename = "posts.json"
    filepath = platform_dir / filename
    
    output = {
        "platform": "twitter",
        "scraped_at": datetime.now().isoformat(),
        "total_count": len(all_tweets),
        "sources": [{"name": s["source_name"], "username": s.get("username"), "count": len(s.get("items", []))} for s in sources_data],
        "items": all_tweets
    }
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    # 提取并保存作者信息
    authors = extract_unique_authors(all_tweets)
    save_authors_data(authors)
    
    return str(filepath)


# ==================== YouTube 爬虫 ====================

async def get_youtube_channel_id(url: str, timeout: int = 60) -> Optional[str]:
    """
    从 YouTube 频道 URL 获取 channel_id
    支持多种 URL 格式：@username, /c/name, /channel/ID
    增加超时时间以适应生产环境
    """
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            # 如果已经是 channel_id 格式
            channel_match = re.search(r'/channel/([a-zA-Z0-9_-]+)', url)
            if channel_match:
                return channel_match.group(1)
            
            # 访问频道页面获取真实的 channel_id
            response = await client.get(url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            })
            
            if response.status_code == 200:
                html = response.text
                
                # 方法1: 从 meta 标签提取
                meta_match = re.search(r'<meta\s+itemprop="channelId"\s+content="([^"]+)"', html)
                if meta_match:
                    return meta_match.group(1)
                
                # 方法2: 从 canonical URL 提取
                canonical_match = re.search(r'"canonicalBaseUrl"\s*:\s*"/channel/([^"]+)"', html)
                if canonical_match:
                    return canonical_match.group(1)
                
                # 方法3: 从 externalId 提取
                external_match = re.search(r'"externalId"\s*:\s*"([^"]+)"', html)
                if external_match:
                    return external_match.group(1)
                
                # 方法4: 从 browseId 提取
                browse_match = re.search(r'"browseId"\s*:\s*"(UC[a-zA-Z0-9_-]+)"', html)
                if browse_match:
                    return browse_match.group(1)
            
            return None
    except Exception as e:
        print(f"[YouTube] Error getting channel_id for {url}: {e}")
        return None


async def fetch_youtube_rss_feed(channel_id: str, timeout: int = 60) -> Optional[str]:
    """
    获取 YouTube 频道的 RSS Feed
    增加超时时间以适应生产环境
    """
    try:
        rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(rss_url)
            if response.status_code == 200:
                print(f"[YouTube RSS] Success for {channel_id}: got feed content")
                return response.text
            print(f"[YouTube RSS] Failed for {channel_id}: HTTP {response.status_code}")
            return None
    except httpx.TimeoutException:
        print(f"[YouTube RSS] Timeout for {channel_id} after {timeout}s")
        return None
    except Exception as e:
        print(f"[YouTube RSS] Error for {channel_id}: {e}")
        return None


async def fetch_youtube_channel_page(url: str, timeout: int = 90) -> Optional[Dict[str, Any]]:
    """
    获取 YouTube 频道视频列表
    优先使用 RSS Feed，更可靠
    增加超时时间以适应生产环境
    """
    try:
        # 首先获取 channel_id
        channel_id = await get_youtube_channel_id(url, timeout=60)
        
        if channel_id:
            print(f"[YouTube] Got channel_id: {channel_id}")
            # 获取 RSS Feed
            rss_content = await fetch_youtube_rss_feed(channel_id, timeout=60)
            
            if rss_content and '<entry>' in rss_content:
                # 统计视频数量
                video_count = rss_content.count('<entry>')
                print(f"[YouTube] RSS success for {channel_id}: found {video_count} videos")
                return {
                    "success": True,
                    "data": {
                        "markdown": rss_content,
                        "metadata": {"channel_id": channel_id},
                        "is_rss": True
                    }
                }
            else:
                print(f"[YouTube] RSS returned but no entries found for {channel_id}")
        else:
            print(f"[YouTube] Could not get channel_id for {url}")
        
        # 如果 RSS 失败，尝试 FireCrawl 作为备选
        print(f"[YouTube] RSS failed, trying FireCrawl for {url}")
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                FIRECRAWL_API_URL,
                json={"url": url},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print(f"[FireCrawl] Success for {url}")
                    return data
            
            print(f"[FireCrawl] Failed {url}: HTTP {response.status_code}")
            return None
    
    except httpx.TimeoutException:
        print(f"[YouTube] Timeout for {url} after {timeout}s")
        return None
    except Exception as e:
        print(f"[YouTube] Error {url}: {str(e)}")
        return None


def extract_youtube_videos_from_markdown(markdown: str, source_name: str) -> List[Dict[str, Any]]:
    """从 FireCrawl 返回的 markdown 中提取 YouTube 视频信息"""
    items = []
    seen_ids = set()
    
    # 多种匹配模式
    patterns = [
        # 模式1: ### [视频标题](URL)
        (r'###\s*\[([^\]]+)\]\((?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})', 2),
        # 模式2: [任意文本](youtube URL)
        (r'\[([^\]]+)\]\((?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})', 2),
        # 模式3: 直接匹配 youtube URL
        (r'youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})', 1),
        # 模式4: youtu.be 短链接
        (r'youtu\.be/([a-zA-Z0-9_-]{11})', 1),
        # 模式5: 从缩略图 URL 提取 (i.ytimg.com/vi/VIDEO_ID/)
        (r'i\.ytimg\.com/vi/([a-zA-Z0-9_-]{11})/', 1),
    ]
    
    for pattern, id_group in patterns:
        matches = re.findall(pattern, markdown)
        for match in matches:
            if isinstance(match, tuple):
                video_id = match[id_group - 1] if id_group == 2 else match[0]
                title = match[0] if id_group == 2 and len(match) > 1 else None
            else:
                video_id = match
                title = None
            
            if video_id and video_id not in seen_ids and len(video_id) == 11:
                seen_ids.add(video_id)
                
                # 清理标题
                if title:
                    clean_title = re.sub(r'^\s*\d+:\d+\s*', '', title).strip()
                    # 排除时间戳格式
                    if re.match(r'^\d+:\d+$', clean_title):
                        clean_title = None
                else:
                    clean_title = None
                
                # 尝试从上下文提取标题
                if not clean_title:
                    title_pattern = rf'\[([^\]]+)\][^\[]*{video_id}'
                    title_match = re.search(title_pattern, markdown)
                    if title_match:
                        clean_title = title_match.group(1).strip()
                        clean_title = re.sub(r'^\s*\d+:\d+\s*', '', clean_title).strip()
                
                if not clean_title:
                    clean_title = f"Video from {source_name}"
                
                items.append({
                    "id": video_id,
                    "title": clean_title,
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "platform": "youtube",
                    "source_name": source_name,
                    "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                    "scraped_at": datetime.now().isoformat()
                })
    
    # 提取观看次数
    for item in items:
        video_id = item["id"]
        views_patterns = [
            rf'{video_id}[^\n]*?(\d+(?:\.\d+)?[KMB]?)\s*views',
            rf'(\d+(?:\.\d+)?[KMB]?)\s*views[^\n]*{video_id}',
        ]
        for vp in views_patterns:
            views_match = re.search(vp, markdown, re.IGNORECASE)
            if views_match:
                item["views"] = views_match.group(1) + " views"
                break
    
    return items


def extract_youtube_videos_from_rss(rss_content: str, source_name: str) -> List[Dict[str, Any]]:
    """从 YouTube RSS Feed 中提取视频信息"""
    items = []
    
    # RSS 格式: <entry>包含 videoId, title, published 等
    video_pattern = r'<entry>.*?<yt:videoId>([^<]+)</yt:videoId>.*?<title>([^<]+)</title>.*?<published>([^<]+)</published>.*?</entry>'
    matches = re.findall(video_pattern, rss_content, re.DOTALL)
    
    for video_id, title, published in matches:
        items.append({
            "id": video_id.strip(),
            "title": title.strip(),
            "url": f"https://www.youtube.com/watch?v={video_id.strip()}",
            "platform": "youtube",
            "source_name": source_name,
            "thumbnail": f"https://i.ytimg.com/vi/{video_id.strip()}/hqdefault.jpg",
            "published_at": published.strip(),
            "scraped_at": datetime.now().isoformat()
        })
    
    return items


async def crawl_youtube_source(source: Dict[str, str]) -> Dict[str, Any]:
    """爬取单个 YouTube 频道"""
    raw_data = await fetch_youtube_channel_page(source["url"])
    
    if not raw_data or not raw_data.get("success"):
        return {
            "source_name": source["name"],
            "source_url": source["url"],
            "error": "Crawl failed",
            "items": []
        }
    
    data = raw_data.get("data", {})
    markdown = data.get("markdown", "")
    is_rss = data.get("is_rss", False)
    
    # 根据数据类型选择解析方法
    if is_rss:
        items = extract_youtube_videos_from_rss(markdown, source["name"])
    else:
        items = extract_youtube_videos_from_markdown(markdown, source["name"])
    
    # 提取频道信息
    metadata = raw_data.get("data", {}).get("metadata", {})
    channel_name = metadata.get("ogTitle") or metadata.get("og:title") or source["name"]
    channel_description = metadata.get("ogDescription") or metadata.get("description") or ""
    channel_image = metadata.get("ogImage") or metadata.get("og:image") or ""
    
    return {
        "source_name": source["name"],
        "source_url": source["url"],
        "channel_name": channel_name,
        "channel_description": channel_description[:200] + "..." if len(channel_description) > 200 else channel_description,
        "channel_image": channel_image,
        "platform": "youtube",
        "scraped_at": datetime.now().isoformat(),
        "items": items
    }


def save_youtube_data(sources_data: List[Dict[str, Any]]) -> str:
    """保存 YouTube 数据 - 直接覆盖文件"""
    # 合并所有视频
    all_videos = []
    for source in sources_data:
        for item in source.get("items", []):
            all_videos.append(item)
    
    # 保存到文件 - 固定文件名，每次覆盖
    platform_dir = CRAWL_DATA_BASE_PATH / "youtube"
    platform_dir.mkdir(parents=True, exist_ok=True)
    
    filename = "videos.json"
    filepath = platform_dir / filename
    
    output = {
        "platform": "youtube",
        "scraped_at": datetime.now().isoformat(),
        "total_count": len(all_videos),
        "sources": [{"name": s["source_name"], "channel_name": s.get("channel_name"), "count": len(s.get("items", []))} for s in sources_data],
        "items": all_videos
    }
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    return str(filepath)


# ==================== 主爬虫函数 ====================

async def crawl_all_twitter() -> Dict[str, Any]:
    """爬取所有 Twitter 信源"""
    sources = load_sources()
    twitter_sources = sources.get("twitter", [])
    
    results = []
    for source in twitter_sources:
        safe_name = source['name'].encode('ascii', 'replace').decode('ascii')
        print(f"[Twitter] Crawling: {safe_name}...")
        result = await crawl_twitter_source(source)
        results.append(result)
    
    # 合并所有推文
    all_tweets = []
    for source in results:
        for item in source.get("items", []):
            all_tweets.append(item)
    all_tweets.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # 构建输出数据
    output_data = {
        "platform": "twitter",
        "scraped_at": datetime.now().isoformat(),
        "total_count": len(all_tweets),
        "sources": [{"name": s["source_name"], "username": s.get("username"), "count": len(s.get("items", []))} for s in results],
        "items": all_tweets
    }
    
    # 尝试保存到文件（本地开发时有效）
    filepath = None
    try:
        filepath = save_twitter_data(results)
    except Exception as e:
        print(f"[Warning] Could not save to file: {e}")
    
    return {
        "success": True,
        "platform": "twitter",
        "file": filepath,
        "sources_count": len(results),
        "total_posts": len(all_tweets),
        "data": output_data  # 返回数据供 API 缓存
    }


async def crawl_all_youtube() -> Dict[str, Any]:
    """爬取所有 YouTube 频道"""
    sources = load_sources()
    youtube_sources = sources.get("youtube", [])
    
    results = []
    for source in youtube_sources:
        safe_name = source['name'].encode('ascii', 'replace').decode('ascii')
        print(f"[YouTube] Crawling: {safe_name}...")
        result = await crawl_youtube_source(source)
        results.append(result)
    
    # 合并所有视频
    all_videos = []
    for source in results:
        for item in source.get("items", []):
            all_videos.append(item)
    
    # 构建输出数据
    output_data = {
        "platform": "youtube",
        "scraped_at": datetime.now().isoformat(),
        "total_count": len(all_videos),
        "sources": [{"name": s["source_name"], "channel_name": s.get("channel_name"), "count": len(s.get("items", []))} for s in results],
        "items": all_videos
    }
    
    # 尝试保存到文件
    filepath = None
    try:
        filepath = save_youtube_data(results)
    except Exception as e:
        print(f"[Warning] Could not save to file: {e}")
    
    return {
        "success": True,
        "platform": "youtube",
        "file": filepath,
        "sources_count": len(results),
        "total_videos": len(all_videos),
        "data": output_data  # 返回数据供 API 缓存
    }


async def crawl_all_overseas() -> Dict[str, Any]:
    """爬取所有海外信源"""
    twitter_result = await crawl_all_twitter()
    youtube_result = await crawl_all_youtube()
    
    return {
        "success": True,
        "twitter": twitter_result,
        "youtube": youtube_result,
        "crawled_at": datetime.now().isoformat()
    }

