"""
笔记服务
处理笔记的创建、读取、更新、删除、搜索、分类、模板等核心业务逻辑
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import json
import re

from ..models import Note, NoteTemplate, NoteType, NoteStatus
from ..core.database import get_db

class NoteService:
    """笔记服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_note(
        self,
        user_id: int,
        title: str,
        content: str,
        summary: Optional[str] = None,
        note_type: str = "note",
        status: str = "draft",
        tags: Optional[List[str]] = None,
        category: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Note:
        """创建新笔记"""
        
        note = Note(
            title=title,
            content=content,
            summary=summary,
            type=NoteType(note_type) if note_type else NoteType.NOTE,
            status=NoteStatus(status) if status else NoteStatus.DRAFT,
            tags=tags or [],
            category=category,
            user_id=user_id,
            metadata=metadata or {}
        )
        
        # 自动生成摘要（如果未提供）
        if not summary and content:
            note.summary = self.generate_summary(content)
        
        # 更新字数统计
        note.update_word_count()
        
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        
        return note
    
    async def get_note_by_id(self, note_id: int, user_id: int) -> Optional[Note]:
        """根据ID获取笔记"""
        return self.db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == user_id,
            Note.is_deleted == False
        ).first()
    
    async def update_note(self, note: Note, update_data: Dict) -> Note:
        """更新笔记"""
        # 允许更新的字段
        allowed_fields = [
            'title', 'content', 'summary', 'type', 'status',
            'tags', 'category', 'metadata'
        ]
        
        for field, value in update_data.items():
            if field in allowed_fields and value is not None:
                if field == 'type':
                    setattr(note, field, NoteType(value))
                elif field == 'status':
                    setattr(note, field, NoteStatus(value))
                else:
                    setattr(note, field, value)
        
        # 更新字数统计
        note.update_word_count()
        note.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(note)
        
        return note
    
    async def delete_note(self, note: Note):
        """软删除笔记"""
        note.soft_delete()
        self.db.commit()
    
    async def get_user_notes(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        note_type: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc"
    ) -> Dict:
        """获取用户笔记列表"""
        
        query = self.db.query(Note).filter(
            Note.user_id == user_id,
            Note.is_deleted == False
        )
        
        # 搜索过滤
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Note.title.ilike(search_pattern),
                    Note.content.ilike(search_pattern),
                    Note.summary.ilike(search_pattern)
                )
            )
        
        # 分类过滤
        if category:
            query = query.filter(Note.category == category)
        
        # 标签过滤
        if tags:
            for tag in tags:
                query = query.filter(
                    func.json_extract(Note.tags, '$').like(f'%"{tag}"%')
                )
        
        # 类型过滤
        if note_type:
            query = query.filter(Note.type == NoteType(note_type))
        
        # 状态过滤
        if status:
            query = query.filter(Note.status == NoteStatus(status))
        
        # 排序
        if hasattr(Note, sort_by):
            order_column = getattr(Note, sort_by)
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
    
    async def advanced_search(
        self,
        user_id: int,
        query: str,
        fields: List[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        min_words: Optional[int] = None,
        max_words: Optional[int] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict:
        """高级搜索"""
        
        db_query = self.db.query(Note).filter(
            Note.user_id == user_id,
            Note.is_deleted == False
        )
        
        # 多字段搜索
        if query and fields:
            search_conditions = []
            search_pattern = f"%{query}%"
            
            if "title" in fields:
                search_conditions.append(Note.title.ilike(search_pattern))
            if "content" in fields:
                search_conditions.append(Note.content.ilike(search_pattern))
            if "summary" in fields:
                search_conditions.append(Note.summary.ilike(search_pattern))
            if "category" in fields:
                search_conditions.append(Note.category.ilike(search_pattern))
            
            if search_conditions:
                db_query = db_query.filter(or_(*search_conditions))
        
        # 日期范围过滤
        if date_from:
            db_query = db_query.filter(Note.created_at >= date_from)
        if date_to:
            db_query = db_query.filter(Note.created_at <= date_to)
        
        # 字数范围过滤
        if min_words:
            db_query = db_query.filter(Note.word_count >= min_words)
        if max_words:
            db_query = db_query.filter(Note.word_count <= max_words)
        
        # 按相关性排序（简单实现）
        db_query = db_query.order_by(desc(Note.updated_at))
        
        # 统计和分页
        total = db_query.count()
        offset = (page - 1) * page_size
        items = db_query.offset(offset).limit(page_size).all()
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    async def get_user_notes_stats(self, user_id: int) -> Dict:
        """获取用户笔记统计"""
        
        base_query = self.db.query(Note).filter(
            Note.user_id == user_id,
            Note.is_deleted == False
        )
        
        # 总数统计
        total_notes = base_query.count()
        
        # 按类型统计
        type_stats = self.db.query(
            Note.type, func.count(Note.id)
        ).filter(
            Note.user_id == user_id,
            Note.is_deleted == False
        ).group_by(Note.type).all()
        
        # 按状态统计
        status_stats = self.db.query(
            Note.status, func.count(Note.id)
        ).filter(
            Note.user_id == user_id,
            Note.is_deleted == False
        ).group_by(Note.status).all()
        
        # 按分类统计
        category_stats = self.db.query(
            Note.category, func.count(Note.id)
        ).filter(
            Note.user_id == user_id,
            Note.is_deleted == False,
            Note.category.isnot(None)
        ).group_by(Note.category).all()
        
        # 总字数
        total_words = self.db.query(
            func.sum(Note.word_count)
        ).filter(
            Note.user_id == user_id,
            Note.is_deleted == False
        ).scalar() or 0
        
        # 总查看次数
        total_views = self.db.query(
            func.sum(Note.view_count)
        ).filter(
            Note.user_id == user_id,
            Note.is_deleted == False
        ).scalar() or 0
        
        # 最近30天创建的笔记数
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_notes = base_query.filter(
            Note.created_at >= thirty_days_ago
        ).count()
        
        return {
            "total_notes": total_notes,
            "total_words": total_words,
            "total_views": total_views,
            "recent_notes": recent_notes,
            "type_stats": {str(type_): count for type_, count in type_stats},
            "status_stats": {str(status): count for status, count in status_stats},
            "category_stats": {category: count for category, count in category_stats if category}
        }
    
    async def get_user_categories(self, user_id: int) -> List[Dict]:
        """获取用户的所有分类"""
        
        categories = self.db.query(
            Note.category, func.count(Note.id).label('count')
        ).filter(
            Note.user_id == user_id,
            Note.is_deleted == False,
            Note.category.isnot(None)
        ).group_by(Note.category).order_by(desc('count')).all()
        
        return [
            {
                "name": category,
                "count": count
            }
            for category, count in categories
        ]
    
    async def get_user_tags(self, user_id: int) -> List[Dict]:
        """获取用户的所有标签"""
        
        # 获取所有笔记的标签
        notes = self.db.query(Note.tags).filter(
            Note.user_id == user_id,
            Note.is_deleted == False,
            Note.tags.isnot(None)
        ).all()
        
        # 统计标签使用频率
        tag_counts = {}
        for note in notes:
            if note.tags:
                for tag in note.tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        # 按使用频率排序
        sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
        
        return [
            {
                "name": tag,
                "count": count
            }
            for tag, count in sorted_tags
        ]
    
    async def duplicate_note(self, original_note: Note) -> Note:
        """复制笔记"""
        
        new_note = Note(
            title=f"{original_note.title} (副本)",
            content=original_note.content,
            summary=original_note.summary,
            type=original_note.type,
            status=NoteStatus.DRAFT,  # 复制的笔记默认为草稿
            tags=original_note.tags.copy() if original_note.tags else [],
            category=original_note.category,
            user_id=original_note.user_id,
            metadata=original_note.metadata.copy() if original_note.metadata else {}
        )
        
        # 更新字数统计
        new_note.update_word_count()
        
        self.db.add(new_note)
        self.db.commit()
        self.db.refresh(new_note)
        
        return new_note
    
    async def export_note(self, note: Note, format: str = "markdown") -> str:
        """导出笔记为指定格式"""
        
        if format == "markdown":
            return self.export_to_markdown(note)
        elif format == "html":
            return self.export_to_html(note)
        elif format == "txt":
            return self.export_to_text(note)
        elif format == "json":
            return self.export_to_json(note)
        else:
            raise ValueError(f"不支持的导出格式: {format}")
    
    def export_to_markdown(self, note: Note) -> str:
        """导出为Markdown格式"""
        content = []
        
        # 标题
        content.append(f"# {note.title}\n")
        
        # 元信息
        content.append("---")
        content.append(f"创建时间: {note.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        content.append(f"更新时间: {note.updated_at.strftime('%Y-%m-%d %H:%M:%S')}")
        content.append(f"类型: {note.type.value}")
        content.append(f"状态: {note.status.value}")
        
        if note.category:
            content.append(f"分类: {note.category}")
        
        if note.tags:
            content.append(f"标签: {', '.join(note.tags)}")
        
        if note.summary:
            content.append(f"摘要: {note.summary}")
        
        content.append("---\n")
        
        # 内容
        content.append(note.content)
        
        return "\n".join(content)
    
    def export_to_html(self, note: Note) -> str:
        """导出为HTML格式"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{note.title}</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
        .meta {{ background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }}
        .meta p {{ margin: 5px 0; }}
        .content {{ line-height: 1.6; }}
    </style>
</head>
<body>
    <h1>{note.title}</h1>
    <div class="meta">
        <p><strong>创建时间:</strong> {note.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p><strong>更新时间:</strong> {note.updated_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p><strong>类型:</strong> {note.type.value}</p>
        <p><strong>状态:</strong> {note.status.value}</p>"""
        
        if note.category:
            html += f"\n        <p><strong>分类:</strong> {note.category}</p>"
        
        if note.tags:
            html += f"\n        <p><strong>标签:</strong> {', '.join(note.tags)}</p>"
        
        if note.summary:
            html += f"\n        <p><strong>摘要:</strong> {note.summary}</p>"
        
        html += f"""
    </div>
    <div class="content">
        {note.content.replace(chr(10), '<br>')}
    </div>
</body>
</html>"""
        
        return html
    
    def export_to_text(self, note: Note) -> str:
        """导出为纯文本格式"""
        content = []
        
        content.append(f"标题: {note.title}")
        content.append(f"创建时间: {note.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        content.append(f"更新时间: {note.updated_at.strftime('%Y-%m-%d %H:%M:%S')}")
        content.append(f"类型: {note.type.value}")
        content.append(f"状态: {note.status.value}")
        
        if note.category:
            content.append(f"分类: {note.category}")
        
        if note.tags:
            content.append(f"标签: {', '.join(note.tags)}")
        
        if note.summary:
            content.append(f"摘要: {note.summary}")
        
        content.append("-" * 50)
        content.append(note.content)
        
        return "\n".join(content)
    
    def export_to_json(self, note: Note) -> str:
        """导出为JSON格式"""
        data = {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "summary": note.summary,
            "type": note.type.value,
            "status": note.status.value,
            "category": note.category,
            "tags": note.tags or [],
            "metadata": note.metadata or {},
            "word_count": note.word_count,
            "view_count": note.view_count,
            "created_at": note.created_at.isoformat(),
            "updated_at": note.updated_at.isoformat()
        }
        
        return json.dumps(data, ensure_ascii=False, indent=2)
    
    def generate_summary(self, content: str, max_length: int = 200) -> str:
        """自动生成摘要"""
        if not content:
            return ""
        
        # 移除多余的空白符
        clean_content = re.sub(r'\s+', ' ', content.strip())
        
        # 如果内容较短，直接返回
        if len(clean_content) <= max_length:
            return clean_content
        
        # 尝试在句号处截断
        sentences = clean_content.split('。')
        summary = ""
        for sentence in sentences:
            if len(summary + sentence + "。") <= max_length:
                summary += sentence + "。"
            else:
                break
        
        # 如果没有找到合适的句号截断点，直接截断
        if not summary:
            summary = clean_content[:max_length - 3] + "..."
        
        return summary
    
    # 笔记模板相关方法
    async def create_note_template(
        self,
        created_by: int,
        name: str,
        description: Optional[str],
        content_template: str,
        category: Optional[str] = None,
        is_public: bool = False
    ) -> NoteTemplate:
        """创建笔记模板"""
        
        template = NoteTemplate(
            name=name,
            description=description,
            content_template=content_template,
            category=category,
            is_public=is_public,
            created_by=created_by
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        
        return template
    
    async def get_user_templates(
        self,
        user_id: int,
        include_public: bool = True,
        category: Optional[str] = None
    ) -> List[NoteTemplate]:
        """获取用户可用的模板列表"""
        
        query = self.db.query(NoteTemplate)
        
        # 用户自己的模板 + 公共模板
        if include_public:
            query = query.filter(
                or_(
                    NoteTemplate.created_by == user_id,
                    NoteTemplate.is_public == True
                )
            )
        else:
            query = query.filter(NoteTemplate.created_by == user_id)
        
        # 分类过滤
        if category:
            query = query.filter(NoteTemplate.category == category)
        
        return query.order_by(NoteTemplate.sort_order, NoteTemplate.created_at.desc()).all() 