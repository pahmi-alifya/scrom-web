import React, { useState, useEffect } from "react";

function Dashboard({ user, onOpenCourse }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    fetch("/api/scorm/courses")
      .then((res) => res.json())
      .then(setCourses)
      .catch((err) => console.error("Failed to fetch courses:", err));
  };

  const handleUpload = async (e) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await fetch("/api/scorm/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      alert(data.message || "Upload success");
      fetchCourses(); // Refresh list
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <hr />
      <h3>Upload SCORM</h3>
      <input type="file" accept=".zip" onChange={handleUpload} />
      <hr />
      <h3>List SCORM</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {courses.map((c) => (
          <li key={c.courseId} style={{ marginBottom: "10px" }}>
            <button
              onClick={() => onOpenCourse(c)}
              style={{ padding: "8px 16px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;