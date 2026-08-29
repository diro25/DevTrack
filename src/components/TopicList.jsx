function TopicList({ topics }) {
  return (
    <section className="topic-list">
      <h3>Learning Topics</h3>
      <div className="topic-grid">
        {topics.map((topic) => (
          <div key={topic.id} className="topic-card">
            <h4>{topic.title}</h4>
            <p>{topic.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TopicList;