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
from app.api import chat, paper, knowledge, crawler, pdf_analyzer, translate, docs
from app.utils.resilience import get_all_health_status

# API Documentation module loaded

# 爬虫调度间隔（秒）- 默认 3 小时
CRAWLER_INTERVAL = int(os.getenv("CRAWLER_INTERVAL_SECONDS", 3 * 60 * 60))
# 默认关闭自动爬虫，避免影响其他服务
ENABLE_AUTO_CRAWL = os.getenv("ENABLE_AUTO_CRAWL", "false").lower() == "true"


async def scheduled_crawler():
    """
    后台定时爬虫任务
    
    注意：此功能默认关闭，不会影响其他服务（如 PDF 分析）
    如需启用，设置环境变量 ENABLE_AUTO_CRAWL=true
    """
    from app.services.crawler_service import crawl_all_overseas
    
    while True:
        try:
            print(f"[AutoCrawler] Starting automatic crawl...")
            result = await crawl_all_overseas()
            twitter_count = result.get("twitter", {}).get("total_posts", 0)
            youtube_count = result.get("youtube", {}).get("total_videos", 0)
            print(f"[AutoCrawler] Crawl complete: Twitter={twitter_count}, YouTube={youtube_count}")
        except Exception as e:
            print(f"[AutoCrawler] Crawl failed: {e}")
        
        # 等待下一次执行
        print(f"[AutoCrawler] Next crawl in {CRAWLER_INTERVAL // 3600} hours")
        await asyncio.sleep(CRAWLER_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理 - 启动/关闭时执行
    
    注意：自动爬虫默认关闭，不会影响其他独立服务
    各服务（PDF 分析、爬虫、知识库等）完全解耦
    """
    # 启动时
    print("=" * 60)
    print("[Athena] Backend starting...")
    print("[Athena] Services: PDF Analyzer, Crawler, Knowledge Base, Chat")
    print("=" * 60)
    
    # 启动定时爬虫任务（默认关闭，需手动启用）
    crawler_task = None
    if ENABLE_AUTO_CRAWL:
        print(f"[Athena] [!] Auto-crawl ENABLED, interval: {CRAWLER_INTERVAL // 3600} hours")
        print(f"[Athena] Auto-crawl will run in background independently")
        crawler_task = asyncio.create_task(scheduled_crawler())
    else:
        print("[Athena] [+] Auto-crawl DISABLED (default)")
        print("[Athena] To enable: set ENABLE_AUTO_CRAWL=true in .env")
    
    print("=" * 60)
    
    yield
    
    # 关闭时
    if crawler_task:
        print("[Athena] Stopping auto-crawl task...")
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
app.include_router(pdf_analyzer.router, prefix="/api/pdf-analyzer", tags=["PDF Analyzer"])
app.include_router(translate.router, prefix="/api", tags=["Translate"])
app.include_router(docs.router, prefix="/api", tags=["Documentation"])


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


@app.get("/api/system/health/all")
async def all_services_health():
    """获取所有服务的健康状态"""
    health_status = get_all_health_status()
    
    # 判断整体健康状态
    all_healthy = all(
        s.get("healthy", True) for s in health_status.values()
    ) if health_status else True
    
    return {
        "overall": "healthy" if all_healthy else "degraded",
        "services": health_status,
        "version": "0.1.0"
    }

