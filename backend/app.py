from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db, init_db

app = Flask(__name__)
# CORS(app, origins=['http://localhost:5173/'])
CORS(app)

def row_to_dict(row):
    '''Convert a sqlite3.Row to a plain dict Flask can serialize'''
    return {
        'id':         row['id'],
        'title':      row['title'],
        'completed':  bool(row['completed']),   # 0/1 → False/True
        'created_at': row['created_at']
    }

# ── GET /tasks ──────────────────────────────────────────
@app.route('/tasks', methods=['GET'])
def get_tasks():
    conn = get_db()
    rows = conn.execute('SELECT * FROM tasks ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows]), 200

# ── POST /tasks ─────────────────────────────────────────
@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    if not data or not data.get('title') or not data['title'].strip():
        return jsonify({'error': 'Title is required'}), 400
    conn = get_db()
    cursor = conn.execute('INSERT INTO tasks (title) VALUES (?)',
                          (data['title'].strip(),))
    conn.commit()
    new_task = conn.execute('SELECT * FROM tasks WHERE id = ?',
                            (cursor.lastrowid,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(new_task)), 201

# ── PUT /tasks/<id> ─────────────────────────────────────
@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    conn = get_db()
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found'}), 404
    new_title     = data.get('title',     task['title'])
    new_completed = data.get('completed', bool(task['completed']))
    conn.execute('UPDATE tasks SET title = ?, completed = ? WHERE id = ?',
                 (new_title, int(new_completed), task_id))
    conn.commit()
    updated = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(updated)), 200

# ── DELETE /tasks/<id> ──────────────────────────────────
@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db()
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found'}), 404
    conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Task deleted successfully'}), 200

if __name__ == '__main__':
    init_db()   # Creates table on first run
    app.run(debug=True, port=5000)
