#!/usr/bin/env python
# -*- coding: utf-8 -*-

from neo4j import GraphDatabase
import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv('config.env')

NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')

def init_database():
    """初始化数据库，创建索引和约束"""
    
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
    
    try:
        with driver.session() as session:
            print("开始初始化数据库...")
            
            # 创建索引
            indexes = [
                "CREATE INDEX IF NOT EXISTS FOR (p:Person) ON (p.name)",
                "CREATE INDEX IF NOT EXISTS FOR (p:Project) ON (p.name)",
                "CREATE INDEX IF NOT EXISTS FOR (t:Task) ON (t.name)",
                "CREATE INDEX IF NOT EXISTS FOR (d:Document) ON (d.content)",
                "CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.name)",
                "CREATE INDEX IF NOT EXISTS FOR (o:Organization) ON (o.name)",
                "CREATE INDEX IF NOT EXISTS FOR (ev:Event) ON (ev.name)"
            ]
            
            for index_query in indexes:
                session.run(index_query)
                print(f"创建索引: {index_query.split('FOR')[1].split('ON')[0].strip()}")
            
            # 创建约束
            constraints = [
                "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (o:Organization) REQUIRE o.name IS UNIQUE"
            ]
            
            for constraint_query in constraints:
                try:
                    session.run(constraint_query)
                    print(f"创建约束: {constraint_query.split('FOR')[1].split('REQUIRE')[0].strip()}")
                except Exception as e:
                    print(f"约束创建失败（可能已存在）: {e}")
            
            # 创建示例数据
            print("创建示例数据...")
            create_sample_data(session)
            
            print("数据库初始化完成！")
            
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        sys.exit(1)
    
    finally:
        driver.close()

def create_sample_data(session):
    """创建示例数据"""
    
    # 创建组织
    session.run("""
        MERGE (org1:Organization {name: '技术部', type: 'department', description: '负责技术开发和维护'})
        MERGE (org2:Organization {name: '产品部', type: 'department', description: '负责产品规划和设计'})
        MERGE (org3:Organization {name: '运营部', type: 'department', description: '负责产品运营和推广'})
    """)
    
    # 创建人员
    session.run("""
        MERGE (p1:Person {name: '张三', role: '项目经理', email: 'zhangsan@company.com', department: '技术部'})
        MERGE (p2:Person {name: '李四', role: '开发工程师', email: 'lisi@company.com', department: '技术部'})
        MERGE (p3:Person {name: '王五', role: '产品经理', email: 'wangwu@company.com', department: '产品部'})
        MERGE (p4:Person {name: '赵六', role: '运营专员', email: 'zhaoliu@company.com', department: '运营部'})
    """)
    
    # 创建项目
    session.run("""
        CREATE (proj1:Project {
            name: '智能客服系统',
            description: '基于AI的智能客服解决方案',
            start_date: date('2024-01-01'),
            end_date: date('2024-06-30'),
            status: 'active',
            priority: 'high',
            budget: 500000,
            created_at: datetime()
        })
        
        CREATE (proj2:Project {
            name: '移动端应用重构',
            description: '移动端应用架构重构和性能优化',
            start_date: date('2024-02-01'),
            end_date: date('2024-08-31'),
            status: 'planning',
            priority: 'medium',
            budget: 300000,
            created_at: datetime()
        })
    """)
    
    # 创建任务
    session.run("""
        MATCH (proj1:Project {name: '智能客服系统'})
        CREATE (task1:Task {
            name: '需求分析',
            description: '收集和分析业务需求',
            start_date: date('2024-01-01'),
            end_date: date('2024-01-15'),
            status: 'completed',
            priority: 'high',
            progress: 100,
            assignee: '王五',
            created_at: datetime()
        })
        CREATE (task2:Task {
            name: '系统设计',
            description: '设计系统架构和数据库',
            start_date: date('2024-01-16'),
            end_date: date('2024-02-15'),
            status: 'progress',
            priority: 'high',
            progress: 60,
            assignee: '张三',
            created_at: datetime()
        })
        CREATE (task3:Task {
            name: '后端开发',
            description: '开发后端API和业务逻辑',
            start_date: date('2024-02-16'),
            end_date: date('2024-04-30'),
            status: 'todo',
            priority: 'high',
            progress: 0,
            assignee: '李四',
            created_at: datetime()
        })
        
        CREATE (proj1)-[:HAS_TASK]->(task1)
        CREATE (proj1)-[:HAS_TASK]->(task2)
        CREATE (proj1)-[:HAS_TASK]->(task3)
    """)
    
    # 创建文档
    session.run("""
        CREATE (doc1:Document {
            content: '智能客服系统需求文档：本系统旨在为客户提供7x24小时智能客服服务，支持自然语言理解和多轮对话。主要功能包括：1.智能问答 2.人工转接 3.知识库管理 4.数据统计分析',
            metadata: {
                title: '智能客服系统需求文档',
                type: 'requirement',
                author: '王五',
                version: '1.0'
            },
            created_at: datetime()
        })
        
        CREATE (doc2:Document {
            content: '移动端重构技术方案：采用React Native框架重构现有移动端应用，提升性能和用户体验。技术栈包括：React Native、Redux、TypeScript、Jest测试框架',
            metadata: {
                title: '移动端重构技术方案',
                type: 'technical',
                author: '张三',
                version: '1.0'
            },
            created_at: datetime()
        })
    """)
    
    # 创建实体（从文档中提取）
    session.run("""
        MERGE (e1:Entity {name: '智能客服系统', type: 'PRODUCT'})
        MERGE (e2:Entity {name: '自然语言理解', type: 'TECHNOLOGY'})
        MERGE (e3:Entity {name: 'React Native', type: 'TECHNOLOGY'})
        MERGE (e4:Entity {name: 'Redux', type: 'TECHNOLOGY'})
        MERGE (e5:Entity {name: 'TypeScript', type: 'TECHNOLOGY'})
    """)
    
    # 建立关系
    session.run("""
        MATCH (org1:Organization {name: '技术部'}), (p1:Person {name: '张三'})
        MERGE (org1)-[:HAS_MEMBER]->(p1)
        
        MATCH (org1:Organization {name: '技术部'}), (p2:Person {name: '李四'})
        MERGE (org1)-[:HAS_MEMBER]->(p2)
        
        MATCH (org2:Organization {name: '产品部'}), (p3:Person {name: '王五'})
        MERGE (org2)-[:HAS_MEMBER]->(p3)
        
        MATCH (org3:Organization {name: '运营部'}), (p4:Person {name: '赵六'})
        MERGE (org3)-[:HAS_MEMBER]->(p4)
        
        MATCH (p1:Person {name: '张三'}), (proj1:Project {name: '智能客服系统'})
        MERGE (p1)-[:MANAGES]->(proj1)
        
        MATCH (p3:Person {name: '王五'}), (proj1:Project {name: '智能客服系统'})
        MERGE (p3)-[:PARTICIPATES]->(proj1)
        
        MATCH (p2:Person {name: '李四'}), (proj2:Project {name: '移动端应用重构'})
        MERGE (p2)-[:PARTICIPATES]->(proj2)
        
        MATCH (doc1:Document), (e1:Entity {name: '智能客服系统'})
        MERGE (doc1)-[:CONTAINS]->(e1)
        
        MATCH (doc1:Document), (e2:Entity {name: '自然语言理解'})
        MERGE (doc1)-[:CONTAINS]->(e2)
        
        MATCH (doc2:Document), (e3:Entity {name: 'React Native'})
        MERGE (doc2)-[:CONTAINS]->(e3)
        
        MATCH (doc2:Document), (e4:Entity {name: 'Redux'})
        MERGE (doc2)-[:CONTAINS]->(e4)
        
        MATCH (doc2:Document), (e5:Entity {name: 'TypeScript'})
        MERGE (doc2)-[:CONTAINS]->(e5)
    """)
    
    # 创建事件
    session.run("""
        CREATE (event1:Event {
            name: '项目启动会议',
            description: '智能客服系统项目启动会议',
            event_date: date('2024-01-01'),
            location: '会议室A',
            attendees: ['张三', '王五', '李四'],
            type: 'meeting',
            created_at: datetime()
        })
        
        CREATE (event2:Event {
            name: '技术评审',
            description: '移动端重构方案技术评审',
            event_date: date('2024-02-15'),
            location: '会议室B',
            attendees: ['张三', '李四'],
            type: 'review',
            created_at: datetime()
        })
        
        MATCH (proj1:Project {name: '智能客服系统'}), (event1:Event {name: '项目启动会议'})
        CREATE (proj1)-[:HAS_EVENT]->(event1)
        
        MATCH (proj2:Project {name: '移动端应用重构'}), (event2:Event {name: '技术评审'})
        CREATE (proj2)-[:HAS_EVENT]->(event2)
    """)
    
    print("示例数据创建完成！")
    print("- 创建了3个组织部门")
    print("- 创建了4个人员")
    print("- 创建了2个项目")
    print("- 创建了3个任务")
    print("- 创建了2个文档")
    print("- 创建了5个实体")
    print("- 创建了2个事件")
    print("- 建立了相关关系")

def test_connection():
    """测试数据库连接"""
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
        with driver.session() as session:
            result = session.run("RETURN 1 as test")
            record = result.single()
            if record and record["test"] == 1:
                print("✓ Neo4j数据库连接成功！")
                return True
            else:
                print("✗ Neo4j数据库连接失败！")
                return False
    except Exception as e:
        print(f"✗ Neo4j数据库连接失败: {e}")
        return False
    finally:
        driver.close()

if __name__ == "__main__":
    print("=" * 50)
    print("关系知识管理系统 - 数据库初始化")
    print("=" * 50)
    
    if test_connection():
        init_database()
    else:
        print("请检查Neo4j数据库是否正常运行！")
        print("可以通过以下命令启动：docker-compose up -d neo4j")
        sys.exit(1) 