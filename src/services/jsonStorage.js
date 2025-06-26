// Service to handle all data operations
export const jsonStorage = {
  // Load initial data from JSON file or localStorage
  async loadInitialData() {
    try {
      // Try to load from JSON file first
      const response = await fetch('/data.json');
      const jsonData = await response.json();
      
      // Check if localStorage has newer data
      const localStorageData = JSON.parse(localStorage.getItem('appData') || '{}');
      
      // Merge data (give priority to localStorage)
      return {
        projects: localStorageData.projects || jsonData.projects || [],
        clients: localStorageData.clients || jsonData.clients || [],
        locations: localStorageData.locations || jsonData.locations || []
      };
    } catch (error) {
      console.error("Error loading data:", error);
      // Fallback to localStorage only
      return JSON.parse(localStorage.getItem('appData') || '{"projects":[],"clients":[],"locations":[]}');
    }
  },

  // Save all data
  async saveAllData(data) {
    try {
      // Save to localStorage
      localStorage.setItem('appData', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      return false;
    }
  },

  // Projects CRUD
  async getProjects() {
    const data = await this.loadInitialData();
    return data.projects;
  },

  async saveProject(project) {
    const data = await this.loadInitialData();
    const newProject = { ...project, id: Date.now().toString() };
    data.projects = [...data.projects, newProject];
    await this.saveAllData(data);
    return newProject;
  },

  async updateProject(id, updatedProject) {
    const data = await this.loadInitialData();
    data.projects = data.projects.map(p => 
      p.id === id ? { ...updatedProject, id } : p
    );
    await this.saveAllData(data);
    return updatedProject;
  },

  async deleteProject(id) {
    const data = await this.loadInitialData();
    data.projects = data.projects.filter(p => p.id !== id);
    await this.saveAllData(data);
    return true;
  },

  // Clients
  async getClients() {
    const data = await this.loadInitialData();
    return data.clients;
  },

  async saveClient(client) {
    const data = await this.loadInitialData();
    if (!data.clients.includes(client)) {
      data.clients = [...data.clients, client];
      await this.saveAllData(data);
    }
    return client;
  },

  // Locations
  async getLocations() {
    const data = await this.loadInitialData();
    return data.locations;
  },

  async saveLocation(location) {
    const data = await this.loadInitialData();
    if (!data.locations.includes(location)) {
      data.locations = [...data.locations, location];
      await this.saveAllData(data);
    }
    return location;
  }
};