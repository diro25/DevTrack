import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";

function Topics() {
  const [topics, setTopics] = useState(() => {
    const savedTopics = localStorage.getItem("topics");
    return savedTopics
      ? JSON.parse(savedTopics)
      : [
          { id: 1, title: "HTML", status: "Done" },
          { id: 2, title: "CSS", status: "In Progress" },
          { id: 3, title: "JavaScript", status: "Not Started" },
        ];
  });

  useEffect(() => {
    localStorage.setItem("topics", JSON.stringify(topics));
  }, [topics]);

  function deleteTopic(id) {
    setTopics((prevTopics) => prevTopics.filter((topic) => topic.id !== id));
  }

  function addTopic(title) {
    const newTopic = {
      id: Date.now(),
      title,
      status: "Not Started",
    };
    setTopics((prevTopics) => [...prevTopics, newTopic]);
  }

  return (
    <div className="dashboard-page">
      <h2>Topics</h2>
      <TopicList topics={topics} onDelete={deleteTopic} onAdd={addTopic} />
    </div>
  );
}

export default Topics;