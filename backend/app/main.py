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

# 环境变量（作为配置文件的默认值）
CRAWLER_INTERVAL = int(os.getenv("CRAWLER_INTERVAL_SECONDS", 3 * 60 * 60))
ENABLE_AUTO_CRAWL = os.getenv("ENABLE_AUTO_CRAWL", "false").lower() == "true"

# 全局爬虫配置（支持运行时动态修改）
crawler_config = {
    "enabled": False,           # 是否启用自动爬虫
    "interval": 10800,          # 爬取间隔（秒）
    "task": None,               # 爬虫任务引用
    "should_restart": False     # 是否需要重启任务
}


async def scheduled_crawler():
    """
    后台定时爬虫任务 - 支持动态配置

    支持运行时修改配置：
    - 通过修改 crawler_config["enabled"] 启用/禁用
    - 通过修改 crawler_config["interval"] 调整间隔
    - 通过设置 crawler_config["should_restart"] 重启任务
    """
    from app.services.crawler_service import crawl_all_overseas
    from app.services.config_service import CrawlerConfigService

    while True:
        # 检查是否需要重启（配置变更）
        if crawler_config["should_restart"]:
            print("[AutoCrawler] Configuration changed, restarting task...")
            crawler_config["should_restart"] = False
            return  # 退出当前任务，外部会重新启动

        # 检查是否启用
        if not crawler_config["enabled"]:
            # 未启用时，每分钟检查一次是否需要启用
            await asyncio.sleep(60)
            continue

        try:
            print(f"[AutoCrawler] Starting automatic crawl...")
            result = await crawl_all_overseas()
            twitter_count = result.get("twitter", {}).get("total_posts", 0)
            youtube_count = result.get("youtube", {}).get("total_videos", 0)
            print(f"[AutoCrawler] Crawl complete: Twitter={twitter_count}, YouTube={youtube_count}")

            # 更新上次爬取时间
            CrawlerConfigService.update_last_crawl_time()
        except Exception as e:
            print(f"[AutoCrawler] Crawl failed: {e}")

        # 等待配置的间隔时间
        interval_hours = crawler_config["interval"] / 3600
        print(f"[AutoCrawler] Next crawl in {interval_hours:.1f} hours")
        await asyncio.sleep(crawler_config["interval"])


async def start_crawler_task():
    """启动或重启爬虫任务"""
    if crawler_config["task"]:
        # 取消旧任务
        crawler_config["task"].cancel()
        try:
            await crawler_config["task"]
        except asyncio.CancelledError:
            pass

    # 启动新任务
    crawler_config["task"] = asyncio.create_task(scheduled_crawler())
    print(f"[AutoCrawler] Task started (enabled={crawler_config['enabled']}, interval={crawler_config['interval']}s)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理 - 启动/关闭时执行

    注意：自动爬虫配置优先级：配置文件 > 环境变量
    各服务（PDF 分析、爬虫、知识库等）完全解耦
    """
    from app.services.config_service import CrawlerConfigService

    # 启动时
    print("=" * 60)
    print("[Athena] Backend starting...")
    print("[Athena] Services: PDF Analyzer, Crawler, Knowledge Base, Chat")
    print("=" * 60)

    # 从配置文件加载配置（向后兼容环境变量）
    config = CrawlerConfigService.init_from_env(ENABLE_AUTO_CRAWL, CRAWLER_INTERVAL)

    # 更新全局配置
    crawler_config["enabled"] = config.get("auto_crawl_enabled", False)
    crawler_config["interval"] = config.get("interval_seconds", 10800)

    # 启动定时爬虫任务
    if crawler_config["enabled"]:
        print(f"[Athena] [!] Auto-crawl ENABLED")
        print(f"[Athena] Interval: {crawler_config['interval'] / 3600:.1f} hours")
        print(f"[Athena] Auto-crawl will run in background independently")
        await start_crawler_task()
    else:
        print("[Athena] [+] Auto-crawl DISABLED")
        print("[Athena] To enable: use crawler config page or set ENABLE_AUTO_CRAWL=true")
        # 即使禁用也启动任务（任务内部会轮询检查是否启用）
        await start_crawler_task()

    print("=" * 60)

    yield

    # 关闭时
    if crawler_config["task"]:
        print("[Athena] Stopping auto-crawl task...")
        crawler_config["task"].cancel()
        try:
            await crawler_config["task"]
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

