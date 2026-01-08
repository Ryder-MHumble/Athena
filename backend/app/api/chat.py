"""
术语通模块 API 路由
处理多轮对话请求
"""

from fastapi import APIRouter, Header, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm_service import get_llm_service

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, x_api_key: str = Header(None)):
    """
    术语通 - 发送消息并获取 AI 回复
    
    Args:
        request: 聊天请求（包含消息和对话历史）
        x_api_key: API Key（从请求头获取）
    
    Returns:
        AI 回复内容
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        # 获取 LLM 服务实例
        llm_service = get_llm_service(api_key=x_api_key)
        
        # 转换历史消息格式
        history = None
        if request.history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.history
            ]
        
        # 调用 LLM 生成回复
        # 思考模式：调整temperature（思考模式用低temperature，快速模式用高temperature）
        thinking_mode = request.thinking_mode if hasattr(request, 'thinking_mode') else True
        response_message = llm_service.chat(
            message=request.message,
            history=history,
            temperature=0.3 if thinking_mode else 0.9,  # 思考模式：0.3，快速模式：0.9
        )
        
        return ChatResponse(
            message=response_message,
            session_id=request.session_id,
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

