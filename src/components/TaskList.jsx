import { useState } from "react";

function TaskList() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "CSS Grid", done: false },
    { id: 2, title: "JavaScript DOM", done: false },
    { id: 3, title: "HTML Review", done: true },
  ]);

  const [newTask, setNewTask] = useState("");

  function toggleTask(id) {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function addTask(e) {
    e.preventDefault();

    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      title: newTask,
      done: false,
    };

    setTasks([...tasks, task]);
    setNewTask("");
  }

  const completedCount = tasks.filter((task) => task.done).length;
  const totalCount = tasks.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <section className="task-list">
      <h3>Today's Tasks</h3>
      <p>
        {completedCount} of {totalCount} completed ({progress}%)
      </p>

      <form onSubmit={addTask} className="task-form">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <ul className="task-items">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={task.done ? "task done" : "task"}
            onClick={() => toggleTask(task.id)}
          >
            {task.done ? "☑" : "☐"} {task.title}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TaskList;