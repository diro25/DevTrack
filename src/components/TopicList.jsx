import { useState } from "react";

function TopicList({ topics, onDelete, onAdd }) {
  const [newTopic, setNewTopic] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newTopic.trim()) return;
    onAdd(newTopic);
    setNewTopic("");
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
        <button type="submit">Add</button>
      </form>

      <div className="topic-grid">
        {topics.map((topic) => (
          <div key={topic.id} className="topic-card">
            <h4>{topic.title}</h4>
            <p>{topic.status}</p>
            <button onClick={() => onDelete(topic.id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TopicList;