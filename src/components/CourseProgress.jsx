import React, { useState, useEffect } from "react";
import SCORMHistory from "./ScormHistory";

function CourseProgress({ user, course, onBack, onStartScorm }) {
  const [progressUsers, setProgressUsers] = useState([]);
  const [selectedUserProgress, setSelectedUserProgress] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isCurrentUserStarted, setIsCurrentUserStarted] = useState(false);

  useEffect(() => {
    fetchCourseProgress();
  }, []);

  const fetchCourseProgress = async () => {
    try {
      const res = await fetch(`/api/scorm/course-progress/${course.courseId}`);
      if (res.ok) {
        const data = await res.json();
        setProgressUsers(data);
        setIsCurrentUserStarted(data.some(p => p.userId === user.id));
      }
    } catch (error) {
      console.error("Failed to fetch course progress:", error);
    }
  };

  const handleDetailClick = async (progress) => {
    try {
      const res = await fetch(`/api/scorm/history/${progress.userId}/${course.courseId}`);
      if (res.ok) {
        const history = await res.json();
        setSelectedUserProgress({ ...progress, history });
        setShowHistory(true);
      }
    } catch (error) {
      console.error("Failed to fetch SCORM history:", error);
    }
  };

  const handleDeleteProgress = async (progress) => {
    if (window.confirm("Are you sure you want to delete this progress?")) {
      try {
        await fetch(`/api/scorm/progress/${progress.userId}/${course.courseId}`, {
          method: "DELETE",
        });
        alert("Progress deleted successfully.");
        fetchCourseProgress();
      } catch (error) {
        console.error("Failed to delete progress:", error);
      }
    }
  };

  if (showHistory) {
    return (
      <SCORMHistory
        progress={selectedUserProgress}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <div>
      <button onClick={onBack}>&larr; Back to Dashboard</button>
      <h2>Progress Course: {course.name}</h2>
      {!isCurrentUserStarted && (
        <button onClick={onStartScorm} style={{ margin: "10px 0", padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px" }}>
          Start SCORM
        </button>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ backgroundColor: "#000" }}>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Nama</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Started On</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Last Accessed On</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Score</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {progressUsers.map((p) =>{ 
            return (
            <tr key={p.userId}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{p.userName}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{p.userEmail}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{new Date(p.startedAt).toLocaleString()}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{new Date(p.updatedAt).toLocaleString()}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {p.data && JSON.parse(p.data)['cmi.score.raw'] || 'N/A'}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                <button onClick={() => onStartScorm(course)} style={{ margin: "2px", padding: "5px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px" }}>Play</button>
                <button onClick={() => handleDetailClick(p)} style={{ margin: "2px", padding: "5px", backgroundColor: "#ffc107", color: "#000", border: "none", borderRadius: "4px" }}>Detail</button>
                <button onClick={() => handleDeleteProgress(p)} style={{ margin: "2px", padding: "5px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px" }}>Delete</button>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}

export default CourseProgress;