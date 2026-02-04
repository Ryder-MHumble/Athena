"""
弹性工具模块 - 提供重试、熔断、超时等功能
确保线上环境的稳定性
"""

import asyncio
import functools
import logging
import time
from typing import TypeVar, Callable, Any, Optional, Type, Tuple
from enum import Enum

# 配置日志
logger = logging.getLogger("athena.resilience")

T = TypeVar('T')


class CircuitState(Enum):
    """熔断器状态"""
    CLOSED = "closed"      # 正常
    OPEN = "open"          # 熔断
    HALF_OPEN = "half_open"  # 半开（尝试恢复）


class CircuitBreaker:
    """
    熔断器 - 防止连续失败导致资源耗尽
    
    使用示例:
        breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)
        
        async with breaker:
            await some_risky_operation()
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        name: str = "default"
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.name = name
        
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: Optional[float] = None
        self._lock = asyncio.Lock()
    
    @property
    def state(self) -> CircuitState:
        return self._state
    
    async def __aenter__(self):
        async with self._lock:
            if self._state == CircuitState.OPEN:
                # 检查是否可以尝试恢复
                if self._last_failure_time and (time.time() - self._last_failure_time) > self.recovery_timeout:
                    self._state = CircuitState.HALF_OPEN
                    logger.info(f"[CircuitBreaker:{self.name}] 进入半开状态，尝试恢复")
                else:
                    raise CircuitBreakerOpenError(f"熔断器 {self.name} 处于开启状态，请稍后重试")
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        async with self._lock:
            if exc_type is None:
                # 成功
                if self._state == CircuitState.HALF_OPEN:
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    logger.info(f"[CircuitBreaker:{self.name}] 恢复正常")
                elif self._state == CircuitState.CLOSED:
                    self._failure_count = 0
            else:
                # 失败
                self._failure_count += 1
                self._last_failure_time = time.time()
                
                if self._failure_count >= self.failure_threshold:
                    self._state = CircuitState.OPEN
                    logger.warning(f"[CircuitBreaker:{self.name}] 熔断器开启，失败次数: {self._failure_count}")
        
        return False  # 不吞掉异常


class CircuitBreakerOpenError(Exception):
    """熔断器开启异常"""
    pass


def retry_async(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    on_retry: Optional[Callable[[Exception, int], None]] = None
):
    """
    异步重试装饰器
    
    Args:
        max_retries: 最大重试次数
        delay: 初始延迟（秒）
        backoff: 退避倍数
        exceptions: 需要重试的异常类型
        on_retry: 重试时的回调函数
    
    使用示例:
        @retry_async(max_retries=3, delay=1.0, backoff=2.0)
        async def fetch_data():
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt < max_retries:
                        if on_retry:
                            on_retry(e, attempt + 1)
                        
                        logger.warning(
                            f"[Retry] {func.__name__} 失败 (尝试 {attempt + 1}/{max_retries + 1}): {e}"
                        )
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(
                            f"[Retry] {func.__name__} 最终失败，已重试 {max_retries} 次: {e}"
                        )
            
            raise last_exception
        
        return wrapper
    return decorator


def timeout_async(seconds: float):
    """
    异步超时装饰器
    
    Args:
        seconds: 超时时间（秒）
    
    使用示例:
        @timeout_async(30.0)
        async def slow_operation():
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError:
                logger.error(f"[Timeout] {func.__name__} 超时 ({seconds}s)")
                raise TimeoutError(f"操作超时（{seconds}秒）")
        
        return wrapper
    return decorator


class RateLimiter:
    """
    速率限制器 - 防止 API 调用过于频繁
    
    使用示例:
        limiter = RateLimiter(calls_per_second=10)
        
        async with limiter:
            await api_call()
    """
    
    def __init__(self, calls_per_second: float = 10.0):
        self.min_interval = 1.0 / calls_per_second
        self._last_call_time = 0.0
        self._lock = asyncio.Lock()
    
    async def __aenter__(self):
        async with self._lock:
            now = time.time()
            elapsed = now - self._last_call_time
            
            if elapsed < self.min_interval:
                await asyncio.sleep(self.min_interval - elapsed)
            
            self._last_call_time = time.time()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False


class HealthChecker:
    """
    健康检查器 - 跟踪服务健康状态
    """
    
    def __init__(self, name: str):
        self.name = name
        self._healthy = True
        self._last_check_time: Optional[float] = None
        self._last_error: Optional[str] = None
        self._consecutive_failures = 0
        self._total_checks = 0
        self._successful_checks = 0
    
    def record_success(self):
        """记录成功"""
        self._healthy = True
        self._last_check_time = time.time()
        self._consecutive_failures = 0
        self._total_checks += 1
        self._successful_checks += 1
    
    def record_failure(self, error: str):
        """记录失败"""
        self._last_check_time = time.time()
        self._last_error = error
        self._consecutive_failures += 1
        self._total_checks += 1
        
        if self._consecutive_failures >= 3:
            self._healthy = False
    
    @property
    def is_healthy(self) -> bool:
        return self._healthy
    
    @property
    def success_rate(self) -> float:
        if self._total_checks == 0:
            return 1.0
        return self._successful_checks / self._total_checks
    
    def get_status(self) -> dict:
        """获取状态信息"""
        return {
            "name": self.name,
            "healthy": self._healthy,
            "last_check": self._last_check_time,
            "last_error": self._last_error,
            "consecutive_failures": self._consecutive_failures,
            "success_rate": f"{self.success_rate * 100:.1f}%"
        }


# 全局健康检查器实例
_health_checkers: dict[str, HealthChecker] = {}


def get_health_checker(name: str) -> HealthChecker:
    """获取或创建健康检查器"""
    if name not in _health_checkers:
        _health_checkers[name] = HealthChecker(name)
    return _health_checkers[name]


def get_all_health_status() -> dict:
    """获取所有服务的健康状态"""
    return {
        name: checker.get_status()
        for name, checker in _health_checkers.items()
    }


# 预创建常用服务的健康检查器
MINERU_HEALTH = get_health_checker("mineru")
CRAWLER_HEALTH = get_health_checker("crawler")
LLM_HEALTH = get_health_checker("llm")

