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
import jsonStorage from "../services/jsonStorage";
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

const ProjectForm = ({ onProjectUpdate }) => {
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
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
  const [loading, setLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const projects = await jsonStorage.getProjects();
        const clients = await jsonStorage.getClients();
        const locations = await jsonStorage.getLocations();

        setProjectsList(projects);
        setClients(clients);
        setLocations(locations);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle team member changes
  const handlePersonChange = (index, value) => {
    const updatedPersons = [...project.personsInvolved];
    updatedPersons[index] = value;
    setProject((prev) => ({ ...prev, personsInvolved: updatedPersons }));
  };

  // Add new team member field
  const addPersonField = () => {
    setProject((prev) => ({
      ...prev,
      personsInvolved: [...prev.personsInvolved, ""],
    }));
  };

  // Remove team member field
  const removePersonField = (index) => {
    if (project.personsInvolved.length <= 1) return;
    const updatedPersons = project.personsInvolved.filter(
      (_, i) => i !== index
    );
    setProject((prev) => ({ ...prev, personsInvolved: updatedPersons }));
  };

  // Form validation
  const validateForm = () => {
    if (!project.projectName) {
      setError("Project name is required");
      return false;
    }
    if (!project.fieldSupervisor) {
      setError("Project Lead / Person who is visiting is required");
      return false;
    }
    return true;
  };

  // Load project for editing
  const loadProjectForEdit = (projectId) => {
    const projectToEdit = projectsList.find((p) => p.id === projectId);
    if (projectToEdit) {
      setProject({
        ...projectToEdit,
        personsInvolved:
          projectToEdit.personsInvolved?.length > 0
            ? projectToEdit.personsInvolved
            : [""],
      });
      setEditMode(true);
      setSelectedProjectId(projectId);
      setSuccess(false);
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      if (editMode) {
        await jsonStorage.updateProject(selectedProjectId, project);
      } else {
        await jsonStorage.saveProject(project);
      }

      // Refresh data
      const projects = await jsonStorage.getProjects();
      const clients = await jsonStorage.getClients();
      const locations = await jsonStorage.getLocations();

      setProjectsList(projects);
      setClients(clients);
      setLocations(locations);

      // Notify parent component of project update
      if (onProjectUpdate) {
        onProjectUpdate();
      }

      setSuccess(true);
      handleClearForm();
    } catch (err) {
      console.error("Failed to save project:", err);
      setError("Failed to save project. Please try again.");
    }
  };

  // Clear form
  const handleClearForm = () => {
    setProject(initialProjectState);
    setEditMode(false);
    setSelectedProjectId("");
    setShowNewClientInput(false);
    setShowNewLocationInput(false);
    setError(null);
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      await jsonStorage.deleteProject(projectId);
      const projects = await jsonStorage.getProjects();
      setProjectsList(projects);

      // Notify parent component of project update
      if (onProjectUpdate) {
        onProjectUpdate();
      }

      if (selectedProjectId === projectId) {
        handleClearForm();
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError("Failed to delete project. Please try again.");
    }
  };

  // Save new client
  const saveNewClient = async () => {
    if (!newClient.trim()) return;

    try {
      await jsonStorage.saveClient(newClient.trim());
      const clients = await jsonStorage.getClients();
      setClients(clients);
      setProject((prev) => ({ ...prev, client: newClient.trim() }));
      setShowNewClientInput(false);
      setNewClient("");
    } catch (err) {
      console.error("Failed to save client:", err);
      setError("Failed to save client. Please try again.");
    }
  };

  // Save new location
  const saveNewLocation = async () => {
    if (!newLocation.trim()) return;

    try {
      await jsonStorage.saveLocation(newLocation.trim());
      const locations = await jsonStorage.getLocations();
      setLocations(locations);
      setProject((prev) => ({ ...prev, location: newLocation.trim() }));
      setShowNewLocationInput(false);
      setNewLocation("");
    } catch (err) {
      console.error("Failed to save location:", err);
      setError("Failed to save location. Please try again.");
    }
  };

  // Handle client select change
  const handleClientChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setShowNewClientInput(true);
      setProject((prev) => ({ ...prev, client: "" }));
    } else {
      setShowNewClientInput(false);
      setProject((prev) => ({ ...prev, client: value }));
    }
  };

  // Handle location select change
  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setShowNewLocationInput(true);
      setProject((prev) => ({ ...prev, location: "" }));
    } else {
      setShowNewLocationInput(false);
      setProject((prev) => ({ ...prev, location: value }));
    }
  };

  return (
    <Container fluid className="project-form-container py-4">
      {/* Header */}
      <div className="page-header mb-4">
        <h2>Project Management</h2>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
          Project {editMode ? "updated" : "saved"} successfully!
        </Alert>
      )}

      {/* Project Form */}
      <Card className="mb-4 form-card" id="project-form">
        <Card.Header className="card-header-custom">
          <h5 className="card-title">
            <i className="bi bi-folder me-2"></i>
            {editMode ? "Edit Project" : "Create New Project"}
          </h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Client Field */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client</Form.Label>
                  {showNewClientInput ? (
                    <InputGroup>
                      <Form.Control
                        type="text"
                        value={newClient}
                        onChange={(e) => setNewClient(e.target.value)}
                        placeholder="Enter new client"
                      />
                      <Button variant="outline-success" onClick={saveNewClient}>
                        Save
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowNewClientInput(false)}
                      >
                        Cancel
                      </Button>
                    </InputGroup>
                  ) : (
                    <Form.Select
                      value={project.client || ""}
                      onChange={handleClientChange}
                    >
                      <option value="">Select a client</option>
                      {clients.map((client, index) => (
                        <option key={index} value={client}>
                          {client}
                        </option>
                      ))}
                      <option value="new">+ Add New Client</option>
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>

              {/* Location Field */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  {showNewLocationInput ? (
                    <InputGroup>
                      <Form.Control
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Enter new location"
                      />
                      <Button
                        variant="outline-success"
                        onClick={saveNewLocation}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowNewLocationInput(false)}
                      >
                        Cancel
                      </Button>
                    </InputGroup>
                  ) : (
                    <Form.Select
                      value={project.location || ""}
                      onChange={handleLocationChange}
                    >
                      <option value="">Select a location</option>
                      {locations.map((location, index) => (
                        <option key={index} value={location}>
                          {location}
                        </option>
                      ))}
                      <option value="new">+ Add New Location</option>
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* PO Number Section */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Has PO Number?</Form.Label>
                  <div className="d-flex">
                    <Form.Check
                      type="radio"
                      label="Yes"
                      name="hasPO"
                      id="hasPO-yes"
                      value="yes"
                      checked={project.hasPO === "yes"}
                      onChange={handleChange}
                      className="me-3"
                    />
                    <Form.Check
                      type="radio"
                      label="No"
                      name="hasPO"
                      id="hasPO-no"
                      value="no"
                      checked={project.hasPO === "no"}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
              </Col>

              {project.hasPO === "yes" && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>PO Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="poNumber"
                      value={project.poNumber}
                      onChange={handleChange}
                      placeholder="Purchase order number"
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>

            {/* Project Name and Supervisor */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Project Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="projectName"
                    value={project.projectName}
                    onChange={handleChange}
                    placeholder="Project name"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Project Lead / Person who is visiting <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="fieldSupervisor"
                    value={project.fieldSupervisor}
                    onChange={handleChange}
                    placeholder="Project Lead or Visiting Person"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Project Details */}
            <Form.Group className="mb-3">
              <Form.Label>Project Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="projectDetails"
                value={project.projectDetails}
                onChange={handleChange}
                placeholder="Project description and details"
              />
            </Form.Group>

            {/* Team Members */}
            <Card className="mb-4">
              <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                <h5 className="card-title">
                  <i className="bi bi-people me-2"></i>
                  Team Members
                </h5>
                <Button
                  variant="btn btn-primary"
                  size="sm"
                  onClick={addPersonField}
                >
                  <i className="bi bi-plus-circle me-1"></i>Add Member
                </Button>
              </Card.Header>
              <Card.Body>
                {project.personsInvolved.map((person, index) => (
                  <Row key={index} className="mb-3 align-items-center">
                    <Col>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          value={person}
                          onChange={(e) =>
                            handlePersonChange(index, e.target.value)
                          }
                          placeholder={`Team member #${index + 1}`}
                        />
                        {project.personsInvolved.length > 1 && (
                          <Button
                            variant="outline-danger"
                            onClick={() => removePersonField(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                      </InputGroup>
                    </Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>

            {/* Form Actions */}
            <div className="form-actions">
              <Button
                variant="outline-secondary"
                onClick={handleClearForm}
                className="me-3"
              >
                <i className="bi bi-x-circle me-2"></i>Clear Form
              </Button>
              <Button variant="primary" type="submit">
                <i className="bi bi-save me-2"></i>
                {editMode ? "Update Project" : "Save Project"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Existing Projects Table */}
      <Card className="mb-4 form-card">
        <Card.Header className="card-header-custom">
          <h5 className="card-title">
            <i className="bi bi-list-check me-2"></i>
            Existing Projects
          </h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : projectsList.length === 0 ? (
            <div className="text-center py-4">
              <i
                className="bi bi-folder-x"
                style={{ fontSize: "3rem", color: "#6c757d" }}
              ></i>
              <p className="mt-3">
                No projects found. Create your first project!
              </p>
            </div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Location</th>
                  <th>Project Lead / Person who is visiting</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projectsList.map((proj) => (
                  <tr key={proj.id}>
                    <td>{proj.projectName}</td>
                    <td>{proj.client || "-"}</td>
                    <td>{proj.location || "-"}</td>
                    <td>{proj.fieldSupervisor}</td>
                    <td>
                      <Button
                        variant="primary"
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
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProjectForm;
