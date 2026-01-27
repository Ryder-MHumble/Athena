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
    
    # Supabase 配置
    SUPABASE_URL: str = "https://casxuvpohhbuqvmkqunb.supabase.co"
    SUPABASE_KEY: str = "sb_publishable_pMJU4jEnsjfOnbAqJu5u-Q_PTAeytLh"
    SUPABASE_SECRET_KEY: str = "sb_secret_UtBZnpg_hhEgF_E5zvfLHg_fTaZYVe1"
    
    # CORS 配置
    CORS_ORIGINS: str = "http://localhost:3000,https://*.vercel.app"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """解析 CORS_ORIGINS 字符串为列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # 文件上传配置
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # LLM 配置
    # 默认主模型（用于术语通等需要高质量推理的场景）
    LLM_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    # 小模型（用于论文分析等追求速度的场景）
    LLM_MODEL_SMALL: str = "Qwen/Qwen2.5-7B-Instruct"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    TEMPERATURE: float = 0.7
    MAX_TOKENS: int = 2000
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = 'ignore'  # 忽略不在模型中定义的额外环境变量


# 全局配置实例
settings = Settings()

