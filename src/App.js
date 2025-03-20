import { useState } from "react";

function App() {
  const [url, setUrl] = useState(""); // Stores the input URL
  const [uuid, setUuid] = useState(""); // Extracts UUID
  const [error, setError] = useState("");

  const handleExtractUUID = () => {
    setError("");
    setUuid("");

    const match = url.match(/\/listing\/.+-([a-f0-9-]{36})$/i);

    let normalizedUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "");

    // Ensure the URL starts with "www.withgarage.com/listing/"
    if (!normalizedUrl.startsWith("withgarage.com/listing/")) {
      setError("Invalid URL. Please enter a valid Garage fire truck listing URL.");
      return;
    }
    // Ensure URL has a valid UUID (8-4-4-4-12)
    if (!match) {
      setError("Invalid URL format. Please enter a valid fire truck listing URL.");
      return;
    }

    const extractedUuid = match[1]; // Extract only the UUID
    setUuid(extractedUuid); // Store it in state
    console.log("Extracted UUID:", extractedUuid); // Debugging
  };
  
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>🚒 Fire Truck Invoice Generator</h1>

      <input
        type="text"
        placeholder="Enter Fire Truck Listing URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ padding: "10px", width: "60%" }}
      />

      <button
        onClick={handleExtractUUID}
        style={{ marginLeft: "10px", padding: "10px", cursor: "pointer" }}
      >
        Extract UUID
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {uuid && (
        <p style={{ marginTop: "20px" }}>
          <strong>Extracted UUID:</strong> {uuid}
        </p>
      )}
    </div>
  );
}

export default App;
