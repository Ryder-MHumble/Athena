"""
Athena Backend - FastAPI 主应用
提供 AI 战略分析师工作台的后端 API 服务
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import chat, paper, knowledge

# 创建 FastAPI 应用实例
app = FastAPI(
    title="Athena API",
    description="AI 战略分析师智能工作台后端 API",
    version="0.1.0",
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


@app.get("/")
async def root():
    """健康检查端点"""
    return {"message": "Athena API is running", "version": "0.1.0"}


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}

