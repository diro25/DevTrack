import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";

function Topics() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data));
  }, []);

  function deleteTopic(id) {
    fetch(`http://localhost:5000/topics/${id}`, {
      method: "DELETE",
    }).then(() => {
      setTopics((prevTopics) => prevTopics.filter((topic) => topic.id !== id));
    });
  }

  function addTopic(title) {
    fetch("http://localhost:5000/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
      .then((res) => res.json())
      .then((newTopic) => {
        setTopics((prevTopics) => [...prevTopics, newTopic]);
      });
  }

  return (
    <div className="dashboard-page">
      <h2>Topics</h2>
      <TopicList topics={topics} onDelete={deleteTopic} onAdd={addTopic} />
    </div>
  );
}

export default Topics;