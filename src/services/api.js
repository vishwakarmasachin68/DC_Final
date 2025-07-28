// src/services/api.js
const API = "http://localhost:8000"; // Change if backend runs elsewhere

// Helper function for API calls
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

  const response = await fetch(`${API}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || response.statusText;
    throw new Error(`API request failed: ${errorMessage}`);
  }
  return await response.json();
}

// Challan endpoints
export async function getChallans() {
  return fetchAPI("/challans/");
}

export async function addChallan(challan) {
  return fetchAPI("/challans/", "POST", {
    dc_number: challan.dc_number,
    dc_sequence: challan.dc_sequence,
    date: challan.date,
    name: challan.name,
    project_id: challan.project_id,
    project_name: challan.project_name,
    client: challan.client,
    location: challan.location,
    has_po: challan.has_po,
    po_number: challan.po_number,
    items: challan.items.map((item) => ({
      sno: item.sno,
      asset_name: item.asset_name,
      description: item.description,
      quantity: item.quantity,
      serial_no: item.serial_no,
      returnable: item.returnable,
      expected_return_date: item.expected_return_date || null,
    })),
  });
}

export async function deleteChallan(id) {
  return fetchAPI(`/challans/${id}/`, "DELETE");
}

// Other endpoints remain the same...
export async function getClients() {
  return fetchAPI("/clients/");
}

export async function addClient(name) {
  return fetchAPI("/clients/", "POST", { name });
}

export async function getLocations() {
  return fetchAPI("/locations/");
}

export async function addLocation(name) {
  return fetchAPI("/locations/", "POST", { name });
}

export async function getProjects() {
  return fetchAPI("/projects/");
}

export async function addProject(project) {
  return fetchAPI("/projects/", "POST", project);
}

export async function updateProject(id, project) {
  return fetchAPI(`/projects/${id}/`, "PUT", project);
}

export async function deleteProject(id) {
  return fetchAPI(`/projects/${id}/`, "DELETE");
}
