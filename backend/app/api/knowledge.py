"""
知识沉淀模块 API 路由
处理文档上传和知识库搜索
"""

from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Body
from app.models.schemas import SearchRequest, SearchResponse, UploadResponse
from app.services.rag_service import get_rag_service
from app.services.llm_service import get_llm_service
from app.services.embedding_service import get_embedding_service
from app.config import settings
import fitz  # PyMuPDF
import os
import tempfile

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    team_key: str = Form(...),
    x_api_key: str = Header(None),
):
    """
    上传文档到知识库
    
    Args:
        file: 上传的文件（PDF/Word）
        team_key: 团队访问密钥
        x_api_key: API Key（用于生成 embedding）
    
    Returns:
        上传结果
    """
    # 验证团队密钥
    if team_key != settings.TEAM_ACCESS_KEY:
        raise HTTPException(status_code=403, detail="Invalid team access key")
    
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        # 保存文件到临时目录
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            temp_path = tmp_file.name
        
        try:
            # 提取文本（目前只支持 PDF）
            if file.filename and file.filename.endswith(".pdf"):
                doc = fitz.open(temp_path)
                text = ""
                for page in doc:
                    text += page.get_text()
                doc.close()
            else:
                raise HTTPException(status_code=400, detail="Only PDF files are supported currently")
            
            # 获取服务实例
            rag_service = get_rag_service()
            embedding_service = get_embedding_service(api_key=x_api_key)
            
            # 切分文本
            chunks = rag_service.text_splitter.split_text(text)
            
            # 生成 embeddings
            embeddings = await embedding_service.generate_embeddings(chunks)
            
            # 上传到向量数据库
            metadata = {
                "source": file.filename or "uploaded_file.pdf",
                "uploaded_at": str(os.path.getmtime(temp_path)),
            }
            
            success = rag_service.upload_document(text, metadata, embeddings)
        finally:
            # 清理临时文件
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to upload document to vector database")
        
        return UploadResponse(
            success=True,
            message="Document uploaded successfully",
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")


@router.post("/search", response_model=SearchResponse)
async def search_knowledge(
    request: SearchRequest = Body(...),
    x_api_key: str = Header(None),
):
    """
    搜索知识库
    
    Args:
        request: 搜索请求
        x_api_key: API Key（用于生成 embedding 和 LLM 回答）
    
    Returns:
        搜索结果和 AI 生成的答案
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        # 获取服务实例
        rag_service = get_rag_service()
        llm_service = get_llm_service(api_key=x_api_key)
        embedding_service = get_embedding_service(api_key=x_api_key)
        
        # 生成查询向量
        query_embedding = await embedding_service.generate_embedding(request.query)
        
        # 搜索相似文档
        results = rag_service.search(
            query=request.query,
            query_embedding=query_embedding,
            top_k=request.top_k,
        )
        
        # 生成答案
        answer = rag_service.generate_answer(
            query=request.query,
            context=results,
            api_key=x_api_key,
        )
        
        return SearchResponse(
            results=results,
            answer=answer,
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching knowledge: {str(e)}")


@router.post("/generate-report")
async def generate_report(
    request: SearchRequest = Body(...),
    x_api_key: str = Header(None),
):
    """
    生成知识库文档的结构化报告
    自动从文档内容生成摘要、关键概念、核心洞察等
    
    Args:
        request: 包含文档内容的请求
        x_api_key: API Key
    
    Returns:
        结构化报告
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        llm_service = get_llm_service(api_key=x_api_key)
        
        # 生成结构化报告的提示词
        report_prompt = f"""
        请根据以下文档内容生成一份专业的结构化报告。
        
        **文档内容：**
        {request.query[:3000]}  # 限制输入长度
        
        请生成一份包含以下部分的Markdown格式报告：
        
        ## 📌 核心摘要
        用2-3句话总结文档的核心内容
        
        ## 🎯 关键概念
        列出3-5个最重要的概念或术语（使用bullet list）
        
        ## 💡 核心洞察
        列出3-5条核心洞察或发现
        
        ## 📊 数据/统计（如果有）
        重点突出文档中提到的关键数据或统计
        
        ## 🔗 相关领域
        列出这个话题相关的其他领域或概念
        
        ## 📝 建议行动
        基于文档内容提出2-3条可行的建议
        
        请用通俗易懂的语言，避免过于专业的术语。
        """
        
        # 调用 LLM 生成报告
        report = llm_service.chat(
            message=report_prompt,
            system_prompt="你是一个专业的文档分析师，善于从复杂的文档中提取关键信息并生成结构化报告。",
            temperature=0.5,  # 中等创意度
        )
        
        return {
            "report": report,
            "timestamp": str(os.path.getmtime(temp_path)) if 'temp_path' in locals() else "",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
