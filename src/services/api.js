// const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
// const API_BASE_URL = "http://192.168.1.213:8000"
const API_BASE_URL = "https://backend-final-dc-2.onrender.com";

export default API_BASE_URL;

// Generic API request handler
async function fetchAPI(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw {
        status: response.status,
        detail: errorData.detail || "Unknown error occurred",
      };
    }

    // Handle empty response safely
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Helper to format dates consistently for API requests
const formatDateForAPI = (date) => {
  if (!date) return null;
  if (typeof date === "string") return date; // Already formatted
  return date.toISOString().split("T")[0];
};

// -------------------- Assets --------------------
export const getAssets = () => fetchAPI("/assets/");

export const addAsset = (assetData) => {
  const formattedData = {
    ...assetData,
    make: assetData.make || null,
    model: assetData.model || null,
    date_of_purchase: formatDateForAPI(assetData.date_of_purchase),
    last_service_date: formatDateForAPI(assetData.last_service_date),
    transaction_date: formatDateForAPI(assetData.transaction_date),
    date_of_issue: formatDateForAPI(assetData.date_of_issue),
    expected_return_date: formatDateForAPI(assetData.expected_return_date),
    returned_date: formatDateForAPI(assetData.returned_date),
    date_of_approval: formatDateForAPI(assetData.date_of_approval),
    date_of_media_sanitisation: formatDateForAPI(
      assetData.date_of_media_sanitisation
    ),
  };
  return fetchAPI("/assets/", "POST", formattedData);
};

export const updateAsset = (assetId, assetData) => {
  const formattedData = {
    ...assetData,
    date_of_purchase: formatDateForAPI(assetData.date_of_purchase),
    last_service_date: formatDateForAPI(assetData.last_service_date),
    transaction_date: formatDateForAPI(assetData.transaction_date),
    date_of_issue: formatDateForAPI(assetData.date_of_issue),
    expected_return_date: formatDateForAPI(assetData.expected_return_date),
    returned_date: formatDateForAPI(assetData.returned_date),
    date_of_approval: formatDateForAPI(assetData.date_of_approval),
    date_of_media_sanitisation: formatDateForAPI(
      assetData.date_of_media_sanitisation
    ),
  };
  return fetchAPI(`/assets/${assetId}/`, "PUT", formattedData);
};

export const deleteAsset = (assetId) =>
  fetchAPI(`/assets/${assetId}`, "DELETE");

// -------------------- Asset Tracking --------------------
export const getAssetTracking = () => fetchAPI("/asset-tracking/");

export const addAssetTracking = (trackingData) => {
  const formattedData = {
    ...trackingData,
    date: formatDateForAPI(trackingData.date),
    return_date: formatDateForAPI(trackingData.return_date),
  };
  return fetchAPI("/asset-tracking/", "POST", formattedData);
};

export const updateAssetTracking = (id, trackingData) => {
  const formattedData = {
    ...trackingData,
    date: formatDateForAPI(trackingData.date),
    return_date: formatDateForAPI(trackingData.return_date),
  };
  return fetchAPI(`/asset-tracking/${id}`, "PUT", formattedData);
};

export const deleteAssetTracking = (id) =>
  fetchAPI(`/asset-tracking/${id}`, "DELETE");

// -------------------- Challans --------------------
export const getChallans = () => fetchAPI("/challans/");

export const addChallan = (challan) => fetchAPI("/challans/", "POST", challan);

export const updateChallan = (id, challan) => {
  const formattedChallan = {
    ...challan,
    date: formatDateForAPI(challan.date),
    items: challan.items.map((item) => ({
      ...item,
      expected_return_date: item.expected_return_date || null,
      returned_date: item.returned_date || null,
    })),
  };
  return fetchAPI(`/challans/${id}/`, "PUT", formattedChallan);
};

export const deleteChallan = (id) => fetchAPI(`/challans/${id}/`, "DELETE");

export const markItemAsReturned = (
  itemId,
  returnedDate = new Date().toISOString().split("T")[0]
) =>
  fetchAPI(`/challan-items/${itemId}/return`, "PUT", {
    returned_date: returnedDate,
  });

// -------------------- Clients --------------------
export const getClients = () => fetchAPI("/clients/");

export const addClient = (name) => fetchAPI("/clients/", "POST", { name });

export const deleteClient = (clientName) =>
  fetchAPI(`/clients/${encodeURIComponent(clientName)}`, "DELETE");

// -------------------- Locations --------------------
export const getLocations = () => fetchAPI("/locations/");

export const addLocation = (name) => fetchAPI("/locations/", "POST", { name });

export const deleteLocation = (locationName) =>
  fetchAPI(`/locations/${encodeURIComponent(locationName)}`, "DELETE");

// -------------------- Projects --------------------
export const getProjects = () => fetchAPI("/projects/");

export const addProject = (project) => fetchAPI("/projects/", "POST", project);

export const updateProject = (id, project) =>
  fetchAPI(`/projects/${id}/`, "PUT", project);

export const deleteProject = (id) => fetchAPI(`/projects/${id}/`, "DELETE");  

// -------------------- Available Assets --------------------
export const getAvailableAssets = () => fetchAPI("/assets/available/");