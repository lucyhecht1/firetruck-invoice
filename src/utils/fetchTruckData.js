import axios from "axios";

export async function fetchTruckData(uuid, setTruckData, setError) {
    try {
        const response = await axios.post("https://garage-backend.onrender.com/getListing", {
            id: uuid,
        });

        const data = response.data;
        if (data.result?.listing) {
            setTruckData(data.result.listing);
        } else {
            // API is returning 200 OK even when no truck is found
            setError("Truck not found. Please check the URL and try again.");
        }
    } catch (error) {
        console.error("Error fetching truck data:", error);

        if (error.response) {
            const status = error.response.status;

            if (status === 404) {
                //API route is wrong: https://garage-backend.onrender.com/getListingBROKEN
                setError("There was an issue processing your request. Please try again soon.");
            } else if (status === 500) {
                setError("Server error. Please try again later.");
            } else {
                setError(`Unexpected error (${status}). Please try again.`);
            }
        } else if (error.request) {
            setError("No response from server. Check your internet connection.");
        } else {
            setError("Request setup error. Please try again.");
        }
    }
}