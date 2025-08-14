import { useState } from "react";

export default function App() {
  const [scormPath, setScormPath] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.success) {
      setScormPath(data.path);
    } else {
      alert("Upload failed: " + data.error);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>SCORM Player (React + Node.js)</h2>

      <input type="file" accept=".zip" onChange={handleUpload} />
      {loading && <p>Uploading & extracting...</p>}

      {scormPath && (
        <iframe
          src={scormPath}
          title="SCORM Player"
          style={{
            marginTop: 20,
            width: "100%",
            height: "600px",
            border: "1px solid #ccc",
          }}
        />
      )}
    </div>
  );
}

