"""
论文处理服务模块
封装论文文本提取和解析逻辑
"""

import fitz  # PyMuPDF
import httpx
import os
from typing import Dict, Any
import json
import re


class PaperService:
    """论文处理服务类"""
    
    @staticmethod
    async def extract_text_from_pdf(file_path: str) -> str:
        """
        从 PDF 文件提取文本
        
        Args:
            file_path: PDF 文件路径
        
        Returns:
            提取的文本内容
        """
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    
    @staticmethod
    async def download_arxiv_paper(url: str) -> str:
        """
        从 Arxiv URL 下载论文并提取文本
        
        Args:
            url: Arxiv URL
        
        Returns:
            论文文本内容
        """
        # 将 Arxiv URL 转换为 PDF URL
        if "arxiv.org/abs/" in url:
            pdf_url = url.replace("/abs/", "/pdf/") + ".pdf"
        elif "arxiv.org/pdf/" in url:
            pdf_url = url
        else:
            raise ValueError("Invalid Arxiv URL")
        
        # 下载 PDF
        async with httpx.AsyncClient() as client:
            response = await client.get(pdf_url, timeout=60.0)
            response.raise_for_status()
            
            # 保存临时文件
            temp_path = f"/tmp/arxiv_{os.path.basename(pdf_url)}"
            with open(temp_path, "wb") as f:
                f.write(response.content)
            
            # 提取文本
            text = await PaperService.extract_text_from_pdf(temp_path)
            
            # 清理临时文件
            os.remove(temp_path)
            
            return text
    
    @staticmethod
    def parse_structured_summary(text: str) -> Dict[str, Any]:
        """
        解析 LLM 返回的结构化摘要文本为字典
        
        Args:
            text: LLM 返回的文本（可能包含 JSON）
        
        Returns:
            结构化摘要字典 (camelCase格式)
        """
        # 尝试提取 JSON
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                # LLM返回的格式是 {"summary": {...}}，需要提取summary字段
                if "summary" in data:
                    return data["summary"]
                # 如果直接就是summary内容，直接返回
                return data
            except Exception as e:
                print(f"JSON解析失败: {e}")
                pass
        
        # 如果无法解析 JSON，返回默认结构 (使用camelCase以匹配前端和prompt定义)
        return {
            "coreProblem": "解析失败，请重试",
            "previousDilemma": "解析失败，请重试",
            "coreIntuition": "解析失败，请重试",
            "keySteps": [],
            "innovations": {
                "comparison": "解析失败，请重试",
                "essence": "解析失败，请重试",
            },
            "boundaries": {
                "assumptions": "解析失败，请重试",
                "unsolved": "解析失败，请重试",
            },
            "oneSentence": "解析失败，请重试",
        }

