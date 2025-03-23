import { jsPDF } from "jspdf";
import { getBase64JPEGImage } from "./getBase64Image";

export async function generatePDF({ truckData, name, email, url }) {
    const doc = new jsPDF();

    const formattedDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const logoUrl = `${process.env.PUBLIC_URL}/logo-2.jpeg`;
    try {
        const base64Logo = await getBase64JPEGImage(logoUrl);
        doc.addImage(base64Logo, "JPEG", 10, 18, 30, 30);
        doc.link(10, 18, 30, 30, { url: "https://www.withgarage.com/" });
    } catch (error) {
        console.error("Error loading logo:", error);
    }

    const textX = 43;
    const textY = 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const companyText = "Garage Technologies, Inc.";
    doc.text(companyText, textX, textY);
    const textW = doc.getTextWidth(companyText);
    doc.link(textX, textY - 3, textW, 6, {
        url: "https://www.withgarage.com/",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("17 W 20th St", textX, textY + 6);
    doc.text("New York, NY, 10011", textX, textY + 12);

    let y = 30;
    const invoiceNumber = Math.floor(100000 + Math.random() * 900000);
    const rightMargin = 200;
    const textPadding = 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const invoiceText = `Invoice #${invoiceNumber}`;
    const dateText = formattedDate;

    doc.text(invoiceText, rightMargin - doc.getTextWidth(invoiceText), y);
    doc.setFont("helvetica", "normal");
    doc.text(dateText, rightMargin - doc.getTextWidth(dateText), y + textPadding);

    y += 20;
    doc.setLineWidth(0.3);
    doc.line(10, y, 200, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Invoice", 10, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("This invoice contains details of your fire truck.", 10, y + 6);

    y += 30;
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(10, y - 5, 60, y - 5);
    doc.line(73, y - 5, 129, y - 5);
    doc.line(142, y - 5, 200, y - 5);

    doc.text("BILL TO", 10, y);
    doc.text("DETAILS", 73, y);
    doc.text("PAYMENT", 142, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(name, 10, y + 6);
    doc.text(`Email: ${email}`, 10, y + 12);

    const detailsX = 73;
    const detailsY = y + 6;
    const detailsMaxWidth = 50;
    const detailsText = `Truck Model: ${truckData.listingTitle}`;
    const wrappedDetails = doc.splitTextToSize(detailsText, detailsMaxWidth);
    doc.text(wrappedDetails, detailsX, detailsY);

    if (wrappedDetails.length > 0) {
        const firstLineWidth = doc.getTextWidth(wrappedDetails[0]);
        doc.link(detailsX, detailsY - 3, firstLineWidth, 6, { url });
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
    doc.setLineWidth(0.4);
    doc.line(10, y, 200, y);

    const headerPadding = 8;
    const rowSpacing = 12;

    doc.setFont("helvetica", "bold");
    doc.text("ITEM", 10, y + headerPadding);
    doc.text("QTY", 120, y + headerPadding);
    doc.text("PRICE", 150, y + headerPadding);
    doc.text("AMOUNT", 180, y + headerPadding);
    doc.line(10, y + headerPadding + 5, 200, y + headerPadding + 5);

    y += headerPadding + rowSpacing;
    doc.setFont("helvetica", "normal");
    const titleText = truckData.listingTitle;
    doc.text(titleText, 10, y);
    doc.link(10, y - 3, doc.getTextWidth(titleText), 6, { url });
    const price = truckData.sellingPrice?.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    });

    doc.text("1", 125, y);
    doc.text(price, 150, y);
    doc.text(price, 180, y);

    y += 8;
    doc.line(10, y, 200, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 150, y);
    doc.setFont("helvetica", "normal");
    doc.text(price, 180, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Tax:", 150, y);
    doc.setFont("helvetica", "normal");
    doc.text("$0.00", 180, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Total Due:", 150, y);
    doc.text(price, 180, y);

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

    if (truckData.imageUrls?.length > 0) {
        try {
            const base64Image = await getBase64JPEGImage(truckData.imageUrls[0]);
            doc.addImage(base64Image, "JPEG", imgX, imgY, imgWidth, imgHeight);
        } catch (error) {
            console.error("Error loading truck image:", error);
        }
    }

    const rawDescription = truckData.listingDescription || "No additional details available";
    const description = rawDescription.replace(/\n{2,}/g, "\n");
    const wrappedDescription = doc.splitTextToSize(description, columnWidth);

    const column1StartY = imgY + imgHeight + 10;
    const moreDetailsHeadingHeight = 6;
    const availableHeight = 297 - column1StartY - 10;
    const maxLinesLeft = Math.floor((availableHeight - moreDetailsHeadingHeight) / lineHeight);

    const column1Lines = wrappedDescription.slice(0, maxLinesLeft);
    const column2Lines = wrappedDescription.slice(maxLinesLeft);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("More Details", column1X, column1StartY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (let i = 0; i < column1Lines.length; i++) {
        const lineY = column1StartY + moreDetailsHeadingHeight + i * lineHeight;
        doc.text(column1Lines[i], column1X, lineY);
    }

    const column2StartY = imgY;
    for (let i = 0; i < column2Lines.length; i++) {
        doc.text(column2Lines[i], column2X, column2StartY + i * lineHeight);
    }

    return doc.output("datauristring").split(",")[1];
}
