import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Card,
  Alert,
  Row,
  Col,
  InputGroup,
  Container,
  Table,
} from "react-bootstrap";
import "../styles/ProjectForm.css";

const initialProjectState = {
  location: "",
  client: "",
  hasPO: "no",
  poNumber: "",
  projectName: "",
  projectDetails: "",
  personsInvolved: [""],
  fieldSupervisor: "",
};

const STORAGE_KEYS = {
  PROJECTS: "projects",
  CLIENTS: "clients",
  LOCATIONS: "locations",
};

const ProjectForm = () => {
  const [clients, setClients] = useState(() => {
    const savedClients = sessionStorage.getItem(STORAGE_KEYS.CLIENTS);
    return savedClients ? JSON.parse(savedClients) : [];
  });
  
  const [locations, setLocations] = useState(() => {
    const savedLocations = sessionStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return savedLocations ? JSON.parse(savedLocations) : [];
  });
  
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [showNewLocationInput, setShowNewLocationInput] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [project, setProject] = useState(initialProjectState);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Load all data from sessionStorage on mount
  useEffect(() => {
    const storedProjects = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.PROJECTS) || "[]");
    setProjectsList(storedProjects);
    
    const storedClients = sessionStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (storedClients) setClients(JSON.parse(storedClients));
    
    const storedLocations = sessionStorage.getItem(STORAGE_KEYS.LOCATIONS);
    if (storedLocations) setLocations(JSON.parse(storedLocations));
  }, []);

  // Save data to sessionStorage when they change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    sessionStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
    sessionStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projectsList));
  }, [clients, locations, projectsList]);

  const handleClientChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setShowNewClientInput(true);
      setProject(prev => ({ ...prev, client: "" }));
    } else {
      setShowNewClientInput(false);
      setProject(prev => ({ ...prev, client: value }));
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setShowNewLocationInput(true);
      setProject(prev => ({ ...prev, location: "" }));
    } else {
      setShowNewLocationInput(false);
      setProject(prev => ({ ...prev, location: value }));
    }
  };

  const saveNewClient = () => {
    if (newClient.trim() && !clients.includes(newClient.trim())) {
      const updatedClients = [...clients, newClient.trim()];
      setClients(updatedClients);
      setProject(prev => ({ ...prev, client: newClient.trim() }));
      setShowNewClientInput(false);
      setNewClient("");
    }
  };

  const saveNewLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      const updatedLocations = [...locations, newLocation.trim()];
      setLocations(updatedLocations);
      setProject(prev => ({ ...prev, location: newLocation.trim() }));
      setShowNewLocationInput(false);
      setNewLocation("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
  };

  const handlePersonChange = (index, value) => {
    const updatedPersons = [...project.personsInvolved];
    updatedPersons[index] = value;
    setProject((prev) => ({ ...prev, personsInvolved: updatedPersons }));
  };

  const addPersonField = () => {
    setProject((prev) => ({
      ...prev,
      personsInvolved: [...prev.personsInvolved, ""],
    }));
  };

  const removePersonField = (index) => {
    if (project.personsInvolved.length <= 1) return;
    const updatedPersons = project.personsInvolved.filter((_, i) => i !== index);
    setProject((prev) => ({ ...prev, personsInvolved: updatedPersons }));
  };

  const validateForm = () => {
    if (!project.projectName) {
      setError("Please fill in the project name field");
      return false;
    }
    if (!project.fieldSupervisor) {
      setError("Please fill in the field supervisor field");
      return false;
    }
    return true;
  };

  const loadProjectForEdit = (projectId) => {
    const projectToEdit = projectsList.find(p => p.id === projectId);
    if (projectToEdit) {
      const persons = projectToEdit.personsInvolved?.length > 0 
        ? projectToEdit.personsInvolved 
        : [""];
      
      setProject({
        ...projectToEdit,
        personsInvolved: persons
      });
      
      setEditMode(true);
      setSelectedProjectId(projectId);
      setSuccess(false);
      setError(null);
      setShowNewClientInput(false);
      setShowNewLocationInput(false);
      
      document.getElementById("project-form").scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      let updatedProjects = [...projectsList];
      
      if (editMode) {
        updatedProjects = updatedProjects.map(p => 
          p.id === selectedProjectId ? { ...project, id: selectedProjectId } : p
        );
      } else {
        updatedProjects.push({ ...project, id: Date.now().toString() });
      }

      setProjectsList(updatedProjects);
      setSuccess(true);
      handleClearForm();
    } catch (err) {
      setError("Failed to save project: " + err.message);
    }
  };

  const handleClearForm = () => {
    setProject(initialProjectState);
    setEditMode(false);
    setSelectedProjectId("");
    setShowNewClientInput(false);
    setShowNewLocationInput(false);
    setError(null);
  };

  const handleDeleteProject = (projectId) => {
    const updatedProjects = projectsList.filter(project => project.id !== projectId);
    setProjectsList(updatedProjects);
    
    if (selectedProjectId === projectId) {
      handleClearForm();
    }
  };

  return (
    <Container fluid className="project-form-container">
      <div className="page-header mb-4">
        <h2 className="page-title">
          <i className="bi bi-folder-plus me-2"></i>
          Project Management
        </h2>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="alert-custom">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="alert-custom" onClose={() => setSuccess(false)} dismissible>
          <i className="bi bi-check-circle-fill me-2"></i>
          Project {editMode ? "updated" : "saved"} successfully!
        </Alert>
      )}

      <Card className="mb-4 form-card" id="project-form">
        <Card.Header className="card-header-custom">
          <h5 className="card-title">
            <i className="bi bi-folder me-2"></i>
            {editMode ? "Edit Project" : "Create New Project"}
          </h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client</Form.Label>
                  {showNewClientInput ? (
                    <InputGroup>
                      <InputGroup.Text><i className="bi bi-building"></i></InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={newClient}
                        onChange={(e) => setNewClient(e.target.value)}
                        placeholder="Enter new client"
                        className="form-control-custom"
                      />
                      <Button variant="outline-success" onClick={saveNewClient}>
                        <i className="bi bi-check"></i>
                      </Button>
                      <Button variant="outline-secondary" onClick={() => setShowNewClientInput(false)}>
                        <i className="bi bi-x"></i>
                      </Button>
                    </InputGroup>
                  ) : (
                    <InputGroup>
                      <InputGroup.Text><i className="bi bi-building"></i></InputGroup.Text>
                      <Form.Select
                        value={project.client || ""}
                        onChange={handleClientChange}
                        className="form-control-custom"
                      >
                        <option value="">Select a client</option>
                        {clients.map((client, index) => (
                          <option key={index} value={client}>{client}</option>
                        ))}
                        <option value="new">+ Add New Client</option>
                      </Form.Select>
                    </InputGroup>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  {showNewLocationInput ? (
                    <InputGroup>
                      <InputGroup.Text><i className="bi bi-geo-alt"></i></InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Enter new location"
                        className="form-control-custom"
                      />
                      <Button variant="outline-success" onClick={saveNewLocation}>
                        <i className="bi bi-check"></i>
                      </Button>
                      <Button variant="outline-secondary" onClick={() => setShowNewLocationInput(false)}>
                        <i className="bi bi-x"></i>
                      </Button>
                    </InputGroup>
                  ) : (
                    <InputGroup>
                      <InputGroup.Text><i className="bi bi-geo-alt"></i></InputGroup.Text>
                      <Form.Select
                        value={project.location || ""}
                        onChange={handleLocationChange}
                        className="form-control-custom"
                      >
                        <option value="">Select a location</option>
                        {locations.map((location, index) => (
                          <option key={index} value={location}>{location}</option>
                        ))}
                        <option value="new">+ Add New Location</option>
                      </Form.Select>
                    </InputGroup>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Has PO Number?</Form.Label>
                  <div className="d-flex">
                    <div className="form-check me-3">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="hasPO"
                        id="hasPO-yes"
                        value="yes"
                        checked={project.hasPO === "yes"}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="hasPO-yes">Yes</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="hasPO"
                        id="hasPO-no"
                        value="no"
                        checked={project.hasPO === "no"}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="hasPO-no">No</label>
                    </div>
                  </div>
                </Form.Group>
              </Col>

              {project.hasPO === "yes" && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>PO Number</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><i className="bi bi-file-earmark-text"></i></InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="poNumber"
                        value={project.poNumber}
                        onChange={handleChange}
                        placeholder="Purchase order number"
                        className="form-control-custom"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Name <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <InputGroup.Text><i className="bi bi-journal"></i></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="projectName"
                      value={project.projectName}
                      onChange={handleChange}
                      placeholder="Project name"
                      required
                      className="form-control-custom"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Field Supervisor <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <InputGroup.Text><i className="bi bi-person-badge"></i></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="fieldSupervisor"
                      value={project.fieldSupervisor}
                      onChange={handleChange}
                      placeholder="Supervisor name"
                      required
                      className="form-control-custom"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Project Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="projectDetails"
                value={project.projectDetails}
                onChange={handleChange}
                placeholder="Project description and details"
                className="form-control-custom"
              />
            </Form.Group>

            <Card className="mb-4">
              <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                <h5 className="card-title">
                  <i className="bi bi-people me-2"></i>
                  Team Members
                </h5>
                <Button variant="outline-primary" size="sm" onClick={addPersonField}>
                  <i className="bi bi-plus-circle me-1"></i>Add Member
                </Button>
              </Card.Header>
              <Card.Body>
                {project.personsInvolved.map((person, index) => (
                  <Row key={index} className="mb-3 align-items-center">
                    <Col>
                      <InputGroup>
                        <InputGroup.Text><i className="bi bi-person"></i></InputGroup.Text>
                        <Form.Control
                          type="text"
                          value={person}
                          onChange={(e) => handlePersonChange(index, e.target.value)}
                          placeholder={`Team member #${index + 1}`}
                          className="form-control-custom"
                        />
                      </InputGroup>
                    </Col>
                    <Col xs="auto">
                      {project.personsInvolved.length > 1 && (
                        <Button variant="outline-danger" onClick={() => removePersonField(index)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>

            <div className="form-actions">
              <Button variant="outline-secondary" onClick={handleClearForm} className="me-3">
                <i className="bi bi-x-circle me-2"></i>Clear Form
              </Button>
              <Button variant="primary" type="submit" size="lg">
                <i className="bi bi-save me-2"></i>
                {editMode ? "Update Project" : "Save Project"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4 form-card">
        <Card.Header className="card-header-custom">
          <h5 className="card-title">
            <i className="bi bi-list-check me-2"></i>
            Existing Projects
          </h5>
        </Card.Header>
        <Card.Body>
          {projectsList.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-folder-x" style={{ fontSize: "3rem", color: "#6c757d" }}></i>
              <p className="mt-3">No projects found. Create your first project!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover className="projects-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Client</th>
                    <th>Location</th>
                    <th>Field Supervisor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsList.map((proj) => (
                    <tr key={proj.id} className={selectedProjectId === proj.id ? "table-active" : ""}>
                      <td>{proj.projectName}</td>
                      <td>{proj.client || "-"}</td>
                      <td>{proj.location || "-"}</td>
                      <td>{proj.fieldSupervisor}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => loadProjectForEdit(proj.id)}
                          className="me-2"
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteProject(proj.id)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProjectForm;