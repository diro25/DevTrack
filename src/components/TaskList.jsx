import { useState } from "react";

function TaskList({ tasks, onToggle, onAdd }) {
  const [newTask, setNewTask] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAdd(newTask);
    setNewTask("");
  }

  const completedCount = tasks.filter((task) => task.done).length;
  const totalCount = tasks.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <section className="task-list">
      <h3>Today's Tasks</h3>
      <p>
        {completedCount} of {totalCount} completed ({progress}%)
      </p>

      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty-message">No tasks yet. Add your first task above.</p>
      ) : (
        <ul className="task-items">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={task.done ? "task done" : "task"}
              onClick={() => onToggle(task.id)}
            >
              {task.done ? "☑" : "☐"} {task.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TaskList;