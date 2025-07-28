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
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return await response.json();
}

// Client endpoints
export async function getClients() {
  return fetchAPI("/clients/");
}

export async function addClient(name) {
  return fetchAPI("/clients/", "POST", { name });
}

// Location endpoints
export async function getLocations() {
  return fetchAPI("/locations/");
}

export async function addLocation(name) {
  return fetchAPI("/locations/", "POST", { name });
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

// Challan endpoints
export async function getChallans() {
  return fetchAPI("/challans/");
}

export async function addChallan(challan) {
  return fetchAPI("/challans/", "POST", challan);
}

export async function deleteChallan(id) {
  return fetchAPI(`/challans/${id}/`, "DELETE");
}