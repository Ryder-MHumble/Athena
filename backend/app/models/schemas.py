"""
Pydantic 数据模型定义
用于 API 请求和响应的数据验证
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ========== 术语通模块 (Chat) ==========

class ChatMessage(BaseModel):
    """聊天消息模型"""
    role: str = Field(..., description="消息角色: user 或 assistant")
    content: str = Field(..., description="消息内容")


class ChatRequest(BaseModel):
    """聊天请求模型"""
    session_id: str = Field(..., description="会话 ID，用于维护对话历史")
    message: str = Field(..., description="用户输入的消息")
    history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="对话历史（最近 5 轮）"
    )
    thinking_mode: Optional[bool] = Field(
        default=True,
        description="思考模式：True为深入思考，False为快速回复"
    )
    model: Optional[str] = Field(
        default=None,
        description="指定使用的模型ID，如果为空则使用默认模型"
    )
    system_prompt: Optional[str] = Field(
        default=None,
        description="自定义 System Prompt，如果为空则使用默认值"
    )


class ChatResponse(BaseModel):
    """聊天响应模型"""
    message: str = Field(..., description="AI 回复内容")
    session_id: str = Field(..., description="会话 ID")


# ========== 论文伴侣模块 (Paper) ==========

class PaperAnalysisRequest(BaseModel):
    """论文分析请求模型"""
    url: Optional[str] = Field(None, description="Arxiv URL（可选）")
    # file 字段在 FastAPI 中通过 FormData 处理，不在此定义


class PaperSummary(BaseModel):
    """论文结构化摘要（字段名采用 camelCase，便于前端直接使用）"""
    coreProblem: str = Field(..., description="核心痛点")
    previousDilemma: str = Field(..., description="前人困境")
    coreIntuition: str = Field(..., description="核心直觉")
    keySteps: List[str] = Field(..., description="关键步骤")
    innovations: Dict[str, str] = Field(..., description="创新增量")
    boundaries: Dict[str, str] = Field(..., description="批判性边界")
    oneSentence: str = Field(..., description="一言以蔽之")


class PaperQAPair(BaseModel):
    """论文 Q&A 对"""
    question: str = Field(..., description="问题")
    answer: str = Field(..., description="答案")


class PaperAnalysisResponse(BaseModel):
    """论文分析响应模型"""
    summary: PaperSummary = Field(..., description="结构化摘要")
    speech: str = Field(..., description="口语化演讲稿（Markdown 格式）")
    qa: List[PaperQAPair] = Field(..., description="预测问题及答案")
    paper_text: str = Field(..., description="论文文本内容（用于AI解读）")


# ========== 知识沉淀模块 (Knowledge) ==========

class SearchRequest(BaseModel):
    """知识库搜索请求模型"""
    query: str = Field(..., description="搜索查询")
    top_k: int = Field(default=5, ge=1, le=20, description="返回结果数量")


class SearchResult(BaseModel):
    """搜索结果项"""
    content: str = Field(..., description="文档内容片段")
    metadata: Dict[str, Any] = Field(..., description="元数据（来源、页码等）")
    similarity: float = Field(..., description="相似度分数")


class SearchResponse(BaseModel):
    """知识库搜索响应模型"""
    results: List[SearchResult] = Field(..., description="检索到的文档片段")
    answer: str = Field(..., description="基于检索结果的 AI 总结")


class UploadResponse(BaseModel):
    """文档上传响应模型"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="响应消息")
    document_id: Optional[str] = Field(None, description="文档 ID（如果成功）")
    file_url: Optional[str] = Field(None, description="文档存储 URL")


class DocumentItem(BaseModel):
    """文档列表项"""
    id: str = Field(..., description="文档 UUID")
    title: str = Field(..., description="文档标题")
    file_url: str = Field(..., description="存储 URL")
    summary: Optional[str] = Field(None, description="AI 生成的摘要")
    created_at: str = Field(..., description="创建时间戳")


class DocumentListResponse(BaseModel):
    """文档列表响应"""
    success: bool = Field(..., description="是否成功")
    documents: List[DocumentItem] = Field(..., description="文档列表")
    count: int = Field(..., description="文档总数")


class ReportRequest(BaseModel):
    """生成报告请求"""
    document_id: str = Field(..., description="文档 ID")
    content: str = Field(..., description="文档文本内容")


class ReportResponse(BaseModel):
    """报告生成响应"""
    success: bool = Field(..., description="是否成功")
    report: str = Field(..., description="Markdown 格式的结构化报告")

