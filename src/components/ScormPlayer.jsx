import { useEffect, useRef } from "react";
import { initScormAPI } from "../scorm/scormAPi";

export default function ScormPlayer({ scormUrl, userId, courseId, onBack }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    initScormAPI(userId, courseId);
    return () => {
      if (window.API && typeof window.API.Terminate === 'function') {
        window.API.Terminate();
      }
      if (window.API_1484_11 && typeof window.API_1484_11.Terminate === 'function') {
        window.API_1484_11.Terminate();
      }
      
      delete window.API;
      delete window.API_1484_11;
    };
  }, [userId, courseId]);

  return (
    <div>
      <button onClick={onBack}>&larr; Back</button>
      <div style={{ position: "relative", width: "100%", height: "80vh", marginTop: "10px", border: "1px solid #ccc" }}>
        <iframe
          ref={iframeRef}
          src={scormUrl}
          title="SCORM Player"
          style={{ width: "100%", height: "100%", border: "none" }}
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
