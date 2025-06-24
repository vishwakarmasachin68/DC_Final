const API_BASE_URL = 'http://127.0.0.1:8000';

// Helper function for API calls
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
};

// Clients API
export const fetchClients = async () => {
  return apiRequest('/clients/');
};

export const createClient = async (clientData) => {
  return apiRequest('/clients/', 'POST', {
    client_name: clientData.name
  });
};

// Locations API
export const fetchLocations = async () => {
  return apiRequest('/locations/');
};

export const fetchClientLocations = async (clientId) => {
  return apiRequest(`/clients/${clientId}/locations/`);
};

export const createLocation = async (locationData) => {
  return apiRequest('/locations/', 'POST', {
    location_name: locationData.name,
    client_id: locationData.clientId
  });
};

// Projects API
export const fetchProjects = async () => {
  return apiRequest('/projects/');
};

export const fetchProjectByPONumber = async (poNumber) => {
  return apiRequest(`/projects/?po_number=${poNumber}`);
};

export const createProject = async (projectData) => {
  return apiRequest('/projects/', 'POST', projectData);
};

// Challans API
export const createChallan = async (challanData) => {
  return apiRequest('/challans/', 'POST', {
    dc_number: challanData.dcNumber,
    date: challanData.date,
    preparer_name: challanData.name,
    client_id: challanData.client,
    location_id: challanData.location,
    has_po: challanData.hasPO === 'yes',
    po_number: challanData.poNumber || null,
    items: challanData.items.map(item => ({
      sno: item.sno,
      asset_name: item.assetName,
      description: item.description,
      quantity: item.quantity,
      serial_no: item.serialNo,
      returnable: item.returnable,
      expected_return_date: item.expectedReturnDate || null
    }))
  });
};

export const fetchChallans = async () => {
  return apiRequest('/challans/');
};