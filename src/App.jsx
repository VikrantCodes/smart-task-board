import { useState, useEffect } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { fetchTasks, createTask, updateTask, deleteTask } from './api';
import './styles.css';

function App() {
    const [tasks,   setTasks]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => { loadTasks(); }, []);

    async function loadTasks() {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchTasks();
            setTasks(data);
        } catch (err) {
            setError('Could not load tasks. Is the Flask server running?');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddTask(title) {
        try {
            const newTask = await createTask(title);
            setTasks(prev => [newTask, ...prev]);
        } catch {
            setError('Could not add task. Please try again.');
        }
    }

    async function handleToggleComplete(id, currentCompleted) {
        try {
            const updated = await updateTask(id, { completed: !currentCompleted });
            setTasks(prev => prev.map(t => t.id === id ? updated : t));
        } catch {
            setError('Could not update task.');
        }
    }

    async function handleUpdateTitle(id, newTitle) {
        try {
            const updated = await updateTask(id, { title: newTitle });
            setTasks(prev => prev.map(t => t.id === id ? updated : t));
        } catch {
            setError('Could not update task.');
        }
    }

    async function handleDeleteTask(id) {
        try {
            await deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch {
            setError('Could not delete task.');
        }
    }

    return (
        <div className='app'>
            <header>
                <h1>Smart Task Board</h1>
                <p>React + Flask + SQLite</p>
            </header>
            {error && (
                <div className='error-banner'>
                    {error}
                    <button onClick={() => setError(null)}>x</button>
                </div>
            )}
            <TaskForm onAddTask={handleAddTask} />
            {loading ? (
                <p className='loading'>Loading tasks from server...</p>
            ) : (
                <TaskList
                    tasks={tasks}
                    onToggleComplete={handleToggleComplete}
                    onUpdateTitle={handleUpdateTitle}
                    onDeleteTask={handleDeleteTask}
                />
            )}
        </div>
    );
}

export default App;
