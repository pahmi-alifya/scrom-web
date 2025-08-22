// import { useState, useEffect } from "react";
// import UserList from "./UserList";
// import UserDetails from "./UserDetails";

// export default function App() {
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [view, setView] = useState("courses"); // 'courses', 'player', 'list', 'details'
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [currentCourse, setCurrentCourse] = useState(null);
//   const [scormPath, setScormPath] = useState(null);
//   const [selectedUserId, setSelectedUserId] = useState(null);

//   useEffect(() => {
//     fetchCourses();

//     const handleMessage = (event) => {
//       // Pastikan pesan berasal dari domain yang Anda harapkan
//       // Jika di-deploy, ganti dengan domain Anda
//       // if (event.origin !== "http://localhost:5173") return;
      
//       const { type, completionStatus, score } = event.data;
      
//       if (type === "SCORM_SAVE_STATE") {
//         console.log("Pesan diterima dari SCORM:", event.data);
//         if (completionStatus === "completed") {
//           alert(`Selamat, Anda telah menyelesaikan kursus! Skor Anda: ${score}`);
//           setTimeout(() => {
//             handleGoHome();
//           }, 3000);
//         }
//       }
//     };
    
//     window.addEventListener('message', handleMessage);
    
//     return () => {
//       window.removeEventListener('message', handleMessage);
//     };
//   }, []);

//   async function fetchCourses() {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/courses");
//       const data = await res.json();
//       setCourses(data);
//     } catch (err) {
//       console.error("Failed to fetch courses:", err);
//     }
//     setLoading(false);
//   }

//   async function handleUpload(e) {
//     const file = e.target.files[0];
//     if (!file) return;

//     setLoading(true);
//     const formData = new FormData();
//     formData.append("file", file);

//     const res = await fetch("/upload", {
//       method: "POST",
//       body: formData,
//     });
//     const data = await res.json();

//     if (data.success) {
//       alert("SCORM uploaded successfully!");
//       fetchCourses(); // Muat ulang daftar kursus
//     } else {
//       alert("Upload failed: " + data.error);
//     }
//     setLoading(false);
//     e.target.value = null; // Reset input file
//   }

//   async function handleStartScorm(e) {
//     e.preventDefault();
//     if (!name || !email || !currentCourse) {
//       alert("Please enter your name, email, and select a course.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch("/start-scorm", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name,
//           email,
//           courseId: currentCourse.id,
//         }),
//       });
//       const data = await res.json();

//       if (data.success) {
//         setScormPath(data.scormPath);
//         setView("player");
//       } else {
//         alert("Failed to start SCORM: " + data.error);
//       }
//     } catch (err) {
//       alert("An error occurred: " + err.message);
//     }
//     setLoading(false);
//   }

//   function handleViewList() {
//     setView("list");
//   }

//   function handleViewDetails(id) {
//     setSelectedUserId(id);
//     setView("details");
//   }

//   function handleBack() {
//     setView("list");
//   }

//   function handleGoHome() {
//     setView("courses");
//     setScormPath(null);
//     setCurrentCourse(null);
//     setName("");
//     setEmail("");
//     fetchCourses();
//   }

//   function handleSelectCourse(course) {
//     setCurrentCourse(course);
//     setView("startForm");
//   }

//   return (
//     <div style={{ padding: 20 }}>
//       {view === "courses" && (
//         <>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <h2>SCORM Player (React + Node.js)</h2>
//             <button onClick={handleViewList} disabled={loading}>
//               View Learner Data
//             </button>
//           </div>
//           <hr />

//           <h3>Upload New SCORM</h3>
//           <input type="file" accept=".zip" onChange={handleUpload} disabled={loading} />
//           {loading && <p>Uploading & extracting...</p>}

//           <h3 style={{ marginTop: 20 }}>Available Courses</h3>
//           {loading ? (
//             <p>Loading courses...</p>
//           ) : courses.length === 0 ? (
//             <p>No courses found. Please upload one.</p>
//           ) : (
//             <ul style={{ listStyle: "none", padding: 0 }}>
//               {courses.map((course) => (
//                 <li key={course.id} style={{ marginBottom: 10 }}>
//                   <button onClick={() => handleSelectCourse(course)}>
//                     {course.title}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </>
//       )}

//       {view === "startForm" && currentCourse && (
//         <>
//           <button onClick={handleGoHome}>&larr; Back</button>
//           <h2 style={{ marginTop: 10 }}>Start Course: {currentCourse.title}</h2>
//           <form onSubmit={handleStartScorm} style={{ marginTop: 20 }}>
//             <p>Please enter your details to begin:</p>
//             <input
//               type="text"
//               placeholder="Your Name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//             />
//             <input
//               type="email"
//               placeholder="Your Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               style={{ marginLeft: 10 }}
//             />
//             <button type="submit" disabled={loading} style={{ marginLeft: 10 }}>
//               Start SCORM
//             </button>
//           </form>
//         </>
//       )}

//       {view === "player" && scormPath && (
//         <>
//           <button onClick={handleGoHome}>&larr; Back to Home</button>
//           <h2 style={{ marginTop: 10 }}>SCORM Player</h2>
//           <iframe
//             src={scormPath}
//             title="SCORM Player"
//             style={{
//               marginTop: 20,
//               width: "100%",
//               height: "600px",
//               border: "1px solid #ccc",
//             }}
//           />
//         </>
//       )}

//       {view === "list" && <UserList onViewDetails={handleViewDetails} onBack={handleGoHome} />}

//       {view === "details" && <UserDetails userId={selectedUserId} onBack={handleBack} />}
//     </div>
//   );
// }

// src/App.tsx
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
