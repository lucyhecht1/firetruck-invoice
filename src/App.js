import { useState } from "react";

function App() {
  const [url, setUrl] = useState(""); // Holds the input URL

  const handleSubmit = () => {
    console.log("Submitted URL:", url); // For debugging
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
        onClick={handleSubmit}
        style={{ marginLeft: "10px", padding: "10px", cursor: "pointer" }}
      >
        Get Invoice
      </button>
    </div>
  );
}

export default App;
