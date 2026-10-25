import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

// One task row that can be dragged by its handle
function SortableTaskItem({ task, dragEnabled, onToggle, onDelete, onStartEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const classes = ["task"];
  if (task.done) classes.push("done");
  if (isDragging) classes.push("dragging");

  return (
    <li ref={setNodeRef} style={style} className={classes.join(" ")}>
      {dragEnabled && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="task-drag-handle"
          aria-label={`Reorder ${task.title}`}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      )}

      <span className="task-main" onClick={() => onToggle(task.id)}>
        <span className="task-title">
          {task.done ? "☑" : "☐"} {task.title}
        </span>
        <DueBadge task={task} />
      </span>

      <div className="task-actions">
        <button
          onClick={() => onStartEdit(task)}
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
  );
}

function TaskList({ tasks, onToggle, onAdd, onDelete, onEdit, onReorder }) {
  const [newTask, setNewTask] = useState("");
  const [newDue, setNewDue] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Reordering is only allowed on the full, unfiltered list
  const dragEnabled =
    Boolean(onReorder) && filter === "All" && editingId === null && tasks.length > 1;

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

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(tasks, oldIndex, newIndex));
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

  let hint = "";
  if (onReorder && tasks.length > 1) {
    if (dragEnabled) hint = "Drag the ⋮⋮ handle to reorder your tasks.";
    else if (filter !== "All") hint = 'Switch to "All" to reorder.';
  }

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

      {hint && <p className="drag-hint">{hint}</p>}

      {tasks.length === 0 ? (
        <p className="empty-message">No tasks yet. Add your first task above.</p>
      ) : visibleTasks.length === 0 ? (
        <p className="empty-message">No tasks in this view.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
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
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    dragEnabled={dragEnabled}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onStartEdit={startEdit}
                  />
                )
              )}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

export default TaskList;