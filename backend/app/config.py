"""
应用配置管理
使用 Pydantic Settings 管理环境变量
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """应用配置类"""
    
    # API 配置
    SILICONFLOW_API_KEY: str = ""
    TEAM_ACCESS_KEY: str = ""  # 团队共享知识库的访问密钥
    MINERU_API_KEY: str = ""  # MinerU 云 API Key (OpenXLab)
    
    # Supabase 配置
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    
    # CORS 配置
    # 支持多个域名，用逗号分隔
    # 生产环境需要添加实际的 Vercel 域名，例如：https://your-app.vercel.app
    CORS_ORIGINS: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """解析 CORS_ORIGINS 字符串为列表，支持通配符匹配 Vercel 域名"""
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        # 如果包含通配符模式，需要手动添加具体域名
        # 注意：FastAPI CORS 不支持通配符，需要在环境变量中明确指定所有允许的域名
        return origins
    
    # 文件上传配置
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # LLM 配置
    # 默认主模型（用于术语通等需要高质量推理的场景）
    LLM_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    # 小模型（用于论文分析等追求速度的场景）
    LLM_MODEL_SMALL: str = "Qwen/Qwen2.5-7B-Instruct"
    # 多模态模型（用于图片分析）
    VISION_MODEL: str = "Qwen/Qwen3-VL-8B-Instruct"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    TEMPERATURE: float = 0.7
    MAX_TOKENS: int = 2000
    # LLM 请求超时时间（秒）
    LLM_REQUEST_TIMEOUT: float = 180.0  # 3分钟

    # 钉钉机器人配置
    DINGTALK_WEBHOOK_URL: str = ""
    DINGTALK_SECRET: str = ""

    # 报告配置
    REPORT_BASE_URL: str = ""  # 报告访问的基础 URL
    REPORT_DEFAULT_HOURS: int = 24  # 默认报告时间窗口（小时）
    REPORT_DEFAULT_TOP_N: int = 10  # 默认 Top N 推文数量
    AUTO_SEND_REPORT_AFTER_CRAWL: bool = False  # 爬虫完成后自动发送报告

    # 定时日报配置
    ENABLE_AUTO_REPORT: bool = False  # 是否启用自动日报生成
    REPORT_SCHEDULE_TIME: str = "09:00"  # 日报生成时间（格式：HH:MM，24小时制）
    REPORT_TIMEZONE: str = "Asia/Shanghai"  # 时区设置
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = 'ignore'  # 忽略不在模型中定义的额外环境变量


# 全局配置实例
settings = Settings()

