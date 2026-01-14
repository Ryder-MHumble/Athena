"""
Embedding 服务模块
封装向量嵌入生成逻辑（调用 SiliconFlow Embedding API）
"""

from typing import List
import httpx
from app.config import settings


class EmbeddingService:
    """Embedding 服务类 - 生成文本向量嵌入"""
    
    def __init__(self, api_key: str = None):
        """
        初始化 Embedding 服务
        
        Args:
            api_key: SiliconFlow API Key
        """
        self.api_key = api_key or settings.SILICONFLOW_API_KEY
        self.api_base = "https://api.siliconflow.cn/v1"
        self.model = settings.EMBEDDING_MODEL
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        生成单个文本的向量嵌入
        
        Args:
            text: 输入文本
        
        Returns:
            向量嵌入列表
        """
        if not self.api_key:
            raise ValueError("API Key is required for embedding generation")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.api_base}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "input": text,
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                return data["data"][0]["embedding"]
            except httpx.HTTPStatusError as e:
                print(f"API Error: {e.response.status_code} - {e.response.text}")
                if e.response.status_code == 401:
                    raise ValueError(f"Invalid API key: {e.response.text}")
                raise ValueError(f"Failed to generate embedding: {e.response.text}")
            except Exception as e:
                print(f"Embedding generation error: {e}")
                raise ValueError(f"Failed to generate embedding: {str(e)}")
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        批量生成向量嵌入
        
        Args:
            texts: 文本列表
        
        Returns:
            向量嵌入列表（每个文本对应一个向量）
        """
        if not self.api_key:
            raise ValueError("API Key is required for embedding generation")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.api_base}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "input": texts,
                    },
                    timeout=60.0,
                )
                response.raise_for_status()
                data = response.json()
                return [item["embedding"] for item in data["data"]]
            except httpx.HTTPStatusError as e:
                print(f"API Error: {e.response.status_code} - {e.response.text}")
                if e.response.status_code == 401:
                    raise ValueError(f"Invalid API key: {e.response.text}")
                raise ValueError(f"Failed to generate embeddings: {e.response.text}")
            except Exception as e:
                print(f"Embeddings generation error: {e}")
                raise ValueError(f"Failed to generate embeddings: {str(e)}")


# 全局 Embedding 服务实例
_embedding_service: EmbeddingService = None


def get_embedding_service(api_key: str = None) -> EmbeddingService:
    """获取 Embedding 服务实例（单例模式）"""
    global _embedding_service
    if _embedding_service is None or api_key:
        _embedding_service = EmbeddingService(api_key=api_key)
    return _embedding_service

