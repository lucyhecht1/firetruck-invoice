import { useState } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState(""); // Stores the input URL
  const [uuid, setUuid] = useState(""); // Extracts UUID
  const [error, setError] = useState("");
  const [truckData, setTruckData] = useState(null);


  const handleExtractUUID = () => {
    setError("");
    setUuid("");
    setTruckData(null);

    let normalizedUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    const match = url.match(/\/listing\/.+-([a-f0-9-]{36})$/i);


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
    fetchTruckData(extractedUuid);
  };
  const fetchTruckData = async (uuid) => {
    try {
      const response = await axios.post("https://garage-backend.onrender.com/getListing", {
        id: uuid,
      });

      console.log("API Response:", response.data); // Debugging: Check API response

      setTruckData(response.data);
      if (response.data.result?.listing) {
        setTruckData(response.data.result.listing);
      } else {
        setError("Invalid API response format.");
      }
    } catch (error) {
      setError("Error fetching truck data. Please try again.");
      console.error(error);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Fire Truck Invoice Generator</h1>

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
        Get Truck Details
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {truckData && (
        <div>
          <h2>{truckData.listingTitle || "No title available"}</h2>
          <p><strong>Year:</strong> {truckData.itemAge || "N/A"}</p>
          <p><strong>Location:</strong> {truckData.addressState || "N/A"}</p>
          <p><strong>Price:</strong> ${truckData.sellingPrice || "N/A"}</p>
          <p><strong>Mileage:</strong> {truckData.mileage ? `${truckData.mileage} miles` : "N/A"}</p>
          <p><strong>Tank Size:</strong> {truckData.tankSize ? `${truckData.tankSize} gallons` : "N/A"}</p>
          <p><strong>Pump Size:</strong> {truckData.pumpSize ? `${truckData.pumpSize} GPM` : "N/A"}</p>
          <p><strong>Description:</strong></p>
          <p>{truckData.listingDescription || "No description available"}</p>

          {truckData.imageUrls?.length > 0 ? (
            <div>
              <h3>Images:</h3>
              {truckData.imageUrls.map((image, index) => (
                <img key={index} src={image} alt="Truck" style={{ width: "100%", maxWidth: "400px", marginTop: "10px" }} />
              ))}
            </div>
          ) : (
            <p>No images available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
