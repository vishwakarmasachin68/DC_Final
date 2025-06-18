import React, { useState } from "react";
import {
  Form,
  Button,
  Card,
  Alert,
  Row,
  Col,
  InputGroup,
  Container,
} from "react-bootstrap";
import "../styles/ProjectForm.css";

const ProjectForm = () => {
  const [project, setProject] = useState({
    location: "",
    client: "",
    hasPO: "no",
    poNumber: "",
    projectName: "",
    projectDetails: "",
    personsInvolved: [""],
    fieldSupervisor: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

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
    const requiredFields = [
      "location",
      "client",
      "projectName",
      "fieldSupervisor",
    ];

    const missing = requiredFields.find((field) => !project[field]);
    if (missing) {
      setError(`Please fill in the ${missing} field`);
      return false;
    }

    if (project.hasPO === "yes" && !project.poNumber) {
      setError("Please enter PO Number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      // In a real app, you would save to database here
      // For now, save to localStorage
      const projects = JSON.parse(localStorage.getItem("projects") || []);
      projects.push({ ...project, id: Date.now().toString() });
      localStorage.setItem("projects", JSON.stringify(projects));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reset form
      setProject({
        location: "",
        client: "",
        hasPO: "no",
        poNumber: "",
        projectName: "",
        projectDetails: "",
        personsInvolved: [""],
        fieldSupervisor: "",
      });
    } catch (err) {
      setError("Failed to save project: " + err.message);
    }
  };

  return (
    <Container fluid className="project-form-container">
      <div className="page-header mb-4">
        <h2 className="page-title">
          <i className="bi bi-folder-plus me-2"></i>
          Add New Project
        </h2>
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="alert-custom"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="alert-custom">
          <i className="bi bi-check-circle-fill me-2"></i>
          Project saved successfully!
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4 form-card">
          <Card.Header className="card-header-custom">
            <h5 className="card-title">
              <i className="bi bi-info-circle me-2"></i>
              Project Information
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Location <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-geo-alt"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="location"
                      value={project.location}
                      onChange={handleChange}
                      placeholder="Project location"
                      required
                      className="form-control-custom"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Client <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-building"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="client"
                      value={project.client}
                      onChange={handleChange}
                      placeholder="Client name"
                      required
                      className="form-control-custom"
                    />
                  </InputGroup>
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
                      <label className="form-check-label" htmlFor="hasPO-yes">
                        Yes
                      </label>
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
                      <label className="form-check-label" htmlFor="hasPO-no">
                        No
                      </label>
                    </div>
                  </div>
                </Form.Group>
              </Col>

              {project.hasPO === "yes" && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      PO Number <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-file-earmark-text"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="poNumber"
                        value={project.poNumber}
                        onChange={handleChange}
                        placeholder="Purchase order number"
                        required={project.hasPO === "yes"}
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
                  <Form.Label>
                    Project Name <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-journal"></i>
                    </InputGroup.Text>
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
                  <Form.Label>
                    Field Supervisor <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-person-badge"></i>
                    </InputGroup.Text>
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
          </Card.Body>
        </Card>

        <Card className="mb-4 form-card">
          <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
            <h5 className="card-title">
              <i className="bi bi-people me-2"></i>
              Team Members
            </h5>
            <Button
              variant="outline-primary"
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
                    <InputGroup.Text>
                      <i className="bi bi-person"></i>
                    </InputGroup.Text>
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
                    <Button
                      variant="outline-danger"
                      onClick={() => removePersonField(index)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  )}
                </Col>
              </Row>
            ))}
          </Card.Body>
        </Card>

        <div className="form-actions">
          <Button variant="primary" type="submit" size="lg">
            <i className="bi bi-save me-2"></i>Save Project
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default ProjectForm;