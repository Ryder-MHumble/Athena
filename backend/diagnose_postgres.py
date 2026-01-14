"""
通过 PostgreSQL 直接连接检查表结构
"""

import psycopg2
from psycopg2 import sql
import json

# Supabase PostgreSQL 连接信息
# 格式: postgresql://[user]:[password]@[host]:[port]/[database]

# 从 Supabase URL 推断连接信息
SUPABASE_URL = "casxuvpohhbuqvmkqunb.supabase.co"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = None  # 需要用户提供
DB_HOST = f"{SUPABASE_URL}"
DB_PORT = 5432

def test_postgres_connection(password):
    """测试 PostgreSQL 连接"""
    print("=" * 70)
    print("测试 PostgreSQL 连接...")
    print("=" * 70)
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=password
        )
        print("✅ PostgreSQL 连接成功！")
        return conn
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return None


def check_tables(conn):
    """检查现有表"""
    print("\n" + "=" * 70)
    print("检查 public schema 中的表...")
    print("=" * 70)
    
    try:
        cursor = conn.cursor()
        
        # 获取所有表
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"\n找到 {len(tables)} 个表:")
        
        for (table_name,) in tables:
            print(f"\n📋 表: {table_name}")
            
            # 获取表结构
            cursor.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
            """, (table_name,))
            
            columns = cursor.fetchall()
            print("   列:")
            for col_name, col_type, is_nullable in columns:
                null_info = "NULL" if is_nullable == "YES" else "NOT NULL"
                print(f"     - {col_name}: {col_type} ({null_info})")
            
            # 获取行数
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"   记录数: {count}")
            
            # 如果表不为空，显示示例数据
            if count > 0 and table_name in ['documents', 'document_chunks']:
                print(f"   示例数据 (前3行):")
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                
                # 获取列名
                cursor.execute(f"""
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position
                """, (table_name,))
                
                col_names = [col[0] for col in cursor.fetchall()]
                rows = cursor.fetchall()
                
                for row in rows:
                    row_dict = dict(zip(col_names, row))
                    # 简化输出，跳过太长的数据
                    simplified = {}
                    for k, v in row_dict.items():
                        if isinstance(v, str) and len(str(v)) > 100:
                            simplified[k] = f"{str(v)[:50]}... (长度: {len(str(v))})"
                        else:
                            simplified[k] = v
                    print(f"     {simplified}")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ 检查表失败: {e}")


def check_functions(conn):
    """检查自定义函数"""
    print("\n" + "=" * 70)
    print("检查 public schema 中的函数...")
    print("=" * 70)
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT routine_name, routine_type
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            ORDER BY routine_name
        """)
        
        functions = cursor.fetchall()
        
        if functions:
            print(f"\n找到 {len(functions)} 个函数:")
            for func_name, func_type in functions:
                print(f"  - {func_name} ({func_type})")
        else:
            print("\n⚠️  未找到自定义函数")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ 检查函数失败: {e}")


def main():
    print("\n")
    print("█" * 70)
    print("  Supabase 数据库结构诊断")
    print("█" * 70)
    print("\n说明：需要提供 Supabase 数据库密码")
    print("密码位置：Supabase Dashboard → Project Settings → Database → Password")
    
    password = input("\n请输入 PostgreSQL 密码: ")
    
    conn = test_postgres_connection(password)
    
    if not conn:
        print("\n❌ 无法连接，请检查密码")
        return
    
    check_tables(conn)
    check_functions(conn)
    
    conn.close()
    
    print("\n" + "=" * 70)
    print("诊断完成")
    print("=" * 70)


if __name__ == "__main__":
    main()
