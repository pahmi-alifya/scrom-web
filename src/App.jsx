import { useState, useEffect } from "react";
import ScormPlayer from "./ScormPlayer";

function App() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    fetch("/api/scorm/courses")
      .then((res) => res.json())
      .then(setCourses);
  }, []);

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
    const newCourses = await fetch("/api/scorm/courses");
    setCourses(await newCourses.json());
   } catch (error) {
    console.error("Upload failed:", error);
   }
  };

  if (selectedCourse) {
    return (
      <ScormPlayer
        scormUrl={`/${selectedCourse.path}/index_lms.html`}
        userId="user123"
        courseId={selectedCourse.courseId}
      />
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">SCORM</h1>

      <input type="file" accept=".zip" onChange={handleUpload} />

      <ul className="mt-4">
        {courses.map((c) => (
          <li key={c.courseId} className="mb-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => setSelectedCourse(c)}
            >
              Open {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
