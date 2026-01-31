"""
论文伴侣模块 API 路由
处理论文上传和分析请求
"""

from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Body
from app.models.schemas import PaperAnalysisResponse, PaperSummary, PaperQAPair
from app.services.llm_service import get_llm_service
from app.services.paper_service import PaperService
import os
import tempfile

router = APIRouter()




@router.post("/analyze", response_model=PaperAnalysisResponse)
async def analyze_paper(
    file: UploadFile = File(None),
    url: str = Form(None),
    x_api_key: str = Header(None),
):
    """
    分析论文 - 生成结构化报告、演讲稿和 Q&A
    
    Args:
        file: 上传的 PDF 文件（可选）
        url: Arxiv URL（可选）
        x_api_key: API Key
    
    Returns:
        论文分析结果
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    if not file and not url:
        raise HTTPException(status_code=400, detail="Either file or url is required")
    
    try:
        # 提取论文文本
        paper_text = ""
        
        if file:
            # 保存上传的文件到临时目录
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                content = await file.read()
                tmp_file.write(content)
                temp_path = tmp_file.name
            
            try:
                # 提取文本
                paper_text = await PaperService.extract_text_from_pdf(temp_path)
            finally:
                # 清理临时文件
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        elif url:
            paper_text = await PaperService.download_arxiv_paper(url)
        
        if not paper_text:
            raise HTTPException(status_code=400, detail="Failed to extract text from paper")
        
        # 获取 LLM 服务
        llm_service = get_llm_service(api_key=x_api_key)
        
        # 并行执行分析和讲解生成，提升响应速度
        import asyncio
        
        async def run_analysis():
            loop = asyncio.get_event_loop()
            # 在线程池中运行 CPU 密集的 LLM 调用
            summary_data = await loop.run_in_executor(None, llm_service.analyze_paper_structured, paper_text)
            return summary_data
        
        async def run_speech_generation():
            loop = asyncio.get_event_loop()
            # 在线程池中运行讲解生成
            speech = await loop.run_in_executor(None, llm_service.generate_speech, paper_text)
            return speech
        
        # 并行执行分析和讲解生成
        try:
            # 使用 asyncio.gather 并行执行两个任务
            summary_data, speech = await asyncio.gather(
                run_analysis(),
                run_speech_generation(),
                return_exceptions=True  # 允许一个任务失败不影响另一个
            )
            
            # 处理分析结果
            if isinstance(summary_data, Exception):
                raise HTTPException(status_code=500, detail=f"Failed to analyze paper: {str(summary_data)}")
            
            # 处理讲解生成结果
            if isinstance(speech, Exception):
                # 讲解生成失败不影响主流程，设置为空字符串
                print(f"Warning: Speech generation failed: {str(speech)}")
                speech = ""
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="LLM request timed out. Please try again.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process paper: {str(e)}")
        
        # Q&A 功能暂时返回占位内容，用户可以在"对话"标签页按需生成
        qa = []
        
        # 解析结构化摘要（PaperService已在文件顶部导入）
        parsed_summary = PaperService.parse_structured_summary(summary_data["raw_response"])
        
        # parsed_summary 现在返回的是camelCase格式,直接使用
        summary = PaperSummary(
            coreProblem=parsed_summary.get("coreProblem", "解析失败"),
            previousDilemma=parsed_summary.get("previousDilemma", "解析失败"),
            coreIntuition=parsed_summary.get("coreIntuition", "解析失败"),
            keySteps=parsed_summary.get("keySteps", []),
            innovations=parsed_summary.get("innovations", {"comparison": "", "essence": ""}),
            boundaries=parsed_summary.get("boundaries", {"assumptions": "", "unsolved": ""}),
            oneSentence=parsed_summary.get("oneSentence", "解析失败"),
        )
        
        qa_pairs = [
            PaperQAPair(question=q["question"], answer=q["answer"])
            for q in qa
        ] if qa else []
        
        return PaperAnalysisResponse(
            summary=summary,
            speech=speech,
            qa=qa_pairs,
            paper_text=paper_text[:10000],  # 限制长度，返回前10000字符用于AI解读
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing paper: {str(e)}")


@router.post("/generate-speech")
async def generate_speech(
    paper_text: str = Body(..., embed=True),
    x_api_key: str = Header(None),
):
    """
    按需生成论文讲解内容
    
    Args:
        paper_text: 论文文本内容
        x_api_key: API Key
    
    Returns:
        讲解内容
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        llm_service = get_llm_service(api_key=x_api_key)
        speech = llm_service.generate_speech(paper_text)
        return {"speech": speech}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating speech: {str(e)}")


@router.post("/generate-qa")
async def generate_qa(
    paper_text: str = Body(..., embed=True),
    x_api_key: str = Header(None),
):
    """
    按需生成论文 Q&A
    
    Args:
        paper_text: 论文文本内容
        x_api_key: API Key
    
    Returns:
        Q&A 列表
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        llm_service = get_llm_service(api_key=x_api_key)
        qa = llm_service.generate_qa(paper_text)
        qa_pairs = [
            {"question": q["question"], "answer": q["answer"]}
            for q in qa
        ] if qa else []
        return {"qa": qa_pairs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating Q&A: {str(e)}")


@router.post("/chat")
async def chat_with_paper(
    question: str = Body(..., embed=True),
    paper_text: str = Body(..., embed=True),
    system_prompt: str = Body(None, embed=True),
    x_api_key: str = Header(None),
):
    """
    AI 解读论文 - 根据论文内容回答用户问题
    
    Args:
        question: 用户问题
        paper_text: 论文文本内容
        system_prompt: 自定义 System Prompt（可选，如果为空则使用默认值）
        x_api_key: API Key
    
    Returns:
        AI 回答
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        from app.prompts.paper_chat_prompt import PAPER_CHAT_SYSTEM_PROMPT
        
        llm_service = get_llm_service(api_key=x_api_key)
        
        # 构建提示词，将论文内容作为上下文
        prompt = f"""以下是用户正在阅读的论文内容：

---论文内容开始---
{paper_text[:5000]}
---论文内容结束---

用户问题：{question}

请基于论文内容回答用户的问题。"""
        
        # 使用自定义 system_prompt，如果没有则使用默认值
        final_system_prompt = system_prompt if system_prompt else PAPER_CHAT_SYSTEM_PROMPT
        answer = llm_service.chat(prompt, system_prompt=final_system_prompt)
        
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error chatting with paper: {str(e)}")

