"""
钉钉机器人通知服务
支持自定义机器人 Webhook + HMAC-SHA256 签名
"""

import time
import hmac
import hashlib
import base64
import urllib.parse
from typing import Optional, Dict, Any
from datetime import datetime

import httpx

from app.config import settings


class DingTalkService:
    """钉钉机器人服务"""

    def __init__(self, webhook_url: str = None, secret: str = None):
        self.webhook_url = webhook_url or settings.DINGTALK_WEBHOOK_URL
        self.secret = secret or settings.DINGTALK_SECRET

    def _generate_sign(self) -> tuple:
        """生成 HMAC-SHA256 签名"""
        timestamp = str(round(time.time() * 1000))
        string_to_sign = f"{timestamp}\n{self.secret}"
        hmac_code = hmac.new(
            self.secret.encode("utf-8"),
            string_to_sign.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).digest()
        sign = urllib.parse.quote_plus(base64.b64encode(hmac_code))
        return timestamp, sign

    def _build_url(self) -> str:
        """构建完整的 Webhook URL（含签名参数）"""
        url = self.webhook_url
        if self.secret:
            timestamp, sign = self._generate_sign()
            url += f"&timestamp={timestamp}&sign={sign}"
        return url

    async def _send_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """发送 HTTP POST 到钉钉 Webhook"""
        if not self.webhook_url:
            return {"errcode": -1, "errmsg": "DINGTALK_WEBHOOK_URL not configured"}

        url = self._build_url()
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                result = response.json()
                if result.get("errcode") != 0:
                    print(f"[DingTalk] API error: {result}")
                return result
        except Exception as e:
            print(f"[DingTalk] Request failed: {e}")
            return {"errcode": -1, "errmsg": str(e)}

    async def send_text(self, content: str, at_all: bool = False) -> Dict[str, Any]:
        """发送纯文本消息"""
        payload = {
            "msgtype": "text",
            "text": {"content": content},
            "at": {"isAtAll": at_all},
        }
        return await self._send_request(payload)

    async def send_markdown(
        self, title: str, text: str, at_all: bool = False
    ) -> Dict[str, Any]:
        """发送 Markdown 消息"""
        payload = {
            "msgtype": "markdown",
            "markdown": {"title": title, "text": text},
            "at": {"isAtAll": at_all},
        }
        return await self._send_request(payload)

    async def send_action_card(
        self,
        title: str,
        text: str,
        btn_title: str = "查看完整报告",
        btn_url: str = "",
    ) -> Dict[str, Any]:
        """发送 ActionCard 消息（单按钮）"""
        payload = {
            "msgtype": "actionCard",
            "actionCard": {
                "title": title,
                "text": text,
                "btnOrientation": "0",
                "singleTitle": btn_title,
                "singleURL": btn_url,
            },
        }
        return await self._send_request(payload)

    async def send_report(
        self,
        text_summary: str,
        report_url: str = None,
        report_title: str = None,
    ) -> Dict[str, Any]:
        """
        发送报告：直接发送 Markdown 格式的文字摘要
        如果提供了 report_url，则发送 ActionCard 带链接按钮
        """
        if not report_title:
            report_title = f"Athena AI行业推特日报 - {datetime.now().strftime('%Y-%m-%d')}"

        # 构建钉钉 markdown 内容
        md_text = f"## {report_title}\n\n{text_summary}\n\n---\n*{datetime.now().strftime('%Y-%m-%d %H:%M')} 自动生成*"

        # 如果有报告链接，使用 ActionCard；否则直接发送 Markdown
        if report_url:
            return await self.send_action_card(
                title=report_title,
                text=md_text,
                btn_title="查看完整报告",
                btn_url=report_url,
            )
        else:
            return await self.send_markdown(
                title=report_title,
                text=md_text,
            )
