"""
文本翻译 API
使用 LLM 进行快速翻译
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

from app.services.llm_service import get_llm_service


router = APIRouter()


class TranslateRequest(BaseModel):
    """翻译请求"""
    text: str
    source_lang: str = "en"  # 源语言
    target_lang: str = "zh"  # 目标语言
    max_chunk_size: int = 3000  # 单次翻译最大字符数


class TranslateResponse(BaseModel):
    """翻译响应"""
    success: bool
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(
    request: TranslateRequest,
    x_api_key: str = Header(None)
):
    """
    翻译文本
    
    支持大文本分块翻译
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="文本不能为空")
    
    try:
        llm_service = get_llm_service(api_key=x_api_key)
        
        # 如果文本较短，直接翻译
        if len(request.text) <= request.max_chunk_size:
            translated = _translate_chunk(
                llm_service,
                request.text,
                request.source_lang,
                request.target_lang
            )
        else:
            # 分块翻译
            translated = _translate_large_text(
                llm_service,
                request.text,
                request.source_lang,
                request.target_lang,
                request.max_chunk_size
            )
        
        return TranslateResponse(
            success=True,
            original_text=request.text,
            translated_text=translated,
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"翻译失败: {str(e)}")


def _translate_chunk(
    llm_service,
    text: str,
    source_lang: str,
    target_lang: str
) -> str:
    """翻译单个文本块"""
    lang_names = {
        "en": "英语",
        "zh": "中文",
        "ja": "日语",
        "ko": "韩语",
        "fr": "法语",
        "de": "德语",
        "es": "西班牙语"
    }
    
    source_name = lang_names.get(source_lang, source_lang)
    target_name = lang_names.get(target_lang, target_lang)
    
    prompt = f"""请将以下{source_name}文本翻译成{target_name}。

要求：
1. 保持原文的段落结构和格式
2. 保留 Markdown 标记（如 #、**、`等）
3. 数学公式和代码不翻译
4. 专业术语保持准确性
5. 只返回翻译结果，不要有任何解释

原文：
{text}

翻译："""
    
    try:
        translated = llm_service.chat(
            message=prompt,
            temperature=0.3,
            max_tokens=4000
        )
        return translated.strip()
    except Exception as e:
        print(f"[翻译] 调用 LLM 失败: {e}")
        raise Exception(f"翻译失败: {str(e)}")


def _translate_large_text(
    llm_service,
    text: str,
    source_lang: str,
    target_lang: str,
    max_chunk_size: int
) -> str:
    """分块翻译大文本"""
    # 按段落分割
    paragraphs = text.split('\n\n')
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for para in paragraphs:
        if current_length + len(para) > max_chunk_size and current_chunk:
            chunks.append('\n\n'.join(current_chunk))
            current_chunk = [para]
            current_length = len(para)
        else:
            current_chunk.append(para)
            current_length += len(para)
    
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))
    
    # 逐块翻译
    translated_chunks = []
    for i, chunk in enumerate(chunks):
        print(f"[翻译] 正在翻译第 {i+1}/{len(chunks)} 块...")
        translated = _translate_chunk(
            llm_service,
            chunk,
            source_lang,
            target_lang
        )
        translated_chunks.append(translated)
    
    return '\n\n'.join(translated_chunks)

