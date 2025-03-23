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
To run the app on your local machine:

Clone this repository:
```
git clone https://github.com/your-username/firetruck-invoice.git
```
Navigate to the project directory:
```
cd firetruck-invoice
```
Install dependencies:
```
npm install
```
**Start the app**
```
npm start
