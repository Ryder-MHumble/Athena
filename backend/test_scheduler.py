#!/usr/bin/env python3
"""
自动日报调度器测试脚本

用于测试定时日报功能是否正常工作
"""

import asyncio
import sys
import os
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings


async def test_report_generation():
    """测试报告生成功能"""
    print("=" * 60)
    print("测试 1: 报告生成功能")
    print("=" * 60)

    try:
        from app.services.report_service import generate_report

        print("[测试] 正在生成测试报告...")
        result = await generate_report(
            platform="twitter",
            hours=24,
            top_n=5,  # 减少数量以加快测试
        )

        if result.get("report_url"):
            print(f"✅ 报告生成成功!")
            print(f"   - 文件名: {result.get('filename')}")
            print(f"   - URL: {result.get('report_url')}")
            print(f"   - 生成时间: {result.get('generated_at')}")

            if result.get('analytics_summary'):
                summary = result['analytics_summary']
                print(f"   - 分析推文数: {summary.get('analysis_posts_count')}")
                print(f"   - 总浏览量: {summary.get('total_views')}")

            return True
        else:
            print("⚠️  报告生成完成，但未返回 URL（可能是数据不足或 Supabase 未配置）")
            return False

    except Exception as e:
        print(f"❌ 报告生成失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_scheduler_config():
    """测试调度器配置"""
    print("\n" + "=" * 60)
    print("测试 2: 调度器配置检查")
    print("=" * 60)

    print(f"[配置] ENABLE_AUTO_REPORT: {settings.ENABLE_AUTO_REPORT}")
    print(f"[配置] REPORT_SCHEDULE_TIME: {settings.REPORT_SCHEDULE_TIME}")
    print(f"[配置] REPORT_TIMEZONE: {settings.REPORT_TIMEZONE}")
    print(f"[配置] SUPABASE_URL: {settings.SUPABASE_URL[:30]}..." if settings.SUPABASE_URL else "[配置] SUPABASE_URL: 未配置")
    print(f"[配置] SUPABASE_SECRET_KEY: {'已配置' if settings.SUPABASE_SECRET_KEY else '未配置'}")
    print(f"[配置] DINGTALK_WEBHOOK_URL: {'已配置' if settings.DINGTALK_WEBHOOK_URL else '未配置'}")

    # 验证时间格式
    try:
        hour, minute = map(int, settings.REPORT_SCHEDULE_TIME.split(":"))
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            print(f"✅ 时间格式正确: {hour:02d}:{minute:02d}")
        else:
            print(f"❌ 时间格式错误: {settings.REPORT_SCHEDULE_TIME}")
            return False
    except Exception as e:
        print(f"❌ 时间格式解析失败: {e}")
        return False

    # 验证时区
    try:
        from apscheduler.triggers.cron import CronTrigger
        trigger = CronTrigger(hour=9, minute=0, timezone=settings.REPORT_TIMEZONE)
        print(f"✅ 时区配置正确: {settings.REPORT_TIMEZONE}")
    except Exception as e:
        print(f"❌ 时区配置错误: {e}")
        return False

    return True


async def test_scheduler_api():
    """测试调度器 API（需要服务运行）"""
    print("\n" + "=" * 60)
    print("测试 3: 调度器 API 测试（可选）")
    print("=" * 60)

    try:
        import httpx

        base_url = "http://localhost:8000"
        print(f"[测试] 尝试连接到 {base_url}...")

        async with httpx.AsyncClient() as client:
            # 测试健康检查
            response = await client.get(f"{base_url}/health", timeout=5.0)
            if response.status_code == 200:
                print(f"✅ 服务正在运行")

                # 测试调度器状态 API
                response = await client.get(f"{base_url}/api/report/scheduler/status", timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    scheduler = data.get('scheduler', {})
                    print(f"✅ 调度器状态 API 正常")
                    print(f"   - 启用状态: {scheduler.get('enabled')}")
                    print(f"   - 运行状态: {scheduler.get('running')}")
                    print(f"   - 下次运行: {scheduler.get('next_run')}")
                    return True
                else:
                    print(f"⚠️  调度器状态 API 返回错误: {response.status_code}")
                    return False
            else:
                print(f"⚠️  服务未响应: {response.status_code}")
                return False

    except httpx.ConnectError:
        print("⚠️  无法连接到服务（请先启动 FastAPI 服务）")
        print("   提示: 运行 'uvicorn app.main:app --reload' 启动服务")
        return None
    except Exception as e:
        print(f"❌ API 测试失败: {e}")
        return False


async def main():
    """主测试流程"""
    print("\n🚀 开始测试自动日报功能\n")
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    results = []

    # 测试 1: 配置检查
    result = await test_scheduler_config()
    results.append(("配置检查", result))

    # 测试 2: 报告生成
    result = await test_report_generation()
    results.append(("报告生成", result))

    # 测试 3: API 测试（可选）
    result = await test_scheduler_api()
    if result is not None:
        results.append(("API 测试", result))

    # 汇总结果
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)

    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name}: {status}")

    all_passed = all(r for _, r in results)

    if all_passed:
        print("\n🎉 所有测试通过！自动日报功能可以正常使用。")
        print("\n📝 下一步:")
        print("   1. 确保 Supabase 配置正确（在 .env 文件中）")
        print("   2. 启动服务: uvicorn app.main:app --reload")
        print("   3. 检查日志确认调度器已启动")
        print("   4. 等待定时任务执行或调用 POST /api/report/scheduler/trigger 手动触发")
    else:
        print("\n⚠️  部分测试失败，请检查上述错误信息。")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
