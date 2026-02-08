"""
AI 行业报告生成服务（Markdown 版）
- 加载推文数据并计算分析指标
- 调用 LLM 生成行业洞察摘要 + 逐帖分析
- 渲染 Markdown 报告并上传到 Supabase Storage
"""

import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from collections import Counter

from app.services.llm_service import get_llm_service
from app.prompts.report_prompt import (
    REPORT_EXECUTIVE_SUMMARY_PROMPT,
    REPORT_POST_ANALYSIS_PROMPT,
)
from app.services.crawler_service import CRAWL_DATA_BASE_PATH
from app.config import settings

REPORT_OUTPUT_DIR = CRAWL_DATA_BASE_PATH / "reports"
MAX_REPORTS_KEEP = 30

# 英文停用词（用于关键词提取）
STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "must", "ought",
    "i", "me", "my", "we", "our", "you", "your", "he", "him", "his",
    "she", "her", "it", "its", "they", "them", "their", "this", "that",
    "these", "those", "am", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "as", "into", "through", "during", "before", "after",
    "about", "between", "under", "above", "up", "down", "out", "off",
    "over", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "just", "because", "but", "and",
    "or", "if", "while", "what", "which", "who", "whom", "whose", "new",
    "also", "like", "get", "got", "one", "two", "don", "don't", "it's",
    "i'm", "we're", "they're", "he's", "she's", "that's", "there's",
    "what's", "who's", "let's", "here's", "doesn't", "didn't", "won't",
    "can't", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't",
    "hadn't", "couldn't", "wouldn't", "shouldn't", "mustn't", "amp",
}


# ==================== 工具函数 ====================

def _parse_twitter_time(ts: str) -> Optional[datetime]:
    """解析 Twitter 时间格式: 'Wed Sep 27 13:40:54 +0000 2023'"""
    try:
        return datetime.strptime(ts, "%a %b %d %H:%M:%S %z %Y")
    except (ValueError, TypeError):
        return None


def _format_number(n: int) -> str:
    """格式化数字: 1234567 -> 1,234,567"""
    return f"{n:,}"


def _format_short_number(n: int) -> str:
    """缩写数字: 1500000 -> 1.5M"""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


def _truncate_text(text: str, max_len: int = 300) -> str:
    """截断文本"""
    if len(text) <= max_len:
        return text
    return text[:max_len] + "..."


# ==================== 数据加载 ====================

def load_posts_data(platform: str = "twitter", data_path: str = None) -> Dict[str, Any]:
    """
    加载帖子数据
    Args:
        platform: 平台类型 ("twitter" / "youtube")
        data_path: 自定义数据文件路径（可选）
    """
    if data_path:
        filepath = Path(data_path)
    elif platform == "twitter":
        filepath = CRAWL_DATA_BASE_PATH / "twitter" / "posts.json"
    elif platform == "youtube":
        filepath = CRAWL_DATA_BASE_PATH / "youtube" / "videos.json"
    else:
        return {"items": [], "total_count": 0}

    if not filepath.exists():
        return {"items": [], "total_count": 0}

    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


# ==================== 数据分析 ====================

def _engagement_score(item: Dict[str, Any]) -> float:
    """计算单条推文的互动分数"""
    stats = item.get("stats", {})
    return (
        stats.get("likes", 0)
        + stats.get("retweets", 0) * 2
        + stats.get("views", 0) * 0.01
        + stats.get("quotes", 0) * 3
    )


def filter_and_analyze(
    posts_data: Dict[str, Any],
    hours: int = 24,
    authors: Optional[List[str]] = None,
    top_n: int = 10,
) -> Dict[str, Any]:
    """
    数据过滤与分析
    Args:
        posts_data: 原始帖子数据
        hours: 时间窗口（小时）
        authors: 可选的作者用户名过滤列表
        top_n: Top N 推文数量
    """
    items = posts_data.get("items", [])
    now = datetime.now(timezone.utc)

    # 解析时间
    for item in items:
        item["_parsed_time"] = _parse_twitter_time(item.get("created_at", ""))

    # 作者过滤（如果指定）
    if authors:
        authors_lower = {a.lower().lstrip("@") for a in authors}
        items = [
            item for item in items
            if (item.get("author", {}).get("username") or "").lower() in authors_lower
        ]

    # 时间窗口过滤
    recent_items = []
    for item in items:
        pt = item.get("_parsed_time")
        if pt:
            delta = (now - pt).total_seconds() / 3600
            if delta <= hours:
                recent_items.append(item)

    # 如果时间窗口内推文太少，放宽到全部数据（前 50 条）
    use_all = len(recent_items) < 5
    analysis_items = items[:50] if use_all else recent_items

    # Top N 高互动推文
    sorted_by_engagement = sorted(analysis_items, key=_engagement_score, reverse=True)
    top_posts = sorted_by_engagement[:top_n]

    # 最活跃作者（带详细信息）
    author_post_map: Dict[str, Dict[str, Any]] = {}
    for item in analysis_items:
        author = item.get("author", {})
        username = author.get("username")
        if not username:
            continue
        if username not in author_post_map:
            author_post_map[username] = {
                "username": username,
                "name": author.get("name") or username,
                "avatar": author.get("avatar", ""),
                "followers": author.get("followers", 0),
                "verified": author.get("verified", False),
                "post_count": 0,
            }
        author_post_map[username]["post_count"] += 1
        # 更新为最新的粉丝数
        if author.get("followers", 0) > author_post_map[username]["followers"]:
            author_post_map[username]["followers"] = author.get("followers", 0)
            author_post_map[username]["avatar"] = author.get("avatar", "")

    top_authors_by_activity = sorted(
        author_post_map.values(),
        key=lambda x: x["post_count"],
        reverse=True,
    )[:10]

    # 关键词频率
    all_text = " ".join(item.get("text", "") for item in analysis_items)
    all_text = re.sub(r"https?://\S+", "", all_text)
    all_text = re.sub(r"@\w+", "", all_text)
    words = re.findall(r"[a-zA-Z]{3,}", all_text.lower())
    word_freq = Counter(w for w in words if w not in STOP_WORDS)
    top_keywords = word_freq.most_common(20)

    # 互动汇总
    total_likes = sum(item.get("stats", {}).get("likes", 0) for item in analysis_items)
    total_retweets = sum(item.get("stats", {}).get("retweets", 0) for item in analysis_items)
    total_views = sum(item.get("stats", {}).get("views", 0) for item in analysis_items)

    active_authors = len(set(
        item.get("author", {}).get("username", "")
        for item in analysis_items
        if item.get("author", {}).get("username")
    ))

    # 清理临时字段
    for item in posts_data.get("items", []):
        item.pop("_parsed_time", None)

    return {
        "total_posts": posts_data.get("total_count", len(posts_data.get("items", []))),
        "analysis_posts_count": len(analysis_items),
        "used_full_data": use_all,
        "hours": hours,
        "top_n": top_n,
        "top_posts": top_posts,
        "top_authors_by_activity": top_authors_by_activity,
        "top_keywords": top_keywords,
        "total_likes": total_likes,
        "total_retweets": total_retweets,
        "total_views": total_views,
        "active_authors": active_authors,
        "scraped_at": posts_data.get("scraped_at", ""),
    }


# ==================== LLM 洞察生成 ====================

def build_llm_input(top_posts: List[Dict[str, Any]]) -> str:
    """
    构建 LLM 输入文本，只包含 Top N 推文的精简信息
    控制总输入在 2000-3000 字以内
    """
    lines = []
    for i, post in enumerate(top_posts, 1):
        author = post.get("author", {})
        stats = post.get("stats", {})
        name = author.get("name") or author.get("username") or "Unknown"
        username = author.get("username", "")
        text = _truncate_text(post.get("text", ""), 300)

        line = (
            f"[{i}] @{username} ({name}, {_format_short_number(author.get('followers', 0))} followers)\n"
            f"内容: {text}\n"
            f"互动: {_format_short_number(stats.get('likes', 0))} likes, "
            f"{_format_short_number(stats.get('retweets', 0))} RT, "
            f"{_format_short_number(stats.get('views', 0))} views"
        )

        # 引用推文
        qt = post.get("quoted_tweet")
        if qt:
            qt_author = qt.get("author", {})
            qt_text = _truncate_text(qt.get("text", ""), 200)
            line += (
                f"\n引用推文 @{qt_author.get('username', '')}: {qt_text}"
            )

        lines.append(line)

    return "\n\n".join(lines)


async def _call_llm(
    message: str,
    system_prompt: str,
    max_tokens: int,
    llm_config: Optional[Dict[str, Any]] = None,
) -> str:
    """通用 LLM 调用封装"""
    config = llm_config or {}
    api_key = config.get("api_key")
    model = config.get("model")

    llm = get_llm_service(api_key=api_key, model=model)

    # 如果指定了自定义 base_url，需要重新创建 llm 实例
    if config.get("base_url"):
        from langchain_openai import ChatOpenAI
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
        except ImportError:
            from langchain.schema import HumanMessage, SystemMessage

        custom_llm = ChatOpenAI(
            model=model or settings.LLM_MODEL,
            openai_api_key=api_key or settings.SILICONFLOW_API_KEY,
            openai_api_base=config["base_url"],
            temperature=0.4,
            max_tokens=max_tokens,
            request_timeout=settings.LLM_REQUEST_TIMEOUT,
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message),
        ]
        response = custom_llm.invoke(messages)
        return response.content.strip()

    return llm.chat(
        message=message,
        system_prompt=system_prompt,
        temperature=0.4,
        max_tokens=max_tokens,
    ).strip()


async def generate_executive_summary(
    top_posts: List[Dict[str, Any]],
    llm_config: Optional[Dict[str, Any]] = None,
) -> str:
    """
    使用 LLM 生成综合性行业洞察摘要（300-500字）
    """
    llm_input = build_llm_input(top_posts)

    try:
        return await _call_llm(
            message=llm_input,
            system_prompt=REPORT_EXECUTIVE_SUMMARY_PROMPT,
            max_tokens=1000,
            llm_config=llm_config,
        )
    except Exception as e:
        print(f"[Report] Executive summary generation failed: {e}")
        return _fallback_executive_summary(top_posts)


async def generate_post_analyses(
    top_posts: List[Dict[str, Any]],
    llm_config: Optional[Dict[str, Any]] = None,
) -> Dict[int, str]:
    """
    使用 LLM 生成逐帖分析。返回 {帖子序号: 分析文本}
    """
    llm_input = build_llm_input(top_posts)

    try:
        raw_output = await _call_llm(
            message=llm_input,
            system_prompt=REPORT_POST_ANALYSIS_PROMPT,
            max_tokens=2500,
            llm_config=llm_config,
        )
        return _parse_post_analyses(raw_output, len(top_posts))
    except Exception as e:
        print(f"[Report] Post analyses generation failed: {e}")
        return {}


def _parse_post_analyses(raw_output: str, num_posts: int) -> Dict[int, str]:
    """
    解析 LLM 输出的逐帖分析
    格式: [1] 分析内容...\n\n[2] 分析内容...\n\n
    """
    result = {}

    # 尝试按 [N] 标记分割
    parts = re.split(r'\[(\d+)\]\s*', raw_output)
    # parts 格式: ['', '1', '分析内容', '2', '分析内容', ...]
    if len(parts) >= 3:
        for i in range(1, len(parts) - 1, 2):
            try:
                idx = int(parts[i])
                text = parts[i + 1].strip()
                if text and 1 <= idx <= num_posts:
                    result[idx] = text
            except (ValueError, IndexError):
                continue

    # 如果解析失败，尝试按双换行分割并顺序映射
    if not result:
        paragraphs = [p.strip() for p in raw_output.split("\n\n") if p.strip()]
        for i, para in enumerate(paragraphs[:num_posts], 1):
            # 去除可能的编号前缀
            cleaned = re.sub(r'^\d+[.、)\]]\s*', '', para)
            if cleaned:
                result[i] = cleaned

    return result


def _fallback_executive_summary(top_posts: List[Dict[str, Any]]) -> str:
    """LLM 失败时的降级摘要内容"""
    if not top_posts:
        return "暂无足够数据生成洞察。"

    top = top_posts[0]
    author = top.get("author", {})
    stats = top.get("stats", {})
    name = author.get("name") or author.get("username") or "Unknown"

    return (
        f"本次分析共筛选出 {len(top_posts)} 条高互动推文。"
        f"其中来自 {name} 的推文获得了最高互动"
        f"（{_format_short_number(stats.get('views', 0))} 浏览，"
        f"{_format_short_number(stats.get('likes', 0))} 点赞）。"
    )


# ==================== Markdown 报告渲染 ====================

def render_markdown_report(
    analytics: Dict[str, Any],
    executive_summary: str,
    post_analyses: Dict[int, str],
    report_time: datetime = None,
) -> str:
    """
    将分析数据 + LLM 洞察组装为 Markdown 格式报告（可嵌入HTML div标签优化排版）
    """
    if report_time is None:
        report_time = datetime.now()

    date_str = report_time.strftime("%Y-%m-%d")
    time_str = report_time.strftime("%Y-%m-%d %H:%M")

    # 时间窗口描述
    hours = analytics["hours"]
    time_window = f"最近 {hours} 小时" if not analytics["used_full_data"] else "全部数据（最近50条）"

    # 构建报告内容
    md_lines = []

    # 标题和元数据
    md_lines.append(f"# AI 行业推特日报 | {date_str}\n")
    md_lines.append(f"> 数据窗口：{time_window} | 分析推文：{analytics['analysis_posts_count']} 条 | 活跃作者：{analytics['active_authors']} 位 | 总浏览量：{_format_short_number(analytics['total_views'])}\n")
    md_lines.append("---\n")

    # 综合洞察部分
    md_lines.append("## 核心洞察\n")
    # 将LLM生成的洞察按段落分割
    insights_paragraphs = [p.strip() for p in executive_summary.split("\n\n") if p.strip()]
    for para in insights_paragraphs:
        # 提取段落标题（如果有）
        lines = para.split("\n")
        if len(lines) > 1 and len(lines[0]) < 50:
            md_lines.append(f"### {lines[0]}")
            md_lines.append("\n".join(lines[1:]) + "\n")
        else:
            md_lines.append(para + "\n")
    md_lines.append("---\n")

    # Top推文部分
    md_lines.append(f"## 高互动推文 Top {len(analytics['top_posts'])}\n")

    for i, post in enumerate(analytics['top_posts'], 1):
        author = post.get("author", {})
        stats = post.get("stats", {})
        name = author.get("name") or author.get("username") or "Unknown"
        username = author.get("username", "")
        avatar = author.get("avatar", "")
        followers = _format_short_number(author.get("followers", 0))
        verified = " ✓" if author.get("verified") else ""
        text = post.get("text", "")
        url = post.get("url", "")

        md_lines.append(f"### {i}. {name}\n")

        # 作者信息（嵌入HTML优化头像显示）
        if avatar:
            md_lines.append(f'<img src="{avatar}" width="24" height="24" style="border-radius:50%;vertical-align:middle;"> **{name}** · @{username} · {followers} followers{verified}\n')
        else:
            md_lines.append(f"**{name}** · @{username} · {followers} followers{verified}\n")

        # 推文内容
        md_lines.append(f"> {text}\n")

        # 引用推文
        qt = post.get("quoted_tweet")
        if qt:
            qt_author = qt.get("author", {})
            qt_name = qt_author.get("name") or qt_author.get("username") or "Unknown"
            qt_username = qt_author.get("username", "")
            qt_text = qt.get("text", "")
            qt_url = qt.get("url", "")

            qt_link = f": [原文]({qt_url})" if qt_url else ""
            md_lines.append(f"> **引用 @{qt_username}** ({qt_name}){qt_link}")
            md_lines.append(f"> ")
            for line in qt_text.split("\n"):
                md_lines.append(f"> {line}")
            md_lines.append("")

        # LLM分析（如果有）
        if i in post_analyses:
            analysis_text = post_analyses[i]
            md_lines.append('<div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 12px 16px; margin: 12px 0;">')
            md_lines.append(f'<strong>🔍 AI分析：</strong> {analysis_text}')
            md_lines.append('</div>\n')

        # 互动数据
        likes = _format_short_number(stats.get("likes", 0))
        retweets = _format_short_number(stats.get("retweets", 0))
        views = _format_short_number(stats.get("views", 0))
        replies = _format_short_number(stats.get("replies", 0))

        view_link = f" · [查看原文]({url})" if url else ""
        md_lines.append(f"likes {likes} · RT {retweets} · views {views} · replies {replies}{view_link}\n")

    md_lines.append("\n---\n")
    md_lines.append(f"\n*由 Athena 自动生成 | {time_str}*\n")

    return "\n".join(md_lines)


# ==================== 存储 ====================

def save_markdown_report(md_content: str, filename: str = None) -> Tuple[str, str]:
    """
    保存 Markdown 报告到本地磁盘，清理旧报告。
    返回 (绝对文件路径, 文件名)
    """
    REPORT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if not filename:
        filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"

    filepath = REPORT_OUTPUT_DIR / filename
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md_content)

    # 清理旧报告
    reports = sorted(
        list(REPORT_OUTPUT_DIR.glob("report_*.md")),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    for old in reports[MAX_REPORTS_KEEP:]:
        old.unlink(missing_ok=True)

    return str(filepath), filename


def get_report_url(filename: str, base_url: str = None) -> str:
    """构建报告的本地可访问 URL（备用）"""
    if not base_url:
        base_url = "http://localhost:8000"
    base_url = base_url.rstrip("/")
    return f"{base_url}/reports/{filename}"


async def upload_to_supabase(
    pdf_bytes: bytes,
    filename: str,
    storage_config: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    """
    上传报告文件到 Supabase Storage（使用 REST API 直接上传）
    Args:
        pdf_bytes: 文件字节（可以是PDF或MD）
        filename: 文件名
        storage_config: 可选的自定义存储配置 {supabase_url, supabase_key, bucket}
    Returns:
        公开访问 URL，失败返回 None
    """
    config = storage_config or {}
    supabase_url = config.get("supabase_url") or settings.SUPABASE_URL
    supabase_key = config.get("supabase_key") or settings.SUPABASE_SECRET_KEY
    bucket = config.get("bucket", "reports")

    if not supabase_url or not supabase_key:
        print("[Report] Supabase not configured, skipping upload")
        return None

    try:
        import httpx

        # 根据文件扩展名决定上传路径
        if filename.endswith('.md'):
            file_path = f"markdown/{filename}"
            content_type = "text/markdown"
        elif filename.endswith('.pdf'):
            file_path = f"pdf/{filename}"
            content_type = "application/pdf"
        else:
            file_path = filename
            content_type = "application/octet-stream"

        # Supabase Storage REST API endpoints
        storage_base_url = f"{supabase_url}/storage/v1"
        upload_url = f"{storage_base_url}/object/{bucket}/{file_path}"

        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": content_type,
        }

        # 上传文件（使用 x-upsert 覆盖同名文件）
        upload_headers = {**headers, "x-upsert": "true"}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                upload_url,
                content=pdf_bytes,
                headers=upload_headers,
            )
            response.raise_for_status()

        # 生成公开访问 URL
        public_url = f"{storage_base_url}/object/public/{bucket}/{file_path}"
        print(f"[Report] Uploaded to Supabase: {public_url}")
        return public_url

    except httpx.HTTPStatusError as e:
        print(f"[Report] Supabase upload failed (HTTP {e.response.status_code}): {e.response.text}")
        return None
    except Exception as e:
        print(f"[Report] Supabase upload failed: {e}")
        return None


# ==================== 完整报告生成流水线 ====================

async def generate_report(
    platform: str = "twitter",
    hours: int = 24,
    authors: Optional[List[str]] = None,
    top_n: int = 10,
    report_style: str = "daily_insight",
    storage_config: Optional[Dict[str, Any]] = None,
    llm_config: Optional[Dict[str, Any]] = None,
    data_path: str = None,
) -> Dict[str, Any]:
    """
    完整报告生成流水线
    Args:
        platform: 平台 ("twitter" / "youtube")
        hours: 时间窗口（小时）
        authors: 可选的作者过滤列表
        top_n: Top N 推文数量
        report_style: 报告风格（预留）
        storage_config: 可选的 Supabase 存储配置
        llm_config: 可选的 LLM 配置
        data_path: 可选的自定义数据文件路径
    Returns:
        {report_url, insights, analytics_summary, filename, generated_at, format}
    """
    # 1. 加载数据
    posts_data = load_posts_data(platform=platform, data_path=data_path)
    if not posts_data.get("items"):
        return {
            "report_url": None,
            "insights": None,
            "text_summary": "当前没有可用的数据，请先运行爬虫。",
            "filename": None,
            "generated_at": datetime.now().isoformat(),
            "analytics_summary": None,
            "format": "markdown",
        }

    # 2. 数据过滤与分析
    analytics = filter_and_analyze(
        posts_data,
        hours=hours,
        authors=authors,
        top_n=top_n,
    )

    report_time = datetime.now()

    # 3. LLM 生成洞察（两个并发调用）
    executive_summary, post_analyses = await asyncio.gather(
        generate_executive_summary(analytics["top_posts"], llm_config=llm_config),
        generate_post_analyses(analytics["top_posts"], llm_config=llm_config),
    )

    # 4. 渲染 Markdown 报告
    md_report = render_markdown_report(
        analytics, executive_summary, post_analyses, report_time=report_time,
    )

    # 5. 保存 Markdown 到本地
    md_filename = f"report_{report_time.strftime('%Y%m%d_%H%M%S')}.md"
    local_md_path, md_filename = save_markdown_report(md_report, filename=md_filename)

    # 6. 上传到 Supabase Storage
    md_bytes = md_report.encode('utf-8')
    report_url = await upload_to_supabase(md_bytes, md_filename, storage_config=storage_config)

    # 如果 Supabase 上传失败，使用本地 URL 作为备用
    if not report_url:
        report_url = get_report_url(md_filename)

    return {
        "report_url": report_url,
        "insights": executive_summary,
        "text_summary": executive_summary,  # 兼容旧接口
        "filename": md_filename,
        "generated_at": report_time.isoformat(),
        "format": "markdown",
        "analytics_summary": {
            "total_posts": analytics["total_posts"],
            "analysis_posts_count": analytics["analysis_posts_count"],
            "total_views": analytics["total_views"],
            "total_likes": analytics["total_likes"],
            "total_retweets": analytics["total_retweets"],
            "active_authors": analytics["active_authors"],
            "top_keywords": [word for word, _ in analytics["top_keywords"][:10]],
        },
    }


# ==================== 兼容旧接口 ====================

async def generate_full_report(
    hours: int = 24,
    base_url: str = None,
    api_key: str = None,
) -> Dict[str, Any]:
    """
    兼容旧接口的报告生成函数
    内部调用新的 generate_report()
    """
    llm_config = {"api_key": api_key} if api_key else None
    result = await generate_report(
        platform="twitter",
        hours=hours,
        llm_config=llm_config,
    )

    # 映射回旧格式
    return {
        "html_path": None,
        "report_url": result.get("report_url"),
        "text_summary": result.get("text_summary", ""),
        "filename": result.get("filename"),
        "generated_at": result.get("generated_at"),
        "analytics_summary": result.get("analytics_summary"),
    }
