# Firetruck Invoice Generator
This tool lets you generate and email PDF invoices for fire truck listings from the Garage marketplace.  
Paste a listing URL to fetch truck details, generate a downloadable PDF invoice, and send it via email.

You can access the live app here:  
🔗 [https://lucyhecht1.github.io/firetruck-invoice/](https://lucyhecht1.github.io/firetruck-invoice/)

---

## Demo 1: Happy Path
A walkthrough of the complete flow: entering a valid truck listing, generating a PDF, and sending the invoice via email.

[![Watch the demo](https://img.youtube.com/vi/RpF2NyW2OIw/hqdefault.jpg)](https://www.youtube.com/watch?v=RpF2NyW2OIw)

---

## Demo 2: Invalid Inputs
See how the service responds to empty or incorrectly formatted fields.

[![Watch the demo](https://img.youtube.com/vi/nkOQXCrr2gU/hqdefault.jpg)](https://youtu.be/nkOQXCrr2gU)

---

## Demo 3: API Errors
Demonstrates how the service handles unexpected API issues, including non-existing UUIDs, 404s, and 500 server errors.

[![Watch the demo](https://img.youtube.com/vi/8c1GB9SKO4M/hqdefault.jpg)](https://www.youtube.com/watch?v=8c1GB9SKO4M)

---
### Tech  Stack:
- React – UI and state management
- Axios – Handles API requests to the Garage backend
- jsPDF – Generates downloadable PDF invoices
- EmailJS – Sends the generated invoice via email
- CSS – For custom styling and layout
---
### Installation  
*Note:* You can access the live version of the app [here](https://lucyhecht1.github.io/firetruck-invoice/)!

To run the app on your local machine:

Clone this repository:
```bash
git clone https://github.com/your-username/firetruck-invoice.git
```
Navigate to the project directory:
```bash
cd firetruck-invoice
```
Install dependencies:
```bash
npm install
```
**Set up EmailJS:**  
This app uses [EmailJS](https://www.emailjs.com/) to send the invoice PDF to users without needing a backend. To configure it:

1. [Create an EmailJS account](https://dashboard.emailjs.com/sign-up) if you don’t already have one.
2. Set up an email service and template in the EmailJS dashboard.
3. Create a `.env` file in the root of your project and add the following environment variables:

```env
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
REACT_APP_EMAILJS_USER_ID=your_public_key
```

You’ll find these values in your EmailJS dashboard.  
**Note:** Your `.env` file is already included in `.gitignore`.

**Start the app**
```bash
npm start
```
