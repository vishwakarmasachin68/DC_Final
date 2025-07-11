// src/services/jsonStorage.js

const jsonStorage = {
  // Initialize with default data structure
  async initialize() {
    if (!localStorage.getItem('appData')) {
      const defaultData = {
        projects: [],
        clients: [],
        locations: [],
        challans: []
      };
      localStorage.setItem('appData', JSON.stringify(defaultData));
    }
  },

  // Get all data
  async getAllData() {
    await this.initialize();
    return JSON.parse(localStorage.getItem('appData'));
  },

  // Save all data
  async saveAllData(data) {
    localStorage.setItem('appData', JSON.stringify(data));
    return true;
  },

  // Projects
  async getProjects() {
    const data = await this.getAllData();
    return data.projects || [];
  },

  async saveProject(project) {
    const data = await this.getAllData();
    const newProject = { ...project, id: Date.now().toString() };
    data.projects = [...(data.projects || []), newProject];
    await this.saveAllData(data);
    return newProject;
  },

  async updateProject(id, updatedProject) {
    const data = await this.getAllData();
    data.projects = (data.projects || []).map(p => 
      p.id === id ? { ...updatedProject, id } : p
    );
    await this.saveAllData(data);
    return updatedProject;
  },

  async deleteProject(id) {
    const data = await this.getAllData();
    data.projects = (data.projects || []).filter(p => p.id !== id);
    await this.saveAllData(data);
    return true;
  },

  // Clients
  async getClients() {
    const data = await this.getAllData();
    return data.clients || [];
  },

  async saveClient(client) {
    const data = await this.getAllData();
    if (!data.clients.includes(client)) {
      data.clients = [...(data.clients || []), client];
      await this.saveAllData(data);
    }
    return client;
  },

  // Locations
  async getLocations() {
    const data = await this.getAllData();
    return data.locations || [];
  },

  async saveLocation(location) {
    const data = await this.getAllData();
    if (!data.locations.includes(location)) {
      data.locations = [...(data.locations || []), location];
      await this.saveAllData(data);
    }
    return location;
  },

  // Challans
  async getChallans() {
    const data = await this.getAllData();
    return data.challans || [];
  },

  async saveChallan(challan) {
    const data = await this.getAllData();
    const existingIndex = (data.challans || []).findIndex(c => c.dcNumber === challan.dcNumber);
    
    if (existingIndex >= 0) {
      data.challans[existingIndex] = challan;
    } else {
      data.challans = [...(data.challans || []), challan];
    }
    
    await this.saveAllData(data);
    return challan;
  },

  async deleteChallan(dcNumber) {
    const data = await this.getAllData();
    data.challans = (data.challans || []).filter(c => c.dcNumber !== dcNumber);
    await this.saveAllData(data);
    return true;
  },
};

// Initialize storage with default structure and sample data
jsonStorage.initialize();
// jsonStorage.seedSampleData();

export default jsonStorage;