"""
术语通模块 API 路由
处理多轮对话请求，支持流式和非流式响应
"""

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm_service import get_llm_service
import asyncio
import json

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, x_api_key: str = Header(None)):
    """
    术语通 - 发送消息并获取 AI 回复（非流式，保持向后兼容）
    
    Args:
        request: 聊天请求（包含消息和对话历史）
        x_api_key: API Key（从请求头获取）
    
    Returns:
        AI 回复内容
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        # 获取 LLM 服务实例（使用用户指定的模型）
        llm_service = get_llm_service(api_key=x_api_key, model=request.model)
        
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
            system_prompt=request.system_prompt,  # 使用用户自定义的 system prompt
        )
        
        return ChatResponse(
            message=response_message,
            session_id=request.session_id,
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@router.post("/stream")
async def chat_stream(request: ChatRequest, x_api_key: str = Header(None)):
    """
    术语通 - 流式聊天响应
    使用 Server-Sent Events (SSE) 实时流式传输 AI 回复
    
    Args:
        request: 聊天请求
        x_api_key: API Key
    
    Returns:
        SSE 流式响应
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    async def generate_stream():
        try:
            # 获取 LLM 服务实例（使用用户指定的模型）
            llm_service = get_llm_service(api_key=x_api_key, model=request.model)
            
            # 转换历史消息格式
            history = None
            if request.history:
                history = [
                    {"role": msg.role, "content": msg.content}
                    for msg in request.history
                ]
            
            # 思考模式
            thinking_mode = request.thinking_mode if hasattr(request, 'thinking_mode') else True
            
            # 调用 LLM 的流式方法（如果 LLM 服务支持）
            # 使用 stream_chat 方法来获取流式响应
            stream_response = llm_service.stream_chat(
                message=request.message,
                history=history,
                temperature=0.3 if thinking_mode else 0.9,
                system_prompt=request.system_prompt,  # 使用用户自定义的 system prompt
            )
            
            # 发送流式数据
            for chunk in stream_response:
                # 返回 SSE 格式的数据
                data = {
                    "type": "content",
                    "delta": chunk,
                    "session_id": request.session_id,
                }
                yield f"data: {json.dumps(data)}\n\n"
                await asyncio.sleep(0)  # 让出控制权
            
            # 发送完成信号
            data = {
                "type": "done",
                "session_id": request.session_id,
            }
            yield f"data: {json.dumps(data)}\n\n"
            
        except Exception as e:
            # 发送错误信号
            data = {
                "type": "error",
                "error": str(e),
            }
            yield f"data: {json.dumps(data)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用 nginx 缓冲
        },
    )


