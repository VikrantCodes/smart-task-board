import { useState } from 'react';

function TaskItem({ task, onToggleComplete, onUpdateTitle, onDeleteTask }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    async function handleSave() {
        if (editTitle.trim() && editTitle !== task.title) {
            await onUpdateTitle(task.id, editTitle.trim());
        }
        setIsEditing(false);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter')  handleSave();
        if (e.key === 'Escape') { setEditTitle(task.title); setIsEditing(false); }
    }

    return (
        <li className={`task-item ${task.completed ? 'completed' : ''}`}>
            <input
                type='checkbox'
                checked={task.completed}
                onChange={() => onToggleComplete(task.id, task.completed)}
            />
            {isEditing ? (
                <input
                    type='text'
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className='edit-input'
                />
            ) : (
                <span className='task-title' onDoubleClick={() => setIsEditing(true)}
                      title='Double-click to edit'>
                    {task.title}
                </span>
            )}
            <div className='task-actions'>
                {isEditing
                    ? <button onClick={handleSave} className='btn-save'>Save</button>
                    : <button onClick={() => setIsEditing(true)} className='btn-edit'>Edit</button>
                }
                <button onClick={() => onDeleteTask(task.id)} className='btn-delete'>Delete</button>
            </div>
        </li>
    );
}

export default TaskItem;
