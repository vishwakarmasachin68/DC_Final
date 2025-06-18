// Simulates database storage
const PROJECTS_KEY = 'delivery_challan_projects';

export const saveProject = (project) => {
  const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || []);
  projects.push({ ...project, id: Date.now().toString() });
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return Promise.resolve();
};

export const getProjects = () => {
  const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || []);
  return Promise.resolve(projects);
};