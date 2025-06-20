import React, { useState } from "react";
import {
  Form,
  Button,
  Table,
  Row,
  Col,
  Card,
  Alert,
  Navbar,
  Container,
  InputGroup,
} from "react-bootstrap";
import { generateDoc } from "../services/docGenerator";
import DataView from "./DataView";
import PreviewModal from "./PreviewModal";
import ProjectForm from "./ProjectForm";
import "../styles/ChallanForm.css";

const ChallanForm = () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  };

  // State for clients and locations with sample data
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [showNewLocationInput, setShowNewLocationInput] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const [challan, setChallan] = useState({
    dcSequence: "001",
    date: new Date().toISOString().split("T")[0],
    name: "",
    client: "",
    location: "",
    hasPO: "no",
    poNumber: "",
    items: [
      {
        sno: 1,
        assetName: "",
        description: "",
        quantity: 1,
        serialNo: "",
        returnable: "no",
        expectedReturnDate: "",
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("challan");
  const [showPreview, setShowPreview] = useState(false);

  const getDcNumber = () => {
    const prefix = "DSI/";
    const middle =
      challan.hasPO === "yes" && challan.poNumber
        ? challan.poNumber
        : formatDate(challan.date);
    return `${prefix}${middle}/${challan.dcSequence}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallan((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    setChallan((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: name === "quantity" ? Math.max(1, parseInt(value) || 1) : value,
      };
      return { ...prev, items: updatedItems };
    });
    setError(null);
  };

  const addItem = () => {
    setChallan((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sno: prev.items.length + 1,
          assetName: "",
          description: "",
          quantity: 1,
          serialNo: "",
          returnable: "no",
          expectedReturnDate: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (challan.items.length <= 1) return;
    const updatedItems = challan.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        sno: i + 1,
      }));
    setChallan((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Handle client selection
  const handleClientChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setShowNewClientInput(true);
      setChallan((prev) => ({ ...prev, client: "" }));
    } else {
      setShowNewClientInput(false);
      setChallan((prev) => ({ ...prev, client: value }));
    }
  };

  // Handle location selection
  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setShowNewLocationInput(true);
      setChallan((prev) => ({ ...prev, location: "" }));
    } else {
      setShowNewLocationInput(false);
      setChallan((prev) => ({ ...prev, location: value }));
    }
  };

  // Save new client
  const saveNewClient = () => {
    if (newClient.trim() && !clients.includes(newClient.trim())) {
      setClients([...clients, newClient.trim()]);
      setChallan((prev) => ({ ...prev, client: newClient.trim() }));
      setShowNewClientInput(false);
      setNewClient("");
    }
  };

  // Save new location
  const saveNewLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setChallan((prev) => ({ ...prev, location: newLocation.trim() }));
      setShowNewLocationInput(false);
      setNewLocation("");
    }
  };

  const validateForm = () => {
    const requiredFields = ["dcSequence", "name", "client", "location"];
    const missing = requiredFields.find((field) => !challan[field]);
    if (missing) {
      setError(`Please fill in the ${missing} field`);
      return false;
    }

    if (challan.hasPO === "yes" && !challan.poNumber) {
      setError("Please enter PO Number");
      return false;
    }

    if (!/^\d{3}$/.test(challan.dcSequence)) {
      setError("DC Sequence must be a 3-digit number");
      return false;
    }

    for (const [i, item] of challan.items.entries()) {
      if (!item.assetName || !item.description || !item.serialNo) {
        setError(`Please complete all fields for item ${i + 1}`);
        return false;
      }

      if (item.returnable === "yes" && !item.expectedReturnDate) {
        setError(`Please enter expected return date for item ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const docChallan = {
        ...challan,
        dcNumber: getDcNumber(),
      };
      await generateDoc(docChallan);
      setShowPreview(false);
    } catch (err) {
      console.error("Document generation failed:", err);
      setError(err.message || "Failed to generate document.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearForm = () => {
    setChallan({
      dcSequence: "001",
      date: new Date().toISOString().split("T")[0],
      name: "",
      client: "",
      location: "",
      hasPO: "no",
      poNumber: "",
      items: [
        {
          sno: 1,
          assetName: "",
          description: "",
          quantity: 1,
          serialNo: "",
          returnable: "no",
          expectedReturnDate: "",
        },
      ],
    });
    setShowNewClientInput(false);
    setShowNewLocationInput(false);
  };

  return (
    <div className="challan-app-container">
      <Navbar
        bg="primary"
        variant="dark"
        expand="lg"
        className="app-navbar py-2"
      >
        <Container
          fluid
          className="d-flex justify-content-between align-items-center position-relative"
        >
          <div className="d-flex align-items-center">
            <Navbar.Brand href="#" className="d-flex align-items-center">
              <img
                src="/deevia-logo.png"
                alt="Deevia Software"
                height="50"
                className="navbar-logo me-2"
              />
            </Navbar.Brand>
          </div>

          <div className="position-absolute top-50 start-50 translate-middle text-center">
            <span className="navbar-brand-title text-white fs-2 fw-semibold">
              Delivery Challan Generator
            </span>
          </div>

          <div className="d-flex align-items-center ms-auto">
            <div className="d-flex gap-2">
              <Button
                variant={currentView === "challan" ? "light" : "outline-light"}
                onClick={() => setCurrentView("challan")}
                className="d-flex align-items-center"
              >
                <i className="bi bi-house me-2"></i>
                Dashboard
              </Button>
              <Button
                variant={currentView === "data" ? "light" : "outline-light"}
                onClick={() => setCurrentView("data")}
                className="d-flex align-items-center"
              >
                <i className="bi bi-card-checklist me-2"></i>
                Data View
              </Button>
              <Button
                variant={currentView === "project" ? "light" : "outline-light"}
                onClick={() => setCurrentView("project")}
                className="d-flex align-items-center"
              >
                <i className="bi bi-folder-plus me-2"></i>
                Add Project
              </Button>
            </div>
          </div>
        </Container>
      </Navbar>

      {currentView === "data" ? (
        <DataView challan={challan} />
      ) : currentView === "project" ? (
        <ProjectForm />
      ) : (
        <Container fluid className="main-content-container">
          <div className="page-header mb-4">
            <h2 className="page-title">
              <i className="bi bi-file-earmark-text me-2"></i>
              Create New Delivery Challan
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

          <Form>
            <Card className="mb-4 form-card">
              <Card.Header className="card-header-custom">
                <h5 className="card-title">
                  <i className="bi bi-file-text me-2"></i>Challan Information
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="dcNumber" className="mb-3">
                      <Form.Label>
                        DC Number <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-hash"></i>
                        </InputGroup.Text>
                        <InputGroup.Text className="dc-prefix">
                          DSI/
                        </InputGroup.Text>
                        <InputGroup.Text className="dc-middle">
                          {challan.hasPO === "yes" && challan.poNumber
                            ? challan.poNumber
                            : formatDate(challan.date)}
                        </InputGroup.Text>
                        <InputGroup.Text className="dc-slash">
                          /
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="dcSequence"
                          value={challan.dcSequence}
                          onChange={handleInputChange}
                          placeholder="001"
                          required
                          className="form-control-custom dc-sequence"
                          maxLength={3}
                        />
                      </InputGroup>
                      <div className="dc-preview mt-2">
                        Full DC Number: <strong>{getDcNumber()}</strong>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="date" className="mb-3">
                      <Form.Label>
                        Date <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-calendar"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="date"
                          name="date"
                          value={challan.date}
                          onChange={handleInputChange}
                          required
                          className="form-control-custom"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group controlId="name" className="mb-3">
                      <Form.Label>
                        Name <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-person"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="name"
                          value={challan.name}
                          onChange={handleInputChange}
                          placeholder="Enter Name"
                          required
                          className="form-control-custom"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="client" className="mb-3">
                      <Form.Label>
                        Client <span className="text-danger">*</span>
                      </Form.Label>
                      {showNewClientInput ? (
                        <InputGroup>
                          <InputGroup.Text>
                            <i className="bi bi-building"></i>
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            value={newClient}
                            onChange={(e) => setNewClient(e.target.value)}
                            placeholder="Enter new client"
                            className="form-control-custom"
                          />
                          <Button
                            variant="outline-success"
                            onClick={saveNewClient}
                          >
                            <i className="bi bi-check"></i>
                          </Button>
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowNewClientInput(false)}
                          >
                            <i className="bi bi-x"></i>
                          </Button>
                        </InputGroup>
                      ) : (
                        <InputGroup>
                          <InputGroup.Text>
                            <i className="bi bi-building"></i>
                          </InputGroup.Text>
                          <Form.Select
                            value={challan.client || ""}
                            onChange={handleClientChange}
                            className="form-control-custom"
                            required
                          >
                            <option value="">Select a client</option>
                            {clients.map((client, index) => (
                              <option key={index} value={client}>
                                {client}
                              </option>
                            ))}
                            <option value="new">+ Add New Client</option>
                          </Form.Select>
                        </InputGroup>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group controlId="location" className="mb-3">
                      <Form.Label>
                        Location <span className="text-danger">*</span>
                      </Form.Label>
                      {showNewLocationInput ? (
                        <InputGroup>
                          <InputGroup.Text>
                            <i className="bi bi-geo-alt"></i>
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            placeholder="Enter new location"
                            className="form-control-custom"
                          />
                          <Button
                            variant="outline-success"
                            onClick={saveNewLocation}
                          >
                            <i className="bi bi-check"></i>
                          </Button>
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowNewLocationInput(false)}
                          >
                            <i className="bi bi-x"></i>
                          </Button>
                        </InputGroup>
                      ) : (
                        <InputGroup>
                          <InputGroup.Text>
                            <i className="bi bi-geo-alt"></i>
                          </InputGroup.Text>
                          <Form.Select
                            value={challan.location || ""}
                            onChange={handleLocationChange}
                            className="form-control-custom"
                            required
                          >
                            <option value="">Select a location</option>
                            {locations.map((location, index) => (
                              <option key={index} value={location}>
                                {location}
                              </option>
                            ))}
                            <option value="new">+ Add New Location</option>
                          </Form.Select>
                        </InputGroup>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="hasPO" className="mb-3">
                      <Form.Label>Has PO Number?</Form.Label>
                      <div className="d-flex">
                        <div className="form-check me-3">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="hasPO"
                            id="hasPO-yes"
                            value="yes"
                            checked={challan.hasPO === "yes"}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="hasPO-yes"
                          >
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
                            checked={challan.hasPO === "no"}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="hasPO-no"
                          >
                            No
                          </label>
                        </div>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                {challan.hasPO === "yes" && (
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="poNumber" className="mb-3">
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
                            value={challan.poNumber}
                            onChange={handleInputChange}
                            placeholder="Enter PO Number"
                            required={challan.hasPO === "yes"}
                            className="form-control-custom"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>

            <Card className="mb-4 form-card">
              <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                <h5 className="card-title">
                  <i className="bi bi-list-ul me-2"></i>Item Details
                </h5>
                <div>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={addItem}
                    className="me-2"
                  >
                    <i className="bi bi-plus-circle me-1"></i>Add Item
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeItem(challan.items.length - 1)}
                    disabled={challan.items.length <= 1}
                  >
                    <i className="bi bi-dash-circle me-1"></i>Remove Item
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table bordered hover className="items-table mb-0">
                    <thead className="table-header">
                      <tr>
                        <th width="5%">#</th>
                        <th width="20%">Asset Name *</th>
                        <th width="25%">Description *</th>
                        <th width="10%">Qty</th>
                        <th width="15%">Serial No *</th>
                        <th width="10%">Returnable</th>
                        {challan.items.some(
                          (item) => item.returnable === "yes"
                        ) && <th width="15%">Expected Return Date</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {challan.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{item.sno}</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="assetName"
                              value={item.assetName}
                              onChange={(e) => handleItemChange(idx, e)}
                              required
                              placeholder="Enter asset name"
                              className="table-input"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              name="description"
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, e)}
                              required
                              placeholder="Enter description"
                              className="table-input"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              name="quantity"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, e)}
                              className="table-input text-center"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              name="serialNo"
                              value={item.serialNo}
                              onChange={(e) => handleItemChange(idx, e)}
                              required
                              placeholder="Enter serial no"
                              className="table-input"
                            />
                          </td>
                          <td>
                            <Form.Select
                              name="returnable"
                              value={item.returnable}
                              onChange={(e) => handleItemChange(idx, e)}
                              className="table-select"
                            >
                              <option value="no">No</option>
                              <option value="yes">Yes</option>
                            </Form.Select>
                          </td>
                          {challan.items.some(
                            (i) => i.returnable === "yes"
                          ) && (
                            <td>
                              {item.returnable === "yes" ? (
                                <Form.Control
                                  type="date"
                                  name="expectedReturnDate"
                                  value={item.expectedReturnDate}
                                  onChange={(e) => handleItemChange(idx, e)}
                                  required={item.returnable === "yes"}
                                  className="table-input"
                                />
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
            <div className="form-actions">
              <Button
                variant="outline-secondary"
                size="lg"
                className="me-3"
                onClick={handleClearForm}
              >
                <i className="bi bi-x-circle me-2"></i>Clear Form
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handlePreview}
                disabled={loading}
              >
                <i className="bi bi-eye-fill me-2"></i>Preview Challan
              </Button>
            </div>
          </Form>
        </Container>
      )}
      <PreviewModal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        challan={challan}
        dcNumber={getDcNumber()}
        onSave={handleSave}
        onPrint={handlePrint}
        loading={loading}
      />
    </div>
  );
};
export default ChallanForm;