"""
PDF 分析任务管理器
统一管理 MinerU API 调用的任务生命周期，解决以下问题：
1. 任务状态跟踪与同步
2. 取消任务机制
3. 资源清理
4. 超时处理
5. 并发控制
"""

import asyncio
import uuid
import time
from enum import Enum
from typing import Dict, Any, Optional, Callable, AsyncGenerator
from dataclasses import dataclass, field
from contextlib import asynccontextmanager
import traceback


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"           # 等待开始
    UPLOADING = "uploading"       # 上传中
    PARSING = "parsing"           # 解析中
    PROCESSING = "processing"     # 处理中
    EXTRACTING = "extracting"     # 提取中
    ANALYZING = "analyzing"       # 分析中
    COMPLETE = "complete"         # 完成
    ERROR = "error"               # 错误
    CANCELLED = "cancelled"       # 已取消


@dataclass
class TaskProgress:
    """任务进度"""
    status: TaskStatus
    progress: int  # 0-100
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@dataclass
class AnalysisTask:
    """分析任务"""
    task_id: str
    created_at: float
    status: TaskStatus = TaskStatus.PENDING
    progress: int = 0
    message: str = ""
    cancelled: bool = False
    mineru_task_id: Optional[str] = None  # MinerU API 返回的任务 ID
    mineru_batch_id: Optional[str] = None  # MinerU API 返回的批次 ID
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    
    # 用于取消的事件
    _cancel_event: asyncio.Event = field(default_factory=asyncio.Event)
    
    def cancel(self):
        """取消任务"""
        self.cancelled = True
        self.status = TaskStatus.CANCELLED
        self._cancel_event.set()
    
    def is_cancelled(self) -> bool:
        """检查是否已取消"""
        return self.cancelled or self._cancel_event.is_set()
    
    async def wait_if_cancelled(self, timeout: float = 0) -> bool:
        """等待取消事件，返回是否被取消"""
        try:
            await asyncio.wait_for(self._cancel_event.wait(), timeout=timeout)
            return True
        except asyncio.TimeoutError:
            return False


class TaskManager:
    """
    任务管理器 - 单例模式
    
    功能：
    1. 创建和跟踪分析任务
    2. 提供取消机制
    3. 清理过期任务
    4. 限制并发数量
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._tasks: Dict[str, AnalysisTask] = {}
        self._max_concurrent = 5  # 最大并发任务数
        self._task_timeout = 600  # 任务超时时间（秒）
        self._cleanup_interval = 60  # 清理间隔（秒）
        self._initialized = True
        
        # 启动清理任务
        asyncio.create_task(self._cleanup_loop())
    
    def create_task(self) -> AnalysisTask:
        """创建新任务"""
        task_id = str(uuid.uuid4())[:12]
        task = AnalysisTask(
            task_id=task_id,
            created_at=time.time()
        )
        self._tasks[task_id] = task
        return task
    
    def get_task(self, task_id: str) -> Optional[AnalysisTask]:
        """获取任务"""
        return self._tasks.get(task_id)
    
    def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        task = self._tasks.get(task_id)
        if task:
            task.cancel()
            return True
        return False
    
    def cancel_all_tasks(self):
        """取消所有任务"""
        for task in self._tasks.values():
            if task.status not in [TaskStatus.COMPLETE, TaskStatus.ERROR, TaskStatus.CANCELLED]:
                task.cancel()
    
    def update_task(
        self, 
        task_id: str, 
        status: Optional[TaskStatus] = None,
        progress: Optional[int] = None,
        message: Optional[str] = None,
        mineru_task_id: Optional[str] = None,
        mineru_batch_id: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        """更新任务状态"""
        task = self._tasks.get(task_id)
        if not task:
            return
        
        if status is not None:
            task.status = status
        if progress is not None:
            task.progress = progress
        if message is not None:
            task.message = message
        if mineru_task_id is not None:
            task.mineru_task_id = mineru_task_id
        if mineru_batch_id is not None:
            task.mineru_batch_id = mineru_batch_id
        if result is not None:
            task.result = result
        if error is not None:
            task.error = error
    
    def remove_task(self, task_id: str):
        """移除任务"""
        if task_id in self._tasks:
            del self._tasks[task_id]
    
    def get_active_tasks_count(self) -> int:
        """获取活跃任务数"""
        return sum(
            1 for task in self._tasks.values()
            if task.status not in [TaskStatus.COMPLETE, TaskStatus.ERROR, TaskStatus.CANCELLED]
        )
    
    async def _cleanup_loop(self):
        """定期清理过期任务"""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval)
                current_time = time.time()
                
                # 收集过期任务
                expired_tasks = [
                    task_id for task_id, task in self._tasks.items()
                    if current_time - task.created_at > self._task_timeout * 2  # 超时2倍后清理
                ]
                
                # 移除过期任务
                for task_id in expired_tasks:
                    self.remove_task(task_id)
                
            except Exception as e:
                print(f"[TaskManager] 清理任务失败: {e}")
    
    @asynccontextmanager
    async def run_task(self, task_id: str):
        """
        任务运行上下文管理器
        自动处理异常和状态更新
        """
        task = self.get_task(task_id)
        if not task:
            raise ValueError(f"任务不存在: {task_id}")
        
        try:
            yield task
        except asyncio.CancelledError:
            task.cancel()
            raise
        except Exception as e:
            task.status = TaskStatus.ERROR
            task.error = str(e)
            raise


# 全局任务管理器实例
_task_manager: Optional[TaskManager] = None


def get_task_manager() -> TaskManager:
    """获取任务管理器实例"""
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager()
    return _task_manager


class SSEEventGenerator:
    """
    SSE 事件生成器
    统一管理 SSE 事件的生成和发送
    """
    
    def __init__(self, task: AnalysisTask):
        self.task = task
        self._closed = False
    
    def _format_event(self, status: str, progress: int, message: str, data: Optional[Dict] = None) -> str:
        """格式化 SSE 事件"""
        import json
        event = {
            "status": status,
            "progress": progress,
            "message": message
        }
        if data:
            event["data"] = data
        return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
    
    async def send_progress(self, status: str, progress: int, message: str) -> Optional[str]:
        """发送进度事件"""
        if self._closed or self.task.is_cancelled():
            return None
        
        # 更新任务状态
        self.task.status = TaskStatus(status) if status in [s.value for s in TaskStatus] else TaskStatus.PROCESSING
        self.task.progress = progress
        self.task.message = message
        
        return self._format_event(status, progress, message)
    
    async def send_complete(self, data: Dict[str, Any]) -> Optional[str]:
        """发送完成事件"""
        if self._closed or self.task.is_cancelled():
            return None
        
        self.task.status = TaskStatus.COMPLETE
        self.task.progress = 100
        self.task.result = data
        
        return self._format_event("complete", 100, "分析完成", data)
    
    async def send_error(self, error: str) -> str:
        """发送错误事件"""
        self.task.status = TaskStatus.ERROR
        self.task.error = error
        return self._format_event("error", 0, error)
    
    def close(self):
        """关闭生成器"""
        self._closed = True


async def cancellable_sleep(seconds: float, task: AnalysisTask) -> bool:
    """
    可取消的睡眠
    返回 True 表示正常完成，False 表示被取消
    """
    try:
        # 使用较小的间隔检查取消状态
        interval = min(0.5, seconds)
        elapsed = 0
        
        while elapsed < seconds:
            if task.is_cancelled():
                return False
            await asyncio.sleep(interval)
            elapsed += interval
        
        return True
    except asyncio.CancelledError:
        return False


async def poll_with_cancel(
    poll_func: Callable,
    task: AnalysisTask,
    max_attempts: int = 120,
    interval: float = 5.0,
    progress_callback: Optional[Callable[[int], None]] = None
) -> Optional[Dict[str, Any]]:
    """
    可取消的轮询
    
    Args:
        poll_func: 轮询函数，返回 (is_done, result_or_none)
        task: 任务对象
        max_attempts: 最大尝试次数
        interval: 轮询间隔（秒）
        progress_callback: 进度回调
    
    Returns:
        轮询结果，如果被取消则返回 None
    """
    for attempt in range(max_attempts):
        # 检查取消
        if task.is_cancelled():
            return None
        
        try:
            is_done, result = await poll_func(attempt)
            
            if is_done:
                return result
            
            # 更新进度
            if progress_callback:
                progress_callback(attempt)
            
        except Exception as e:
            # 检查是否是致命错误
            error_msg = str(e)
            if "失败" in error_msg or "错误" in error_msg:
                raise
            # 其他错误继续重试
        
        # 可取消的睡眠
        if not await cancellable_sleep(interval, task):
            return None
    
    raise TimeoutError("轮询超时")


class ChunkedJSONSerializer:
    """
    分块 JSON 序列化器
    用于处理大型响应，避免内存问题
    """
    
    MAX_TEXT_SIZE = 2 * 1024 * 1024  # 2MB
    MAX_CHARTS = 100
    
    @classmethod
    def serialize_result(cls, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        序列化结果，自动处理大型数据
        """
        import json
        
        # 处理文本
        original_text = result.get("original_text", "")
        translated_text = result.get("translated_text", "")
        
        if len(original_text) > cls.MAX_TEXT_SIZE:
            original_text = original_text[:cls.MAX_TEXT_SIZE] + "\n\n[文本过长，已截断...]"
        
        if len(translated_text) > cls.MAX_TEXT_SIZE:
            translated_text = translated_text[:cls.MAX_TEXT_SIZE] + "\n\n[文本过长，已截断...]"
        
        # 处理图表
        charts = result.get("charts", [])
        if len(charts) > cls.MAX_CHARTS:
            charts = charts[:cls.MAX_CHARTS]
        
        # 处理图表中的 base64 数据（不在 SSE 中发送）
        charts_response = []
        for chart in charts:
            chart_data = {
                "id": chart.get("id", ""),
                "type": chart.get("type", "other"),
                "pageNumber": chart.get("pageNumber", 0),
                "imageUrl": f"/api/pdf-analyzer/image/{chart.get('id', '')}",
                "title": chart.get("title", ""),
                "summary": chart.get("summary", ""),
                "keyPoints": chart.get("keyPoints", []),
                "category": chart.get("category"),
                "filename": chart.get("filename", "")
            }
            charts_response.append(chart_data)
        
        return {
            "success": True,
            "originalText": original_text,
            "translatedText": translated_text,
            "charts": charts_response,
            "metadata": result.get("metadata", {}),
            "paperAnalysis": result.get("paperAnalysis")
        }
    
    @classmethod
    def safe_json_dumps(cls, data: Dict[str, Any]) -> str:
        """安全的 JSON 序列化"""
        import json
        
        try:
            return json.dumps(data, ensure_ascii=False)
        except Exception as e:
            # 尝试简化数据
            simplified = {
                "success": True,
                "originalText": str(data.get("originalText", ""))[:100000],
                "translatedText": "",
                "charts": data.get("charts", [])[:20],
                "metadata": {},
                "paperAnalysis": None
            }
            return json.dumps(simplified, ensure_ascii=False)

