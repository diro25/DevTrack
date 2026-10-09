import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";
import { API_URL } from "../config";

function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/topics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch(() => setError("Could not load your topics. Is the server running?"))
      .finally(() => setLoading(false));
  }, []);

  function deleteTopic(id) {
    fetch(`${API_URL}/topics/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setTopics((prev) => prev.filter((topic) => topic.id !== id));
    });
  }

  function addTopic(title) {
    fetch(`${API_URL}/topics`, {
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
    fetch(`${API_URL}/topics/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((updatedTopic) => {
        setTopics((prev) =>
          prev.map((topic) => (topic.id === id ? updatedTopic : topic))
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