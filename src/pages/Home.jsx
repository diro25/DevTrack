import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Master Your Development Journey</h1>
        <p>Learn. Build. Track. Become a developer.</p>

        <div className="hero-buttons">
          <Link to="/register" className="primary-btn">
            Get Started
          </Link>
          <Link to="/login" className="secondary-btn">
            Login
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Track your skills</h3>
          <p>Keep an eye on what you are learning.</p>
        </div>

        <div className="feature-card">
          <h3>Organize your learning</h3>
          <p>Manage topics, tasks, and projects in one place.</p>
        </div>

        <div className="feature-card">
          <h3>Measure your progress</h3>
          <p>See how far you have come and what is left.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;