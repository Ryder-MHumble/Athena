"""
搜索服务模块
封装 DuckDuckGo 搜索逻辑（免费，无需 API Key）
"""

from langchain_community.tools import DuckDuckGoSearchRun
from typing import List, Dict


class SearchService:
    """搜索服务类 - 使用 DuckDuckGo 进行网络搜索"""
    
    def __init__(self):
        """初始化 DuckDuckGo 搜索工具"""
        self.search_tool = DuckDuckGoSearchRun()
    
    def search(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """
        执行网络搜索
        
        Args:
            query: 搜索查询
            max_results: 最大结果数量
        
        Returns:
            搜索结果列表 [{"title": "...", "snippet": "...", "url": "..."}]
        """
        try:
            # DuckDuckGo 搜索（完全免费，无需 API Key）
            result = self.search_tool.run(query)
            
            # 格式化结果
            # 注意：DuckDuckGo 返回的是文本格式，需要解析
            # 这里简化处理，实际应该解析返回的文本
            return [{
                "title": "搜索结果",
                "snippet": result[:500],  # 截取前 500 字符
                "url": "",
            }]
            
        except Exception as e:
            print(f"Error searching: {e}")
            return []


# 全局搜索服务实例
_search_service: SearchService = None


def get_search_service() -> SearchService:
    """获取搜索服务实例（单例模式）"""
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service

