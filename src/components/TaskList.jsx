import { useState } from "react";

const TASK_FILTERS = ["All", "To do", "Done"];

function TaskList({ tasks, onToggle, onAdd, onDelete }) {
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("All");

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

  const visibleTasks = tasks.filter((task) => {
    if (filter === "To do") return !task.done;
    if (filter === "Done") return task.done;
    return true;
  });

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

      <div className="filter-chips">
        {TASK_FILTERS.map((f) => (
          <button
            type="button"
            key={f}
            className={filter === f ? "filter-chip active" : "filter-chip"}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <p className="empty-message">No tasks yet. Add your first task above.</p>
      ) : visibleTasks.length === 0 ? (
        <p className="empty-message">No tasks in this view.</p>
      ) : (
        <ul className="task-items">
          {visibleTasks.map((task) => (
            <li key={task.id} className={task.done ? "task done" : "task"}>
              <span onClick={() => onToggle(task.id)} style={{ cursor: "pointer" }}>
                {task.done ? "☑" : "☐"} {task.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="task-delete-btn"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TaskList;