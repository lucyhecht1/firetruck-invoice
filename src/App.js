import { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import TruckDetails from "./components/TruckDetails";
import InvoiceModal from "./components/InvoiceModal";
import Banner from "./components/Banner";
import { fetchTruckData } from "./utils/fetchTruckData";
import "./index.css";

function App() {
  const [url, setUrl] = useState("");
  const [uuid, setUuid] = useState("");
  const [error, setError] = useState("");
  const [truckData, setTruckData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfBase64, setPdfBase64] = useState("");
  const [banner, setBanner] = useState(null);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const urlInputRef = useRef(null);
  const getDetailsButtonRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const generateButtonRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showForm) setShowForm(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  const handleExtractUUID = () => {
    setError("");
    setUuid("");
    setTruckData(null);
    setPdfGenerated(false);
    setPdfBase64("");
    setShowForm(false);
    setName("");
    setEmail("");
    setNameError("");
    setEmailError("");
    setBanner(null);

    const normalizedUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    const match = url.match(/\/listing\/.+-([a-f0-9-]{36})$/i);

    if (!normalizedUrl.startsWith("withgarage.com/listing/")) {
      setError("Invalid URL. Please enter a valid Garage fire truck listing URL.");
      getDetailsButtonRef.current?.blur();
      urlInputRef.current?.focus();
      return;
    }

    if (!match) {
      setError("Invalid URL format. Please enter a valid fire truck listing URL.");
      getDetailsButtonRef.current?.blur();
      urlInputRef.current?.focus();
      return;
    }

    const extractedUuid = match[1];
    setUuid(extractedUuid);
    fetchTruckData(extractedUuid, setTruckData, setError);
    getDetailsButtonRef.current?.blur();
  };

  const downloadPDF = () => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = "garage_invoice.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="garage-main-container">
      {banner && <Banner banner={banner} />}
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Header />

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
                getDetailsButtonRef.current?.focus();
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
          <TruckDetails truckData={truckData} setShowForm={setShowForm} />
        )}

        {(showForm || isClosing) && (
          <InvoiceModal
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            nameRef={nameRef}
            emailRef={emailRef}
            nameError={nameError}
            setNameError={setNameError}
            emailError={emailError}
            setEmailError={setEmailError}
            generateButtonRef={generateButtonRef}
            truckData={truckData}
            url={url}
            setPdfBase64={setPdfBase64}
            pdfBase64={pdfBase64}
            pdfGenerated={pdfGenerated}
            setPdfGenerated={setPdfGenerated}
            loading={loading}
            setLoading={setLoading}
            setShowForm={setShowForm}
            setBanner={setBanner}
            downloadPDF={downloadPDF}
            showForm={showForm}
            isClosing={isClosing}
            setIsClosing={setIsClosing}
          />
        )}
      </div>
    </div>
  );
}

export default App;
