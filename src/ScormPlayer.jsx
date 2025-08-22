// src/components/ScormPlayer.tsx
import { useEffect, useRef } from "react";
import { initScormAPI } from "./scorm/scormAPi";

export default function ScormPlayer({ scormUrl, userId, courseId }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    initScormAPI(userId, courseId);
  }, [userId, courseId]);

  return (
    <div className="w-full h-screen">
      <iframe
        ref={iframeRef}
        src={scormUrl}
        title="SCORM Player"
        style={{
          width: "100%",
          height: "40rem",
          border: "none",
        }}
      />
    </div>
  );
}
