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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const FILTERS = ["All", "Not Started", "In Progress", "Done"];

// One project card that can be dragged by its handle
function SortableProjectCard({ project, dragEnabled, onToggle, onDelete, onStartEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "project-card dragging" : "project-card"}
      onClick={() => onToggle(project.id)}
      onKeyDown={(e) => {
        // Only when the card itself is focused, not the handle or a button inside it
        if (e.target === e.currentTarget && e.key === "Enter") onToggle(project.id);
      }}
      role="button"
      tabIndex={0}
    >
      {dragEnabled && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="drag-handle"
          aria-label={`Reorder ${project.name}`}
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      )}

      <h4>{project.name}</h4>
      <p>{project.description}</p>
      <span>{project.status}</span>
      <div className="card-actions">
        <button
          className="edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit(project);
          }}
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function ProjectList({ projects, onDelete, onAdd, onToggle, onEdit, onReorder }) {
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtersActive = query.trim() !== "" || statusFilter !== "All";

  // Reordering is only allowed on the full, unfiltered list
  const dragEnabled =
    Boolean(onReorder) && !filtersActive && editingId === null && projects.length > 1;

  function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim() || !newDescription.trim()) return;

    onAdd(newName, newDescription);
    setNewName("");
    setNewDescription("");
  }

  function startEdit(project) {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }

  async function saveEdit(e, project) {
    e.preventDefault();
    const name = editName.trim();
    const description = editDescription.trim();
    if (!name || !description) return;
    if (name === project.name && description === project.description) {
      cancelEdit();
      return;
    }
    const ok = await onEdit(project.id, name, description);
    if (ok) cancelEdit();
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(projects, oldIndex, newIndex));
  }

  const visibleProjects = projects.filter((project) => {
    const text = `${project.name} ${project.description}`.toLowerCase();
    const matchesText = text.includes(query.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "All" || project.status === statusFilter;
    return matchesText && matchesStatus;
  });

  let hint = "";
  if (onReorder && projects.length > 1) {
    if (dragEnabled) hint = "Drag the ⋮⋮ handle to reorder your projects.";
    else if (filtersActive) hint = "Clear the search and filters to reorder.";
  }

  return (
    <section className="project-list">
      <h3>Projects</h3>

      <form onSubmit={handleSubmit} className="project-form">
        <input
          type="text"
          placeholder="Project name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Project description..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <div className="filter-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Search projects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-chips">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f}
              className={statusFilter === f ? "filter-chip active" : "filter-chip"}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="results-count">
        Showing {visibleProjects.length} of {projects.length} projects
      </p>
      {hint && <p className="drag-hint">{hint}</p>}

      {projects.length === 0 ? (
        <p className="empty-message">No projects yet. Add your first project above.</p>
      ) : visibleProjects.length === 0 ? (
        <p className="empty-message">No projects match your search or filter.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleProjects.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="project-grid">
              {visibleProjects.map((project) =>
                editingId === project.id ? (
                  <div key={project.id} className="project-card editing">
                    <form className="edit-form" onSubmit={(e) => saveEdit(e, project)}>
                      <input
                        className="edit-input"
                        value={editName}
                        autoFocus
                        placeholder="Project name"
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <input
                        className="edit-input"
                        value={editDescription}
                        placeholder="Project description"
                        onChange={(e) => setEditDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="card-actions">
                        <button type="submit" className="save-btn">Save</button>
                        <button type="button" className="cancel-btn" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    dragEnabled={dragEnabled}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onStartEdit={startEdit}
                  />
                )
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

export default ProjectList;