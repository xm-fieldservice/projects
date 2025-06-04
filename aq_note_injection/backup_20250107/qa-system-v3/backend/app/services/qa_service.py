"""
问答服务
处理AI问答、多轮对话、会话管理、统计分析等核心业务逻辑
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import json
import time
import asyncio
import secrets

from ..models import QASession, ConversationTurn, QATemplate, Note, AgentType, SessionStatus, NoteType, NoteStatus
from ..core.database import get_db

class QAService:
    """问答服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_qa_session(
        self,
        user_id: int,
        title: str,
        question: str,
        context: Optional[str] = None,
        agent_type: str = "general",
        temperature: float = 0.7,
        max_tokens: int = 2000,
        model_name: Optional[str] = None
    ) -> QASession:
        """创建问答会话"""
        
        session = QASession(
            title=title,
            question=question,
            context=context,
            agent_type=AgentType(agent_type) if agent_type else AgentType.GENERAL,
            temperature=temperature,
            max_tokens=max_tokens,
            model_name=model_name or "gpt-3.5-turbo",
            user_id=user_id,
            status=SessionStatus.ACTIVE
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    async def get_session_by_id(self, session_id: int, user_id: int) -> Optional[QASession]:
        """根据ID获取会话"""
        return self.db.query(QASession).filter(
            QASession.id == session_id,
            QASession.user_id == user_id,
            QASession.is_deleted == False
        ).first()
    
    async def get_ai_answer(self, session: QASession) -> Dict[str, any]:
        """获取AI回答（模拟实现）"""
        start_time = time.time()
        
        # 构建完整的prompt
        prompt = self.build_prompt(session)
        
        # 模拟AI API调用
        # TODO: 这里应该集成真实的AI服务（如OpenAI、Claude等）
        answer = await self.simulate_ai_response(prompt, session)
        
        # 计算响应时间
        response_time = time.time() - start_time
        
        # 估算token使用量
        tokens_used = self.estimate_tokens(prompt + answer)
        
        return {
            "answer": answer,
            "tokens_used": tokens_used,
            "response_time": response_time,
            "cost": self.calculate_cost(tokens_used)
        }
    
    async def simulate_ai_response(self, prompt: str, session: QASession) -> str:
        """模拟AI响应（用于开发和测试）"""
        # 模拟网络延迟
        await asyncio.sleep(0.5 + (len(prompt) / 1000))
        
        # 根据智能体类型生成不同风格的回答
        if session.agent_type == AgentType.CODE:
            return self.generate_code_response(session.question)
        elif session.agent_type == AgentType.WRITING:
            return self.generate_writing_response(session.question)
        elif session.agent_type == AgentType.ANALYSIS:
            return self.generate_analysis_response(session.question)
        else:
            return self.generate_general_response(session.question)
    
    def generate_code_response(self, question: str) -> str:
        """生成编程助手风格的回答"""
        return f"""根据您的问题："{question}"，我来为您提供编程解决方案。

```python
# 示例代码
def example_function():
    '''
    这是一个示例函数，用于演示代码结构
    '''
    result = "Hello, World!"
    return result

# 调用函数
output = example_function()
print(output)
```

**代码说明：**
1. 定义了一个示例函数
2. 添加了适当的文档字符串
3. 返回预期结果

**最佳实践建议：**
- 保持代码简洁清晰
- 添加必要的注释
- 遵循PEP8代码规范
- 进行适当的错误处理

如果您需要更具体的实现或有其他问题，请随时告诉我！"""

    def generate_writing_response(self, question: str) -> str:
        """生成写作助手风格的回答"""
        return f"""关于您的写作问题："{question}"

**写作建议：**

1. **结构组织**
   - 明确文章的主题和目标读者
   - 制定清晰的大纲和逻辑结构
   - 确保段落之间的逻辑连贯性

2. **语言表达**
   - 使用简洁有力的句式
   - 避免冗余和模糊的表达
   - 适当使用修辞手法增强表现力

3. **内容充实**
   - 提供具体的例子和证据
   - 平衡理论阐述与实际应用
   - 考虑读者的背景知识水平

4. **修改完善**
   - 多次审阅和修改文稿
   - 检查语法、拼写和标点
   - 请他人阅读并提供反馈

希望这些建议对您的写作有所帮助！如需更详细的指导，请提供具体的写作场景。"""

    def generate_analysis_response(self, question: str) -> str:
        """生成分析助手风格的回答"""
        return f"""针对您的分析问题："{question}"

**分析框架：**

### 1. 问题定义
- 明确分析目标和范围
- 识别关键变量和因素
- 确定分析的时间范围

### 2. 数据收集
- 确定所需数据类型和来源
- 评估数据的质量和可靠性
- 考虑数据的局限性

### 3. 分析方法
- 选择合适的分析工具和技术
- 进行定量和定性分析
- 使用多角度验证结果

### 4. 结论输出
- 总结关键发现
- 提出可行的建议
- 识别潜在风险和机会

**建议采用的分析步骤：**
1. 现状分析 → 2. 趋势识别 → 3. 原因探究 → 4. 影响评估 → 5. 策略建议

如需针对具体领域的深入分析，请提供更多背景信息。"""

    def generate_general_response(self, question: str) -> str:
        """生成通用助手风格的回答"""
        return f"""您好！关于您的问题："{question}"

我很乐意为您提供帮助。根据您的问题，我理解您可能需要：

**相关信息：**
- 这个问题涉及多个层面，需要综合考虑
- 建议从基础概念开始理解
- 可以通过实践加深认识

**解决思路：**
1. **了解背景**：先掌握相关的基础知识
2. **分析问题**：识别问题的核心要素
3. **寻找方案**：探索可能的解决路径
4. **实施验证**：通过实践检验方案效果

**后续建议：**
- 如果需要更具体的指导，请提供更多细节
- 可以将复杂问题分解为几个小问题
- 欢迎随时提出后续问题

希望这个回答对您有帮助！如果您需要更详细的解释或有其他问题，请随时告诉我。"""

    def build_prompt(self, session: QASession) -> str:
        """构建AI Prompt"""
        prompt_parts = []
        
        # 系统角色设定
        if session.agent_type == AgentType.CODE:
            prompt_parts.append("你是一个专业的编程助手，擅长提供代码解决方案和技术指导。")
        elif session.agent_type == AgentType.WRITING:
            prompt_parts.append("你是一个专业的写作助手，专注于提高文本质量和表达效果。")
        elif session.agent_type == AgentType.ANALYSIS:
            prompt_parts.append("你是一个专业的分析助手，擅长数据分析、逻辑推理和深度思考。")
        else:
            prompt_parts.append("你是一个智能助手，能够回答各种问题并提供有用的建议。")
        
        # 添加上下文
        if session.context:
            prompt_parts.append(f"上下文信息：{session.context}")
        
        # 添加用户问题
        prompt_parts.append(f"用户问题：{session.question}")
        
        # 添加特殊指令
        prompt_parts.append("请提供详细、准确且有用的回答。如果需要，可以分步骤说明。")
        
        return "\n\n".join(prompt_parts)
    
    def estimate_tokens(self, text: str) -> int:
        """估算token数量"""
        # 简单估算：中文约1.5字符/token，英文约4字符/token
        chinese_chars = len([c for c in text if '\u4e00' <= c <= '\u9fff'])
        other_chars = len(text) - chinese_chars
        
        tokens = int(chinese_chars / 1.5 + other_chars / 4)
        return max(tokens, 1)
    
    def calculate_cost(self, tokens: int) -> float:
        """计算API调用成本"""
        # 示例定价：每1000个token成本0.002美元
        return (tokens / 1000) * 0.002
    
    async def create_conversation_turn(self, session_id: int, user_message: str) -> ConversationTurn:
        """创建对话轮次"""
        
        # 获取当前会话的轮次数
        turn_count = self.db.query(ConversationTurn).filter(
            ConversationTurn.session_id == session_id
        ).count()
        
        turn = ConversationTurn(
            session_id=session_id,
            turn_number=turn_count + 1,
            user_message=user_message
        )
        
        self.db.add(turn)
        self.db.commit()
        self.db.refresh(turn)
        
        return turn
    
    async def get_conversation_answer(self, session: QASession, turn: ConversationTurn) -> Dict[str, any]:
        """获取多轮对话的AI回答"""
        start_time = time.time()
        
        # 构建包含历史对话的prompt
        prompt = self.build_conversation_prompt(session, turn)
        
        # 获取AI回答
        answer = await self.simulate_ai_response_with_context(prompt, session, turn)
        
        response_time = time.time() - start_time
        tokens_used = self.estimate_tokens(prompt + answer)
        
        return {
            "answer": answer,
            "tokens_used": tokens_used,
            "response_time": response_time,
            "cost": self.calculate_cost(tokens_used)
        }
    
    def build_conversation_prompt(self, session: QASession, current_turn: ConversationTurn) -> str:
        """构建多轮对话的prompt"""
        prompt_parts = []
        
        # 系统设定
        prompt_parts.append(self.get_agent_system_prompt(session.agent_type))
        
        # 原始问题和回答
        if session.question and session.answer:
            prompt_parts.append(f"用户：{session.question}")
            prompt_parts.append(f"助手：{session.answer}")
        
        # 历史对话轮次
        previous_turns = self.db.query(ConversationTurn).filter(
            ConversationTurn.session_id == session.id,
            ConversationTurn.id < current_turn.id,
            ConversationTurn.assistant_message.isnot(None)
        ).order_by(ConversationTurn.turn_number).all()
        
        for turn in previous_turns:
            prompt_parts.append(f"用户：{turn.user_message}")
            prompt_parts.append(f"助手：{turn.assistant_message}")
        
        # 当前用户消息
        prompt_parts.append(f"用户：{current_turn.user_message}")
        prompt_parts.append("助手：")
        
        return "\n".join(prompt_parts)
    
    def get_agent_system_prompt(self, agent_type: AgentType) -> str:
        """获取智能体系统提示"""
        prompts = {
            AgentType.CODE: "你是专业的编程助手，继续为用户提供编程相关的帮助。",
            AgentType.WRITING: "你是专业的写作助手，继续为用户提供写作指导。",
            AgentType.ANALYSIS: "你是专业的分析助手，继续为用户提供分析和思考。",
            AgentType.GENERAL: "你是智能助手，继续为用户提供帮助。"
        }
        return prompts.get(agent_type, prompts[AgentType.GENERAL])
    
    async def simulate_ai_response_with_context(self, prompt: str, session: QASession, turn: ConversationTurn) -> str:
        """基于上下文模拟AI回答"""
        await asyncio.sleep(0.3)  # 模拟延迟
        
        # 简单的上下文相关回答
        return f"""我理解您的后续问题。基于我们之前的讨论，我认为：

{self.generate_contextual_response(turn.user_message, session.agent_type)}

如果您需要更详细的解释或有其他相关问题，请随时告诉我！"""
    
    def generate_contextual_response(self, message: str, agent_type: AgentType) -> str:
        """生成上下文相关的回答"""
        if agent_type == AgentType.CODE:
            return "让我为您提供更具体的代码实现和技术细节..."
        elif agent_type == AgentType.WRITING:
            return "关于写作技巧，我建议您关注以下几个方面..."
        elif agent_type == AgentType.ANALYSIS:
            return "从分析角度来看，我们可以进一步探讨..."
        else:
            return "根据您的问题，我建议我们从以下角度思考..."
    
    async def get_user_sessions(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        agent_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Dict:
        """获取用户会话列表"""
        
        query = self.db.query(QASession).filter(
            QASession.user_id == user_id,
            QASession.is_deleted == False
        )
        
        # 智能体类型过滤
        if agent_type:
            query = query.filter(QASession.agent_type == AgentType(agent_type))
        
        # 状态过滤
        if status:
            query = query.filter(QASession.status == SessionStatus(status))
        
        # 搜索过滤
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    QASession.title.ilike(search_pattern),
                    QASession.question.ilike(search_pattern),
                    QASession.answer.ilike(search_pattern)
                )
            )
        
        # 排序
        if hasattr(QASession, sort_by):
            order_column = getattr(QASession, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(desc(order_column))
            else:
                query = query.order_by(asc(order_column))
        
        # 统计总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": offset + page_size < total
        }
    
    async def get_session_turns(self, session_id: int) -> List[ConversationTurn]:
        """获取会话的所有对话轮次"""
        return self.db.query(ConversationTurn).filter(
            ConversationTurn.session_id == session_id
        ).order_by(ConversationTurn.turn_number).all()
    
    async def delete_session(self, session: QASession):
        """软删除会话"""
        session.is_deleted = True
        session.deleted_at = datetime.utcnow()
        session.status = SessionStatus.ARCHIVED
        self.db.commit()
    
    async def convert_session_to_note(self, session: QASession, note_data: Dict) -> Note:
        """将问答会话转换为笔记"""
        from .note_service import NoteService
        
        note_service = NoteService(self.db)
        
        # 构建笔记内容
        content_parts = []
        content_parts.append(f"# 问答记录：{session.title}\n")
        
        # 原始问答
        content_parts.append("## 原始问答")
        content_parts.append(f"**问题：** {session.question}")
        content_parts.append(f"**回答：** {session.answer}")
        
        # 对话轮次
        turns = await self.get_session_turns(session.id)
        if turns:
            content_parts.append("\n## 后续对话")
            for turn in turns:
                content_parts.append(f"**用户：** {turn.user_message}")
                if turn.assistant_message:
                    content_parts.append(f"**助手：** {turn.assistant_message}")
        
        # 元信息
        content_parts.append(f"\n---")
        content_parts.append(f"**智能体类型：** {session.agent_type.value}")
        content_parts.append(f"**创建时间：** {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        content_parts.append(f"**Token使用：** {session.tokens_used}")
        
        note_content = "\n".join(content_parts)
        
        # 创建笔记
        note = await note_service.create_note(
            user_id=session.user_id,
            title=note_data.get('title', f"问答记录：{session.title}"),
            content=note_content,
            summary=session.question[:200] + "..." if len(session.question) > 200 else session.question,
            note_type="qa",
            status=note_data.get('status', 'draft'),
            tags=note_data.get('tags', ['AI问答']),
            category=note_data.get('category', 'AI问答'),
            metadata={
                'source': 'qa_session',
                'session_id': session.id,
                'agent_type': session.agent_type.value,
                'tokens_used': session.tokens_used
            }
        )
        
        return note
    
    async def get_user_qa_stats(self, user_id: int) -> Dict:
        """获取用户问答统计"""
        
        base_query = self.db.query(QASession).filter(
            QASession.user_id == user_id,
            QASession.is_deleted == False
        )
        
        # 总会话数
        total_sessions = base_query.count()
        
        # 按智能体类型统计
        agent_stats = self.db.query(
            QASession.agent_type, func.count(QASession.id)
        ).filter(
            QASession.user_id == user_id,
            QASession.is_deleted == False
        ).group_by(QASession.agent_type).all()
        
        # 按状态统计
        status_stats = self.db.query(
            QASession.status, func.count(QASession.id)
        ).filter(
            QASession.user_id == user_id,
            QASession.is_deleted == False
        ).group_by(QASession.status).all()
        
        # 总token使用量
        total_tokens = self.db.query(
            func.sum(QASession.tokens_used)
        ).filter(
            QASession.user_id == user_id,
            QASession.is_deleted == False
        ).scalar() or 0
        
        # 总成本
        total_cost = self.db.query(
            func.sum(QASession.cost)
        ).filter(
            QASession.user_id == user_id,
            QASession.is_deleted == False
        ).scalar() or 0
        
        # 平均响应时间
        avg_response_time = self.db.query(
            func.avg(QASession.response_time)
        ).filter(
            QASession.user_id == user_id,
            QASession.is_deleted == False,
            QASession.response_time > 0
        ).scalar() or 0
        
        # 最近30天的会话数
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_sessions = base_query.filter(
            QASession.created_at >= thirty_days_ago
        ).count()
        
        return {
            "total_sessions": total_sessions,
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 4),
            "avg_response_time": round(avg_response_time, 2),
            "recent_sessions": recent_sessions,
            "agent_stats": {str(agent): count for agent, count in agent_stats},
            "status_stats": {str(status): count for status, count in status_stats}
        }
    
    async def get_user_qa_templates(
        self,
        user_id: int,
        agent_type: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[QATemplate]:
        """获取用户可用的问答模板"""
        
        query = self.db.query(QATemplate).filter(
            or_(
                QATemplate.created_by == user_id,
                QATemplate.is_public == True
            )
        )
        
        # 智能体类型过滤
        if agent_type:
            query = query.filter(QATemplate.agent_type == AgentType(agent_type))
        
        # 分类过滤
        if category:
            query = query.filter(QATemplate.category == category)
        
        return query.order_by(QATemplate.sort_order, QATemplate.created_at.desc()).all()
    
    async def create_session_share(self, session: QASession, share_config: Dict) -> Dict:
        """创建会话分享"""
        
        # 生成分享token
        share_token = secrets.token_urlsafe(32)
        
        # 更新会话元数据
        if not session.metadata:
            session.metadata = {}
        
        session.metadata['share'] = {
            'token': share_token,
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(days=share_config.get('expire_days', 7))).isoformat(),
            'allow_anonymous': share_config.get('allow_anonymous', False),
            'password': share_config.get('password'),
            'view_count': 0
        }
        
        self.db.commit()
        
        return {
            'share_url': f"/shared/qa/{share_token}",
            'share_token': share_token,
            'expires_at': session.metadata['share']['expires_at'],
            'settings': {
                'allow_anonymous': share_config.get('allow_anonymous', False),
                'password_protected': bool(share_config.get('password')),
                'expire_days': share_config.get('expire_days', 7)
            }
        }
    
    async def export_user_qa_data(
        self,
        user_id: int,
        format: str = "json",
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        agent_types: Optional[List[str]] = None
    ) -> any:
        """导出用户问答数据"""
        
        query = self.db.query(QASession).filter(
            QASession.user_id == user_id,
            QASession.is_deleted == False
        )
        
        # 日期过滤
        if date_from:
            query = query.filter(QASession.created_at >= date_from)
        if date_to:
            query = query.filter(QASession.created_at <= date_to)
        
        # 智能体类型过滤
        if agent_types:
            agent_enums = [AgentType(at) for at in agent_types]
            query = query.filter(QASession.agent_type.in_(agent_enums))
        
        sessions = query.order_by(QASession.created_at.desc()).all()
        
        # 根据格式导出
        if format == "json":
            return self.export_to_json(sessions)
        elif format == "csv":
            return self.export_to_csv(sessions)
        elif format == "markdown":
            return self.export_to_markdown(sessions)
        else:
            raise ValueError(f"不支持的导出格式: {format}")
    
    def export_to_json(self, sessions: List[QASession]) -> List[Dict]:
        """导出为JSON格式"""
        result = []
        
        for session in sessions:
            # 获取对话轮次
            turns = self.db.query(ConversationTurn).filter(
                ConversationTurn.session_id == session.id
            ).order_by(ConversationTurn.turn_number).all()
            
            session_data = session.to_dict()
            session_data['conversation_turns'] = [turn.to_dict() for turn in turns]
            result.append(session_data)
        
        return result
    
    def export_to_csv(self, sessions: List[QASession]) -> str:
        """导出为CSV格式"""
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # 写入表头
        writer.writerow([
            'ID', '标题', '问题', '回答', '智能体类型', '状态',
            'Token使用', '成本', '响应时间', '创建时间'
        ])
        
        # 写入数据
        for session in sessions:
            writer.writerow([
                session.id,
                session.title,
                session.question,
                session.answer,
                session.agent_type.value,
                session.status.value,
                session.tokens_used,
                session.cost,
                session.response_time,
                session.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return output.getvalue()
    
    def export_to_markdown(self, sessions: List[QASession]) -> str:
        """导出为Markdown格式"""
        content = []
        content.append("# 问答记录导出\n")
        content.append(f"导出时间：{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        content.append(f"总会话数：{len(sessions)}\n")
        content.append("---\n")
        
        for i, session in enumerate(sessions, 1):
            content.append(f"## {i}. {session.title}")
            content.append(f"**智能体类型：** {session.agent_type.value}")
            content.append(f"**创建时间：** {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            content.append(f"**状态：** {session.status.value}")
            content.append("")
            
            content.append("### 问题")
            content.append(session.question)
            content.append("")
            
            content.append("### 回答")
            content.append(session.answer or "暂无回答")
            content.append("")
            
            # 对话轮次
            turns = self.db.query(ConversationTurn).filter(
                ConversationTurn.session_id == session.id
            ).order_by(ConversationTurn.turn_number).all()
            
            if turns:
                content.append("### 后续对话")
                for turn in turns:
                    content.append(f"**轮次 {turn.turn_number} - 用户：** {turn.user_message}")
                    if turn.assistant_message:
                        content.append(f"**轮次 {turn.turn_number} - 助手：** {turn.assistant_message}")
                content.append("")
            
            content.append("---\n")
        
        return "\n".join(content) 