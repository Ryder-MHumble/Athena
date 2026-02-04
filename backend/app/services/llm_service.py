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
    
    def __init__(self, api_key: str = None, model: str = None):
        """
        初始化 LLM 服务
        
        Args:
            api_key: SiliconFlow API Key（如果为 None，使用环境变量）
            model: 模型ID（如果为 None，使用配置文件中的默认模型）
        """
        self.api_key = api_key or settings.SILICONFLOW_API_KEY
        self.model = model or settings.LLM_MODEL
        
        # 创建 LangChain ChatOpenAI 实例
        # SiliconFlow 兼容 OpenAI API 格式
        self.llm = ChatOpenAI(
            model=self.model,
            openai_api_key=self.api_key,
            openai_api_base="https://api.siliconflow.cn/v1",  # SiliconFlow API 地址
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
            request_timeout=settings.LLM_REQUEST_TIMEOUT,
        )
    
    def chat(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        system_prompt: str = None,
        temperature: float = None,
        max_tokens: int = None
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
        
        # 调用 LLM（如果指定了temperature或max_tokens，临时创建新的llm实例）
        if temperature is not None or max_tokens is not None:
            temp_llm = ChatOpenAI(
                model=self.model,
                openai_api_key=self.api_key,
                openai_api_base="https://api.siliconflow.cn/v1",
                temperature=temperature if temperature is not None else settings.TEMPERATURE,
                max_tokens=max_tokens if max_tokens is not None else settings.MAX_TOKENS,
                request_timeout=settings.LLM_REQUEST_TIMEOUT,
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
            model=self.model,
            openai_api_key=self.api_key,
            openai_api_base="https://api.siliconflow.cn/v1",
            temperature=temperature or settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
            streaming=True,  # 启用流式模式
            request_timeout=180.0,
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
            request_timeout=180.0,
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
            request_timeout=180.0,
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
            request_timeout=180.0,
        )
        response = small_llm.invoke([HumanMessage(content=prompt)])
        # 简单解析：按换行分割问题和答案，对格式要求不严格时至少给出原始文本
        content = response.content.strip()
        if not content:
            return []
        # 这里保持兼容，返回一个包含整体内容的 Q&A
        return [{"question": "关于这篇论文可能被问到的问题及答案", "answer": content}]
    
    def chat_with_image(
        self,
        message: str,
        image_base64: str,
        system_prompt: str = None,
        temperature: float = 0.3,
        max_tokens: int = 2000
    ) -> str:
        """
        多模态对话 - 支持图片输入
        
        Args:
            message: 文本消息
            image_base64: Base64 编码的图片
            system_prompt: 系统提示词
            temperature: 温度参数
            max_tokens: 最大 token 数
        
        Returns:
            AI 回复内容
        """
        import httpx
        import json
        
        # 使用 SiliconFlow 的多模态模型 API
        # 参考：https://docs.siliconflow.cn/docs/model-api
        api_url = "https://api.siliconflow.cn/v1/chat/completions"
        
        # 构建多模态消息
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        # 添加包含图片的用户消息
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": message
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        })
        
        # 调用 API
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # 使用支持多模态的模型
        # 注意：SiliconFlow 的多模态模型需要特殊权限，如果 403 则降级为文本分析
        vision_model = getattr(settings, "VISION_MODEL", "Pro/Qwen/Qwen2-VL-7B-Instruct")
        
        payload = {
            "model": vision_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(api_url, json=payload, headers=headers)
                
                # 如果是 403，尝试使用文本模型进行简单分析
                if response.status_code == 403:
                    print(f"[LLM] 多模态模型返回 403，可能需要权限。尝试使用文本模型...")
                    # 降级为文本分析（不含图片）
                    return self._fallback_text_analysis(message, system_prompt, temperature, max_tokens)
                
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                print(f"[LLM] 多模态 API 403 错误，降级为文本分析")
                return self._fallback_text_analysis(message, system_prompt, temperature, max_tokens)
            print(f"[LLM] 多模态调用失败: {e}")
            raise Exception(f"多模态模型调用失败: {str(e)}")
        except Exception as e:
            print(f"[LLM] 多模态调用失败: {e}")
            raise Exception(f"多模态模型调用失败: {str(e)}")
    
    def _fallback_text_analysis(
        self,
        message: str,
        system_prompt: str = None,
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> str:
        """降级方案：使用文本模型进行基础分析（不看图片）"""
        fallback_message = f"""{message}

注意：由于无法访问多模态模型，此分析仅基于文件名和提示词，未实际查看图片内容。
请提供一个合理的估计性分析结果。"""
        
        return self.chat(
            message=fallback_message,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )


# 全局 LLM 服务实例（懒加载）
_llm_service: LLMService = None


def get_llm_service(api_key: str = None, model: str = None) -> LLMService:
    """
    获取 LLM 服务实例
    注意：由于支持用户自定义模型，不再使用单例模式
    """
    return LLMService(api_key=api_key, model=model)

