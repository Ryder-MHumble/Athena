"""
PDF 智析服务模块
通过 MinerU 官方云 API 进行 PDF 解析、翻译和图表分析

官方 API 文档: https://mineru.net/apiManage/docs

API 调用流程 (异步任务模式):
1. POST /api/v4/file-urls/batch - 获取预签名上传 URL
2. PUT {presigned_url} - 上传 PDF 文件
3. GET /api/v4/extract-results/batch/{batch_id} - 轮询获取结果
"""

import os
import json
import asyncio
import base64
import re
import traceback
import uuid
import zipfile
import io
import httpx
from typing import Dict, List, Any, Optional, Callable
from pathlib import Path

from app.config import settings
from app.services.llm_service import get_llm_service
from app.prompts.pdf_analyzer_prompt import (
    PDF_TRANSLATION_SYSTEM_PROMPT,
    BATCH_CHART_ANALYSIS_SYSTEM_PROMPT
)


class PDFAnalyzerService:
    """PDF 分析服务 - 通过 MinerU 官方云 API"""
    
    # MinerU 官方云 API 基础端点
    MINERU_API_BASE = "https://mineru.net/api/v4"
    
    def __init__(self, api_key: str = None, mineru_api_key: str = None):
        self.llm_api_key = api_key
        self.llm_service = get_llm_service(api_key=api_key)
        
        # MinerU API Key - 优先使用传入的，否则从环境变量读取
        self.mineru_api_key = mineru_api_key or os.getenv("MINERU_API_KEY", "")
        
        # 输出目录
        self.output_base_dir = Path(settings.UPLOAD_DIR) / "pdf_analysis"
        self.output_base_dir.mkdir(parents=True, exist_ok=True)
        
        if not self.mineru_api_key:
            print("[PDFAnalyzer] 警告: 未配置 MinerU API Key")
    
    async def analyze_pdf(
        self, 
        pdf_path: str = None,
        pdf_bytes: bytes = None,
        pdf_url: str = None,
        translate: bool = False,  # 默认关闭翻译（太慢）
        extract_charts: bool = True,
        progress_callback: Callable = None
    ) -> Dict[str, Any]:
        """
        完整的 PDF 分析流程
        
        支持三种输入方式：
        1. pdf_path: 本地文件路径
        2. pdf_bytes: 文件字节内容
        3. pdf_url: 在线 PDF URL（直接传给 MinerU，无需下载）
        
        注意：翻译功能已默认关闭，因为 LLM 翻译太慢
        """
        result = {
            "original_text": "",
            "translated_text": "",
            "charts": [],
            "metadata": {}
        }
        
        try:
            # 1. 调用 MinerU API 解析 PDF
            if progress_callback:
                await progress_callback("parsing", 10)
            
            # 如果提供了 URL，使用 URL 模式
            if pdf_url:
                print(f"[PDFAnalyzer] 使用 URL 模式解析: {pdf_url}")
                parse_result = await self._call_mineru_api(pdf_url=pdf_url, progress_callback=progress_callback)
            else:
                # 读取 PDF 内容
                if pdf_bytes is None:
                    if pdf_path is None:
                        raise ValueError("必须提供 pdf_path、pdf_bytes 或 pdf_url")
                    with open(pdf_path, "rb") as f:
                        pdf_bytes = f.read()
                
                print(f"[PDFAnalyzer] 使用文件上传模式解析 PDF (大小: {len(pdf_bytes)} bytes)...")
                parse_result = await self._call_mineru_api(pdf_bytes=pdf_bytes, progress_callback=progress_callback)
            
            if not parse_result:
                raise Exception("MinerU API 返回空结果")
            
            result["original_text"] = parse_result.get("text", "")
            result["metadata"] = parse_result.get("metadata", {})
            
            print(f"[PDFAnalyzer] 解析完成，文本长度: {len(result['original_text'])}, 图片数量: {len(parse_result.get('images', []))}")
            
            # 2. 翻译文本（已禁用，太慢）
            # if translate and result["original_text"]:
            #     if progress_callback:
            #         await progress_callback("translating", 50)
            #     
            #     print(f"[PDFAnalyzer] 开始翻译...")
            #     result["translated_text"] = await self._translate_text(result["original_text"])
            
            # 3. 处理图表（只提取，不分析）
            if extract_charts:
                if progress_callback:
                    await progress_callback("extracting", 70)
                
                images = parse_result.get("images", [])
                if images:
                    print(f"[PDFAnalyzer] 提取了 {len(images)} 张图片")
                    # 直接使用图片，不进行 LLM 分析（太慢）
                    result["charts"] = self._format_images(images)
            
            if progress_callback:
                await progress_callback("complete", 100)
            
            return result
            
        except Exception as e:
            print(f"[PDFAnalyzer] PDF 分析失败: {str(e)}")
            print(f"[PDFAnalyzer] 详细错误: {traceback.format_exc()}")
            raise Exception(f"PDF 分析失败: {str(e)}")
    
    async def _call_mineru_api(
        self, 
        pdf_bytes: bytes = None,
        pdf_url: str = None,
        progress_callback: Callable = None
    ) -> Dict[str, Any]:
        """
        调用 MinerU 官方云 API
        
        API 文档: https://mineru.net/apiManage/docs
        
        支持两种模式：
        1. 文件上传模式：先获取预签名URL，上传文件，再轮询结果
        2. URL 模式：直接传 URL，创建任务，再轮询结果
        """
        if not self.mineru_api_key:
            raise Exception(
                "MinerU API Key 未配置！\n\n"
                "请在设置页面配置 MinerU API Key\n"
                "获取地址: https://mineru.net"
            )
        
        # 如果提供了 URL，使用 URL 模式
        if pdf_url:
            return await self._call_mineru_api_url_mode(pdf_url, progress_callback)
        
        # 否则使用文件上传模式
        if not pdf_bytes:
            raise Exception("必须提供 pdf_bytes 或 pdf_url")
        
        return await self._call_mineru_api_file_mode(pdf_bytes, progress_callback)
    
    async def _call_mineru_api_url_mode(
        self,
        pdf_url: str,
        progress_callback: Callable = None
    ) -> Dict[str, Any]:
        """
        使用 URL 模式调用 MinerU API
        
        流程：
        1. POST /api/v4/extract/task - 创建解析任务
        2. GET /api/v4/extract/task/{task_id} - 轮询获取结果
        """
        print(f"[PDFAnalyzer] 使用 URL 模式解析: {pdf_url}")
        
        headers = {
            "Authorization": f"Bearer {self.mineru_api_key}",
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
        
        async with httpx.AsyncClient(timeout=600.0) as client:
            # Step 1: 创建解析任务
            print(f"[PDFAnalyzer] Step 1: 创建解析任务...")
            
            task_url = f"{self.MINERU_API_BASE}/extract/task"
            task_body = {
                "url": pdf_url,
                "model_version": "vlm"
            }
            
            print(f"[PDFAnalyzer] 请求 URL: {task_url}")
            print(f"[PDFAnalyzer] 请求体: {json.dumps(task_body, indent=2)}")
            
            try:
                response = await client.post(
                    task_url,
                    headers=headers,
                    json=task_body
                )
                
                print(f"[PDFAnalyzer] Step 1 响应状态: {response.status_code}")
                print(f"[PDFAnalyzer] Step 1 响应内容: {response.text[:1000]}")
                
                if response.status_code == 401:
                    raise Exception("API Key 认证失败，请检查 MinerU API Key 是否正确")
                elif response.status_code == 403:
                    raise Exception("API Key 权限不足或已过期")
                
                response.raise_for_status()
                task_response = response.json()
                
            except httpx.HTTPStatusError as e:
                error_text = e.response.text if hasattr(e.response, 'text') else str(e)
                print(f"[PDFAnalyzer] Step 1 HTTP 错误: {error_text}")
                raise Exception(f"创建解析任务失败: {error_text}")
            
            # 解析响应获取 task_id
            # 响应格式: {"code":0,"msg":"ok","data":{"task_id":"xxx"}}
            if task_response.get("code") != 0:
                error_msg = task_response.get("msg", "未知错误")
                raise Exception(f"MinerU API 错误: {error_msg}")
            
            response_data = task_response.get("data", {})
            task_id = response_data.get("task_id")
            
            if not task_id:
                print(f"[PDFAnalyzer] 意外的响应格式: {json.dumps(task_response, indent=2)}")
                raise Exception(f"无法解析 MinerU API 响应")
            
            print(f"[PDFAnalyzer] 获取到 task_id: {task_id}")
            
            if progress_callback:
                await progress_callback("processing", 20)
            
            # Step 2: 轮询获取解析结果
            print(f"[PDFAnalyzer] Step 2: 轮询获取解析结果...")
            
            result_url = f"{self.MINERU_API_BASE}/extract/task/{task_id}"
            
            max_attempts = 120  # 最多等待 10 分钟
            for attempt in range(max_attempts):
                await asyncio.sleep(5)  # 每 5 秒轮询一次
                
                try:
                    result_response = await client.get(
                        result_url,
                        headers={
                            "Authorization": f"Bearer {self.mineru_api_key}",
                            "Accept": "*/*"
                        }
                    )
                    
                    print(f"[PDFAnalyzer] 轮询 (尝试 {attempt + 1}): 状态 {result_response.status_code}")
                    
                    if result_response.status_code == 200:
                        result_data = result_response.json()
                        
                        # 响应格式: {"code":0,"msg":"ok","data":{...}}
                        if result_data.get("code") != 0:
                            error_msg = result_data.get("msg", "未知错误")
                            raise Exception(f"MinerU API 错误: {error_msg}")
                        
                        inner_data = result_data.get("data", {})
                        
                        # 检查任务状态
                        state = inner_data.get("state", "").lower()
                        
                        # 打印状态
                        if attempt % 6 == 0:
                            print(f"[PDFAnalyzer] 任务状态: state={state}")
                        
                        # 检查是否完成
                        if state in ["done", "completed", "success", "finished"]:
                            print(f"[PDFAnalyzer] ✓ 任务状态=完成，开始解析结果...")
                            return await self._parse_single_task_result(inner_data)
                        
                        # 检查是否失败
                        if state in ["failed", "error"]:
                            error_msg = inner_data.get("error") or inner_data.get("err_msg") or "未知错误"
                            raise Exception(f"MinerU 解析任务失败: {error_msg}")
                        
                        # 更新进度
                        if progress_callback:
                            progress = min(20 + (attempt * 0.5), 45)
                            await progress_callback("processing", int(progress))
                        
                    elif result_response.status_code == 404:
                        # 任务可能还未创建完成
                        pass
                    else:
                        print(f"[PDFAnalyzer] 轮询响应: {result_response.text[:500]}")
                        
                except Exception as e:
                    if "解析任务失败" in str(e):
                        raise
                    print(f"[PDFAnalyzer] 轮询请求异常: {e}")
            
            raise Exception("解析任务超时，请稍后重试")
    
    async def _call_mineru_api_file_mode(
        self,
        pdf_bytes: bytes,
        progress_callback: Callable = None
    ) -> Dict[str, Any]:
        """
        使用文件上传模式调用 MinerU API
        
        流程:
        1. POST /api/v4/file-urls/batch - 获取预签名上传 URL
        2. PUT {presigned_url} - 上传文件
        3. GET /api/v4/extract-results/batch/{batch_id} - 轮询结果
        """
        print(f"[PDFAnalyzer] 使用文件上传模式，文件大小: {len(pdf_bytes)} bytes")
        
        headers = {
            "Authorization": f"Bearer {self.mineru_api_key}",
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
        
        # 生成唯一的文件标识
        data_id = str(uuid.uuid4())[:8]
        filename = f"document_{data_id}.pdf"
        
        async with httpx.AsyncClient(timeout=600.0) as client:
            # Step 1: 请求预签名上传 URL
            print(f"[PDFAnalyzer] Step 1: 请求预签名上传 URL...")
            
            batch_request_url = f"{self.MINERU_API_BASE}/file-urls/batch"
            batch_request_body = {
                "files": [
                    {"name": filename, "data_id": data_id}
                ],
                "model_version": "vlm"
            }
            
            print(f"[PDFAnalyzer] 请求 URL: {batch_request_url}")
            print(f"[PDFAnalyzer] 请求体: {json.dumps(batch_request_body, indent=2)}")
            
            try:
                response = await client.post(
                    batch_request_url,
                    headers=headers,
                    json=batch_request_body
                )
                
                print(f"[PDFAnalyzer] Step 1 响应状态: {response.status_code}")
                print(f"[PDFAnalyzer] Step 1 响应内容: {response.text[:1000]}")
                
                if response.status_code == 401:
                    raise Exception("API Key 认证失败，请检查 MinerU API Key 是否正确")
                elif response.status_code == 403:
                    raise Exception("API Key 权限不足或已过期")
                
                response.raise_for_status()
                batch_response = response.json()
                
            except httpx.HTTPStatusError as e:
                error_text = e.response.text if hasattr(e.response, 'text') else str(e)
                print(f"[PDFAnalyzer] Step 1 HTTP 错误: {error_text}")
                raise Exception(f"获取上传 URL 失败: {error_text}")
            
            # 解析响应
            if batch_response.get("code") != 0:
                error_msg = batch_response.get("msg", "未知错误")
                raise Exception(f"MinerU API 错误: {error_msg}")
            
            response_data = batch_response.get("data", {})
            batch_id = response_data.get("batch_id")
            file_urls = response_data.get("file_urls", [])
            
            if not batch_id or not file_urls:
                print(f"[PDFAnalyzer] 意外的响应格式: {json.dumps(batch_response, indent=2)}")
                raise Exception(f"无法解析 MinerU API 响应")
            
            upload_url = file_urls[0]
            print(f"[PDFAnalyzer] 获取到 batch_id: {batch_id}")
            print(f"[PDFAnalyzer] 获取到上传 URL: {upload_url[:100]}...")
            
            if progress_callback:
                await progress_callback("uploading", 15)
            
            # Step 2: 上传 PDF 文件
            print(f"[PDFAnalyzer] Step 2: 上传 PDF 文件...")
            
            try:
                # 预签名 URL 上传不需要额外的 headers，否则会导致 403
                upload_response = await client.put(
                    upload_url,
                    content=pdf_bytes
                )
                
                print(f"[PDFAnalyzer] Step 2 上传响应状态: {upload_response.status_code}")
                print(f"[PDFAnalyzer] Step 2 上传响应: {upload_response.text[:200] if upload_response.text else 'empty'}")
                
                if upload_response.status_code not in [200, 201, 204]:
                    raise Exception(f"文件上传失败: {upload_response.status_code} - {upload_response.text[:200]}")
                    
            except Exception as e:
                print(f"[PDFAnalyzer] Step 2 上传错误: {e}")
                raise Exception(f"上传文件失败: {e}")
            
            if progress_callback:
                await progress_callback("processing", 25)
            
            # Step 3: 轮询获取解析结果
            print(f"[PDFAnalyzer] Step 3: 轮询获取解析结果...")
            
            result_url = f"{self.MINERU_API_BASE}/extract-results/batch/{batch_id}"
            
            max_attempts = 120
            for attempt in range(max_attempts):
                await asyncio.sleep(5)
                
                try:
                    result_response = await client.get(
                        result_url,
                        headers={
                            "Authorization": f"Bearer {self.mineru_api_key}",
                            "Accept": "*/*"
                        }
                    )
                    
                    if attempt % 6 == 0:  # 每 30 秒打印一次详细信息
                        print(f"[PDFAnalyzer] 轮询 (尝试 {attempt + 1}/{max_attempts}): 状态 {result_response.status_code}")
                    
                    if result_response.status_code == 200:
                        result_data = result_response.json()
                        
                        # 打印完整响应用于调试
                        if attempt % 6 == 0:
                            print(f"[PDFAnalyzer] 响应数据: {json.dumps(result_data, indent=2)[:500]}")
                        
                        if result_data.get("code") != 0:
                            error_msg = result_data.get("msg", "未知错误")
                            print(f"[PDFAnalyzer] API 返回错误码: code={result_data.get('code')}, msg={error_msg}")
                            raise Exception(f"MinerU API 错误: {error_msg}")
                        
                        inner_data = result_data.get("data", {})
                        
                        # 批量任务结果在 extract_result 数组中
                        extract_result = inner_data.get("extract_result", [])
                        
                        # 获取第一个任务的状态
                        task_state = ""
                        if extract_result and len(extract_result) > 0:
                            first_task = extract_result[0]
                            task_state = first_task.get("state", "").lower()
                        
                        # 打印当前状态
                        if attempt % 6 == 0:
                            print(f"[PDFAnalyzer] 任务状态: state={task_state}, tasks={len(extract_result)}")
                        
                        # 检查是否完成
                        completed_states = ["done", "completed", "success", "finished"]
                        if task_state in completed_states:
                            print(f"[PDFAnalyzer] ✓ 解析完成！state={task_state}")
                            return await self._parse_batch_result(inner_data, data_id)
                        
                        # 检查是否失败
                        failed_states = ["failed", "error"]
                        if task_state in failed_states:
                            if extract_result and len(extract_result) > 0:
                                error_msg = extract_result[0].get("err_msg") or "未知错误"
                            else:
                                error_msg = "未知错误"
                            print(f"[PDFAnalyzer] ✗ 解析失败: {error_msg}")
                            raise Exception(f"MinerU 解析任务失败: {error_msg}")
                        
                        # 更新进度
                        if progress_callback:
                            progress = min(25 + (attempt * 0.5), 45)
                            await progress_callback("processing", int(progress))
                        
                    elif result_response.status_code == 404:
                        if attempt % 6 == 0:
                            print(f"[PDFAnalyzer] 任务尚未就绪 (404)")
                    else:
                        print(f"[PDFAnalyzer] 意外状态码 {result_response.status_code}: {result_response.text[:500]}")
                        
                except Exception as e:
                    if "解析任务失败" in str(e) or "API 错误" in str(e):
                        raise
                    if attempt % 6 == 0:
                        print(f"[PDFAnalyzer] 轮询请求异常: {e}")
            
            raise Exception(f"解析任务超时（已等待 {max_attempts * 5 / 60:.1f} 分钟），请稍后重试")
    
    async def _parse_single_task_result(self, result_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        解析单任务结果
        
        单任务响应格式 (GET /extract/task/{task_id}):
        {
            "task_id": "xxx",
            "state": "done",
            "full_zip_url": "..."
        }
        """
        print(f"[PDFAnalyzer] ====== 开始解析单任务结果 ======")
        print(f"[PDFAnalyzer] 响应数据: {json.dumps(result_data, indent=2)[:2000]}")
        
        text = ""
        images = []
        full_zip_url = result_data.get("full_zip_url", "")
        task_id = result_data.get("task_id", "")
        
        # 如果有 full_zip_url，下载并解压获取内容
        if full_zip_url:
            print(f"[PDFAnalyzer] ✓ 找到 full_zip_url: {full_zip_url[:100]}...")
            print(f"[PDFAnalyzer] 开始下载和解压 ZIP...")
            text, images = await self._download_and_extract_zip_async(full_zip_url)
            print(f"[PDFAnalyzer] ✓ ZIP 处理完成: 文本={len(text)}字符, 图片={len(images)}张")
        else:
            print(f"[PDFAnalyzer] ✗ 未找到 full_zip_url")
        
        # 如果没有从 ZIP 获取到内容，尝试直接获取
        if not text:
            print(f"[PDFAnalyzer] 尝试从响应数据直接获取内容...")
            text = result_data.get("md_content", "") or result_data.get("markdown", "") or result_data.get("content", "")
            if text:
                print(f"[PDFAnalyzer] ✓ 从响应数据获取到 {len(text)} 字符")
        
        print(f"[PDFAnalyzer] ====== 解析完成 ======")
        
        return {
            "text": text,
            "images": images,
            "metadata": {
                "parser": "mineru-api-v4-single",
                "task_id": task_id,
                "full_zip_url": full_zip_url
            }
        }
    
    async def _parse_batch_result(self, result_data: Dict[str, Any], data_id: str) -> Dict[str, Any]:
        """
        解析批量任务结果
        
        批量任务响应格式 (GET /extract-results/batch/{batch_id}):
        {
            "extract_status": "done",
            "extract_result": [
                {
                    "data_id": "xxx",
                    "full_zip_url": "...",
                    "md_url": "...",
                }
            ]
        }
        """
        print(f"[PDFAnalyzer] 解析批量任务结果: {json.dumps(result_data, indent=2)[:2000]}")
        
        text = ""
        images = []
        full_zip_url = ""
        
        # 批量任务结果
        extract_results = result_data.get("extract_result", [])
        
        target_result = None
        for r in extract_results:
            if r.get("data_id") == data_id:
                target_result = r
                break
        
        if not target_result and extract_results:
            target_result = extract_results[0]
        
        if target_result:
            full_zip_url = target_result.get("full_zip_url", "")
        
        # 如果有 full_zip_url，下载并解压获取内容
        if full_zip_url:
            print(f"[PDFAnalyzer] ✓ 找到 full_zip_url: {full_zip_url[:100]}...")
            print(f"[PDFAnalyzer] 开始异步下载和解压 ZIP...")
            text, images = await self._download_and_extract_zip_async(full_zip_url)
            print(f"[PDFAnalyzer] ✓ ZIP 处理完成: 文本={len(text)}字符, 图片={len(images)}张")
        
        # 如果没有从 ZIP 获取到内容，尝试直接获取
        if not text:
            text = result_data.get("md_content", "") or result_data.get("markdown", "") or result_data.get("content", "")
        
        return {
            "text": text,
            "images": images,
            "metadata": {
                "parser": "mineru-api-v4-batch",
                "data_id": data_id,
                "full_zip_url": full_zip_url
            }
        }
    
    async def _download_and_extract_zip_async(self, zip_url: str) -> tuple:
        """下载并解压结果 ZIP 文件（异步版本）"""
        text = ""
        images = []
        
        try:
            print(f"[PDFAnalyzer] 开始异步下载 ZIP: {zip_url[:100]}...")
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(zip_url)
                if response.status_code != 200:
                    print(f"[PDFAnalyzer] ✗ 下载 ZIP 失败: {response.status_code}")
                    return text, images
                
                zip_bytes = response.content
                print(f"[PDFAnalyzer] ✓ ZIP 下载成功，大小: {len(zip_bytes) / 1024:.1f} KB")
                
                # 解压 ZIP 文件
                with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zf:
                    file_list = zf.namelist()
                    print(f"[PDFAnalyzer] ZIP 包含 {len(file_list)} 个文件")
                    
                    # 优先查找 full.md
                    md_files = [f for f in file_list if f.endswith('.md')]
                    print(f"[PDFAnalyzer] 找到 {len(md_files)} 个 Markdown 文件: {md_files}")
                    
                    # 优先使用 full.md
                    md_file = None
                    if 'full.md' in file_list:
                        md_file = 'full.md'
                    elif md_files:
                        md_file = md_files[0]
                    
                    if md_file:
                        text = zf.read(md_file).decode('utf-8', errors='ignore')
                        print(f"[PDFAnalyzer] ✓ 读取 Markdown: {md_file}, 长度: {len(text)} 字符")
                    else:
                        print(f"[PDFAnalyzer] ✗ 未找到 Markdown 文件")
                    
                    # 提取图片文件（通常在 images/ 目录下）
                    # 使用 UUID 前缀确保图片 ID 唯一，避免不同 PDF 的图片 ID 冲突
                    session_id = str(uuid.uuid4())[:8]
                    img_idx = 0
                    for filename in file_list:
                        # 检查是否是图片文件
                        lower_name = filename.lower()
                        is_image = any(lower_name.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp'])
                        
                        if is_image and not filename.startswith('__MACOSX'):
                            try:
                                img_bytes = zf.read(filename)
                                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                                
                                # 获取文件扩展名
                                ext = filename.split('.')[-1].lower()
                                if ext == 'jpg':
                                    ext = 'jpeg'
                                
                                # 提取文件名（去掉路径）
                                simple_filename = filename.split('/')[-1]
                                
                                # 使用 session_id 前缀确保唯一性
                                images.append({
                                    "id": f"{session_id}_{img_idx}",
                                    "page": img_idx + 1,
                                    "filename": simple_filename,
                                    "base64": img_base64,
                                    "format": ext
                                })
                                img_idx += 1
                                
                            except Exception as e:
                                print(f"[PDFAnalyzer] ✗ 读取图片失败 {filename}: {e}")
                    
                    print(f"[PDFAnalyzer] ✓ 提取了 {len(images)} 张图片 (session: {session_id})")
                    
        except Exception as e:
            print(f"[PDFAnalyzer] ✗ 下载/解压 ZIP 失败: {e}")
            print(f"[PDFAnalyzer] 详细错误: {traceback.format_exc()}")
        
        return text, images
    
    def _download_and_extract_zip(self, zip_url: str) -> tuple:
        """下载并解压结果 ZIP 文件"""
        text = ""
        images = []
        
        try:
            print(f"[PDFAnalyzer] 开始下载 ZIP: {zip_url[:100]}...")
            
            with httpx.Client(timeout=120.0) as client:
                response = client.get(zip_url)
                if response.status_code != 200:
                    print(f"[PDFAnalyzer] ✗ 下载 ZIP 失败: {response.status_code}")
                    return text, images
                
                zip_bytes = response.content
                print(f"[PDFAnalyzer] ✓ ZIP 下载成功，大小: {len(zip_bytes) / 1024:.1f} KB")
                
                # 解压 ZIP 文件
                with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zf:
                    file_list = zf.namelist()
                    print(f"[PDFAnalyzer] ZIP 包含 {len(file_list)} 个文件")
                    
                    # 优先查找 full.md
                    md_files = [f for f in file_list if f.endswith('.md')]
                    print(f"[PDFAnalyzer] 找到 {len(md_files)} 个 Markdown 文件: {md_files}")
                    
                    # 优先使用 full.md
                    md_file = None
                    if 'full.md' in file_list:
                        md_file = 'full.md'
                    elif md_files:
                        md_file = md_files[0]
                    
                    if md_file:
                        text = zf.read(md_file).decode('utf-8', errors='ignore')
                        print(f"[PDFAnalyzer] ✓ 读取 Markdown: {md_file}, 长度: {len(text)} 字符")
                    else:
                        print(f"[PDFAnalyzer] ✗ 未找到 Markdown 文件")
                    
                    # 提取图片文件（通常在 images/ 目录下）
                    # 使用 UUID 前缀确保图片 ID 唯一
                    session_id = str(uuid.uuid4())[:8]
                    img_idx = 0
                    for filename in file_list:
                        # 检查是否是图片文件
                        lower_name = filename.lower()
                        is_image = any(lower_name.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp'])
                        
                        if is_image and not filename.startswith('__MACOSX'):
                            try:
                                img_bytes = zf.read(filename)
                                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                                
                                # 获取文件扩展名
                                ext = filename.split('.')[-1].lower()
                                if ext == 'jpg':
                                    ext = 'jpeg'
                                
                                # 提取文件名（去掉路径）
                                simple_filename = filename.split('/')[-1]
                                
                                # 使用 session_id 前缀确保唯一性
                                images.append({
                                    "id": f"{session_id}_{img_idx}",
                                    "page": img_idx + 1,
                                    "filename": simple_filename,
                                    "base64": img_base64,
                                    "format": ext
                                })
                                img_idx += 1
                                
                            except Exception as e:
                                print(f"[PDFAnalyzer] ✗ 读取图片失败 {filename}: {e}")
                    
                    print(f"[PDFAnalyzer] ✓ 提取了 {len(images)} 张图片 (session: {session_id})")
                    
        except Exception as e:
            print(f"[PDFAnalyzer] ✗ 下载/解压 ZIP 失败: {e}")
            print(f"[PDFAnalyzer] 详细错误: {traceback.format_exc()}")
        
        return text, images
    
    def _parse_direct_result(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """解析直接返回的结果"""
        text = data.get("md_content", "") or data.get("markdown", "") or data.get("text", "") or data.get("content", "")
        
        images = []
        raw_images = data.get("images", {})
        
        # 使用 UUID 前缀确保图片 ID 唯一
        session_id = str(uuid.uuid4())[:8]
        
        if isinstance(raw_images, dict):
            for idx, (filename, img_data) in enumerate(raw_images.items()):
                base64_data = img_data
                if isinstance(img_data, str) and img_data.startswith("data:"):
                    if "," in img_data:
                        base64_data = img_data.split(",")[1]
                
                images.append({
                    "id": f"{session_id}_{idx}",
                    "page": idx + 1,
                    "filename": filename,
                    "base64": base64_data,
                    "format": filename.split(".")[-1] if "." in filename else "png"
                })
        elif isinstance(raw_images, list):
            for idx, img in enumerate(raw_images):
                if isinstance(img, dict):
                    images.append({
                        "id": f"{session_id}_{idx}",
                        "page": img.get("page", idx + 1),
                        "base64": img.get("base64", img.get("data", "")),
                        "format": img.get("format", "png")
                    })
        
        return {
            "text": text,
            "images": images,
            "metadata": {"parser": "mineru-api-v4-direct"}
        }
    
    async def _translate_text(self, text: str) -> str:
        """使用 LLM 翻译文本"""
        if not text.strip():
            return ""
        
        max_chars = 3000
        paragraphs = text.split("\n\n")
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for para in paragraphs:
            if current_length + len(para) > max_chars and current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = [para]
                current_length = len(para)
            else:
                current_chunk.append(para)
                current_length += len(para)
        
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))
        
        print(f"[PDFAnalyzer] 翻译分为 {len(chunks)} 个块")
        
        translated_chunks = []
        for i, chunk in enumerate(chunks):
            try:
                print(f"[PDFAnalyzer] 翻译第 {i+1}/{len(chunks)} 块...")
                translated = self.llm_service.chat(
                    message=f"请将以下内容翻译成中文：\n\n{chunk}",
                    system_prompt=PDF_TRANSLATION_SYSTEM_PROMPT
                )
                translated_chunks.append(translated)
            except Exception as e:
                print(f"[PDFAnalyzer] 翻译块 {i+1} 失败: {e}")
                translated_chunks.append(f"[翻译失败] {chunk[:100]}...")
        
        return "\n\n".join(translated_chunks)
    
    def _format_images(self, images: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """格式化图片数据（不进行 LLM 分析，直接返回）"""
        if not images:
            return []
        
        formatted_images = []
        for idx, img in enumerate(images):
            formatted_images.append({
                "id": img.get("id", f"img_{idx}"),
                "pageNumber": img.get("page", idx + 1),
                "imageUrl": f"/api/pdf-analyzer/image/{img.get('id', f'img_{idx}')}",
                "imagePath": img.get("path", ""),
                "base64": img.get("base64", ""),
                "format": img.get("format", "png"),
                "filename": img.get("filename", f"image_{idx}.png"),
                "type": "image",
                "title": f"图片 {idx + 1}",
                "summary": "",
                "keyPoints": []
            })
        
        return formatted_images
    
    def _parse_json_response(self, response: str) -> List[Dict[str, Any]]:
        """解析 LLM 返回的 JSON"""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass
        
        json_match = re.search(r'\[[\s\S]*\]', response)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            try:
                obj = json.loads(json_match.group())
                return [obj] if isinstance(obj, dict) else obj
            except json.JSONDecodeError:
                pass
        
        return []


def get_pdf_analyzer_service(api_key: str = None, mineru_api_key: str = None) -> PDFAnalyzerService:
    """获取 PDF 分析服务实例"""
    return PDFAnalyzerService(api_key=api_key, mineru_api_key=mineru_api_key)
