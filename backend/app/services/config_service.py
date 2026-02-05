"""
爬虫配置管理服务
提供配置的读取、保存和应用功能
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime


class CrawlerConfigService:
    """爬虫配置管理服务"""

    # 配置文件路径
    config_file = Path(__file__).parent.parent / "Info_sources" / "crawler_config.json"

    # 默认配置
    DEFAULT_CONFIG = {
        "auto_crawl_enabled": False,
        "interval_seconds": 10800,  # 3小时
        "last_crawl_time": None,
        "updated_at": None
    }

    @classmethod
    def load_config(cls) -> Dict[str, Any]:
        """
        加载配置
        如果文件不存在，返回默认配置
        """
        try:
            if cls.config_file.exists():
                with open(cls.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    # 确保所有必需字段存在
                    for key, value in cls.DEFAULT_CONFIG.items():
                        if key not in config:
                            config[key] = value
                    return config
            else:
                # 首次运行，创建默认配置文件
                print("[ConfigService] Config file not found, creating default config...")
                cls.save_config(cls.DEFAULT_CONFIG.copy())
                return cls.DEFAULT_CONFIG.copy()
        except Exception as e:
            print(f"[ConfigService] Error loading config: {e}, using default")
            return cls.DEFAULT_CONFIG.copy()

    @classmethod
    def save_config(cls, config: Dict[str, Any]) -> None:
        """
        保存配置到文件
        自动添加更新时间戳
        """
        try:
            # 确保目录存在
            cls.config_file.parent.mkdir(parents=True, exist_ok=True)

            # 添加更新时间戳
            config["updated_at"] = datetime.now().isoformat()

            # 写入文件
            with open(cls.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)

            print(f"[ConfigService] Config saved successfully")
        except Exception as e:
            print(f"[ConfigService] Error saving config: {e}")
            raise

    @classmethod
    def update_config(cls, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        更新配置
        只更新提供的字段，其他字段保持不变

        Args:
            updates: 要更新的字段字典

        Returns:
            更新后的完整配置
        """
        # 加载当前配置
        config = cls.load_config()

        # 更新字段
        config.update(updates)

        # 保存配置
        cls.save_config(config)

        return config

    @classmethod
    async def update_and_apply(cls, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        更新配置并应用到运行中的任务

        注意：这个方法会修改全局的 crawler_config 状态
        需要在 main.py 中正确处理

        Args:
            updates: 要更新的字段字典

        Returns:
            更新后的完整配置
        """
        # 更新配置文件
        config = cls.update_config(updates)

        # 尝试应用到运行中的任务
        try:
            from app.main import crawler_config

            # 更新全局配置
            if "auto_crawl_enabled" in updates:
                crawler_config["enabled"] = updates["auto_crawl_enabled"]
                print(f"[ConfigService] Updated global enabled: {crawler_config['enabled']}")

            if "interval_seconds" in updates:
                old_interval = crawler_config["interval"]
                crawler_config["interval"] = updates["interval_seconds"]
                print(f"[ConfigService] Updated global interval: {old_interval}s -> {crawler_config['interval']}s")

                # 如果间隔变化，标记需要重启任务
                if old_interval != crawler_config["interval"]:
                    crawler_config["should_restart"] = True
                    print(f"[ConfigService] Marked task for restart")
        except ImportError:
            # 如果无法导入（例如在测试环境），忽略
            print("[ConfigService] Cannot import crawler_config, skipping runtime update")
        except Exception as e:
            print(f"[ConfigService] Error updating runtime config: {e}")

        return config

    @classmethod
    def get_config_with_computed_fields(cls) -> Dict[str, Any]:
        """
        获取配置，包含计算字段
        添加 interval_hours 等便于前端展示的字段
        """
        config = cls.load_config()

        # 添加小时数（便于前端展示）
        config["interval_hours"] = config["interval_seconds"] / 3600.0

        return config

    @classmethod
    def init_from_env(cls, env_enabled: bool, env_interval: int) -> Dict[str, Any]:
        """
        从环境变量初始化配置
        如果配置文件不存在，使用环境变量创建初始配置

        Args:
            env_enabled: ENABLE_AUTO_CRAWL 环境变量值
            env_interval: CRAWLER_INTERVAL_SECONDS 环境变量值

        Returns:
            初始化后的配置
        """
        if not cls.config_file.exists():
            print(f"[ConfigService] Initializing config from environment variables...")
            initial_config = {
                "auto_crawl_enabled": env_enabled,
                "interval_seconds": env_interval,
                "last_crawl_time": None,
                "updated_at": datetime.now().isoformat()
            }
            cls.save_config(initial_config)
            print(f"[ConfigService] Created initial config: enabled={env_enabled}, interval={env_interval}s")
            return initial_config
        else:
            # 配置文件已存在，使用文件中的配置（文件优先级更高）
            config = cls.load_config()
            print(f"[ConfigService] Using existing config file (overrides env vars)")
            return config

    @classmethod
    def update_last_crawl_time(cls) -> None:
        """更新上次爬取时间为当前时间"""
        config = cls.load_config()
        config["last_crawl_time"] = datetime.now().isoformat()
        cls.save_config(config)
        print(f"[ConfigService] Updated last_crawl_time")
