import TaskItem from './TaskItem';

function TaskList({ tasks, onToggleComplete, onUpdateTitle, onDeleteTask }) {
    if (tasks.length === 0) {
        return <p className='empty'>No tasks yet. Add one above!</p>;
    }
    return (
        <ul className='task-list'>
            {tasks.map(task => (
                <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onUpdateTitle={onUpdateTitle}
                    onDeleteTask={onDeleteTask}
                />
            ))}
        </ul>
    );
}

export default TaskList;
