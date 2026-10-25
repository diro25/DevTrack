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

const STATUS_FILTERS = ["All", "Not Started", "In Progress", "Done"];
const DEFAULT_CATEGORIES = [
  "HTML",
  "CSS",
  "JavaScript",
  "React",
  "Node.js",
  "SQL",
  "Python",
  "Git",
];
const ALL = "__all__";
const NONE = "__none__";

function cleanCategory(value) {
  return value.trim().replace(/\s+/g, " ");
}

// If "HTML" already exists and the user types "html", reuse the existing spelling
function matchExisting(category, known) {
  if (!category) return "";
  const found = known.find((c) => c.toLowerCase() === category.toLowerCase());
  return found || category;
}

// One topic card that can be dragged by its handle
function SortableTopicCard({ topic, dragEnabled, onToggle, onDelete, onStartEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "topic-card dragging" : "topic-card"}
      onClick={() => onToggle(topic.id)}
      onKeyDown={(e) => {
        // Only when the card itself is focused, not the handle or a button inside it
        if (e.target === e.currentTarget && e.key === "Enter") onToggle(topic.id);
      }}
      role="button"
      tabIndex={0}
    >
      {dragEnabled && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="drag-handle"
          aria-label={`Reorder ${topic.title}`}
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      )}

      {topic.category && <span className="category-tag">{topic.category}</span>}
      <h4>{topic.title}</h4>
      <p>{topic.status}</p>
      <div className="card-actions">
        <button
          className="edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit(topic);
          }}
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(topic.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function TopicList({ topics, onDelete, onAdd, onToggle, onEdit, onReorder }) {
  const [newTopic, setNewTopic] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Categories already used, sorted A to Z
  const categories = [...new Set(topics.map((t) => t.category).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  );
  const hasUncategorized = topics.some((t) => !t.category);

  // Spellings we reuse; the user's own come first so their capitalization wins
  const knownCategories = [...categories, ...DEFAULT_CATEGORIES];
  const suggestions = knownCategories.filter(
    (c, i) =>
      knownCategories.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i
  );

  // If the chosen category disappeared (deleted or renamed), fall back to All
  const activeCategory =
    categoryFilter === ALL ||
    (categoryFilter === NONE && hasUncategorized) ||
    categories.includes(categoryFilter)
      ? categoryFilter
      : ALL;

  const filtersActive =
    query.trim() !== "" || statusFilter !== "All" || activeCategory !== ALL;

  // Reordering is only allowed on the full, unfiltered list
  const dragEnabled =
    Boolean(onReorder) && !filtersActive && editingId === null && topics.length > 1;

  function handleSubmit(e) {
    e.preventDefault();
    const title = newTopic.trim();
    if (!title) return;
    const category = matchExisting(cleanCategory(newCategory), knownCategories);
    onAdd(title, category);
    setNewTopic("");
    setNewCategory("");
  }

  function startEdit(topic) {
    setEditingId(topic.id);
    setEditTitle(topic.title);
    setEditCategory(topic.category || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditCategory("");
  }

  async function saveEdit(e, topic) {
    e.preventDefault();
    const title = editTitle.trim();
    if (!title) return;
    const category = matchExisting(cleanCategory(editCategory), knownCategories);
    if (title === topic.title && category === (topic.category || "")) {
      cancelEdit();
      return;
    }
    const ok = await onEdit(topic.id, title, category);
    if (ok) cancelEdit();
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = topics.findIndex((t) => t.id === active.id);
    const newIndex = topics.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(topics, oldIndex, newIndex));
  }

  const visibleTopics = topics.filter((topic) => {
    const text = `${topic.title} ${topic.category || ""}`.toLowerCase();
    const matchesText = text.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "All" || topic.status === statusFilter;
    const matchesCategory =
      activeCategory === ALL ||
      (activeCategory === NONE ? !topic.category : topic.category === activeCategory);
    return matchesText && matchesStatus && matchesCategory;
  });

  let hint = "";
  if (onReorder && topics.length > 1) {
    if (dragEnabled) hint = "Drag the ⋮⋮ handle to reorder your topics.";
    else if (filtersActive) hint = "Clear the search and filters to reorder.";
  }

  return (
    <section className="topic-list">
      <h3>Learning Topics</h3>

      <form onSubmit={handleSubmit} className="topic-form">
        <input
          type="text"
          placeholder="Add a new topic..."
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
        />
        <input
          type="text"
          className="category-input"
          placeholder="Category (optional)"
          list="topic-categories"
          maxLength={30}
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          aria-label="Category (optional)"
        />
        <button type="submit">Add</button>
      </form>

      <datalist id="topic-categories">
        {suggestions.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="filter-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Search topics or categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-chips">
          {STATUS_FILTERS.map((f) => (
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

      {categories.length > 0 && (
        <div className="filter-chips category-chips">
          <span className="chips-label">Category:</span>
          <button
            type="button"
            className={activeCategory === ALL ? "filter-chip active" : "filter-chip"}
            onClick={() => setCategoryFilter(ALL)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              className={activeCategory === c ? "filter-chip active" : "filter-chip"}
              onClick={() => setCategoryFilter(c)}
            >
              {c}
            </button>
          ))}
          {hasUncategorized && (
            <button
              type="button"
              className={activeCategory === NONE ? "filter-chip active" : "filter-chip"}
              onClick={() => setCategoryFilter(NONE)}
            >
              Uncategorized
            </button>
          )}
        </div>
      )}

      <p className="results-count">
        Showing {visibleTopics.length} of {topics.length} topics
      </p>
      {hint && <p className="drag-hint">{hint}</p>}

      {topics.length === 0 ? (
        <p className="empty-message">No topics yet. Add your first topic above.</p>
      ) : visibleTopics.length === 0 ? (
        <p className="empty-message">No topics match your search or filter.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleTopics.map((t) => t.id)}
            strategy={rectSortingStrategy}
          >
            <div className="topic-grid">
              {visibleTopics.map((topic) =>
                editingId === topic.id ? (
                  <div key={topic.id} className="topic-card editing">
                    <form className="edit-form" onSubmit={(e) => saveEdit(e, topic)}>
                      <input
                        className="edit-input"
                        value={editTitle}
                        autoFocus
                        placeholder="Topic name"
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <input
                        className="edit-input"
                        value={editCategory}
                        placeholder="Category (optional)"
                        list="topic-categories"
                        maxLength={30}
                        onChange={(e) => setEditCategory(e.target.value)}
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
                  <SortableTopicCard
                    key={topic.id}
                    topic={topic}
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

export default TopicList;