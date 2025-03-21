import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import emailjs from "emailjs-com";
import './index.css';

function App() {
  const [url, setUrl] = useState(""); // stores the input URL
  const [uuid, setUuid] = useState(""); // extracts UUID
  const [error, setError] = useState("");
  const [truckData, setTruckData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfBase64, setPdfBase64] = useState("");


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
        const base64 = canvas.toDataURL("image/jpeg");
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    });
  };

  const generatePDF = async () => {
    if (!truckData || !name || !email) {
      alert("Please enter your name and email."); //do more specific error checking later
      return;
    }
    setLoading(true);
    setPdfGenerated(false);

    const doc = new jsPDF();

    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const logoUrl = "/logo-2.jpeg";
    try {
      const base64Logo = await getBase64Image(logoUrl);
      doc.addImage(base64Logo, "jpeg", 10, 18, 30, 30);
      doc.link(10, 18, 30, 30, { url: "https://www.withgarage.com/" });
    } catch (error) {
      console.error("Error loading logo:", error);
    }

    // Garage name, address look up
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

    const invoiceY = 30;  // invoice# position
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
    doc.text("This invoice contains details of your fire truck.", 10, y + 6);

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
    doc.text(name, 10, y + 6);
    doc.text(`Email: ${email}`, 10, y + 12);

    // wrap DETAILS if title is too long
    const detailsX = 73;
    const detailsY = y + 6;
    const detailsMaxWidth = 50;
    const detailsText = `Truck Model: ${truckData.listingTitle}`;
    const wrappedDetails = doc.splitTextToSize(detailsText, detailsMaxWidth);
    doc.text(wrappedDetails, detailsX, detailsY);

    doc.text(`Payment due: $${truckData.sellingPrice?.toLocaleString()}`, 142, y + 6);

    const detailsHeight = wrappedDetails.length * 6;
    y += Math.max(38, detailsHeight);

    doc.setFont("helvetica", "bold");

    doc.setLineWidth(0.4);
    doc.line(10, y, 200, y);

    // table headers
    const headerPadding = 8;
    const rowSpacing = 12;

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

    // bottom of the page - image and more details
    y = 225;

    // left side - Truck image
    if (truckData.imageUrls?.length > 0) {
      try {
        const base64Image = await getBase64Image(truckData.imageUrls[0]);

        const imgX = 10;
        const imgY = 225;
        const imgWidth = 85;
        const imgHeight = 65;

        doc.addImage(base64Image, "JPEG", imgX, imgY, imgWidth, imgHeight);

      } catch (error) {
        console.error("Error loading truck image:", error);
      }
    }

    // right side - two columns of text
    const column1X = 110;
    const column2X = 155;
    y = 230;
    doc.setFont("helvetica", "bold");
    doc.text("More Details:", column1X, y);
    doc.setFont("helvetica", "normal");

    y += 6;
    const description = truckData.listingDescription || "No additional details available";

    const lines = description.split("\n");

    const columnWidth = 40;

    let firstColumnText = [];
    let secondColumnText = [];
    let overflowText = [];
    let lineCount = 0;
    const maxLinesFirstColumn = 12; // max # of lines before switching to column 2
    const maxLinesTotal = 24;

    // process each line, add bullet points, wrap text
    lines.forEach((line) => {
      const wrappedLines = doc.splitTextToSize(`• ${line}`, columnWidth);
      wrappedLines.forEach((wrappedLine) => {
        if (lineCount < maxLinesFirstColumn) {
          firstColumnText.push(wrappedLine);
        } else if (lineCount < maxLinesTotal) {
          secondColumnText.push(wrappedLine);
        } else if (lineCount === maxLinesTotal) {
          secondColumnText.push("Continued on the next page...");
        } else {
          overflowText.push(wrappedLine); // Move extra text to new page
        }
        lineCount++;
      });
    });

    // print columns
    doc.text(firstColumnText, column1X, y);
    doc.text(secondColumnText, column2X, y);

    // if text > 24 lines, overflow on next page
    if (overflowText.length > 0) {
      doc.addPage();
      y = 30; // Reset position on new page

      doc.setFont("helvetica", "normal");
      doc.text(overflowText, column1X, y);
    }

    // Save the PDF
    const pdfBase64String = doc.output("datauristring").split(",")[1];
    setPdfBase64(pdfBase64String);

    setTimeout(() => {
      setLoading(false);
      setPdfGenerated(true);
    }, 1500);
  };

  const downloadPDF = () => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = "fire_truck_invoice.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendEmail = async () => {
    if (!pdfBase64) {
      alert("Please generate the invoice first.");
      return;
    }

    const templateParams = {
      name: name,
      email: email,
      title: truckData.listingTitle,
      pdf_attachment: pdfBase64,
    };

    try {
      const response = await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        templateParams,
        process.env.REACT_APP_EMAILJS_USER_ID
      );


      if (response.status === 200) {
        alert("Email sent successfully with the PDF attachment!");
      } else {
        alert("Failed to send email.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("An error occurred while sending the email.");
    }
  };

  return (
    <div className="garage-main-container">
      <div style={{ textAlign: "center", padding: "20px" }}>
        <header className="garage-header">
          <div className="garage-header-content">
            <img
              src="/logo-2.jpeg"
              alt="Garage Logo"
              className="garage-logo"
            />
            <h1 className="garage-title">Garage Invoice Generator</h1>
          </div>
          <p className="garage-subtitle">
            Create and email invoices for Garage fire truck listings
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExtractUUID();
          }}
          className="garage-form"
        >
          <input
            type="text"
            placeholder="Enter Fire Truck Listing URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="garage-input"
          />

          <button type="submit" className="orange-button">
            Get Truck Details
          </button>
        </form>


        {error && <p style={{ color: "red" }}>{error}</p>}

        {truckData && (
          <div className="truck-details-container">
            <h2 className="truck-title">{truckData.listingTitle || "No title available"}</h2><br></br>
            <div className="truck-main-info">
              <div className="truck-info-left">
                <p><strong>Year:</strong> {truckData.itemAge || "N/A"}</p>
                <p><strong>Location:</strong> {truckData.addressState || "N/A"}</p>
                <p><strong>Price:</strong> ${truckData.sellingPrice || "N/A"}</p>
                <p><strong>Mileage:</strong> {truckData.mileage ? `${truckData.mileage} miles` : "N/A"}</p>
                <p><strong>Tank Size:</strong> {truckData.tankSize ? `${truckData.tankSize} gallons` : "N/A"}</p>
                <p><strong>Pump Size:</strong> {truckData.pumpSize ? `${truckData.pumpSize} GPM` : "N/A"}</p>
              </div>

              {truckData.imageUrls?.length > 0 ? (
                <div className="truck-image-right">
                  <img
                    src={truckData.imageUrls[0]}
                    alt="Truck"
                    className="truck-image"
                  />
                </div>
              ) : (
                <p>No image available</p>
              )}
            </div>

            <div className="truck-description">
              <p><strong>Description:</strong></p>
              <p>{truckData.listingDescription || "No description available"}</p>
            </div>
            <br></br>

            <button
              onClick={() => setShowForm(true)}
              className="orange-button"
            >
              Generate PDF Invoice
            </button>
          </div>
        )}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                onClick={() => setShowForm(false)}
                className="modal-close-button"
                aria-label="Close modal"
              >
                ×
              </button>

              <h2 className="modal-heading">Get PDF Invoice</h2>
              <p className="modal-subtext">Fill out the information below to receive a personalized PDF invoice.</p>

              <label className="modal-label">Name (First and Last):</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="modal-input"
              />

              <label className="modal-label">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
              />

              <div className="modal-footer">
                {!pdfGenerated && (
                  <>
                    <button onClick={generatePDF} className="orange-button full-width-button">
                      Generate Invoice
                    </button>
                    {loading && <p className="modal-loading">Loading...</p>}
                  </>
                )}

                {pdfGenerated && (
                  <div className="modal-success">
                    <p>Your PDF invoice has been successfully generated!</p>

                    <button onClick={downloadPDF} className="orange-button">
                      Download PDF
                    </button>

                    <button onClick={sendEmail} className="white-outline-button">
                      Email Me
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;