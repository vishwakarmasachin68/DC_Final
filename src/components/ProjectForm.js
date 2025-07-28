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
import {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getClients,
  getLocations,
  addClient,
  addLocation,
} from "../services/api";
import "../styles/ProjectForm.css";

const initialProjectState = {
  client: "",
  location: "",
  has_po: "no",
  po_number: "",
  project_name: "",
  project_details: "",
  persons_involved: JSON.stringify([""]),
  field_supervisor: "",
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, clientsData, locationsData] = await Promise.all([
        getProjects(),
        getClients(),
        getLocations(),
      ]);

      setProjectsList(projectsData);
      setClients(clientsData.map((c) => c.name));
      setLocations(locationsData.map((l) => l.name));
      setLoading(false);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePersonChange = (index, value) => {
    const currentPersons = JSON.parse(project.persons_involved);
    const updatedPersons = [...currentPersons];
    updatedPersons[index] = value;
    setProject((prev) => ({
      ...prev,
      persons_involved: JSON.stringify(updatedPersons),
    }));
  };

  const addPersonField = () => {
    const currentPersons = JSON.parse(project.persons_involved);
    setProject((prev) => ({
      ...prev,
      persons_involved: JSON.stringify([...currentPersons, ""]),
    }));
  };

  const removePersonField = (index) => {
    const currentPersons = JSON.parse(project.persons_involved);
    if (currentPersons.length <= 1) return;
    const updatedPersons = currentPersons.filter((_, i) => i !== index);
    setProject((prev) => ({
      ...prev,
      persons_involved: JSON.stringify(updatedPersons),
    }));
  };

  const validateForm = () => {
    if (!project.project_name) {
      setError("Project name is required");
      return false;
    }
    if (!project.field_supervisor) {
      setError("Project Lead / Person who is visiting is required");
      return false;
    }
    return true;
  };

  const loadProjectForEdit = (projectId) => {
    const projectToEdit = projectsList.find((p) => p.id === projectId);
    if (projectToEdit) {
      setProject({
        ...projectToEdit,
        persons_involved: projectToEdit.persons_involved
          ? projectToEdit.persons_involved
          : JSON.stringify([""]),
      });
      setEditMode(true);
      setSelectedProjectId(projectId);
      setSuccess(false);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      const projectData = {
        ...project,
        persons_involved: JSON.stringify(
          JSON.parse(project.persons_involved || "[]")
        ),
      };

      if (editMode) {
        await updateProject(selectedProjectId, projectData);
      } else {
        await addProject(projectData);
      }

      await loadData();

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

  const handleClearForm = () => {
    setProject(initialProjectState);
    setEditMode(false);
    setSelectedProjectId("");
    setShowNewClientInput(false);
    setShowNewLocationInput(false);
    setError(null);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      await deleteProject(projectId);
      await loadData();

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

  const saveNewClient = async () => {
    if (!newClient.trim()) return;

    try {
      await addClient(newClient.trim());
      await loadData(); // reload everything
      setProject((prev) => ({ ...prev, client: newClient.trim() }));
      setShowNewClientInput(false);
      setNewClient("");
    } catch (err) {
      console.error("Failed to save client:", err);
      setError("Failed to save client. Please try again.");
    }
  };

  const saveNewLocation = async () => {
    if (!newLocation.trim()) return;

    try {
      await addLocation(newLocation.trim());
      await loadData(); // reload everything
      setProject((prev) => ({ ...prev, location: newLocation.trim() }));
      setShowNewLocationInput(false);
      setNewLocation("");
    } catch (err) {
      console.error("Failed to save location:", err);
      setError("Failed to save location. Please try again.");
    }
  };

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
      <div className="page-header mb-4">
        <h2>Project Management</h2>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
          Project {editMode ? "updated" : "saved"} successfully!
        </Alert>
      )}

      <Card className="mb-4 form-card" id="project-form">
        <Card.Header className="card-header-custom text-white">
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

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Has PO Number?</Form.Label>
                  <div className="d-flex">
                    <Form.Check
                      type="radio"
                      label="Yes"
                      name="has_po"
                      id="has_po-yes"
                      value="yes"
                      checked={project.has_po === "yes"}
                      onChange={handleChange}
                      className="me-3"
                    />
                    <Form.Check
                      type="radio"
                      label="No"
                      name="has_po"
                      id="has_po-no"
                      value="no"
                      checked={project.has_po === "no"}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
              </Col>

              {project.has_po === "yes" && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>PO Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="po_number"
                      value={project.po_number}
                      onChange={handleChange}
                      placeholder="Purchase order number"
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Project Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="project_name"
                    value={project.project_name}
                    onChange={handleChange}
                    placeholder="Project name"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Project Lead / Person who is visiting{" "}
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="field_supervisor"
                    value={project.field_supervisor}
                    onChange={handleChange}
                    placeholder="Project Lead or Visiting Person"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Project Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="project_details"
                value={project.project_details}
                onChange={handleChange}
                placeholder="Project description and details"
              />
            </Form.Group>

            <Card className="mb-4">
              <Card.Header className="card-header-custom d-flex justify-content-between align-items-center text-white">
                <h5 className="card-title">
                  <i className="bi bi-people me-2"></i>
                  Team Members
                </h5>
                <Button
                  variant="btn btn-primary"
                  size="sm"
                  onClick={addPersonField}
                  style={{
                    backgroundColor: "#085f7907",
                    borderColor: "#ffffffff",
                    color: "#fff",
                  }}
                >
                  <i className="bi bi-plus-circle me-1"></i>Add Member
                </Button>
              </Card.Header>
              <Card.Body>
                {JSON.parse(project.persons_involved).map((person, index) => (
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
                        {JSON.parse(project.persons_involved).length > 1 && (
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

            <div className="form-actions">
              <Button
                variant="outline-secondary"
                onClick={handleClearForm}
                className="me-3"
              >
                <i className="bi bi-x-circle me-2"></i>Clear Form
              </Button>
              <Button style={{ backgroundColor: "#085f79ff" }} type="submit">
                <i className="bi bi-save me-2"></i>
                {editMode ? "Update Project" : "Save Project"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4 form-card">
        <Card.Header className="card-header-custom text-white">
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
                    <td>{proj.project_name}</td>
                    <td>{proj.client || "-"}</td>
                    <td>{proj.location || "-"}</td>
                    <td>{proj.field_supervisor}</td>
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
