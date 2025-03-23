import React from "react";
import { generatePDF as generatePDFUtil } from "../utils/generatePDF";
import { sendEmail as sendEmailUtil } from "../utils/sendEmail";
import { isValidEmail } from "../utils/validators";
import { useEffect } from "react";

export default function InvoiceModal({
  name,
  setName,
  email,
  setEmail,
  nameRef,
  emailRef,
  nameError,
  setNameError,
  emailError,
  setEmailError,
  generateButtonRef,
  truckData,
  url,
  setPdfBase64,
  pdfBase64,
  pdfGenerated,
  setPdfGenerated,
  loading,
  setLoading,
  setShowForm,
  setBanner,
  downloadPDF,
  showForm,
  isClosing,
  setIsClosing,
}) {
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

  const handleGeneratePDF = async () => {
    const isValid = validateFields();
    if (!isValid) return;

    setLoading(true);
    const { base64PDF, estimatedBytes, doc } = await generatePDFUtil({ truckData, name, email, url });
    setPdfBase64(base64PDF);

    // save a reference to the doc in case of large PDF fallback
    InvoiceModal.generatedDoc = doc;
    InvoiceModal.estimatedBytes = estimatedBytes;
    console.log("Estimated PDF size:", InvoiceModal.estimatedBytes);


    // slight delay to let firetruck appear before fading in buttons
    setTimeout(() => {
      setLoading(false);
      setPdfGenerated(true);
    }, 800);
  };

  const handleSendEmail = async () => {
    if (!pdfBase64) {
      setBanner({
        message: "Please generate the invoice first.",
        isError: true,
      });
      setTimeout(() => setBanner(null), 5000);
      return;
    }

    // fallback for PDFs larger than 2MB (EmailJS limit)
    const size = InvoiceModal.estimatedBytes || pdfBase64.length;
    if (size > 2_000_000) {
      setBanner({
        message: "The PDF is too large to email. Please download the invoice instead.",
        isError: true,
      });
      setTimeout(() => setBanner(null), 5000);
      return;
    }

    setLoading(true);

    await sendEmailUtil({
      name,
      email,
      truckData,
      pdfBase64,
      setShowForm,
      setBanner,
    });

    setLoading(false);
    setIsClosing(true);
    setTimeout(() => {
      setShowForm(false);
      setIsClosing(false);
    }, 400);
  };

  //debugging firetruck loader
  useEffect(() => {
    console.log("Loading state:", loading);
  }, [loading]);

  return (
    <div className={`modal-overlay ${showForm ? "show" : ""} ${isClosing ? "closing" : ""}`}>
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
        <p className="modal-subtext">
          Fill out the information below to receive a personalized PDF invoice.
        </p>

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
                emailRef.current?.focus();
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

        <div className="modal-footer transition-wrapper">
          {loading && (
            <div className="firetruck-loader-container">
              <div className="firetruck-loader">🚒</div>
            </div>
          )}

          <div
            className={`transition-button-wrapper ${!pdfGenerated && !loading ? "fade-in" : "fade-out"
              }`}
          >
            <button
              onClick={handleGeneratePDF}
              ref={generateButtonRef}
              className="orange-button full-width-button"
              disabled={loading}
            >
              Generate Invoice
            </button>
          </div>

          <div
            className={`transition-button-wrapper ${pdfGenerated && !loading ? "fade-in" : "fade-out"
              }`}
          >
            <div className="modal-success">
              <p>Your PDF invoice has been successfully generated!</p>
              <button onClick={downloadPDF} className="orange-button">
                Download PDF
              </button>
              <button
                onClick={handleSendEmail}
                className="white-outline-button"
                disabled={loading}
              >
                {loading ? "Sending Email..." : "Email Me"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
