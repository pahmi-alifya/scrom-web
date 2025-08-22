import React from "react";

function Scormistory({ progress, onBack }) {
  return (
    <div>
      <button onClick={onBack}>&larr; Back to progress</button>
      <h2>History SCORM from {progress.userName}</h2>
      <p>ID User: {progress.userId}</p>
      <p>Email: {progress.userEmail}</p>
      <p>Start Date: {new Date(progress.startedAt).toLocaleString()}</p>
      
      <h3>SCORM Data:</h3>
      <pre style={{ border: "1px solid #ccc", padding: "10px", backgroundColor: "#000", overflowX: "auto" }}>
        {JSON.stringify(JSON.parse(progress.data), null, 2)}
      </pre>

      <h3>Log History:</h3>
      {progress.history.map((h, index) => (
          <div key={index} style={{ marginBottom: '10px', border: '1px solid #eee', padding: '5px' }}>
              <p>Time: {new Date(h.timestamp).toLocaleString()}</p>
              <p>Key: {h.key}</p>
              <p>Action: {h.action}</p>
          </div>
      ))}
    </div>
  );
}

export default Scormistory;