import React, { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CourseProgress from "./components/CourseProgress";
import ScormPlayer from "./components/ScormPlayer";


function App() {
  const [user, setUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [view, setView] = useState("login");

  const handleLogin = (userData) => {
    setUser(userData);
    setView("dashboard");
  };

  const handleOpenCourse = (course) => {
    setSelectedCourse(course);
    setView("courseProgress");
  };

  const handleStartScorm = (course) => {
    setSelectedCourse(course);
    setView("scormPlayer");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    setSelectedCourse(null);
  };

  const handleBackToCourseList = () => {
    setView("courseProgress");
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ padding: "20px" }}>
      {view === "dashboard" && (
        <Dashboard
          user={user}
          onOpenCourse={handleOpenCourse}
        />
      )}
      {view === "courseProgress" && selectedCourse && (
        <CourseProgress
          user={user}
          course={selectedCourse}
          onBack={handleBackToDashboard}
          onStartScorm={() => handleStartScorm(selectedCourse)}
        />
      )}
      {view === "scormPlayer" && selectedCourse && (
        <ScormPlayer
          scormUrl={`/courses/${selectedCourse.path}/index_lms.html`}
          userId={user.id}
          courseId={selectedCourse.courseId}
          onBack={handleBackToCourseList}
        />
      )}
    </div>
  );
}

export default App;