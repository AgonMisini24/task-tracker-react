import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // Load saved tasks and keep old tasks compatible.
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("tasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [taskInput, setTaskInput] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium");

  // Remember the selected theme.
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  function addTask(event) {
    event.preventDefault();
    const text = taskInput.trim();

    if (!text) return;

    setTasks((current) => [
      ...current,
      { text, completed: false, priority: newPriority },
    ]);

    setTaskInput("");
    setNewPriority("medium");
  }

  function toggleTask(indexToToggle) {
    setTasks((current) =>
      current.map((task, index) =>
        index === indexToToggle
          ? { ...task, completed: !task.completed }
          : task,
      ),
    );
  }

  function deleteTask(indexToDelete) {
    setTasks((current) =>
      current.filter((_, index) => index !== indexToDelete),
    );

    if (editingIndex === indexToDelete) {
      cancelEditing();
    } else if (editingIndex > indexToDelete) {
      setEditingIndex((current) => current - 1);
    }
  }

  function clearCompleted() {
    if (
      !window.confirm("Are you sure you want to delete all completed tasks?")
    ) {
      return;
    }

    setTasks((current) => current.filter((task) => !task.completed));
    cancelEditing();
  }

  function startEditing(index, task) {
    setEditingIndex(index);
    setEditingText(task.text);
    setEditingPriority(task.priority || "medium");
  }

  function cancelEditing() {
    setEditingIndex(null);
    setEditingText("");
    setEditingPriority("medium");
  }

  function saveEdit(indexToEdit) {
    const text = editingText.trim();
    if (!text) return;

    setTasks((current) =>
      current.map((task, index) =>
        index === indexToEdit
          ? { ...task, text, priority: editingPriority }
          : task,
      ),
    );

    cancelEditing();
  }

  // Calculate progress from the current task list.
  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  // Search and filter while keeping each task's original index.
  const filteredTasks = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => {
      const matchesSearch = task.text
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesFilter =
        taskFilter === "all" ||
        (taskFilter === "active" && !task.completed) ||
        (taskFilter === "completed" && task.completed);

      return matchesSearch && matchesFilter;
    });

  return (
    <div className={`app-shell ${darkMode ? "dark-mode" : ""}`}>
      <main className="app">
        <header className="app-header">
          <div>
            <h1>Task Tracker</h1>
            <p className="subtitle">Organize your work, one task at a time.</p>
          </div>

          <button
            type="button"
            className="theme-button"
            onClick={() => setDarkMode((current) => !current)}
            aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        {/* Add a task and choose its priority. */}
        <form className="task-form" onSubmit={addTask}>
          <label className="visually-hidden" htmlFor="new-task">
            New task
          </label>
          <input
            id="new-task"
            type="text"
            placeholder="What needs to be done?"
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
          />

          <label className="visually-hidden" htmlFor="new-priority">
            Task priority
          </label>
          <select
            id="new-priority"
            value={newPriority}
            onChange={(event) => setNewPriority(event.target.value)}
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>

          <button type="submit">Add Task</button>
        </form>

        {/* Task counts and progress. */}
        <section className="progress-section" aria-label="Task progress">
          <div className="summary-row">
            <span>
              {completedCount} of {tasks.length} completed
            </span>
            <strong>{progress}%</strong>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-label="Task completion"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="count-row">
            <span>Total: {tasks.length}</span>
            <span>Active: {activeCount}</span>
          </div>
        </section>

        {/* Search and filters share the task controls area. */}
        <label className="visually-hidden" htmlFor="task-search">
          Search tasks
        </label>
        <input
          id="task-search"
          className="search-input"
          type="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="task-filters">
          {["all", "active", "completed"].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`filter-button ${
                taskFilter === filter ? "selected" : ""
              }`}
              aria-pressed={taskFilter === filter}
              onClick={() => setTaskFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}

          {taskFilter === "completed" && completedCount > 0 && (
            <button
              type="button"
              className="clear-completed"
              onClick={clearCompleted}
            >
              Clear Completed
            </button>
          )}
        </div>

        {/* Show matching tasks or a helpful empty state. */}
        <ul className="task-list">
          {filteredTasks.length === 0 ? (
            <li className="empty-state">
              {search.trim()
                ? "No tasks match your search."
                : taskFilter === "active"
                  ? "No active tasks. You're all caught up!"
                  : taskFilter === "completed"
                    ? "No completed tasks yet."
                    : "No tasks yet. Add your first task above!"}
            </li>
          ) : (
            filteredTasks.map(({ task, index }) => (
              <li className="task-item" key={index}>
                {editingIndex === index ? (
                  <div className="inline-editor">
                    <input
                      type="text"
                      aria-label="Edit task name"
                      value={editingText}
                      autoFocus
                      onChange={(event) => setEditingText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveEdit(index);
                        if (event.key === "Escape") cancelEditing();
                      }}
                    />

                    <select
                      aria-label="Edit task priority"
                      value={editingPriority}
                      onChange={(event) =>
                        setEditingPriority(event.target.value)
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>

                    <button
                      type="button"
                      className="save-button"
                      onClick={() => saveEdit(index)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="task-content">
                    <label className="task-label">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(index)}
                      />
                      <span className={task.completed ? "completed-text" : ""}>
                        {task.text}
                      </span>
                    </label>

                    <span
                      className={`priority-badge priority-${
                        task.priority || "medium"
                      }`}
                    >
                      {task.priority || "medium"}
                    </span>

                    <div className="task-actions">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => startEditing(index, task)}
                        aria-label={`Edit ${task.text}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteTask(index)}
                        aria-label={`Delete ${task.text}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>

        <footer className="app-footer">
          Your tasks are saved on this device.
        </footer>
      </main>
    </div>
  );
}

export default App;
