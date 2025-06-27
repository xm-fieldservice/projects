from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from neo4j import GraphDatabase
import spacy
import json
import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import os
from dotenv import load_dotenv
import logging

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Neo4j配置
NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')

# 初始化Neo4j连接
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# 加载spaCy中文模型
try:
    nlp = spacy.load("zh_core_web_sm")
except OSError:
    logger.warning("中文模型未找到，请安装: python -m spacy download zh_core_web_sm")
    nlp = None

class RelationshipManager:
    def __init__(self, driver):
        self.driver = driver
    
    def create_entity(self, entity_type, properties):
        """创建实体节点"""
        with self.driver.session() as session:
            query = f"""
            CREATE (n:{entity_type} $properties)
            RETURN id(n) as node_id, n
            """
            result = session.run(query, properties=properties)
            return result.single()
    
    def create_relationship(self, from_id, to_id, rel_type, properties=None):
        """创建关系"""
        with self.driver.session() as session:
            query = """
            MATCH (a), (b)
            WHERE id(a) = $from_id AND id(b) = $to_id
            CREATE (a)-[r:$rel_type $properties]->(b)
            RETURN r
            """
            if properties is None:
                properties = {}
            result = session.run(query, from_id=from_id, to_id=to_id, 
                               rel_type=rel_type, properties=properties)
            return result.single()
    
    def get_graph_data(self, filter_params=None):
        """获取图谱数据"""
        with self.driver.session() as session:
            query = """
            MATCH (n)-[r]->(m)
            RETURN n, r, m, labels(n) as n_labels, labels(m) as m_labels
            LIMIT 500
            """
            results = session.run(query)
            
            nodes = {}
            edges = []
            
            for record in results:
                n, r, m = record['n'], record['r'], record['m']
                n_labels, m_labels = record['n_labels'], record['m_labels']
                
                # 添加源节点
                n_id = str(n.id)
                if n_id not in nodes:
                    nodes[n_id] = {
                        'id': n_id,
                        'label': n.get('name', f"节点{n_id}"),
                        'type': n_labels[0] if n_labels else 'Unknown',
                        'properties': dict(n),
                        'size': 30,
                        'style': self._get_node_style(n_labels[0] if n_labels else 'Unknown')
                    }
                
                # 添加目标节点
                m_id = str(m.id)
                if m_id not in nodes:
                    nodes[m_id] = {
                        'id': m_id,
                        'label': m.get('name', f"节点{m_id}"),
                        'type': m_labels[0] if m_labels else 'Unknown',
                        'properties': dict(m),
                        'size': 30,
                        'style': self._get_node_style(m_labels[0] if m_labels else 'Unknown')
                    }
                
                # 添加关系
                edges.append({
                    'source': n_id,
                    'target': m_id,
                    'label': r.type,
                    'properties': dict(r),
                    'style': {
                        'stroke': '#666',
                        'lineWidth': 2
                    }
                })
            
            return {
                'nodes': list(nodes.values()),
                'edges': edges
            }
    
    def _get_node_style(self, node_type):
        """根据节点类型返回样式"""
        color_map = {
            'Person': '#1890FF',
            'Project': '#52C41A',
            'Task': '#FAAD14',
            'Document': '#722ED1',
            'Event': '#F5222D',
            'Organization': '#13C2C2',
            'Unknown': '#8C8C8C'
        }
        return {
            'fill': color_map.get(node_type, '#8C8C8C'),
            'stroke': '#FFF',
            'lineWidth': 2
        }

class KnowledgeManager:
    def __init__(self, driver, nlp_model):
        self.driver = driver
        self.nlp = nlp_model
    
    def process_document(self, doc_content, doc_metadata):
        """处理文档并提取实体关系"""
        if not self.nlp:
            return {"error": "NLP模型未加载"}
        
        doc = self.nlp(doc_content)
        entities = []
        relations = []
        
        # 提取命名实体
        for ent in doc.ents:
            entities.append({
                'text': ent.text,
                'label': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char
            })
        
        # 创建文档节点
        with self.driver.session() as session:
            doc_node = session.run(
                "CREATE (d:Document {content: $content, metadata: $metadata, created_at: datetime()}) RETURN id(d) as doc_id",
                content=doc_content, metadata=doc_metadata
            ).single()
            
            doc_id = doc_node['doc_id']
            
            # 创建实体节点并建立关系
            for entity in entities:
                entity_node = session.run(
                    "MERGE (e:Entity {name: $name, type: $type}) RETURN id(e) as entity_id",
                    name=entity['text'], type=entity['label']
                ).single()
                
                # 建立文档-实体关系
                session.run(
                    """
                    MATCH (d:Document), (e:Entity)
                    WHERE id(d) = $doc_id AND id(e) = $entity_id
                    CREATE (d)-[:CONTAINS]->(e)
                    """,
                    doc_id=doc_id, entity_id=entity_node['entity_id']
                )
        
        return {
            'document_id': doc_id,
            'entities': entities,
            'message': '文档处理完成'
        }
    
    def search_knowledge(self, query):
        """知识搜索"""
        with self.driver.session() as session:
            results = session.run(
                """
                MATCH (d:Document)-[:CONTAINS]->(e:Entity)
                WHERE e.name CONTAINS $query OR d.content CONTAINS $query
                RETURN d, e, d.metadata as metadata
                LIMIT 20
                """,
                query=query
            )
            
            search_results = []
            for record in results:
                search_results.append({
                    'document': dict(record['d']),
                    'entity': dict(record['e']),
                    'metadata': record['metadata']
                })
            
            return search_results

class ProjectManager:
    def __init__(self, driver):
        self.driver = driver
    
    def create_project(self, project_data):
        """创建项目"""
        with self.driver.session() as session:
            result = session.run(
                """
                CREATE (p:Project {
                    name: $name,
                    description: $description,
                    start_date: date($start_date),
                    end_date: date($end_date),
                    status: $status,
                    priority: $priority,
                    created_at: datetime()
                })
                RETURN id(p) as project_id, p
                """,
                **project_data
            )
            return result.single()
    
    def create_task(self, task_data, project_id):
        """创建任务"""
        with self.driver.session() as session:
            # 创建任务节点
            task_result = session.run(
                """
                CREATE (t:Task {
                    name: $name,
                    description: $description,
                    start_date: date($start_date),
                    end_date: date($end_date),
                    status: $status,
                    priority: $priority,
                    assignee: $assignee,
                    progress: $progress,
                    created_at: datetime()
                })
                RETURN id(t) as task_id, t
                """,
                **task_data
            )
            
            task_id = task_result.single()['task_id']
            
            # 建立项目-任务关系
            session.run(
                """
                MATCH (p:Project), (t:Task)
                WHERE id(p) = $project_id AND id(t) = $task_id
                CREATE (p)-[:HAS_TASK]->(t)
                """,
                project_id=project_id, task_id=task_id
            )
            
            return task_id
    
    def get_project_timeline(self, project_id):
        """获取项目时间轴数据"""
        with self.driver.session() as session:
            results = session.run(
                """
                MATCH (p:Project)-[:HAS_TASK]->(t:Task)
                WHERE id(p) = $project_id
                RETURN p, t
                ORDER BY t.start_date
                """,
                project_id=project_id
            )
            
            timeline_data = {
                'project': None,
                'tasks': []
            }
            
            for record in results:
                if timeline_data['project'] is None:
                    timeline_data['project'] = dict(record['p'])
                
                task = dict(record['t'])
                timeline_data['tasks'].append({
                    'id': str(record['t'].id),
                    'name': task['name'],
                    'start_date': str(task['start_date']),
                    'end_date': str(task['end_date']),
                    'status': task['status'],
                    'progress': task.get('progress', 0),
                    'assignee': task.get('assignee', ''),
                    'priority': task.get('priority', 'medium')
                })
            
            return timeline_data

# 初始化管理器
relationship_manager = RelationshipManager(driver)
knowledge_manager = KnowledgeManager(driver, nlp)
project_manager = ProjectManager(driver)

# API路由
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/graph/data')
def get_graph_data():
    """获取图谱数据"""
    try:
        filter_params = request.args.to_dict()
        data = relationship_manager.get_graph_data(filter_params)
        return jsonify(data)
    except Exception as e:
        logger.error(f"获取图谱数据失败: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/entities', methods=['POST'])
def create_entity():
    """创建实体"""
    try:
        data = request.json
        entity_type = data.get('type', 'Entity')
        properties = data.get('properties', {})
        
        result = relationship_manager.create_entity(entity_type, properties)
        return jsonify({
            'success': True,
            'node_id': result['node_id'],
            'message': '实体创建成功'
        })
    except Exception as e:
        logger.error(f"创建实体失败: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/relationships', methods=['POST'])
def create_relationship():
    """创建关系"""
    try:
        data = request.json
        from_id = data['from_id']
        to_id = data['to_id']
        rel_type = data['type']
        properties = data.get('properties', {})
        
        relationship_manager.create_relationship(from_id, to_id, rel_type, properties)
        return jsonify({
            'success': True,
            'message': '关系创建成功'
        })
    except Exception as e:
        logger.error(f"创建关系失败: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents', methods=['POST'])
def process_document():
    """处理文档"""
    try:
        data = request.json
        content = data['content']
        metadata = data.get('metadata', {})
        
        result = knowledge_manager.process_document(content, metadata)
        return jsonify(result)
    except Exception as e:
        logger.error(f"文档处理失败: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search')
def search_knowledge():
    """搜索知识"""
    try:
        query = request.args.get('q', '')
        results = knowledge_manager.search_knowledge(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"知识搜索失败: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects', methods=['POST'])
def create_project():
    """创建项目"""
    try:
        data = request.json
        result = project_manager.create_project(data)
        return jsonify({
            'success': True,
            'project_id': result['project_id'],
            'message': '项目创建成功'
        })
    except Exception as e:
        logger.error(f"创建项目失败: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>/tasks', methods=['POST'])
def create_task(project_id):
    """创建任务"""
    try:
        data = request.json
        task_id = project_manager.create_task(data, project_id)
        return jsonify({
            'success': True,
            'task_id': task_id,
            'message': '任务创建成功'
        })
    except Exception as e:
        logger.error(f"创建任务失败: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>/timeline')
def get_project_timeline(project_id):
    """获取项目时间轴"""
    try:
        timeline = project_manager.get_project_timeline(project_id)
        return jsonify(timeline)
    except Exception as e:
        logger.error(f"获取项目时间轴失败: {e}")
        return jsonify({'error': str(e)}), 500

# 定时任务
def update_dynamic_labels():
    """更新动态标签"""
    with driver.session() as session:
        # 更新高风险文档标签
        session.run("""
            MATCH (d:Document)
            WHERE NOT d:HighRisk AND size(d.content) > 1000
            SET d:HighRisk, d.risk_updated = datetime()
        """)
        
        # 更新重要项目标签
        session.run("""
            MATCH (p:Project)
            WHERE NOT p:Important
            WITH p, size((p)-[:HAS_TASK]->(:Task)) as task_count
            WHERE task_count > 10
            SET p:Important, p.importance_updated = datetime()
        """)

# 启动定时任务
scheduler = BackgroundScheduler()
scheduler.add_job(update_dynamic_labels, 'interval', hours=1)
scheduler.start()

@app.teardown_appcontext
def close_db(error):
    if driver:
        driver.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 