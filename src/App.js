import { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";
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

  //for error handling
  const urlInputRef = useRef(null);
  const getDetailsButtonRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const generateButtonRef = useRef(null);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  //close modal using esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showForm) {
        setShowForm(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showForm]);

  const handleExtractUUID = () => {
    setError("");
    setUuid("");
    setTruckData(null);

    let normalizedUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    const match = url.match(/\/listing\/.+-([a-f0-9-]{36})$/i);


    // URL starts with "www.withgarage.com/listing/"
    if (!normalizedUrl.startsWith("withgarage.com/listing/")) {
      setError("Invalid URL. Please enter a valid Garage fire truck listing URL.");
      getDetailsButtonRef.current?.blur();
      urlInputRef.current?.focus();
      return;
    }
    // URL has invalid UUID (8-4-4-4-12)
    if (!match) {
      setError("Invalid URL format. Please enter a valid fire truck listing URL.");
      getDetailsButtonRef.current?.blur();
      urlInputRef.current?.focus();
      return;
    }

    //all valid
    const extractedUuid = match[1];
    setUuid(extractedUuid);
    console.log("Extracted UUID:", extractedUuid); // debugging
    fetchTruckData(extractedUuid);

    getDetailsButtonRef.current?.blur();
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
  const getBase64JPEGImage = (url) => {
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
        const base64 = canvas.toDataURL("image/jpeg", 0.85); // 85% quality
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    });
  };


  const generatePDF = async () => {
    const isValid = validateFields();
    if (!isValid) return;

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
      const base64Logo = await getBase64JPEGImage(logoUrl);
      doc.addImage(base64Logo, "JPEG", 10, 18, 30, 30);

      doc.link(10, 18, 30, 30, { url: "https://www.withgarage.com/" });
    } catch (error) {
      console.error("Error loading WebP logo:", error);
    }

    // Garage name, address look up
    const textX = 43;
    const textY = 30;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const companyText = "Garage Technologies, Inc.";
    doc.text(companyText, textX, textY);
    // Make company name clickable
    const textW = doc.getTextWidth(companyText);
    doc.link(textX, textY - 3, textW, 6, {
      url: "https://www.withgarage.com/",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("17 W 20th St", textX, textY + 6);
    doc.text("New York, NY, 10011", textX, textY + 12);

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
    const dateText = formattedDate;

    const invoiceY = 30;  // invoice# position
    const formattedDateY = invoiceY + textPadding; // formatted date below 'issue date'

    // right-align text
    doc.text(invoiceText, rightMargin - doc.getTextWidth(invoiceText), invoiceY);
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

    // add clickable link
    if (wrappedDetails.length > 0) {
      const titleX = detailsX;
      const titleY = detailsY;
      const firstLineWidth = doc.getTextWidth(wrappedDetails[0]);
      const listingUrl = url;

      doc.link(titleX, titleY - 3, firstLineWidth, 6, {
        url: listingUrl,
      });
    }

    doc.text(
      `Payment due: ${truckData.sellingPrice?.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      })}`,
      142,
      y + 6
    );

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

    // make it a clickable link to the listing
    const titleText = truckData.listingTitle;
    const titleX = 10;
    const titleY = y;
    doc.text(titleText, titleX, titleY);
    const listingUrl = url;
    const textWidth = doc.getTextWidth(titleText);

    doc.link(titleX, titleY - 3, textWidth, 6, { url: listingUrl });


    doc.text("1", 125, y);
    doc.text(
      truckData.sellingPrice?.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
      150,
      y
    );

    doc.text(
      truckData.sellingPrice?.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
      180,
      y
    );


    // section separator
    y += 8;
    doc.line(10, y, 200, y);

    // subtotal, tax, total due
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 150, y);
    doc.setFont("helvetica", "normal");
    doc.text(
      truckData.sellingPrice?.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
      180,
      y
    );

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Tax:", 150, y);
    doc.setFont("helvetica", "normal");
    doc.text("$0.00", 180, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Total Due:", 150, y);
    doc.text(
      truckData.sellingPrice?.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
      180,
      y
    );


    // --- Add a new page for image + more details ---
    doc.addPage();

    const imgX = 10;
    const imgY = 30;
    const imgWidth = 85;
    const imgHeight = 65;
    const columnWidth = 85;
    const baseLineHeight = 5;
    const lineHeight = baseLineHeight * 1.2;

    const column1X = 10;
    const column2X = 110;

    let wrappedDescription = [];

    if (truckData.imageUrls?.length > 0) {
      try {
        const base64Image = await getBase64JPEGImage(truckData.imageUrls[0]);
        doc.addImage(base64Image, "JPEG", imgX, imgY, imgWidth, imgHeight);

      } catch (error) {
        console.error("Error loading truck image:", error);
      }
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const rawDescription = truckData.listingDescription || "No additional details available";
    const description = rawDescription.replace(/\n{2,}/g, '\n');
    wrappedDescription = doc.splitTextToSize(description, columnWidth);

    // space for left column
    const column1StartY = imgY + imgHeight + 10; // below image
    const moreDetailsHeadingHeight = 6;
    const availableHeight = 297 - column1StartY - 10;
    const maxLinesLeft = Math.floor((availableHeight - moreDetailsHeadingHeight) / lineHeight);

    const column1Lines = wrappedDescription.slice(0, maxLinesLeft);
    const column2Lines = wrappedDescription.slice(maxLinesLeft);

    // left column — starts below image with “More Details”
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("More Details", column1X, column1StartY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (let i = 0; i < column1Lines.length; i++) {
      const lineY = column1StartY + moreDetailsHeadingHeight + i * lineHeight;
      doc.text(column1Lines[i], column1X, lineY);
    }
    // right column — aligned with image height
    const column2StartY = imgY;
    for (let i = 0; i < column2Lines.length; i++) {
      doc.text(column2Lines[i], column2X, column2StartY + i * lineHeight);
    }

    // Save the PDF
    const pdfBase64String = doc.output("datauristring").split(",")[1];
    setPdfBase64(pdfBase64String);

    setTimeout(() => {
      setLoading(false);
      setPdfGenerated(true);
    }, 1500);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateFields = () => {
    setNameError("");
    setEmailError("");

    if (!name.trim()) {
      setNameError("Name is required.");
      nameRef.current.focus();
      return false;
    }

    if (!email.trim()) {
      setEmailError("Email is required.");
      emailRef.current.focus();
      return false;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      emailRef.current.focus();
      return false;
    }

    return true;
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

    const pdfSizeInBytes = (pdfBase64.length * 3) / 4; // Base64 is approximately 33% larger
    console.log(`PDF size: ${pdfSizeInBytes} bytes`);

    const templateParams = {
      name: name,
      email: email,
      title: truckData.listingTitle,
      pdf_attachment: pdfBase64,
    };

    try {
      setLoading(true); // show firetruck loader

      const response = await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        templateParams,
        process.env.REACT_APP_EMAILJS_USER_ID
      );

      // email is successfully sent
      if (response.status === 200) {
        setShowForm(false);
        setBanner({
          message: `Your email has been sent to ${email}.`,
          isError: false,
        });
        setTimeout(() => setBanner(null), 5000);
      } else {
        setShowForm(false);
        setBanner({
          message: "An error occurred: Your email cannot be sent.",
          isError: true,
        });
        setTimeout(() => setBanner(null), 5000);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setShowForm(false);
      setBanner({
        message: "An error occurred while sending the email.",
        isError: true,
      });
      setTimeout(() => setBanner(null), 5000);
    } finally {
      setLoading(false); // Hide loader
    }
  };

  const [banner, setBanner] = useState(null);

  return (
    <div className="garage-main-container">
      {banner && (
        <div className={`email-banner ${banner.isError ? "error" : "success"}`}>
          {banner.message}
        </div>
      )}
      <div style={{ textAlign: "center", padding: "20px" }}>
        <header className="garage-header">
          <div className="garage-header-content">
            <a
              href="https://www.withgarage.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/logo-2.jpeg"
                alt="Garage Logo"
                className="garage-logo"
                style={{ cursor: "pointer" }}
              />
            </a>
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
            ref={urlInputRef}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (getDetailsButtonRef.current) {
                  getDetailsButtonRef.current.focus();
                }
              }
            }}
            className="garage-input"
          />

          <button
            type="submit"
            className="orange-button"
            ref={getDetailsButtonRef}
          >
            Get Truck Details
          </button>

        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {truckData && (
          <div className="truck-details-container">
            <h2 className="truck-title">
              {truckData.listingTitle || "No title available"}
            </h2>
            <div className="truck-main-info">
              {truckData.imageUrls?.length > 0 ? (
                <div className="truck-image-center">
                  <img
                    src={truckData.imageUrls[0]}
                    alt="Truck"
                    className="truck-image"
                  />
                </div>
              ) : (
                <p style={{ textAlign: "center" }}>No image available</p>
              )}

              <div className="truck-details-row">
                <div className="truck-info-left">
                  <p><strong>Year:</strong> {truckData.itemAge || "N/A"}</p>
                  <p><strong>Location:</strong> {truckData.addressState || "N/A"}</p>
                  <p><strong>Price:</strong> {truckData.sellingPrice?.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                  }) || "N/A"}</p>

                  <p><strong>Mileage:</strong> {truckData.mileage ? `${truckData.mileage} miles` : "N/A"}</p>
                  <p><strong>Tank Size:</strong> {truckData.tankSize ? `${truckData.tankSize} gallons` : "N/A"}</p>
                  <p><strong>Pump Size:</strong> {truckData.pumpSize ? `${truckData.pumpSize} GPM` : "N/A"}</p>
                </div>

                <div className="truck-description">
                  <p><strong>Description:</strong></p>
                  <p className="description-text">
                    {truckData.listingDescription
                      ? truckData.listingDescription.slice(0, 100) + "..."
                      : "No description available"
                    }
                  </p>
                  <p><em>See more details when you generate an invoice.</em></p>
                </div>
              </div>
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
                aria-label="Close modal (Esc)"
                title="Close modal (Esc)"
              >
                ×
              </button>

              <h2 className="modal-heading">Get PDF Invoice</h2>
              <p className="modal-subtext">Fill out the information below to receive a personalized PDF invoice.</p>

              <div className="input-group">
                <label className="modal-label">Name (First and Last):</label>
                <input
                  type="text"
                  placeholder="New Rochelle Fire Department"
                  ref={nameRef}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      emailRef.current?.focus(); // move to email field
                    }
                  }}
                  className="modal-input"
                />
                {nameError && <p className="input-error-message">{nameError}</p>}
              </div>
              <div className="input-group">
                <label className="modal-label">Email:</label>
                <input
                  type="email"
                  placeholder="johnsmith@gmail.com"
                  ref={emailRef}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const isValid = validateFields();
                      if (isValid && generateButtonRef.current) {
                        generateButtonRef.current.focus();
                      }
                    }
                  }}
                  className="modal-input"
                />
                {emailError && <p className="input-error-message">{emailError}</p>}
              </div>

              <div className="modal-footer">
                {!pdfGenerated && (
                  <>
                    <button
                      onClick={generatePDF}
                      ref={generateButtonRef}
                      className="orange-button full-width-button"
                    >
                      Generate Invoice
                    </button>
                    {loading && (
                      <>
                        <div className="firetruck-loader-container">
                          <div className="firetruck-loader">🚒</div>
                        </div>
                        <p className="modal-loading">Your PDF invoice is being generated...</p>
                      </>
                    )}
                  </>
                )}

                {pdfGenerated && (
                  <div className="modal-success">
                    {loading ? (
                      <div className="firetruck-loader-container">
                        <div className="firetruck-loader">🚒</div>
                      </div>
                    ) : (
                      <p>Your PDF invoice has been successfully generated!</p>
                    )}

                    <button onClick={downloadPDF} className="orange-button">
                      Download PDF
                    </button>

                    <button
                      onClick={sendEmail}
                      className="white-outline-button"
                      disabled={loading} // disable the button while loading
                    >
                      {loading ? "Sending Email..." : "Email Me"}
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