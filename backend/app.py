"""
FILE: app.py
REQ: 后端API服务
CHECK: Flask应用,API路由,笔记保存集成,跨域支持
HIST: 2025-01-31-AI生成
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import base64
from datetime import datetime

# 添加工具包路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from note_saver_toolkit.core import NoteSaveEngine

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 初始化笔记保存引擎
note_engine = NoteSaveEngine()

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'success': True,
        'message': '服务正常运行',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/save_note', methods=['POST'])
def save_note():
    """保存笔记API"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': '请求数据为空'
            }), 400
        
        content = data.get('content', '').strip()
        app_name = data.get('app_name', 'Web笔记工具')
        images = data.get('images', [])
        
        if not content and not images:
            return jsonify({
                'success': False,
                'message': '笔记内容不能为空'
            }), 400
        
        # 处理图片数据
        processed_images = []
        if images:
            for i, image_data in enumerate(images):
                if isinstance(image_data, str):
                    processed_images.append(image_data)
                elif isinstance(image_data, dict) and 'data' in image_data:
                    processed_images.append(image_data['data'])
        
        # 保存笔记
        result = note_engine.save_note(
            content=content,
            app_name=app_name,
            images=processed_images if processed_images else None
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'保存笔记失败: {str(e)}'
        }), 500

@app.route('/api/get_recent_notes', methods=['GET'])
def get_recent_notes():
    """获取最近笔记"""
    try:
        count = request.args.get('count', 10, type=int)
        notes = note_engine.get_recent_notes(count)
        
        return jsonify({
            'success': True,
            'data': notes,
            'count': len(notes)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取笔记失败: {str(e)}'
        }), 500

@app.route('/api/set_log_file', methods=['POST'])
def set_log_file():
    """设置日志文件路径"""
    try:
        data = request.get_json()
        log_file_path = data.get('log_file_path')
        
        if not log_file_path:
            return jsonify({
                'success': False,
                'message': '日志文件路径不能为空'
            }), 400
        
        success = note_engine.set_log_file(log_file_path)
        
        if success:
            return jsonify({
                'success': True,
                'message': '日志文件路径设置成功',
                'log_file_path': log_file_path
            })
        else:
            return jsonify({
                'success': False,
                'message': '设置日志文件路径失败'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'设置失败: {str(e)}'
        }), 500

@app.route('/api/get_config', methods=['GET'])
def get_config():
    """获取当前配置"""
    try:
        config = {
            'log_file': note_engine.get_log_file(),
            'config_path': note_engine.config_manager.get_config_path()
        }
        
        return jsonify({
            'success': True,
            'data': config
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取配置失败: {str(e)}'
        }), 500

@app.route('/api/update_config', methods=['POST'])
def update_config():
    """更新配置"""
    try:
        data = request.get_json()
        config_updates = data.get('config', {})
        
        if not config_updates:
            return jsonify({
                'success': False,
                'message': '配置更新数据为空'
            }), 400
        
        success = note_engine.update_config(config_updates)
        
        if success:
            return jsonify({
                'success': True,
                'message': '配置更新成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '配置更新失败'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'更新配置失败: {str(e)}'
        }), 500

@app.route('/api/upload_image', methods=['POST'])
def upload_image():
    """上传图片"""
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': '没有上传的图片文件'
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': '没有选择文件'
            }), 400
        
        # 读取图片数据
        image_data = file.read()
        
        # 转换为base64
        base64_data = base64.b64encode(image_data).decode('utf-8')
        
        # 获取文件扩展名
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'png'
        mime_type = f"image/{file_ext}"
        if file_ext in ['jpg', 'jpeg']:
            mime_type = "image/jpeg"
        
        data_url = f"data:{mime_type};base64,{base64_data}"
        
        return jsonify({
            'success': True,
            'data': {
                'image_data': data_url,
                'filename': file.filename,
                'size': len(image_data)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'上传图片失败: {str(e)}'
        }), 500

@app.route('/api/download_notes', methods=['GET'])
def download_notes():
    """下载笔记文件"""
    try:
        log_file = note_engine.get_log_file()
        
        if not os.path.exists(log_file):
            return jsonify({
                'success': False,
                'message': '笔记文件不存在'
            }), 404
        
        directory = os.path.dirname(log_file)
        filename = os.path.basename(log_file)
        
        return send_from_directory(directory, filename, as_attachment=True)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'下载失败: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    """404错误处理"""
    return jsonify({
        'success': False,
        'message': 'API端点不存在'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    return jsonify({
        'success': False,
        'message': '服务器内部错误'
    }), 500

if __name__ == '__main__':
    # 确保日志目录存在
    os.makedirs('logs', exist_ok=True)
    
    print("笔记保存工具包测试服务启动中...")
    print("API文档:")
    print("- POST /api/save_note - 保存笔记")
    print("- GET /api/get_recent_notes - 获取最近笔记")
    print("- POST /api/set_log_file - 设置日志文件")
    print("- GET /api/get_config - 获取配置")
    print("- POST /api/update_config - 更新配置")
    print("- POST /api/upload_image - 上传图片")
    print("- GET /api/download_notes - 下载笔记")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5000) 