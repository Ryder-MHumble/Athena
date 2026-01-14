"""
知识沉淀模块 API 路由
处理文档上传、检索和报告生成
"""

from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Body
from app.models.schemas import (
    SearchRequest, SearchResponse, UploadResponse, 
    DocumentListResponse, DocumentItem, ReportRequest, ReportResponse
)
from app.services.rag_service import get_rag_service
from app.services.llm_service import get_llm_service
from app.services.embedding_service import get_embedding_service
from app.config import settings
from supabase import create_client, Client
import fitz  # PyMuPDF
import os
import tempfile
import uuid
from datetime import datetime

router = APIRouter()

# Supabase 客户端（用于 Storage 操作）
def get_supabase_client() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    team_key: str = Form(...),
    x_api_key: str = Header(None),
):
    """
    上传文档到知识库
    
    Args:
        file: 上传的文件（PDF）
        team_key: 团队访问密钥
        x_api_key: API Key（用于生成 embedding）
    
    Returns:
        上传结果（包含文档 ID 和文件 URL）
    """
    # 验证团队密钥
    if team_key != settings.TEAM_ACCESS_KEY:
        raise HTTPException(status_code=403, detail="Invalid team access key")
    
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        # 生成唯一的文档 ID
        document_id = str(uuid.uuid4())
        
        # 保存文件到临时目录
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            temp_path = tmp_file.name
        
        try:
            # 提取文本
            if file.filename and file.filename.endswith(".pdf"):
                doc = fitz.open(temp_path)
                text = ""
                for page in doc:
                    text += page.get_text()
                doc.close()
            else:
                raise HTTPException(status_code=400, detail="Only PDF files are supported")
            
            if not text.strip():
                raise HTTPException(status_code=400, detail="PDF file is empty or cannot be read")
            
            # 获取服务实例
            rag_service = get_rag_service()
            embedding_service = get_embedding_service(api_key=x_api_key)
            supabase = get_supabase_client()
            
            # 1. 上传文件到 Supabase Storage
            file_storage_path = f"documents/{document_id}/{file.filename}"
            
            try:
                with open(temp_path, 'rb') as f:
                    file_content = f.read()
                
                supabase.storage.from_("documents").upload(
                    file_storage_path,
                    file_content,
                    {"content-type": "application/pdf"}
                )
                
                # 获取公开 URL
                file_url = supabase.storage.from_("documents").get_public_url(file_storage_path)
                print(f"✓ File uploaded to Supabase Storage: {file_storage_path}")
            except Exception as e:
                print(f"✗ Error uploading to Supabase Storage: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to upload file to storage: {str(e)}")
            
            # 2. 在 documents 表中创建记录
            try:
                document_record = {
                    "id": document_id,
                    "title": file.filename.replace(".pdf", ""),
                    "file_path": file_storage_path,
                    "created_at": datetime.utcnow().isoformat(),
                }
                
                supabase.table("documents").insert([document_record]).execute()
                print(f"✓ Document record created in database: {document_id}")
            except Exception as e:
                print(f"✗ Error creating document record: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create document record: {str(e)}")
            
            # 3. 切分文本并生成 embeddings
            try:
                chunks = rag_service.text_splitter.split_text(text)
                print(f"✓ Text split into {len(chunks)} chunks")
                
                print(f"Generating embeddings for {len(chunks)} chunks using API key: {x_api_key[:10]}...")
                embeddings = await embedding_service.generate_embeddings(chunks)
                print(f"✓ Embeddings generated: {len(embeddings)} vectors")
                
                if len(embeddings) != len(chunks):
                    raise ValueError(f"Embedding count mismatch: {len(embeddings)} embeddings for {len(chunks)} chunks")
            except Exception as e:
                print(f"✗ Error generating embeddings: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")
            
            # 4. 上传文本块到 document_chunks 表
            try:
                metadata = {
                    "source": file.filename,
                    "file_url": file_url,
                }
                
                success = rag_service.upload_document(
                    document_id=document_id,
                    content=text,
                    metadata=metadata,
                    embeddings=embeddings
                )
                
                if not success:
                    raise HTTPException(status_code=500, detail="Failed to upload document chunks to database")
                print(f"✓ Document chunks uploaded to database")
            except Exception as e:
                print(f"✗ Error uploading document chunks: {e}")
                if isinstance(e, HTTPException):
                    raise
                raise HTTPException(status_code=500, detail=f"Failed to upload document chunks: {str(e)}")
            
            return UploadResponse(
                success=True,
                message="Document uploaded successfully",
                document_id=document_id,
                file_url=file_url,
            )
            
        finally:
            # 清理临时文件
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")


@router.get("/documents", response_model=DocumentListResponse)
async def get_documents(
    team_key: str = None,
    x_api_key: str = Header(None),
):
    """
    获取已上传的文档列表
    
    Args:
        team_key: 团队访问密钥（查询参数）
        x_api_key: API Key
    
    Returns:
        文档列表
    """
    if team_key and team_key != settings.TEAM_ACCESS_KEY:
        raise HTTPException(status_code=403, detail="Invalid team access key")
    
    try:
        supabase = get_supabase_client()
        
        # 查询 documents 表
        response = supabase.table("documents").select("*").order("created_at", desc=True).execute()
        
        documents = []
        for doc in response.data:
            # 获取 file_url 从 Storage
            file_path = doc.get("file_path", "")
            file_url = supabase.storage.from_("documents").get_public_url(file_path) if file_path else ""
            
            documents.append(DocumentItem(
                id=doc["id"],
                title=doc["title"],
                file_url=file_url,
                summary=doc.get("summary"),
                created_at=doc["created_at"],
            ))
        
        return DocumentListResponse(
            success=True,
            documents=documents,
            count=len(documents),
        )
        
    except Exception as e:
        print(f"Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")


@router.get("/document/{document_id}", response_model=dict)
async def get_document_content(
    document_id: str,
    x_api_key: str = Header(None),
):
    """
    获取指定文档的内容（用于生成报告）
    
    Args:
        document_id: 文档 ID
        x_api_key: API Key
    
    Returns:
        文档内容和元数据
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        supabase = get_supabase_client()
        rag_service = get_rag_service()
        
        # 查询 documents 表获取文档元数据
        doc_response = supabase.table("documents").select("*").eq("id", document_id).execute()
        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_metadata = doc_response.data[0]
        
        # 获取该文档的所有 chunks
        chunks_response = supabase.table("document_chunks").select("content").eq("document_id", document_id).execute()
        
        # 合并所有 chunks 为完整内容
        full_content = "\n\n".join([chunk["content"] for chunk in chunks_response.data])
        
        return {
            "success": True,
            "document_id": document_id,
            "title": doc_metadata.get("title"),
            "content": full_content,
            "chunk_count": len(chunks_response.data),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching document content: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching document content: {str(e)}")


@router.post("/generate-report", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest = Body(...),
    x_api_key: str = Header(None),
):
    """
    生成知识库文档的结构化报告
    自动从文档内容生成摘要、关键概念、核心洞察等
    
    Args:
        request: 包含文档 ID 和内容的请求
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
{request.content[:5000]}  # 限制输入长度以节省 token

请生成一份包含以下部分的Markdown格式报告：

## 📌 核心摘要
用2-3句话总结文档的核心内容

## 🎯 关键概念
列出3-5个最重要的概念或术语（使用 bullet list）

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
        
        return ReportResponse(
            success=True,
            report=report,
        )
        
    except Exception as e:
        print(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@router.post("/chat", response_model=SearchResponse)
async def chat_with_document(
    request: SearchRequest = Body(...),
    document_id: str = None,
    x_api_key: str = Header(None),
):
    """
    与特定文档进行问答（知识库 RAG）
    
    Args:
        request: 问题和配置
        document_id: 文档 ID（可选，如果提供则只在该文档中搜索）
        x_api_key: API Key
    
    Returns:
        搜索结果和 AI 回答
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        from app.prompts.knowledge_prompt import KNOWLEDGE_SYSTEM_PROMPT
        
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
        
        # 构建上下文
        context_text = "\n\n".join([
            f"[来源: {ctx.get('metadata', {}).get('source', '未知')}]\n{ctx['content']}"
            for ctx in results
        ])
        
        # 使用知识库专用 system prompt 生成回答
        prompt = f"""基于以下文档片段，回答用户的问题。如果文档中没有相关信息，请诚实地说"根据提供的文档，我无法找到相关信息"。

文档片段：
{context_text}

用户问题：{request.query}

请用通俗易懂的语言回答，避免专业术语，必要时用生活中的例子做类比。
"""
        
        answer = llm_service.chat(
            message=prompt,
            system_prompt=KNOWLEDGE_SYSTEM_PROMPT,
        )
        
        return SearchResponse(
            results=results,
            answer=answer,
        )
        
    except Exception as e:
        print(f"Error chatting with document: {e}")
        raise HTTPException(status_code=500, detail=f"Error chatting with document: {str(e)}")


@router.post("/search", response_model=SearchResponse)
async def search_knowledge(
    request: SearchRequest = Body(...),
    x_api_key: str = Header(None),
):
    """
    在知识库中搜索相关文档片段
    
    Args:
        request: 搜索查询和配置
        x_api_key: API Key
    
    Returns:
        搜索结果
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        from app.prompts.knowledge_prompt import KNOWLEDGE_SYSTEM_PROMPT
        
        # 获取服务实例
        rag_service = get_rag_service()
        embedding_service = get_embedding_service(api_key=x_api_key)
        
        # 生成查询向量
        query_embedding = await embedding_service.generate_embedding(request.query)
        
        # 搜索相似文档
        results = rag_service.search(
            query=request.query,
            query_embedding=query_embedding,
            top_k=request.top_k,
        )
        
        # 返回搜索结果（不生成答案）
        return SearchResponse(
            results=results,
            answer="",  # 仅返回搜索结果
        )
        
    except Exception as e:
        print(f"Error searching knowledge: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching knowledge: {str(e)}")

