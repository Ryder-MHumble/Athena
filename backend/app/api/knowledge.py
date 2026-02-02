"""
知识沉淀模块 API 路由
简化版：上传文件 → LLM 分析生成报告 → 存储和展示
不使用 RAG/Embedding，直接用 LLM 分析文档内容
"""

from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Body, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from app.services.llm_service import get_llm_service
from app.config import settings
from supabase import create_client, Client
import fitz  # PyMuPDF
import os
import tempfile
import uuid
from datetime import datetime

router = APIRouter()


# ==================== 数据模型 ====================

class UploadResponse(BaseModel):
    success: bool
    message: str
    document_id: Optional[str] = None
    file_url: Optional[str] = None


class DocumentItem(BaseModel):
    id: str
    title: str
    file_url: str
    analysis_report: Optional[str] = None
    status: str = "pending"  # pending, analyzing, completed, failed
    created_at: str


class DocumentListResponse(BaseModel):
    success: bool
    documents: List[DocumentItem]
    count: int


class AnalysisRequest(BaseModel):
    document_id: str
    content: Optional[str] = None


class AnalysisResponse(BaseModel):
    success: bool
    report: Optional[str] = None
    message: Optional[str] = None


# ==================== Supabase 客户端 ====================

def get_supabase_client() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY
    )


# ==================== 后台分析任务 ====================

async def background_analyze_document(document_id: str, text: str, api_key: str):
    """后台分析文档并更新数据库"""
    try:
        print(f"[Background] Starting analysis for document: {document_id}")
        supabase = get_supabase_client()
        
        # 更新状态为分析中
        supabase.table("documents").update({
            "status": "analyzing"
        }).eq("id", document_id).execute()
        
        # 调用 LLM 分析
        llm_service = get_llm_service(api_key=api_key)
        
        # 限制文本长度
        truncated_text = text[:8000] if len(text) > 8000 else text
        
        analysis_prompt = f"""
请对以下文档进行深度分析，生成一份专业的HTML格式分析报告。

**文档内容：**
{truncated_text}

请生成包含以下部分的HTML报告（使用现代卡片式布局，带有优雅的样式）：

<div class="report-container">
  <div class="report-section summary">
    <h2>📌 核心摘要</h2>
    <p>用2-3句话总结文档的核心内容</p>
  </div>
  
  <div class="report-section concepts">
    <h2>🎯 关键概念</h2>
    <ul>列出3-5个最重要的概念或术语</ul>
  </div>
  
  <div class="report-section insights">
    <h2>💡 核心洞察</h2>
    <ul>列出3-5条核心洞察或发现</ul>
  </div>
  
  <div class="report-section data">
    <h2>📊 关键数据</h2>
    <p>重点突出文档中提到的关键数据或统计</p>
  </div>
  
  <div class="report-section actions">
    <h2>📝 建议行动</h2>
    <ul>基于文档内容提出2-3条可行的建议</ul>
  </div>
</div>

请确保：
1. 内容准确、专业
2. 使用简洁清晰的语言
3. 只返回HTML内容，不要包含```html标记
"""
        
        report = llm_service.chat(
            message=analysis_prompt,
            system_prompt="你是一个专业的文档分析师，善于从复杂的文档中提取关键信息并生成结构化的HTML报告。",
            temperature=0.5,
        )
        
        # 清理可能的代码块标记
        if report.startswith("```html"):
            report = report[7:]
        if report.startswith("```"):
            report = report[3:]
        if report.endswith("```"):
            report = report[:-3]
        report = report.strip()
        
        # 更新数据库
        supabase.table("documents").update({
            "analysis_report": report,
            "status": "completed",
            "analyzed_at": datetime.utcnow().isoformat()
        }).eq("id", document_id).execute()
        
        print(f"[Background] Analysis completed for document: {document_id}")
        
    except Exception as e:
        print(f"[Background] Analysis failed for document {document_id}: {e}")
        try:
            supabase = get_supabase_client()
            supabase.table("documents").update({
                "status": "failed",
                "error_message": str(e)
            }).eq("id", document_id).execute()
        except:
            pass


# ==================== API 路由 ====================

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    team_key: str = Form(...),
    x_api_key: str = Header(None),
):
    """
    上传文档到知识库
    上传后会在后台自动分析文档并生成报告
    """
    # 验证团队密钥
    if team_key != settings.TEAM_ACCESS_KEY:
        raise HTTPException(status_code=403, detail="Invalid team access key")
    
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
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
                    "status": "pending",
                    "created_at": datetime.utcnow().isoformat(),
                }
                
                supabase.table("documents").insert([document_record]).execute()
                print(f"✓ Document record created in database: {document_id}")
            except Exception as e:
                print(f"✗ Error creating document record: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create document record: {str(e)}")
            
            # 3. 后台异步分析文档
            background_tasks.add_task(background_analyze_document, document_id, text, x_api_key)
            
            return UploadResponse(
                success=True,
                message="文档上传成功，正在后台分析中...",
                document_id=document_id,
                file_url=file_url,
            )
            
        finally:
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
    """获取已上传的文档列表"""
    if team_key and team_key != settings.TEAM_ACCESS_KEY:
        raise HTTPException(status_code=403, detail="Invalid team access key")
    
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("documents").select("*").order("created_at", desc=True).execute()
        
        documents = []
        for doc in response.data:
            file_path = doc.get("file_path", "")
            file_url = supabase.storage.from_("documents").get_public_url(file_path) if file_path else ""
            
            documents.append(DocumentItem(
                id=doc["id"],
                title=doc["title"],
                file_url=file_url,
                analysis_report=doc.get("analysis_report"),
                status=doc.get("status", "pending"),
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


@router.get("/document/{document_id}")
async def get_document_detail(
    document_id: str,
    x_api_key: str = Header(None),
):
    """获取单个文档详情（包含分析报告）"""
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("documents").select("*").eq("id", document_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = response.data[0]
        file_path = doc.get("file_path", "")
        file_url = supabase.storage.from_("documents").get_public_url(file_path) if file_path else ""
        
        return {
            "success": True,
            "document": {
                "id": doc["id"],
                "title": doc["title"],
                "file_url": file_url,
                "analysis_report": doc.get("analysis_report"),
                "status": doc.get("status", "pending"),
                "created_at": doc["created_at"],
                "analyzed_at": doc.get("analyzed_at"),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching document: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching document: {str(e)}")


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_document(
    background_tasks: BackgroundTasks,
    request: AnalysisRequest = Body(...),
    x_api_key: str = Header(None),
):
    """
    手动触发文档分析（用于重新分析或失败重试）
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    try:
        supabase = get_supabase_client()
        
        # 获取文档信息
        response = supabase.table("documents").select("*").eq("id", request.document_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = response.data[0]
        
        # 如果没有提供内容，需要重新从文件提取
        if not request.content:
            # 这里简化处理，实际可以从 Storage 下载并重新提取
            return AnalysisResponse(
                success=False,
                message="请提供文档内容或重新上传文档"
            )
        
        # 后台分析
        background_tasks.add_task(background_analyze_document, request.document_id, request.content, x_api_key)
        
        return AnalysisResponse(
            success=True,
            message="分析任务已启动，请稍后刷新查看结果"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing document: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")


@router.delete("/document/{document_id}")
async def delete_document(
    document_id: str,
    team_key: str = None,
    x_api_key: str = Header(None),
):
    """删除文档"""
    if team_key and team_key != settings.TEAM_ACCESS_KEY:
        raise HTTPException(status_code=403, detail="Invalid team access key")
    
    try:
        supabase = get_supabase_client()
        
        # 获取文档信息
        response = supabase.table("documents").select("file_path").eq("id", document_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        file_path = response.data[0].get("file_path")
        
        # 删除 Storage 中的文件
        if file_path:
            try:
                supabase.storage.from_("documents").remove([file_path])
            except Exception as e:
                print(f"Warning: Failed to delete file from storage: {e}")
        
        # 删除数据库记录
        supabase.table("documents").delete().eq("id", document_id).execute()
        
        return {"success": True, "message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")
