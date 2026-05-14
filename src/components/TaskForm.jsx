import { useState } from 'react';

function TaskForm({ onAddTask }) {
    const [title,      setTitle]      = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        setSubmitting(true);
        await onAddTask(trimmed);
        setTitle('');
        setSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className='task-form'>
            <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='What needs to be done?'
                disabled={submitting}
            />
            <button type='submit' disabled={submitting || !title.trim()}>
                {submitting ? 'Adding...' : 'Add Task'}
            </button>
        </form>
    );
}

export default TaskForm;
