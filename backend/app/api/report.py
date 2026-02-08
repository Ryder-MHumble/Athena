"""
报告生成与推送 API
支持可配置的平台、作者、时间窗口、LLM、存储等参数
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..services.report_service import (
    generate_report,
    generate_full_report,
    get_report_url,
    REPORT_OUTPUT_DIR,
)
from ..services.dingtalk_service import DingTalkService
from ..config import settings

router = APIRouter(prefix="/report", tags=["report"])


# ==================== Request / Response Models ====================

class StorageConfig(BaseModel):
    """调用方自定义的 Supabase 存储配置"""
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    bucket: str = "reports"


class LLMConfig(BaseModel):
    """调用方自定义的 LLM 配置"""
    api_key: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None


class GenerateReportRequest(BaseModel):
    # 数据筛选
    platform: str = "twitter"
    hours: int = 24
    authors: Optional[List[str]] = None
    top_n: int = 10

    # 报告配置
    report_style: str = "daily_insight"
    language: str = "zh"

    # 外部配置（可选）
    storage: Optional[StorageConfig] = None
    llm: Optional[LLMConfig] = None

    # 推送
    send_dingtalk: bool = False


class SendDingTalkRequest(BaseModel):
    report_url: Optional[str] = None
    custom_message: Optional[str] = None
    hours: int = 24


# ==================== API 端点 ====================

@router.post("/generate")
async def api_generate_report(request: GenerateReportRequest):
    """
    生成 Markdown 报告 + LLM 洞察，可选上传 Supabase 和推送钉钉

    支持的配置：
    - platform: 数据平台 (twitter / youtube)
    - hours: 时间窗口
    - authors: 过滤特定作者列表
    - top_n: Top N 推文数量
    - storage: 自定义 Supabase 存储配置
    - llm: 自定义 LLM 配置
    - send_dingtalk: 是否推送钉钉
    """
    try:
        # 构建存储配置
        storage_config = None
        if request.storage:
            storage_config = {
                "supabase_url": request.storage.supabase_url,
                "supabase_key": request.storage.supabase_key,
                "bucket": request.storage.bucket,
            }

        # 构建 LLM 配置
        llm_config = None
        if request.llm:
            llm_config = {
                "api_key": request.llm.api_key,
                "model": request.llm.model,
                "base_url": request.llm.base_url,
            }

        result = await generate_report(
            platform=request.platform,
            hours=request.hours,
            authors=request.authors,
            top_n=request.top_n,
            report_style=request.report_style,
            storage_config=storage_config,
            llm_config=llm_config,
        )

        # 可选：推送钉钉
        dingtalk_result = None
        if request.send_dingtalk:
            try:
                dingtalk = DingTalkService()
                dingtalk_result = await dingtalk.send_report(
                    text_summary=result.get("insights") or result.get("text_summary", ""),
                    report_url=result.get("report_url"),
                )
            except Exception as e:
                dingtalk_result = {"errcode": -1, "errmsg": str(e)}

        return {
            "success": True,
            "report_url": result.get("report_url"),
            "insights": result.get("insights"),
            "analytics_summary": result.get("analytics_summary"),
            "filename": result.get("filename"),
            "generated_at": result.get("generated_at"),
            "format": result.get("format", "markdown"),
            "dingtalk_result": dingtalk_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-dingtalk")
async def send_dingtalk_report(request: SendDingTalkRequest):
    """生成并通过钉钉发送报告"""
    try:
        if request.custom_message:
            text_summary = request.custom_message
            report_url = request.report_url
        else:
            result = await generate_full_report(hours=request.hours)
            text_summary = result.get("text_summary", "")
            report_url = request.report_url if request.report_url else result.get("report_url")

        if not text_summary:
            raise HTTPException(status_code=400, detail="无法生成摘要，请检查数据是否存在")

        dingtalk = DingTalkService()
        dingtalk_result = await dingtalk.send_report(
            text_summary=text_summary,
            report_url=report_url,
        )

        success = dingtalk_result.get("errcode") == 0
        return {
            "success": success,
            "message": "发送成功" if success else f"发送失败: {dingtalk_result.get('errmsg')}",
            "mode": "ActionCard" if report_url else "Markdown",
            "report_url": report_url,
            "dingtalk_result": dingtalk_result,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest")
async def get_latest_report():
    """获取最新报告元数据"""
    try:
        reports = sorted(
            list(REPORT_OUTPUT_DIR.glob("report_*.md")),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if not reports:
            return {"success": True, "data": None, "message": "暂无报告，请先生成"}

        latest = reports[0]
        base_url = settings.REPORT_BASE_URL or None
        fmt = "markdown"
        return {
            "success": True,
            "data": {
                "filename": latest.name,
                "url": get_report_url(latest.name, base_url=base_url),
                "generated_at": datetime.fromtimestamp(latest.stat().st_mtime).isoformat(),
                "size_kb": round(latest.stat().st_size / 1024, 1),
                "format": fmt,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_reports():
    """列出所有已生成报告"""
    try:
        REPORT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        reports = sorted(
            list(REPORT_OUTPUT_DIR.glob("report_*.md")),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        base_url = settings.REPORT_BASE_URL or None
        items = []
        for r in reports:
            fmt = "markdown"
            items.append({
                "filename": r.name,
                "url": get_report_url(r.name, base_url=base_url),
                "generated_at": datetime.fromtimestamp(r.stat().st_mtime).isoformat(),
                "size_kb": round(r.stat().st_size / 1024, 1),
                "format": fmt,
            })
        return {"success": True, "count": len(items), "reports": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 定时报告管理 API ====================

class ReportSchedulerConfig(BaseModel):
    """报告调度器配置"""
    enabled: bool = False
    schedule_time: str = "09:00"  # HH:MM 格式
    timezone: str = "Asia/Shanghai"


@router.get("/scheduler/status")
async def get_scheduler_status():
    """获取报告调度器状态"""
    try:
        # 从 main.py 导入全局配置
        from app.main import report_scheduler_config

        scheduler = report_scheduler_config.get("scheduler")
        is_running = scheduler is not None and scheduler.running if scheduler else False

        next_run = None
        if is_running and scheduler:
            job = scheduler.get_job("daily_report")
            if job:
                next_run = job.next_run_time.isoformat() if job.next_run_time else None

        return {
            "success": True,
            "scheduler": {
                "enabled": report_scheduler_config.get("enabled", False),
                "running": is_running,
                "schedule_time": report_scheduler_config.get("schedule_time", "09:00"),
                "timezone": report_scheduler_config.get("timezone", "Asia/Shanghai"),
                "next_run": next_run,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scheduler/config")
async def update_scheduler_config(config: ReportSchedulerConfig):
    """
    更新报告调度器配置（动态生效）

    注意：配置修改会立即生效，但不会持久化到环境变量。
    如需永久保存，请修改 .env 文件中的配置：
    - ENABLE_AUTO_REPORT=true
    - REPORT_SCHEDULE_TIME=09:00
    - REPORT_TIMEZONE=Asia/Shanghai
    """
    try:
        from app.main import report_scheduler_config, setup_report_scheduler, shutdown_report_scheduler

        # 更新配置
        report_scheduler_config["enabled"] = config.enabled
        report_scheduler_config["schedule_time"] = config.schedule_time
        report_scheduler_config["timezone"] = config.timezone

        # 重启调度器
        shutdown_report_scheduler()
        if config.enabled:
            setup_report_scheduler()

        scheduler = report_scheduler_config.get("scheduler")
        next_run = None
        if scheduler and scheduler.running:
            job = scheduler.get_job("daily_report")
            if job:
                next_run = job.next_run_time.isoformat() if job.next_run_time else None

        return {
            "success": True,
            "message": f"Scheduler {'enabled' if config.enabled else 'disabled'}",
            "scheduler": {
                "enabled": config.enabled,
                "running": scheduler is not None and scheduler.running if scheduler else False,
                "schedule_time": config.schedule_time,
                "timezone": config.timezone,
                "next_run": next_run,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scheduler/trigger")
async def trigger_manual_report():
    """
    手动触发一次日报生成（不影响定时任务）

    用于测试或立即生成报告
    """
    try:
        from app.main import generate_daily_report

        # 在后台执行报告生成
        import asyncio
        asyncio.create_task(generate_daily_report())

        return {
            "success": True,
            "message": "Report generation triggered in background",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
