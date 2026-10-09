import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";

function Topics() {
  const [topics, setTopics] = useState([]);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("http://localhost:5000/topics", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  function deleteTopic(id) {
    fetch(`http://localhost:5000/topics/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setTopics((prev) => prev.filter((topic) => topic.id !== id));
    });
  }

  function addTopic(title) {
    fetch("http://localhost:5000/topics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    })
      .then((res) => res.json())
      .then((newTopic) => setTopics((prev) => [...prev, newTopic]));
  }

  function toggleTopic(id) {
    fetch(`http://localhost:5000/topics/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((updatedTopic) => {
        setTopics((prev) =>
          prev.map((topic) => (topic.id === updatedTopic.id ? updatedTopic : topic))
        );
      });
  }

  if (loading) return <p className="loading-message">Loading topics...</p>;
  if (error) return <p className="loading-message error">{error}</p>;

  return (
    <div className="dashboard-page">
      <h2>Topics</h2>
      <TopicList
        topics={topics}
        onDelete={deleteTopic}
        onAdd={addTopic}
        onToggle={toggleTopic}
      />
    </div>
  );
}

export default Topics;