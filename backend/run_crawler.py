#!/usr/bin/env python3
"""
Overseas Source Crawler Script
Run this script to crawl all configured Twitter and YouTube sources.
Data will be saved to frontend/public/crawl-data directory.

Usage:
    cd backend
    python run_crawler.py
    
    # Or crawl specific platform only
    python run_crawler.py --twitter
    python run_crawler.py --youtube
"""

import asyncio
import argparse
import sys
import io
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 添加 app 目录到 path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.crawler_service import (
    crawl_all_twitter,
    crawl_all_youtube,
    crawl_all_overseas
)


async def main():
    parser = argparse.ArgumentParser(description='海外信源爬虫')
    parser.add_argument('--twitter', action='store_true', help='只爬取 Twitter')
    parser.add_argument('--youtube', action='store_true', help='只爬取 YouTube')
    args = parser.parse_args()
    
    print("=" * 60)
    print("[Athena] Overseas Source Crawler")
    print("=" * 60)
    
    if args.twitter:
        print("\n[Twitter] Starting crawl...\n")
        result = await crawl_all_twitter()
        print(f"\n[OK] Twitter crawl complete!")
        print(f"   - Sources: {result.get('sources_count', 0)}")
        print(f"   - Posts: {result.get('total_posts', 0)}")
        print(f"   - File: {result.get('file', 'N/A')}")
        
    elif args.youtube:
        print("\n[YouTube] Starting crawl...\n")
        result = await crawl_all_youtube()
        print(f"\n[OK] YouTube crawl complete!")
        print(f"   - Channels: {result.get('sources_count', 0)}")
        print(f"   - Videos: {result.get('total_videos', 0)}")
        print(f"   - File: {result.get('file', 'N/A')}")
        
    else:
        print("\n[Twitter] Starting crawl...")
        twitter_result = await crawl_all_twitter()
        print(f"   [OK] Twitter: {twitter_result.get('total_posts', 0)} posts")
        
        print("\n[YouTube] Starting crawl...")
        youtube_result = await crawl_all_youtube()
        print(f"   [OK] YouTube: {youtube_result.get('total_videos', 0)} videos")
        
        print("\n" + "=" * 60)
        print("[DONE] All crawls complete!")
        print("=" * 60)
        print(f"\nData files:")
        print(f"  Twitter: {twitter_result.get('file', 'N/A')}")
        print(f"  YouTube: {youtube_result.get('file', 'N/A')}")
    
    print("\n")


if __name__ == "__main__":
    asyncio.run(main())

