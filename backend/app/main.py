"""
Athena Backend - FastAPI 主应用
提供 AI 战略分析师工作台的后端 API 服务
"""

import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import chat, paper, knowledge, crawler

# 爬虫调度间隔（秒）- 默认 3 小时
CRAWLER_INTERVAL = int(os.getenv("CRAWLER_INTERVAL_SECONDS", 3 * 60 * 60))
ENABLE_AUTO_CRAWL = os.getenv("ENABLE_AUTO_CRAWL", "true").lower() == "true"


async def scheduled_crawler():
    """后台定时爬虫任务"""
    from app.services.crawler_service import crawl_all_overseas
    
    while True:
        try:
            print(f"[Scheduler] Starting automatic crawl...")
            result = await crawl_all_overseas()
            twitter_count = result.get("twitter", {}).get("total_posts", 0)
            youtube_count = result.get("youtube", {}).get("total_videos", 0)
            print(f"[Scheduler] Crawl complete: Twitter={twitter_count}, YouTube={youtube_count}")
        except Exception as e:
            print(f"[Scheduler] Crawl failed: {e}")
        
        # 等待下一次执行
        print(f"[Scheduler] Next crawl in {CRAWLER_INTERVAL // 3600} hours")
        await asyncio.sleep(CRAWLER_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理 - 启动/关闭时执行"""
    # 启动时
    print("[Athena] Backend starting...")
    
    # 启动定时爬虫任务（如果启用）
    crawler_task = None
    if ENABLE_AUTO_CRAWL:
        print(f"[Athena] Auto-crawl enabled, interval: {CRAWLER_INTERVAL // 3600} hours")
        crawler_task = asyncio.create_task(scheduled_crawler())
    else:
        print("[Athena] Auto-crawl disabled")
    
    yield
    
    # 关闭时
    if crawler_task:
        crawler_task.cancel()
        try:
            await crawler_task
        except asyncio.CancelledError:
            pass
    print("[Athena] Backend shutting down...")


# 创建 FastAPI 应用实例
app = FastAPI(
    title="Athena API",
    description="AI 战略分析师智能工作台后端 API",
    version="0.1.0",
    lifespan=lifespan,
)

# 配置 CORS - 允许 Vercel 前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(paper.router, prefix="/api/paper", tags=["Paper"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["Knowledge"])
app.include_router(crawler.router, prefix="/api", tags=["Crawler"])


@app.get("/")
async def root():
    """健康检查端点"""
    return {
        "message": "Athena API is running", 
        "version": "0.1.0",
        "auto_crawl": ENABLE_AUTO_CRAWL,
        "crawl_interval_hours": CRAWLER_INTERVAL // 3600
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}

