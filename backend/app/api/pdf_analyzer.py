"""
PDF 智析模块 API 路由
通过 MinerU API 服务进行 PDF 解析、翻译和图表分析

使用前请配置环境变量：
MINERU_API_URL=http://your-mineru-server:8010

部署 MinerU 服务：
docker run -d -p 8010:8010 --gpus all opendatalab/mineru:latest
"""

import os
import asyncio
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import json
import httpx

from app.services.pdf_analyzer_service import get_pdf_analyzer_service
from app.services.llm_service import get_llm_service
from app.services.task_manager import (
    get_task_manager, 
    TaskStatus, 
    SSEEventGenerator,
    ChunkedJSONSerializer
)
from app.config import settings

router = APIRouter()

# ============ 数据模型 ============

class ChartInfo(BaseModel):
    """图表信息"""
    id: str
    type: str
    pageNumber: int
    imageUrl: str
    title: str
    summary: str
    keyPoints: List[str]
    category: Optional[str] = None

class PDFAnalysisResponse(BaseModel):
    """PDF 分析响应"""
    success: bool
    originalText: str
    translatedText: str
    charts: List[ChartInfo]
    metadata: dict
    message: Optional[str] = None

# ============ 临时存储 ============
_analysis_results = {}
_current_session_ids = set()  # 跟踪当前会话的图片 ID 前缀


def _clear_old_image_cache(keep_session_ids: set = None):
    """
    清理旧的图片缓存
    只保留指定会话的图片，删除其他所有图片
    """
    global _analysis_results
    if keep_session_ids is None:
        # 清除所有缓存
        _analysis_results.clear()
        return
    
    # 只保留指定会话的图片
    keys_to_remove = []
    for key in _analysis_results.keys():
        # 检查 key 是否属于保留的会话
        session_match = False
        for session_id in keep_session_ids:
            if key.startswith(session_id):
                session_match = True
                break
        if not session_match:
            keys_to_remove.append(key)
    
    for key in keys_to_remove:
        del _analysis_results[key]


def _get_session_id_from_chart_id(chart_id: str) -> str:
    """从图片 ID 中提取会话 ID"""
    if "_" in chart_id:
        return chart_id.split("_")[0]
    return ""

# ============ API 端点 ============

@router.post("/analyze")
async def analyze_pdf(
    file: UploadFile = File(None),
    url: str = Form(None),
    translate: bool = Form(True),
    extract_charts: bool = Form(True),
    x_api_key: str = Header(None),
    x_mineru_api_key: str = Header(None),
):
    """
    分析 PDF 文件
    
    支持两种方式：
    1. 上传文件：file
    2. 提供 URL：url (直接传给 MinerU API，无需下载)
    
    需要提供 MinerU API Key (通过 X-MinerU-API-Key header)
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    if not file and not url:
        raise HTTPException(status_code=400, detail="请上传 PDF 文件或提供 URL")
    
    # 优先使用前端传来的 MinerU API Key，其次使用环境变量
    mineru_key = x_mineru_api_key or os.getenv("MINERU_API_KEY", "")
    if not mineru_key:
        raise HTTPException(
            status_code=503, 
            detail=(
                "MinerU API Key 未配置！\n\n"
                "请在设置页面配置 MinerU API Key\n"
                "获取地址: https://mineru.net"
            )
        )
    
    # 设置环境变量供 service 使用
    os.environ["MINERU_API_KEY"] = mineru_key
    
    try:
        # 获取服务实例
        service = get_pdf_analyzer_service(api_key=x_api_key, mineru_api_key=mineru_key)
        
        pdf_bytes = None
        pdf_url = None
        
        # 如果提供了 URL，直接使用（MinerU 支持直接从 URL 解析）
        if url:
            pdf_url = url
        
        # 如果上传了文件，读取文件内容
        elif file:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="仅支持 PDF 文件")
            
            pdf_bytes = await file.read()
            
            if len(pdf_bytes) > settings.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400, 
                    detail=f"文件大小超过限制 ({settings.MAX_FILE_SIZE // 1024 // 1024}MB)"
                )
            
        
        # 调用分析服务
        result = await service.analyze_pdf(
            pdf_bytes=pdf_bytes,
            pdf_url=pdf_url,
            translate=translate,
            extract_charts=extract_charts
        )
        
        
        # 处理图表数据
        charts_response = []
        for chart in result.get("charts", []):
            chart_id = chart.get("id", "")
            if chart_id:
                _analysis_results[chart_id] = chart
            
            charts_response.append(ChartInfo(
                id=chart.get("id", ""),
                type=chart.get("type", "other"),
                pageNumber=chart.get("pageNumber", 0),
                imageUrl=f"/api/pdf-analyzer/image/{chart.get('id', '')}",
                title=chart.get("title", ""),
                summary=chart.get("summary", ""),
                keyPoints=chart.get("keyPoints", []),
                category=chart.get("category")
            ))
        
        return PDFAnalysisResponse(
            success=True,
            originalText=result.get("original_text", ""),
            translatedText=result.get("translated_text", ""),
            charts=charts_response,
            metadata=result.get("metadata", {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        
        # 提供更友好的错误信息
        if "无法连接" in error_msg or "ConnectError" in error_msg:
            raise HTTPException(
                status_code=503,
                detail=f"无法连接到 MinerU 云 API，请检查网络连接"
            )
        
        if "未配置" in error_msg or "API Key" in error_msg:
            raise HTTPException(
                status_code=503,
                detail=f"MinerU API Key 未配置，请设置 MINERU_API_KEY 环境变量"
            )
        
        raise HTTPException(status_code=500, detail=f"PDF 分析失败: {error_msg}")

@router.post("/analyze/stream")
async def analyze_pdf_stream(
    request: Request,
    file: UploadFile = File(None),
    url: str = Form(None),
    translate: bool = Form(True),
    extract_charts: bool = Form(True),
    enable_paper_analysis: bool = Form(True),
    x_api_key: str = Header(None),
    x_mineru_api_key: str = Header(None),
):
    """
    流式分析 PDF（返回 SSE 事件流）
    
    支持两种方式：
    1. 上传文件：file
    2. 提供 URL：url (直接传给 MinerU API)
    
    使用任务管理器统一管理任务生命周期
    """
    
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    # 检查是否提供了文件或URL
    has_file = file and file.filename
    has_url = url and url.strip()
    
    if not has_file and not has_url:
        raise HTTPException(status_code=400, detail="请上传 PDF 文件或提供 URL")
    
    # 优先使用前端传来的 MinerU API Key，其次使用环境变量
    mineru_key = x_mineru_api_key or os.getenv("MINERU_API_KEY", "")
    if not mineru_key:
        raise HTTPException(status_code=503, detail="MinerU API Key 未配置，请在设置页面配置")
    
    # 设置环境变量供 service 使用
    os.environ["MINERU_API_KEY"] = mineru_key
    
    # 预先读取文件内容（在生成器外部）
    pdf_bytes = None
    pdf_url = None
    
    if has_url:
        pdf_url = url.strip()
    elif has_file:
        pdf_bytes = await file.read()
    
    # 创建任务
    task_manager = get_task_manager()
    task = task_manager.create_task()
    
    async def generate_events():
        sse = SSEEventGenerator(task)
        current_session_id = None  # 用于跟踪当前会话的图片
        
        try:
            # 检查客户端连接
            if await request.is_disconnected():
                task.cancel()
                return
            
            # 清理旧的图片缓存（避免图片混淆）
            # 只保留最近 5 分钟内的会话图片
            _clear_old_image_cache(keep_session_ids=None)
            
            # 发送初始进度
            event = await sse.send_progress("uploading", 5, "正在处理...")
            if event:
                yield event
            
            # 检查取消
            if task.is_cancelled():
                return
            
            # 根据模式发送不同的进度信息
            if pdf_url:
                event = await sse.send_progress("parsing", 15, "正在从 URL 创建解析任务...")
                if event:
                    yield event
            else:
                event = await sse.send_progress("uploading", 15, "正在上传文件到 MinerU...")
                if event:
                    yield event
            
            # 检查取消和连接状态
            if task.is_cancelled() or await request.is_disconnected():
                task.cancel()
                return
            
            # 创建服务实例
            service = get_pdf_analyzer_service(api_key=x_api_key, mineru_api_key=mineru_key)
            
            # 根据是 URL 还是文件，显示不同的阶段消息
            if pdf_url:
                event = await sse.send_progress("parsing", 25, "正在创建 MinerU 解析任务...")
            else:
                event = await sse.send_progress("uploading", 25, "正在上传文件到 MinerU 云端...")
            if event:
                yield event
            
            # 检查取消
            if task.is_cancelled() or await request.is_disconnected():
                return
            
            # 发送等待解析的进度
            event = await sse.send_progress("parsing", 35, "等待 MinerU 解析 PDF 内容...")
            if event:
                yield event
            
            # 简化实现：使用共享状态来传递进度
            # 由于在生成器中无法在回调中 yield，我们使用定时心跳的方式
            progress_state = {"progress": 35, "message": "MinerU 正在解析..."}
            analysis_done = asyncio.Event()
            analysis_result = {"result": None, "error": None}
            
            def get_progress_message(progress: int) -> str:
                """根据进度值返回消息"""
                if progress < 25:
                    return "MinerU 正在创建解析任务..."
                elif progress < 32:
                    return "MinerU 正在解析 PDF 结构..."
                elif progress < 38:
                    return "MinerU 正在识别文档内容..."
                elif progress < 43:
                    return "MinerU 正在提取文本和图片..."
                elif progress < 48:
                    return "MinerU 正在生成 Markdown..."
                else:
                    return "MinerU 解析即将完成..."
            
            async def progress_callback(stage: str, progress: int):
                """进度回调函数"""
                # 将 10-50 的进度映射到 35-78 的范围
                if progress <= 10:
                    mapped = 35
                elif progress >= 50:
                    mapped = 78
                else:
                    mapped = 35 + int((progress - 10) * 43 / 40)
                
                progress_state["progress"] = mapped
                progress_state["message"] = get_progress_message(progress)
            
            async def run_analysis():
                """后台运行分析"""
                try:
                    result = await service.analyze_pdf(
                        pdf_bytes=pdf_bytes,
                        pdf_url=pdf_url,
                        translate=translate,
                        extract_charts=extract_charts,
                        progress_callback=progress_callback
                    )
                    analysis_result["result"] = result
                except Exception as e:
                    analysis_result["error"] = e
                finally:
                    analysis_done.set()
            
            # 启动后台分析任务
            analysis_task = asyncio.create_task(run_analysis())
            
            # 定期发送进度更新（每3秒）
            last_sent_progress = 35
            heartbeat_count = 0
            
            try:
                while not analysis_done.is_set():
                    # 检查取消
                    if task.is_cancelled() or await request.is_disconnected():
                        analysis_task.cancel()
                        return
                    
                    # 等待一小段时间
                    try:
                        await asyncio.wait_for(analysis_done.wait(), timeout=3.0)
                    except asyncio.TimeoutError:
                        pass
                    
                    # 发送进度更新
                    current_progress = progress_state["progress"]
                    current_message = progress_state["message"]
                    
                    # 如果进度有变化，或者是心跳时间
                    if current_progress > last_sent_progress or heartbeat_count % 2 == 0:
                        if current_progress > last_sent_progress:
                            last_sent_progress = current_progress
                        
                        event = await sse.send_progress("parsing", current_progress, current_message)
                        if event:
                            yield event
                    
                    heartbeat_count += 1
                
            except asyncio.CancelledError:
                analysis_task.cancel()
                task.cancel()
                return
            
            # 确保任务完成
            if not analysis_task.done():
                await analysis_task
            
            # 检查错误
            if analysis_result["error"]:
                raise analysis_result["error"]
            
            result = analysis_result["result"]
            if result is None:
                raise Exception("分析返回空结果")
            
            # 检查取消
            if task.is_cancelled() or await request.is_disconnected():
                return
            
            event = await sse.send_progress("extracting", 82, "正在下载并解压结果...")
            if event:
                yield event
            
            # 处理图表 - 存储到临时缓存
            charts = result.get("charts", [])
            charts_count = len(charts)
            
            if charts_count > 0:
                event = await sse.send_progress("extracting", 88, f"正在处理 {charts_count} 张图片...")
                if event:
                    yield event
            
            for chart in charts:
                chart_id = chart.get("id", "")
                if chart_id:
                    _analysis_results[chart_id] = chart
            
            # 添加图表信息到结果
            result["charts"] = charts
            
            # 论文分析（如果启用）
            paper_analysis_result = None
            if enable_paper_analysis:
                try:
                    if not task.is_cancelled():
                        event = await sse.send_progress("analyzing", 92, "正在使用 AI 分析论文内容...")
                        if event:
                            yield event

                        paper_text = result.get("original_text", "")
                        if paper_text and len(paper_text) > 100:
                            from app.services.paper_service import PaperService
                            
                            llm_service = get_llm_service(api_key=x_api_key)
                            loop = asyncio.get_event_loop()
                            
                            summary_data = await loop.run_in_executor(
                                None, 
                                llm_service.analyze_paper_structured, 
                                paper_text
                            )
                            parsed_summary = PaperService.parse_structured_summary(summary_data["raw_response"])
                            
                            if isinstance(parsed_summary, dict):
                                paper_analysis_result = {
                                    "summary": parsed_summary,
                                    "paperText": paper_text[:10000]
                                }
                except Exception:
                    # 论文分析失败不影响主流程
                    pass
            
            result["paperAnalysis"] = paper_analysis_result
            
            # 检查取消
            if task.is_cancelled() or await request.is_disconnected():
                return
            
            event = await sse.send_progress("analyzing", 98, "准备发送结果...")
            if event:
                yield event
            
            # 使用分块序列化器处理结果
            serialized_data = ChunkedJSONSerializer.serialize_result(result)
            
            # 构建最终结果
            final_result = {
                "status": "complete",
                "progress": 100,
                "message": "分析完成",
                "data": serialized_data
            }
            
            # 安全序列化并发送
            try:
                final_json = ChunkedJSONSerializer.safe_json_dumps(final_result)
                yield f"data: {final_json}\n\n"
            except Exception:
                # 发送简化版本
                simplified_result = {
                    "status": "complete",
                    "progress": 100,
                    "message": "分析完成",
                    "data": {
                        "success": True,
                        "originalText": result.get("original_text", "")[:100000],
                        "translatedText": "",
                        "charts": serialized_data.get("charts", [])[:20],
                        "metadata": {},
                        "paperAnalysis": None
                    }
                }
                yield f"data: {json.dumps(simplified_result, ensure_ascii=False)}\n\n"
            
            # 标记任务完成
            task.status = TaskStatus.COMPLETE
            
        except asyncio.CancelledError:
            task.cancel()
        except Exception as e:
            error_event = await sse.send_error(str(e))
            yield error_event
        finally:
            sse.close()
            # 延迟清理任务（让客户端有时间接收最后的消息）
            asyncio.create_task(_delayed_task_cleanup(task.task_id, 30))
    
    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Task-Id": task.task_id  # 返回任务 ID 供客户端使用
        }
    )


async def _delayed_task_cleanup(task_id: str, delay: float):
    """延迟清理任务"""
    await asyncio.sleep(delay)
    task_manager = get_task_manager()
    task_manager.remove_task(task_id)

@router.post("/cancel/{task_id}")
async def cancel_analysis_task(task_id: str):
    """
    取消分析任务
    """
    task_manager = get_task_manager()
    success = task_manager.cancel_task(task_id)
    
    if success:
        return {"success": True, "message": "任务已取消"}
    else:
        return {"success": False, "message": "任务不存在或已完成"}


@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """
    获取任务状态
    """
    task_manager = get_task_manager()
    task = task_manager.get_task(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    return {
        "task_id": task.task_id,
        "status": task.status.value,
        "progress": task.progress,
        "message": task.message,
        "error": task.error
    }


@router.get("/image/{image_id}")
async def get_chart_image(image_id: str):
    """获取图表图片"""
    chart_data = _analysis_results.get(image_id)
    
    if not chart_data:
        raise HTTPException(status_code=404, detail="图片未找到")
    
    # 返回 base64 图片
    base64_data = chart_data.get("base64")
    if base64_data:
        import base64
        from io import BytesIO
        
        image_bytes = base64.b64decode(base64_data)
        return StreamingResponse(
            BytesIO(image_bytes),
            media_type=f"image/{chart_data.get('format', 'png')}"
        )
    
    # 如果有文件路径
    image_path = chart_data.get("imagePath")
    if image_path and os.path.exists(image_path):
        from fastapi.responses import FileResponse
        return FileResponse(
            image_path,
            media_type=f"image/{chart_data.get('format', 'png')}"
        )
    
    raise HTTPException(status_code=404, detail="图片数据不可用")

@router.post("/analyze-image/{image_id}")
async def analyze_image(
    image_id: str,
    x_api_key: str = Header(None)
):
    """
    分析单张图片
    使用多模态模型生成：分类、摘要、关键数据点
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    chart_data = _analysis_results.get(image_id)
    if not chart_data:
        raise HTTPException(status_code=404, detail="图片未找到")
    
    try:
        from app.services.llm_service import get_llm_service
        
        llm_service = get_llm_service(api_key=x_api_key)
        
        # 获取图片的 base64 数据
        base64_data = chart_data.get("base64", "")
        if not base64_data:
            raise HTTPException(status_code=404, detail="图片数据未找到")
        
        # 构建分析 prompt
        prompt = f"""请分析这张图片并生成结构化摘要。

图片文件名: {chart_data.get('filename', '未知')}

请生成：
1. 分类（如：柱状图、折线图、饼图、表格、流程图、示意图等）
2. 一句话总结（20字以内）
3. 关键数据点提取（3-5个要点，每个10-15字）

必须返回 JSON 格式：
{{
  "category": "分类名称",
  "summary": "一句话总结",
  "keyPoints": ["要点1", "要点2", "要点3"]
}}

只返回 JSON，不要有其他文字。"""
        
        
        # 调用多模态模型
        response = llm_service.chat_with_image(
            message=prompt,
            image_base64=base64_data,
            temperature=0.3,
            max_tokens=1000
        )
        
        
        # 解析 JSON 响应
        import json
        import re
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            # 如果无法解析 JSON，返回默认结构
            analysis = {
                "category": "图表",
                "summary": response[:50] if response else "无法生成摘要",
                "keyPoints": []
            }
        
        
        return {
            "success": True,
            "imageId": image_id,
            "filename": chart_data.get('filename'),
            "analysis": analysis
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"图片分析失败: {str(e)}")

@router.get("/status")
async def get_service_status():
    """检查 MinerU API 配置状态"""
    mineru_key = os.getenv("MINERU_API_KEY", "")
    
    if not mineru_key:
        return {
            "configured": False,
            "message": "未配置 MINERU_API_KEY 环境变量",
            "help": "请在 .env 文件中设置 MINERU_API_KEY",
            "docs": "https://mineru.net/apiManage/docs"
        }
    
    return {
        "configured": True,
        "api_base": "https://mineru.net/api/v4",
        "api_docs": "https://mineru.net/apiManage/docs",
        "message": "MinerU API Key 已配置",
        "key_preview": f"{mineru_key[:20]}...{mineru_key[-10:]}" if len(mineru_key) > 30 else "***"
    }

@router.get("/health")
async def health_check():
    """健康检查"""
    mineru_key = os.getenv("MINERU_API_KEY", "")
    return {
        "status": "healthy",
        "service": "pdf-analyzer",
        "mineru_configured": bool(mineru_key),
        "api_base": "https://mineru.net/api/v4",
        "api_docs": "https://mineru.net/apiManage/docs"
    }
