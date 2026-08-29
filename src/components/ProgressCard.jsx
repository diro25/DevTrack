function ProgressCard({ title, progress }) {
  return (
    <div className="progress-card">
      <h3>{title}</h3>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: progress }}></div>
      </div>
      <p>{progress}</p>
    </div>
  );
}

export default ProgressCard;