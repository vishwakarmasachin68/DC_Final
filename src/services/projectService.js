export const saveProject = async (project) => {
  try {
    const response = await fetch('/api/projects/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save project');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const getProjects = async () => {
  try {
    const response = await fetch('/api/projects/');
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const getProjectByPONumber = async (poNumber) => {
  try {
    const response = await fetch(`/api/projects/?po_number=${poNumber}`);
    if (!response.ok) {
      throw new Error('Failed to fetch project by PO number');
    }
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching project by PO:', error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};