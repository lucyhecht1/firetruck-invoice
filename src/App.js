import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

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

  // Convert image URL to Base64 
  // bc jsPDF does not support loading external images directly from URL
  const getBase64Image = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg");
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    });
  };

  const generatePDF = async () => {
    if (!truckData) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Your Fire Truck Invoice", 20, 20);

    doc.setFontSize(12);
    doc.text(`Title: ${truckData.listingTitle || "N/A"}`, 20, 40);
    doc.text(`Year: ${truckData.itemAge || "N/A"}`, 20, 50);
    doc.text(`Location: ${truckData.addressState || "N/A"}`, 20, 60);
    doc.text(`Price: $${truckData.sellingPrice || "N/A"}`, 20, 70);
    doc.text(`Mileage: ${truckData.mileage ? truckData.mileage + " miles" : "N/A"}`, 20, 80);
    doc.text(`Tank Size: ${truckData.tankSize ? truckData.tankSize + " gallons" : "N/A"}`, 20, 90);
    doc.text(`Pump Size: ${truckData.pumpSize ? truckData.pumpSize + " GPM" : "N/A"}`, 20, 100);

    doc.setFontSize(10);
    doc.text("Description:", 20, 120);
    doc.text(truckData.listingDescription ? truckData.listingDescription.substring(0, 250) + "..." : "N/A", 20, 130, { maxWidth: 170 });

    // Add truck image
    if (truckData.imageUrls?.length > 0) {
      try {
        const base64Image = await getBase64Image(truckData.imageUrls[0]); // Convert first image
        doc.addImage(base64Image, "JPEG", 20, 150, 80, 60); // Position image
      } catch (error) {
        console.error("Failed to load image:", error);
      }
    }

    doc.save("fire_truck_invoice.pdf");
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
          <button onClick={generatePDF} style={{ marginTop: "20px", padding: "10px", cursor: "pointer" }}>
            Download Invoice
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
