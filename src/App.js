import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

function App() {
  const [url, setUrl] = useState(""); // stores the input URL
  const [uuid, setUuid] = useState(""); // extracts UUID
  const [error, setError] = useState("");
  const [truckData, setTruckData] = useState(null);


  const handleExtractUUID = () => {
    setError("");
    setUuid("");
    setTruckData(null);

    let normalizedUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    const match = url.match(/\/listing\/.+-([a-f0-9-]{36})$/i);


    // URL starts with "www.withgarage.com/listing/"
    if (!normalizedUrl.startsWith("withgarage.com/listing/")) {
      setError("Invalid URL. Please enter a valid Garage fire truck listing URL.");
      return;
    }
    // URL has a valid UUID (8-4-4-4-12)
    if (!match) {
      setError("Invalid URL format. Please enter a valid fire truck listing URL.");
      return;
    }

    const extractedUuid = match[1];
    setUuid(extractedUuid);
    console.log("Extracted UUID:", extractedUuid); // debugging
    fetchTruckData(extractedUuid);
  };

  const fetchTruckData = async (uuid) => {
    try {
      const response = await axios.post("https://garage-backend.onrender.com/getListing", {
        id: uuid,
      });

      console.log("API Response:", response.data);

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
        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    });
  };

  const generatePDF = async () => {
    if (!truckData) return;

    const doc = new jsPDF();

    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const logoUrl = "/logo-2.png";
    try {
      const base64Logo = await getBase64Image(logoUrl);
      doc.addImage(base64Logo, "png", 10, 18, 30, 30);
      doc.link(10, 18, 30, 30, { url: "https://www.withgarage.com/" });
    } catch (error) {
      console.error("Error loading logo:", error);
    }

    // Garage name, address,
    const textX = 43;
    const textY = 30;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Garage Technologies, Inc.", textX, textY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("123 Firetruck Lane", textX, textY + 6);
    doc.text("New York, NY, USA", textX, textY + 12);

    let y = 30;

    // invoice details - top right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    // generate a random invoice number (6 digits)
    const invoiceNumber = Math.floor(100000 + Math.random() * 900000);
    const rightMargin = 200;
    const textPadding = 6;

    const invoiceText = `Invoice #${invoiceNumber}`;
    doc.setFontSize(10);
    const issueDateText = "Issue Date"; //maybe cut??
    const dateText = formattedDate;

    const invoiceY = 30;  // invoice # position
    const issueDateY = invoiceY + textPadding;  // issue date below
    const formattedDateY = issueDateY + textPadding; // formatted date below 'issue date'

    // right-align text
    doc.text(invoiceText, rightMargin - doc.getTextWidth(invoiceText), invoiceY);
    doc.text(issueDateText, rightMargin - doc.getTextWidth(issueDateText), issueDateY);
    doc.setFont("helvetica", "normal");
    doc.text(dateText, rightMargin - doc.getTextWidth(dateText), formattedDateY);

    y += 20;
    doc.setLineWidth(0.3);
    doc.line(10, y, 200, y);

    // top right
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Invoice", 10, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("This invoice contains the purchase details of your fire truck.", 10, y + 6);

    // three-column section: "Bill To" | "Details" | "Payment" 
    y += 30;
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(10, y - 5, 60, y - 5);  // line above "BILL TO"
    doc.line(73, y - 5, 129, y - 5); // line above "DETAILS"
    doc.line(142, y - 5, 200, y - 5); // line above "PAYMENT"

    doc.text("BILL TO", 10, y);
    doc.text("DETAILS", 73, y);
    doc.text("PAYMENT", 142, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Lucy Hecht", 10, y + 6);
    doc.text("Email: lucy@example.com", 10, y + 12);
    doc.text("Phone: 123-456-7890", 10, y + 18);

    doc.text("Truck Model:", 73, y + 6);
    doc.text(truckData.listingTitle, 73, y + 12);

    doc.text("Due Date:", 142, y + 6);
    doc.text("March 30, 2025", 142, y + 12);
    doc.text(`$${truckData.sellingPrice?.toLocaleString()}`, 142, y + 18);

    y += 38;
    doc.setFont("helvetica", "bold");

    doc.setLineWidth(0.4);
    doc.line(10, y, 200, y);

    // table headers
    const headerPadding = 8; // Space between the lines and text
    const rowSpacing = 12; // Space between headers and first row

    doc.text("ITEM", 10, y + headerPadding);
    doc.text("QTY", 120, y + headerPadding);
    doc.text("PRICE", 150, y + headerPadding);
    doc.text("AMOUNT", 180, y + headerPadding);

    doc.line(10, y + headerPadding + 5, 200, y + headerPadding + 5);

    // table data
    y += headerPadding + rowSpacing;
    doc.setFont("helvetica", "normal");
    doc.text(truckData.listingTitle, 10, y);
    doc.text("1", 125, y);
    doc.text(`$${truckData.sellingPrice?.toLocaleString()}`, 150, y);
    doc.text(`$${truckData.sellingPrice?.toLocaleString()}`, 180, y);

    // section separator
    y += 8;
    doc.line(10, y, 200, y);

    // subtotal, tax, total due
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 150, y);
    doc.setFont("helvetica", "normal");
    doc.text(`$${truckData.sellingPrice?.toLocaleString()}`, 180, y);


    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Tax:", 150, y);
    doc.setFont("helvetica", "normal");
    doc.text("$0.00", 180, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Total Due:", 150, y);
    doc.text(`$${truckData.sellingPrice?.toLocaleString()}`, 180, y);

    // Save the PDF
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
