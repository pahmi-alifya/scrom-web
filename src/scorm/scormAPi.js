// type ScormData = Record<string, string>;

// interface IScormAPI {
//   Initialize(param?: string): string;
//   Terminate(param?: string): string;
//   GetValue(key: string): string;
//   SetValue(key: string, value: string): string;
//   Commit(param?: string): string;
//   GetLastError(): string;
//   GetErrorString(code: string): string;
//   GetDiagnostic(code: string): string;
// }

class BaseScormAPI {
  data = {};
  initialized = false;
  userId;
  courseId;

  constructor(userId, courseId) {
    this.userId = userId;
    this.courseId = courseId;
  }

  async saveToServer() {
    try {
      await fetch("/api/scorm/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: this.userId,
          courseId: this.courseId,
          data: this.data,
        }),
      });
      localStorage.setItem(
        `scormState:${this.userId}:${this.courseId}`,
        JSON.stringify(this.data)
      );
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  }

  async loadFromServer() {
    try {
      const res = await fetch(
        `/api/scorm/progress/${this.userId}/${this.courseId}`
      );
      if (res.ok) {
        const saved = await res.json();
        this.data = saved || {};
      } else {
        // fallback ke localStorage
        const local = localStorage.getItem(
          `scormState:${this.userId}:${this.courseId}`
        );
        if (local) this.data = JSON.parse(local);
      }
    } catch (err) {
      console.warn("Failed to load from server, using localStorage fallback");
      const local = localStorage.getItem(
        `scormState:${this.userId}:${this.courseId}`
      );
      if (local) this.data = JSON.parse(local);
    }
  }
}

/** SCORM 1.2 Implementation */
class Scorm12API extends BaseScormAPI {
  Initialize() {
    console.log("SCORM 1.2 Initialize");
    this.initialized = true;
    return "true";
  }

  Terminate() {
    console.log("SCORM 1.2 Terminate");
    this.saveToServer();
    this.initialized = false;
    return "true";
  }

  GetValue(key) {
    return this.data[key] || "";
  }

  SetValue(key, value) {
    this.data[key] = value;
    this.saveToServer();
    return "true";
  }

  Commit() {
    this.saveToServer();
    return "true";
  }

  GetLastError() {
    return "0";
  }

  GetErrorString() {
    return "No error";
  }

  GetDiagnostic() {
    return "Diagnostic info";
  }
}

/** SCORM 2004 Implementation */
class Scorm2004API extends BaseScormAPI {
  Initialize(param) {
    console.log("SCORM 2004 Initialize", param);
    this.initialized = true;
    return "true";
  }

  Terminate(param) {
    console.log("SCORM 2004 Terminate", param);
    this.saveToServer();
    this.initialized = false;
    return "true";
  }

  GetValue(key) {
    return this.data[key] || "";
  }

  SetValue(key, value) {
    this.data[key] = value;
    this.saveToServer();
    return "true";
  }

  Commit(param) {
    this.saveToServer();
    return "true";
  }

  GetLastError() {
    return "0";
  }

  GetErrorString() {
    return "No error";
  }

  GetDiagnostic() {
    return "Diagnostic info";
  }
}

/** Initialize SCORM APIs and inject to global */
export async function initScormAPI(userId, courseId) {
  const api12 = new Scorm12API(userId, courseId);
  const api2004 = new Scorm2004API(userId, courseId);

  await api12.loadFromServer();
  await api2004.loadFromServer();

  window.API = api12; // SCORM 1.2
  window.API_1484_11 = api2004; // SCORM 2004
}
