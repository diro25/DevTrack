import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";
import { api } from "../api";
import { useToast } from "../ToastContext";

function Topics() {
  const { showToast } = useToast();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/topics")
      .then(setTopics)
      .catch(() => setError("Could not load your topics. Is the server running?"))
      .finally(() => setLoading(false));
  }, []);

  async function addTopic(title) {
    try {
      const newTopic = await api("/topics", { method: "POST", body: { title } });
      setTopics((prev) => [...prev, newTopic]);
      showToast("Topic added");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function toggleTopic(id) {
    try {
      const updated = await api(`/topics/${id}`, { method: "PUT" });
      setTopics((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast(`Status: ${updated.status}`, "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function deleteTopic(id) {
    try {
      await api(`/topics/${id}`, { method: "DELETE" });
      setTopics((prev) => prev.filter((t) => t.id !== id));
      showToast("Topic deleted", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
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