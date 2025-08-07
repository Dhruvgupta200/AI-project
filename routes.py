from flask import render_template, request, jsonify, flash, redirect, url_for
from app import app, db
from models import Task
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@app.route('/')
def index():
    """Main page with task management interface"""
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks with optional filtering and search"""
    try:
        search = request.args.get('search', '')
        status_filter = request.args.get('status', '')
        priority_filter = request.args.get('priority', '')
        
        query = Task.query
        
        # Apply search filter
        if search:
            query = query.filter(Task.title.contains(search) | Task.description.contains(search))
        
        # Apply status filter
        if status_filter:
            query = query.filter(Task.status == status_filter)
            
        # Apply priority filter
        if priority_filter:
            query = query.filter(Task.priority == priority_filter)
        
        # Order by created_at descending
        tasks = query.order_by(Task.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'tasks': [task.to_dict() for task in tasks],
            'count': len(tasks)
        })
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch tasks'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """Get a single task by ID"""
    try:
        task = Task.query.get_or_404(task_id)
        return jsonify({
            'success': True,
            'task': task.to_dict()
        })
    except Exception as e:
        logger.error(f"Error fetching task {task_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Task not found'}), 404

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('title'):
            return jsonify({'success': False, 'error': 'Title is required'}), 400
        
        # Create new task
        task = Task(
            title=data['title'].strip(),
            description=data.get('description', '').strip(),
            status=data.get('status', 'pending'),
            priority=data.get('priority', 'medium')
        )
        
        # Handle due date
        if data.get('due_date'):
            try:
                task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid due date format'}), 400
        
        db.session.add(task)
        db.session.commit()
        
        logger.info(f"Created new task: {task.title}")
        return jsonify({
            'success': True,
            'message': 'Task created successfully',
            'task': task.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating task: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to create task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task"""
    try:
        task = Task.query.get_or_404(task_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate title if provided
        if 'title' in data and not data['title'].strip():
            return jsonify({'success': False, 'error': 'Title cannot be empty'}), 400
        
        # Update fields
        if 'title' in data:
            task.title = data['title'].strip()
        if 'description' in data:
            task.description = data['description'].strip()
        if 'status' in data:
            task.status = data['status']
        if 'priority' in data:
            task.priority = data['priority']
        
        # Handle due date
        if 'due_date' in data:
            if data['due_date']:
                try:
                    task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'success': False, 'error': 'Invalid due date format'}), 400
            else:
                task.due_date = None
        
        task.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Updated task: {task.title}")
        return jsonify({
            'success': True,
            'message': 'Task updated successfully',
            'task': task.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating task {task_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to update task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    try:
        task = Task.query.get_or_404(task_id)
        task_title = task.title
        
        db.session.delete(task)
        db.session.commit()
        
        logger.info(f"Deleted task: {task_title}")
        return jsonify({
            'success': True,
            'message': 'Task deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting task {task_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to delete task'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'success': False, 'error': 'Internal server error'}), 500
