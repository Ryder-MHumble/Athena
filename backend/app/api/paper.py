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
        
        # 优化策略：只生成核心分析，其他内容设为空（按需生成）
        # 这样可以在 5-10 秒内返回结果，大幅提升用户体验
        import asyncio
        
        async def run_analysis():
            loop = asyncio.get_event_loop()
            # 在线程池中运行 CPU 密集的 LLM 调用
            summary_data = await loop.run_in_executor(None, llm_service.analyze_paper_structured, paper_text)
            return summary_data
        
        # 只执行核心分析，大幅减少等待时间（从 30s+ 降至 10s 左右）
        try:
            summary_data = await run_analysis()
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="LLM request timed out. Please try again.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to analyze paper: {str(e)}")
        
        # 演讲稿和 Q&A 功能暂时返回占位内容
        # 用户可以在"讲解"和"对话"标签页按需生成
        speech = ""
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
    x_api_key: str = Header(None),
):
    """
    AI 解读论文 - 根据论文内容回答用户问题
    
    Args:
        question: 用户问题
        paper_text: 论文文本内容
        x_api_key: API Key
    
    Returns:
        AI 回答
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        llm_service = get_llm_service(api_key=x_api_key)
        
        # 构建提示词
        prompt = f"""基于以下论文内容，回答用户的问题。请用通俗易懂的语言解释，必要时使用生活化的类比。

论文内容：
{paper_text[:5000]}  # 限制长度避免token过多

用户问题：{question}

请直接回答，无需重复论文内容。
"""
        
        answer = llm_service.chat(prompt, system_prompt="你是一个论文解读助手，擅长用通俗易懂的语言解释学术内容。")
        
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error chatting with paper: {str(e)}")

