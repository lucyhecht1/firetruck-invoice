import React from "react";

export default function TruckDetails({ truckData, setShowForm }) {
  return (
    <div className="truck-details-container">
      <h2 className="truck-title">
        {truckData.listingTitle || "No title available."}
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
          <p style={{ textAlign: "center" }}>No image available.</p>
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
                ? truckData.listingDescription.length > 100
                  ? truckData.listingDescription.slice(0, 100) + "..."
                  : truckData.listingDescription
                : "No description available."}
            </p>
            {truckData.listingDescription && truckData.listingDescription.length > 100 && (
              <p><em>See more details when you generate an invoice.</em></p>
            )}
          </div>
        </div>
      </div>

      <br />

      <button
        onClick={() => setShowForm(true)}
        className="orange-button"
      >
        Generate PDF Invoice
      </button>
    </div>
  );
}
