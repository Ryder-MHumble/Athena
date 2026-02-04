"""
API 文档端点
提供系统所有 API 的文档信息

自动生成 API 文档供前端展示 - v1.0
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

router = APIRouter(prefix="/docs", tags=["API Documentation"])


class APIParameter(BaseModel):
    """API 参数"""
    name: str
    type: str
    required: bool
    description: str
    default: Optional[str] = None


class APIEndpoint(BaseModel):
    """API 端点"""
    method: str
    path: str
    name: str
    description: str
    category: str
    parameters: List[APIParameter] = []
    request_body: Optional[Dict[str, Any]] = None
    response_example: Optional[Dict[str, Any]] = None
    curl_example: str
    notes: Optional[str] = None


class APICategory(BaseModel):
    """API 分类"""
    id: str
    name: str
    description: str
    icon: str
    endpoints: List[APIEndpoint]


# API 文档数据
API_DOCUMENTATION: List[APICategory] = [
    APICategory(
        id="pdf-analyzer",
        name="PDF 智析",
        description="PDF 文档解析、翻译和图表提取服务",
        icon="FileSearch",
        endpoints=[
            APIEndpoint(
                method="POST",
                path="/api/pdf-analyzer/analyze/stream",
                name="流式分析 PDF",
                description="上传 PDF 文件或提供 URL，返回 SSE 事件流，实时显示解析进度",
                category="pdf-analyzer",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                    APIParameter(name="X-MinerU-API-Key", type="header", required=True, description="MinerU API Key"),
                    APIParameter(name="file", type="file", required=False, description="PDF 文件（与 url 二选一）"),
                    APIParameter(name="url", type="string", required=False, description="PDF 文件 URL（与 file 二选一）"),
                    APIParameter(name="translate", type="boolean", required=False, description="是否翻译", default="false"),
                    APIParameter(name="extract_charts", type="boolean", required=False, description="是否提取图表", default="true"),
                ],
                response_example={
                    "status": "complete",
                    "progress": 100,
                    "message": "分析完成",
                    "data": {
                        "success": True,
                        "originalText": "提取的原文...",
                        "translatedText": "翻译后的文本...",
                        "charts": [{"id": "img_1", "type": "diagram", "imageUrl": "/api/pdf-analyzer/image/img_1"}],
                        "metadata": {"pages": 10, "title": "文档标题"}
                    }
                },
                curl_example='''curl -X POST "https://athena-backend-lh6o.onrender.com/api/pdf-analyzer/analyze/stream" \\
  -H "X-API-Key: your-api-key" \\
  -H "X-MinerU-API-Key: your-mineru-key" \\
  -F "file=@document.pdf" \\
  -F "translate=false" \\
  -F "extract_charts=true"''',
                notes="返回 SSE 事件流，需要使用 EventSource 或流式读取处理"
            ),
            APIEndpoint(
                method="GET",
                path="/api/pdf-analyzer/image/{image_id}",
                name="获取图表图片",
                description="获取解析出的图表/图片",
                category="pdf-analyzer",
                parameters=[
                    APIParameter(name="image_id", type="path", required=True, description="图片 ID"),
                ],
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/api/pdf-analyzer/image/img_123"''',
            ),
            APIEndpoint(
                method="GET",
                path="/api/pdf-analyzer/status",
                name="服务状态",
                description="检查 MinerU API 配置状态",
                category="pdf-analyzer",
                response_example={"configured": True, "has_api_key": True},
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/api/pdf-analyzer/status"''',
            ),
        ]
    ),
    APICategory(
        id="crawler",
        name="数据爬虫",
        description="Twitter/X 和 YouTube 信源爬取服务",
        icon="Database",
        endpoints=[
            APIEndpoint(
                method="POST",
                path="/api/crawler/crawl/all",
                name="爬取所有信源",
                description="爬取所有配置的 Twitter 和 YouTube 信源",
                category="crawler",
                parameters=[
                    APIParameter(name="async_mode", type="query", required=False, description="是否异步执行", default="false"),
                ],
                response_example={
                    "success": True,
                    "message": "爬取完成",
                    "data": {
                        "twitter": {"total_posts": 50},
                        "youtube": {"total_videos": 30}
                    }
                },
                curl_example='''curl -X POST "https://athena-backend-lh6o.onrender.com/api/crawler/crawl/all"''',
            ),
            APIEndpoint(
                method="POST",
                path="/api/crawler/crawl/twitter",
                name="爬取 Twitter",
                description="爬取所有 Twitter/X 信源",
                category="crawler",
                curl_example='''curl -X POST "https://athena-backend-lh6o.onrender.com/api/crawler/crawl/twitter"''',
            ),
            APIEndpoint(
                method="POST",
                path="/api/crawler/crawl/youtube",
                name="爬取 YouTube",
                description="爬取所有 YouTube 频道",
                category="crawler",
                curl_example='''curl -X POST "https://athena-backend-lh6o.onrender.com/api/crawler/crawl/youtube"''',
            ),
            APIEndpoint(
                method="GET",
                path="/api/crawler/sources",
                name="获取信源列表",
                description="获取所有配置的信源",
                category="crawler",
                response_example={
                    "success": True,
                    "sources": {
                        "twitter": [{"name": "OpenAI", "handle": "OpenAI"}],
                        "youtube": [{"name": "Tech Channel", "channel_id": "UC..."}]
                    }
                },
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/api/crawler/sources"''',
            ),
            APIEndpoint(
                method="POST",
                path="/api/crawler/sources",
                name="添加信源",
                description="添加新的 Twitter 或 YouTube 信源",
                category="crawler",
                request_body={
                    "platform": "twitter",
                    "name": "OpenAI",
                    "handle": "OpenAI"
                },
                curl_example="""curl -X POST "https://athena-backend-lh6o.onrender.com/api/crawler/sources" \\
  -H "Content-Type: application/json" \\
  -d '{"platform": "twitter", "name": "OpenAI", "handle": "OpenAI"}'""",
            ),
            APIEndpoint(
                method="DELETE",
                path="/api/crawler/sources",
                name="删除信源",
                description="删除指定的信源",
                category="crawler",
                request_body={
                    "platform": "twitter",
                    "name": "OpenAI"
                },
                curl_example="""curl -X DELETE "https://athena-backend-lh6o.onrender.com/api/crawler/sources" \\
  -H "Content-Type: application/json" \\
  -d '{"platform": "twitter", "name": "OpenAI"}'""",
            ),
            APIEndpoint(
                method="GET",
                path="/api/crawler/data/twitter",
                name="获取 Twitter 数据",
                description="获取已爬取的 Twitter 帖子数据",
                category="crawler",
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/api/crawler/data/twitter"''',
            ),
            APIEndpoint(
                method="GET",
                path="/api/crawler/data/youtube",
                name="获取 YouTube 数据",
                description="获取已爬取的 YouTube 视频数据",
                category="crawler",
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/api/crawler/data/youtube"''',
            ),
        ]
    ),
    APICategory(
        id="translate",
        name="翻译服务",
        description="文本翻译 API",
        icon="Languages",
        endpoints=[
            APIEndpoint(
                method="POST",
                path="/api/translate",
                name="翻译文本",
                description="将文本从源语言翻译为目标语言",
                category="translate",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                ],
                request_body={
                    "text": "Hello, world!",
                    "source_lang": "en",
                    "target_lang": "zh",
                    "max_chunk_size": 3000
                },
                response_example={
                    "success": True,
                    "translated_text": "你好，世界！",
                    "source_lang": "en",
                    "target_lang": "zh"
                },
                curl_example="""curl -X POST "https://athena-backend-lh6o.onrender.com/api/translate" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"text": "Hello, world!", "source_lang": "en", "target_lang": "zh"}'""",
            ),
        ]
    ),
    APICategory(
        id="chat",
        name="AI 对话",
        description="AI 聊天和术语解释服务",
        icon="MessageSquare",
        endpoints=[
            APIEndpoint(
                method="POST",
                path="/api/chat/",
                name="AI 对话",
                description="发送消息给 AI 助手，获取回复",
                category="chat",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                ],
                request_body={
                    "message": "什么是机器学习？",
                    "system_prompt": "你是一个 AI 助手",
                    "model": "Qwen/Qwen2.5-7B-Instruct"
                },
                response_example={
                    "success": True,
                    "content": "机器学习是人工智能的一个分支..."
                },
                curl_example="""curl -X POST "https://athena-backend-lh6o.onrender.com/api/chat/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"message": "什么是机器学习？"}'""",
            ),
            APIEndpoint(
                method="POST",
                path="/api/chat/stream",
                name="流式 AI 对话",
                description="发送消息给 AI 助手，流式返回回复",
                category="chat",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                ],
                request_body={
                    "message": "详细解释深度学习",
                    "stream": True
                },
                curl_example="""curl -X POST "https://athena-backend-lh6o.onrender.com/api/chat/stream" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"message": "详细解释深度学习"}'""",
                notes="返回 SSE 事件流"
            ),
        ]
    ),
    APICategory(
        id="knowledge",
        name="知识库",
        description="文档上传和知识库检索服务",
        icon="Brain",
        endpoints=[
            APIEndpoint(
                method="POST",
                path="/api/knowledge/upload",
                name="上传文档",
                description="上传文档到知识库",
                category="knowledge",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                    APIParameter(name="file", type="file", required=True, description="文档文件"),
                    APIParameter(name="team_key", type="form", required=False, description="团队 Key", default="default"),
                ],
                curl_example='''curl -X POST "https://athena-backend-lh6o.onrender.com/api/knowledge/upload" \\
  -H "X-API-Key: your-api-key" \\
  -F "file=@document.pdf" \\
  -F "team_key=my-team"''',
            ),
            APIEndpoint(
                method="GET",
                path="/api/knowledge/documents",
                name="获取文档列表",
                description="获取知识库中的文档列表",
                category="knowledge",
                parameters=[
                    APIParameter(name="team_key", type="query", required=False, description="团队 Key"),
                ],
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/api/knowledge/documents?team_key=my-team"''',
            ),
            APIEndpoint(
                method="POST",
                path="/api/knowledge/analyze",
                name="分析文档",
                description="对文档进行 AI 分析",
                category="knowledge",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                ],
                request_body={
                    "document_id": "doc_123",
                    "analysis_type": "summary"
                },
                curl_example="""curl -X POST "https://athena-backend-lh6o.onrender.com/api/knowledge/analyze" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"document_id": "doc_123", "analysis_type": "summary"}'""",
            ),
        ]
    ),
    APICategory(
        id="paper",
        name="论文分析",
        description="学术论文解析和分析服务",
        icon="FileText",
        endpoints=[
            APIEndpoint(
                method="POST",
                path="/api/paper/analyze",
                name="分析论文",
                description="上传论文进行 AI 分析",
                category="paper",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                    APIParameter(name="file", type="file", required=False, description="论文 PDF 文件"),
                    APIParameter(name="paper_text", type="form", required=False, description="论文文本（与 file 二选一）"),
                ],
                curl_example='''curl -X POST "https://athena-backend-lh6o.onrender.com/api/paper/analyze" \\
  -H "X-API-Key: your-api-key" \\
  -F "file=@paper.pdf"''',
            ),
            APIEndpoint(
                method="POST",
                path="/api/paper/generate-speech",
                name="生成论文讲稿",
                description="根据论文内容生成讲解稿",
                category="paper",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                ],
                request_body={
                    "paper_text": "论文内容..."
                },
                curl_example="""curl -X POST "https://athena-backend-lh6o.onrender.com/api/paper/generate-speech" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"paper_text": "论文内容..."}'""",
            ),
            APIEndpoint(
                method="POST",
                path="/api/paper/chat",
                name="与论文对话",
                description="基于论文内容进行问答",
                category="paper",
                parameters=[
                    APIParameter(name="X-API-Key", type="header", required=True, description="SiliconFlow API Key"),
                ],
                request_body={
                    "question": "这篇论文的主要贡献是什么？",
                    "paper_text": "论文内容...",
                    "chat_history": []
                },
                curl_example="""curl -X POST "https://athena-backend-lh6o.onrender.com/api/paper/chat" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"question": "主要贡献是什么？", "paper_text": "论文内容..."}'""",
            ),
        ]
    ),
    APICategory(
        id="system",
        name="系统",
        description="系统健康检查和状态监控",
        icon="Activity",
        endpoints=[
            APIEndpoint(
                method="GET",
                path="/",
                name="API 状态",
                description="获取 API 运行状态",
                category="system",
                response_example={
                    "message": "Athena API is running",
                    "version": "0.1.0",
                    "auto_crawl": True,
                    "crawl_interval_hours": 3
                },
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/"''',
            ),
            APIEndpoint(
                method="GET",
                path="/health",
                name="健康检查",
                description="服务健康检查",
                category="system",
                response_example={"status": "healthy"},
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/health"''',
            ),
            APIEndpoint(
                method="GET",
                path="/api/system/health/all",
                name="全面健康检查",
                description="获取所有服务的健康状态",
                category="system",
                response_example={
                    "overall": "healthy",
                    "services": {
                        "mineru": {"healthy": True, "success_rate": "100.0%"},
                        "crawler": {"healthy": True, "success_rate": "95.0%"}
                    }
                },
                curl_example='''curl "https://athena-backend-lh6o.onrender.com/api/system/health/all"''',
            ),
        ]
    ),
]


@router.get("/api-list")
async def get_api_documentation():
    """获取所有 API 文档"""
    return {
        "success": True,
        "base_url": os.getenv("API_BASE_URL", "https://athena-backend-lh6o.onrender.com"),
        "categories": [cat.model_dump() for cat in API_DOCUMENTATION]
    }


@router.get("/category/{category_id}")
async def get_category_documentation(category_id: str):
    """获取指定分类的 API 文档"""
    for cat in API_DOCUMENTATION:
        if cat.id == category_id:
            return {
                "success": True,
                "category": cat.model_dump()
            }
    
    return {
        "success": False,
        "message": f"分类 {category_id} 不存在"
    }

