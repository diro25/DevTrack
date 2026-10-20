import { useState } from "react";
import { dueStatus, formatDue } from "../dates";

const TASK_FILTERS = ["All", "To do", "Done", "Overdue"];

function DueBadge({ task }) {
  if (!task.due_date) return null;
  const status = dueStatus(task.due_date, task.done);
  const text = formatDue(task.due_date);

  if (status === "overdue") {
    return <span className="due-badge overdue">Overdue · {text}</span>;
  }
  if (status === "today") {
    return <span className="due-badge today">Due today</span>;
  }
  if (status === "upcoming") {
    return <span className="due-badge upcoming">Due {text}</span>;
  }
  return <span className="due-badge done">{text}</span>;
}

function TaskList({ tasks, onToggle, onAdd, onDelete, onEdit }) {
  const [newTask, setNewTask] = useState("");
  const [newDue, setNewDue] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAdd(newTask, newDue);
    setNewTask("");
    setNewDue("");
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDue(task.due_date || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDue("");
  }

  async function saveEdit(e, task) {
    e.preventDefault();
    const title = editTitle.trim();
    if (!title) return;
    if (title === task.title && editDue === (task.due_date || "")) {
      cancelEdit();
      return;
    }
    const ok = await onEdit(task.id, title, editDue);
    if (ok) cancelEdit();
  }

  const completedCount = tasks.filter((task) => task.done).length;
  const totalCount = tasks.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const visibleTasks = tasks.filter((task) => {
    if (filter === "To do") return !task.done;
    if (filter === "Done") return task.done;
    if (filter === "Overdue") {
      return dueStatus(task.due_date, task.done) === "overdue";
    }
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
        <input
          type="date"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          aria-label="Due date (optional)"
          title="Due date (optional)"
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
                  <input
                    type="date"
                    className="edit-input edit-date"
                    value={editDue}
                    onChange={(e) => setEditDue(e.target.value)}
                    aria-label="Due date"
                    title="Due date (clear it to remove)"
                  />
                  <button type="submit" className="save-btn">Save</button>
                  <button type="button" className="cancel-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </form>
              </li>
            ) : (
              <li key={task.id} className={task.done ? "task done" : "task"}>
                <span className="task-main" onClick={() => onToggle(task.id)}>
                  <span className="task-title">
                    {task.done ? "☑" : "☐"} {task.title}
                  </span>
                  <DueBadge task={task} />
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