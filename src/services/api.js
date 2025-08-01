 const API = "http://localhost:8000";
//const API = "https://backend-final-dc-2.onrender.com";

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

  let errorData = {};
  if (!response.ok) {
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: response.statusText };
    }

    throw {
      status: response.status,
      detail: errorData.detail || "Unknown error occurred",
    };
  }

  return await response.json();
}

export async function getChallans() {
  return fetchAPI("/challans/");
}

export async function addChallan(challan) {
  return fetchAPI("/challans/", "POST", challan);
}

export async function updateChallan(id, challan) {
  return fetchAPI(`/challans/${id}/`, "PUT", {
    ...challan,
    date: new Date(challan.date).toISOString().split("T")[0],
    items: challan.items.map((item) => ({
      ...item,
      expected_return_date: item.expected_return_date || null,
      returned_date: item.returned_date || null,
    })),
  });
}

export async function deleteChallan(id) {
  return fetchAPI(`/challans/${id}/`, "DELETE");
}

export async function markItemAsReturned(
  itemId,
  returnedDate = new Date().toISOString().split("T")[0]
) {
  return fetchAPI(`/challan-items/${itemId}/return`, "PUT", {
    returned_date: returnedDate,
  });
}

// Client endpoints
export async function getClients() {
  return fetchAPI("/clients/");
}

export async function addClient(name) {
  return fetchAPI("/clients/", "POST", { name });
}

export async function deleteClient(clientName) {
  return fetchAPI(`/clients/${encodeURIComponent(clientName)}`, "DELETE");
}

// Location endpoints
export async function getLocations() {
  return fetchAPI("/locations/");
}

export async function addLocation(name) {
  return fetchAPI("/locations/", "POST", { name });
}

export async function deleteLocation(locationName) {
  return fetchAPI(`/locations/${encodeURIComponent(locationName)}`, "DELETE");
}

// Project endpoints
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
