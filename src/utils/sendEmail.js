import emailjs from "emailjs-com";

export async function sendEmail({ name, email, truckData, pdfBase64, setShowForm, setBanner }) {
  const templateParams = {
    name,
    email,
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
      setShowForm(false);
      setBanner({
        message: `Your email has been sent to ${email}.`,
        isError: false,
      });
    } else {
      setShowForm(false);
      setBanner({
        message: "An error occurred: Your email cannot be sent.",
        isError: true,
      });
    }
  } catch (error) {
    console.error("Error sending email:", error);
    setShowForm(false);
    setBanner({
      message: "An error occurred while sending the email.",
      isError: true,
    });
  } finally {
    setTimeout(() => setBanner(null), 5000);
  }
}