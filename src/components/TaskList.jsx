import { useState } from "react";

const TASK_FILTERS = ["All", "To do", "Done"];

function TaskList({ tasks, onToggle, onAdd, onDelete, onEdit }) {
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAdd(newTask);
    setNewTask("");
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function saveEdit(e, task) {
    e.preventDefault();
    const title = editTitle.trim();
    if (!title) return;
    if (title === task.title) {
      cancelEdit();
      return;
    }
    const ok = await onEdit(task.id, title);
    if (ok) cancelEdit();
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
          {visibleTasks.map((task) =>
            editingId === task.id ? (
              <li key={task.id} className="task">
                <form className="task-edit-form" onSubmit={(e) => saveEdit(e, task)}>
                  <input
                    className="edit-input"
                    value={editTitle}
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                  <button type="submit" className="save-btn">Save</button>
                  <button type="button" className="cancel-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </form>
              </li>
            ) : (
              <li key={task.id} className={task.done ? "task done" : "task"}>
                <span onClick={() => onToggle(task.id)} style={{ cursor: "pointer" }}>
                  {task.done ? "☑" : "☐"} {task.title}
                </span>
                <div className="task-actions">
                  <button
                    onClick={() => startEdit(task)}
                    className="task-edit-btn"
                    aria-label="Edit task"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="task-delete-btn"
                    aria-label="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}

export default TaskList;