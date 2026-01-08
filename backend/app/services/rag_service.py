"""
RAG 服务模块
封装 Supabase 向量检索逻辑
"""

from supabase import create_client, Client
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.config import settings
from app.services.llm_service import get_llm_service
from typing import List, Dict, Any
import hashlib


class RAGService:
    """RAG 服务类 - 处理向量存储和检索"""
    
    def __init__(self):
        """初始化 Supabase 客户端"""
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SECRET_KEY  # 使用 Secret Key 以获得完整权限
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
    
    def upload_document(
        self,
        content: str,
        metadata: Dict[str, Any],
        embeddings: List[List[float]]
    ) -> bool:
        """
        上传文档到向量数据库
        
        Args:
            content: 文档文本内容
            metadata: 元数据（来源、页码等）
            embeddings: 向量嵌入列表（每个 chunk 一个向量）
        
        Returns:
            是否成功
        """
        try:
            # 切分文本
            chunks = self.text_splitter.split_text(content)
            
            # 确保 chunks 和 embeddings 数量一致
            if len(chunks) != len(embeddings):
                raise ValueError("Chunks and embeddings count mismatch")
            
            # 批量插入到 Supabase
            records = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                records.append({
                    "content": chunk,
                    "metadata": {
                        **metadata,
                        "chunk_index": i,
                    },
                    "embedding": embedding,
                })
            
            # 插入到 documents 表
            response = self.supabase.table("documents").insert(records).execute()
            return len(response.data) > 0
            
        except Exception as e:
            print(f"Error uploading document: {e}")
            return False
    
    def search(
        self,
        query: str,
        query_embedding: List[float],
        top_k: int = 5,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        向量相似度搜索
        
        Args:
            query: 查询文本
            query_embedding: 查询向量
            top_k: 返回结果数量
            threshold: 相似度阈值
        
        Returns:
            搜索结果列表
        """
        try:
            # 调用 Supabase RPC 函数进行向量搜索
            response = self.supabase.rpc(
                "match_documents",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": threshold,
                    "match_count": top_k,
                }
            ).execute()
            
            # 格式化结果
            results = []
            for item in response.data:
                results.append({
                    "content": item["content"],
                    "metadata": item["metadata"],
                    "similarity": item["similarity"],
                })
            
            return results
            
        except Exception as e:
            print(f"Error searching: {e}")
            return []
    
    def generate_answer(
        self,
        query: str,
        context: List[Dict[str, Any]],
        api_key: str = None
    ) -> str:
        """
        基于检索结果生成答案
        
        Args:
            query: 用户问题
            context: 检索到的文档片段
            api_key: LLM API Key
        
        Returns:
            AI 生成的答案
        """
        # 构建上下文
        context_text = "\n\n".join([
            f"[来源: {ctx.get('metadata', {}).get('source', '未知')}]\n{ctx['content']}"
            for ctx in context
        ])
        
        prompt = f"""基于以下文档片段，回答用户的问题。如果文档中没有相关信息，请诚实地说"根据提供的文档，我无法找到相关信息"。

文档片段：
{context_text}

用户问题：{query}

请用通俗易懂的语言回答，避免专业术语，必要时用生活中的例子做类比。
"""
        
        from app.prompts.knowledge_prompt import KNOWLEDGE_SYSTEM_PROMPT
        llm_service = get_llm_service(api_key=api_key)
        answer = llm_service.chat(prompt, system_prompt=KNOWLEDGE_SYSTEM_PROMPT)
        
        return answer


# 全局 RAG 服务实例
_rag_service: RAGService = None


def get_rag_service() -> RAGService:
    """获取 RAG 服务实例（单例模式）"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service

