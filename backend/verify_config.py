"""
交互式 Supabase 配置验证
"""

import sys

def main():
    print("\n" + "=" * 70)
    print("  Supabase 配置验证工具")
    print("=" * 70)
    
    print("\n请输入您的 Supabase 配置信息：")
    print("(这些信息可以在 Supabase Dashboard → Project Settings 中找到)\n")
    
    supabase_url = input("1. Project URL: ").strip()
    if not supabase_url:
        supabase_url = "https://casxuvpohhbuqvmkqunb.supabase.co"
        print(f"   使用默认值: {supabase_url}")
    
    supabase_key = input("\n2. Service Role Secret (用于后端): ").strip()
    if not supabase_key:
        print("   ❌ Service Role Secret 是必需的！")
        return
    
    postgres_password = input("\n3. PostgreSQL 密码 (可选，用于直接 DB 诊断): ").strip()
    
    print("\n" + "=" * 70)
    print("  验证配置...")
    print("=" * 70)
    
    # 测试 Supabase JS Client
    print("\n1️⃣  测试 Supabase REST API...")
    try:
        from supabase import create_client
        
        client = create_client(supabase_url, supabase_key)
        
        # 尝试查询 documents 表
        try:
            response = client.table("documents").select("count", count="exact").execute()
            print(f"   ✅ 连接成功！")
            print(f"      documents 表存在，包含 {response.count} 条记录")
        except Exception as e:
            if "does not exist" in str(e):
                print(f"   ⚠️  'documents' 表不存在")
            else:
                print(f"   ❌ 查询失败: {e}")
        
        # 检查 document_chunks 表
        try:
            response = client.table("document_chunks").select("count", count="exact").execute()
            print(f"   ✅ document_chunks 表存在，包含 {response.count} 条记录")
        except Exception as e:
            if "does not exist" in str(e):
                print(f"   ⚠️  'document_chunks' 表不存在")
            else:
                print(f"   ❌ 查询失败: {e}")
        
        # 列出所有表
        print(f"\n   查询所有表...")
        try:
            # 这需要直接 SQL 查询
            response = client.rpc("get_table_names").execute()
            print(f"   表: {response.data}")
        except:
            print(f"   (需要 RPC 函数支持)")
    
    except ImportError:
        print(f"   ❌ supabase 库未安装")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    # 测试 PostgreSQL 连接
    if postgres_password:
        print("\n2️⃣  测试 PostgreSQL 直接连接...")
        try:
            import psycopg2
            
            # 从 URL 提取主机
            host = supabase_url.split("://")[1].split(".")[0] + ".supabase.co"
            
            conn = psycopg2.connect(
                host=host,
                port=5432,
                database="postgres",
                user="postgres",
                password=postgres_password
            )
            
            cursor = conn.cursor()
            
            # 获取所有表
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' ORDER BY table_name
            """)
            
            tables = [row[0] for row in cursor.fetchall()]
            print(f"   ✅ PostgreSQL 连接成功！")
            print(f"      表: {tables}")
            
            # 检查每个表的行数
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    print(f"      - {table}: {count} 条记录")
                except:
                    pass
            
            cursor.close()
            conn.close()
            
        except ImportError:
            print(f"   ❌ psycopg2 库未安装: pip install psycopg2-binary")
        except Exception as e:
            print(f"   ❌ 连接失败: {e}")
    
    print("\n" + "=" * 70)
    print("✅ 验证完成")
    print("=" * 70)


if __name__ == "__main__":
    main()
