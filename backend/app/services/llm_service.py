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
    
    def analyze_paper_structured(self, paper_text: str) -> Dict[str, Any]:
        """
        分析论文 - 生成结构化摘要
        
        Args:
            paper_text: 论文文本内容
        
        Returns:
            结构化摘要字典
        """
        # 使用统一的System Prompt
        prompt = f"""{PAPER_ANALYSIS_SYSTEM_PROMPT}

请严格按照以上框架，以 JSON 格式输出，格式如下：
{{
  "core_problem": "核心问题描述",
  "previous_dilemma": "前人困境描述",
  "core_intuition": "核心直觉描述",
  "key_steps": ["步骤1", "步骤2"],
  "innovations": {{
    "comparison": "对比描述",
    "essence": "本质描述"
  }},
  "boundaries": {{
    "assumptions": "假设描述",
    "unsolved": "未解之谜描述"
  }},
  "one_sentence": "一句话总结"
}}

论文内容如下：

{paper_text[:10000]}  # 限制长度避免 token 超限
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
        生成口语化演讲稿
        
        Args:
            paper_text: 论文文本内容
        
        Returns:
            Markdown 格式的演讲稿
        """
        prompt = f"""请将以下论文内容转换为口语化的演讲稿（Markdown 格式）。
要求：
1. 语言通俗易懂，适合非技术背景的听众
2. 使用生活中的例子做类比
3. 结构清晰，有标题和段落
4. 避免过于专业的术语，必要时用通俗语言解释

论文内容：

{paper_text[:8000]}
"""
        # 使用小模型生成演讲稿以提升速度
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

