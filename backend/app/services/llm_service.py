"""
LLM 服务模块
封装 LangChain 调用 SiliconFlow API 的逻辑
"""

from langchain_openai import ChatOpenAI
try:
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
except ImportError:
    from langchain.schema import HumanMessage, AIMessage, SystemMessage
from app.config import settings
from app.prompts.chat_prompt import CHAT_SYSTEM_PROMPT
from app.prompts.paper_prompt import PAPER_ANALYSIS_SYSTEM_PROMPT
from app.prompts.knowledge_prompt import KNOWLEDGE_SYSTEM_PROMPT
from typing import List, Dict, Any


class LLMService:
    """LLM 服务类 - 封装 LangChain 调用"""
    
    def __init__(self, api_key: str = None):
        """
        初始化 LLM 服务
        
        Args:
            api_key: SiliconFlow API Key（如果为 None，使用环境变量）
        """
        self.api_key = api_key or settings.SILICONFLOW_API_KEY
        
        # 创建 LangChain ChatOpenAI 实例
        # SiliconFlow 兼容 OpenAI API 格式
        self.llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            openai_api_key=self.api_key,
            openai_api_base="https://api.siliconflow.cn/v1",  # SiliconFlow API 地址
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )
    
    def chat(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        system_prompt: str = None,
        temperature: float = None
    ) -> str:
        """
        执行对话
        
        Args:
            message: 用户消息
            history: 对话历史 [{"role": "user/assistant", "content": "..."}]
            system_prompt: 系统提示词
        
        Returns:
            AI 回复内容
        """
        # 构建消息列表
        messages = []
        
        # 添加系统提示词（术语通模块的友好提示）
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        else:
            # 使用统一的术语通 System Prompt
            messages.append(SystemMessage(content=CHAT_SYSTEM_PROMPT))
        
        # 添加对话历史（最近 5 轮）
        if history:
            for msg in history[-5:]:  # 只保留最近 5 轮
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # 添加当前用户消息
        messages.append(HumanMessage(content=message))
        
        # 调用 LLM（如果指定了temperature，临时创建新的llm实例）
        if temperature is not None:
            temp_llm = ChatOpenAI(
                model=settings.LLM_MODEL,
                openai_api_key=self.api_key,
                openai_api_base="https://api.siliconflow.cn/v1",
                temperature=temperature,
                max_tokens=settings.MAX_TOKENS,
            )
            response = temp_llm.invoke(messages)
        else:
            response = self.llm.invoke(messages)
        return response.content
    
    def stream_chat(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        system_prompt: str = None,
        temperature: float = None
    ):
        """
        流式执行对话 - 返回生成器以实时流式输出
        
        Args:
            message: 用户消息
            history: 对话历史
            system_prompt: 系统提示词
            temperature: 温度参数
        
        Yields:
            单个字符或词块
        """
        # 构建消息列表（同 chat 方法）
        messages = []
        
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        else:
            messages.append(SystemMessage(content=CHAT_SYSTEM_PROMPT))
        
        if history:
            for msg in history[-5:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=message))
        
        # 创建流式 LLM 实例
        stream_llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            openai_api_key=self.api_key,
            openai_api_base="https://api.siliconflow.cn/v1",
            temperature=temperature or settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
            streaming=True,  # 启用流式模式
        )
        
        # 使用 stream 方法获取流式响应
        full_response = ""
        for chunk in stream_llm.stream(messages):
            # 每个 chunk 可能包含一个或多个字符/词
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            if content:
                full_response += content
                yield content  # 立即返回，实现流式效果
    

    def analyze_paper_structured(self, paper_text: str) -> Dict[str, Any]:
        """
        分析论文 - 生成结构化摘要
        
        Args:
            paper_text: 论文文本内容
        
        Returns:
            结构化摘要字典
        """
        # 直接使用 PAPER_ANALYSIS_SYSTEM_PROMPT 中定义的 JSON 格式
        prompt = f"""{PAPER_ANALYSIS_SYSTEM_PROMPT}

论文内容如下：

{paper_text[:10000]}
"""
        # 论文分析使用小模型以提升速度，关闭“思考模式”（较低 temperature）
        small_llm = ChatOpenAI(
            model=getattr(settings, "LLM_MODEL_SMALL", settings.LLM_MODEL),
            openai_api_key=self.api_key,
            openai_api_base="https://api.siliconflow.cn/v1",
            temperature=0.3,
            max_tokens=settings.MAX_TOKENS,
        )
        response = small_llm.invoke([HumanMessage(content=prompt)])
        return {"raw_response": response.content}
    
    def generate_speech(self, paper_text: str) -> str:
        """
        生成结构化讲解建议
        
        Args:
            paper_text: 论文文本内容
        
        Returns:
            JSON 格式的结构化讲解建议
        """
        prompt = f"""请将以下论文内容转换为结构化的讲解建议，以 JSON 格式返回。

你必须返回有效的 JSON，格式如下：

{{
  "suggestions": [
    {{
      "title": "讲解点的标题",
      "description": "详细的讲解内容（2-3句话）",
      "examples": "用生活中的例子做类比（1-2个例子）",
      "key_takeaway": "核心要点（1句话）"
    }}
  ]
}}

要求：
1. 生成 4-6 个讲解建议
2. 每个讲解点都要有标题、详细描述、生活类比和核心要点
3. 语言通俗易懂，避免过于专业的术语
4. 讲解点应该覆盖论文的不同方面（背景、问题、方案、优势、应用等）
5. 必须返回有效的JSON，确保所有字符串都被正确转义
6. 不要在 JSON 外添加任何其他文本

论文内容：

{paper_text[:10000]}
"""
        # 使用小模型生成讲解建议以提升速度
        small_llm = ChatOpenAI(
            model=getattr(settings, "LLM_MODEL_SMALL", settings.LLM_MODEL),
            openai_api_key=self.api_key,
            openai_api_base="https://api.siliconflow.cn/v1",
            temperature=0.4,
            max_tokens=settings.MAX_TOKENS,
        )
        response = small_llm.invoke([HumanMessage(content=prompt)])
        return response.content
    
    def generate_qa(self, paper_text: str, num_questions: int = 3) -> List[Dict[str, str]]:
        """
        生成预测问题及答案
        
        Args:
            paper_text: 论文文本内容
            num_questions: 问题数量
        
        Returns:
            Q&A 列表
        """
        prompt = f"""基于以下论文内容，生成 {num_questions} 个可能被问到的问题，并提供简洁易懂的答案。
每个问题应该：
1. 针对论文的核心内容
2. 适合非技术背景的提问者
3. 答案要通俗易懂，避免专业术语

论文内容：

{paper_text[:8000]}
"""
        # 使用小模型生成 Q&A 以提升速度
        small_llm = ChatOpenAI(
            model=getattr(settings, "LLM_MODEL_SMALL", settings.LLM_MODEL),
            openai_api_key=self.api_key,
            openai_api_base="https://api.siliconflow.cn/v1",
            temperature=0.4,
            max_tokens=settings.MAX_TOKENS,
        )
        response = small_llm.invoke([HumanMessage(content=prompt)])
        # 简单解析：按换行分割问题和答案，对格式要求不严格时至少给出原始文本
        content = response.content.strip()
        if not content:
            return []
        # 这里保持兼容，返回一个包含整体内容的 Q&A
        return [{"question": "关于这篇论文可能被问到的问题及答案", "answer": content}]


# 全局 LLM 服务实例（懒加载）
_llm_service: LLMService = None


def get_llm_service(api_key: str = None) -> LLMService:
    """获取 LLM 服务实例（单例模式）"""
    global _llm_service
    if _llm_service is None or api_key:
        _llm_service = LLMService(api_key=api_key)
    return _llm_service

