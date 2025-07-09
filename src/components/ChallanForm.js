import React, { useState, useEffect } from 'react';
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
  Spinner
} from 'react-bootstrap';
import { BiBarChartAlt2, BiPieChartAlt, BiTrash, BiPlusCircle, BiFontColor } from 'react-icons/bi';
import DataView from './DataView';
import PreviewModal from './PreviewModal';
import ProjectForm from './ProjectForm';
import jsonStorage from '../services/jsonStorage';
import '../styles/ChallanForm.css';

const ChallanForm = () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  };

  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [showNewLocationInput, setShowNewLocationInput] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedChallans, setSavedChallans] = useState([]);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("challan");
  const [showPreview, setShowPreview] = useState(false);

  const [challan, setChallan] = useState({
    dcSequence: "001",
    date: new Date().toISOString().split("T")[0],
    name: "",
    project: "",
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

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projects, clients, locations, challans] = await Promise.all([
          jsonStorage.getProjects(),
          jsonStorage.getClients(),
          jsonStorage.getLocations(),
          jsonStorage.getChallans()
        ]);
        
        setProjects(projects);
        setClients(clients);
        setLocations(locations);
        setSavedChallans(challans);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Please refresh the page.");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate DC number
  const getDcNumber = () => {
    const prefix = "DSI/";
    const middle = challan.hasPO === "yes" && challan.poNumber 
      ? challan.poNumber 
      : formatDate(challan.date);
    return `${prefix}${middle}/${challan.dcSequence}`;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallan(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle item changes
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    setChallan(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: name === "quantity" ? Math.max(1, parseInt(value) || 1) : value,
      };
      
      if (name === "returnable" && value === "no") {
        updatedItems[index].expectedReturnDate = "";
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  // Add new item
  const addItem = () => {
    setChallan(prev => ({
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

  // Remove item
  const removeItem = (index) => {
    if (challan.items.length <= 1) return;
    const updatedItems = challan.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, sno: i + 1 }));
    setChallan(prev => ({ ...prev, items: updatedItems }));
  };

  // Validate form
  const validateForm = () => {
    if (!challan.dcSequence || !/^\d{3}$/.test(challan.dcSequence)) {
      setError("DC Sequence must be a 3-digit number");
      return false;
    }
    if (!challan.name) {
      setError("Name is required");
      return false;
    }
    if (!challan.client) {
      setError("Client is required");
      return false;
    }
    if (!challan.location) {
      setError("Location is required");
      return false;
    }
    if (challan.hasPO === "yes" && !challan.poNumber) {
      setError("PO Number is required");
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

  // Handle preview
  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      const dcNumber = getDcNumber();
      const docData = {
        ...challan,
        dcNumber,
        items: challan.items.map(item => ({
          ...item,
          returnable: item.returnable,
          expectedReturnDate: item.returnable === "yes" ? item.expectedReturnDate : ""
        }))
      };
      
      // Save to storage
      await jsonStorage.saveChallan(docData);
      const updatedChallans = await jsonStorage.getChallans();
      setSavedChallans(updatedChallans);
      
      // Generate document (you would implement this)
      // await generateDoc(docData);
      
      setShowPreview(false);
      setError(null);
    } catch (err) {
      console.error("Failed to save challan:", err);
      setError("Failed to save challan. Please try again.");
    }
  };

  // Clear form
  const handleClearForm = () => {
    setChallan({
      dcSequence: "001",
      date: new Date().toISOString().split("T")[0],
      name: "",
      project: "",
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="challan-app-container">
      {/* Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" className="app-navbar py-2">
        <Container fluid className="d-flex justify-content-between align-items-center position-relative">
          <div className="d-flex align-items-center">
            <Navbar.Brand href="#" className="d-flex align-items-center">
              <a href='/'>
            <img
              src="/deevia-logo.png"
              alt="Deevia Software"
              height="50"
              className="navbar-logo me-2"
            />
              </a>
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
                <i className="bi bi-house me-2"></i>Dashboard
            </Button>
            <Button
              variant={currentView === "data" ? "light" : "outline-light"}
              onClick={() => setCurrentView("data")}
                className="d-flex align-items-center"
            >
                <i className="bi bi-card-checklist me-2"></i>Data View
            </Button>
            <Button
              variant={currentView === "project" ? "light" : "outline-light"}
              onClick={() => setCurrentView("project")}
                className="d-flex align-items-center"
            >
                <i className="bi bi-folder-plus me-2"></i>Add Project
            </Button>
            </div>
          </div>
        </Container>
      </Navbar>

      {/* Main Content */}
      {currentView === "data" ? (
        <DataView challans={savedChallans} />
      ) : currentView === "project" ? (
        <ProjectForm />
      ) : (
        <Container fluid className="main-content-container py-4">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form>
            {/* Challan Information */}
            <Card className="mb-4 form-card">
              <Card.Header className="card-header-custom">
                <h5 className="card-title">
                  <i className="bi bi-file-text me-2"></i>Challan Information
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>DC Number</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>DSI/</InputGroup.Text>
                        <InputGroup.Text>
                          {challan.hasPO === "yes" && challan.poNumber
                            ? challan.poNumber
                            : formatDate(challan.date)}
                        </InputGroup.Text>
                        <InputGroup.Text>/</InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="dcSequence"
                          value={challan.dcSequence}
                          onChange={handleInputChange}
                          placeholder="001"
                          required
                          maxLength={3}
                        />
                      </InputGroup>
                      <div className="mt-2">
                        Full DC Number: <strong>{getDcNumber()}</strong>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={challan.date}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Project</Form.Label>
                      <Form.Select
                        name="project"
                        value={challan.project}
                        onChange={(e) => {
                          const projectId = e.target.value;
                          if (!projectId) {
                            setChallan(prev => ({
                              ...prev,
                              project: "",
                              client: "",
                              location: "",
                              hasPO: "no",
                              poNumber: ""
                            }));
                            return;
                          }

                          const selectedProject = projects.find(p => p.id === projectId);
                          if (selectedProject) {
                            setChallan(prev => ({
                              ...prev,
                              project: projectId,
                              client: selectedProject.client || "",
                              location: selectedProject.location || "",
                              hasPO: selectedProject.hasPO || "no",
                              poNumber: selectedProject.poNumber || ""
                            }));
                          }
                        }}
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.projectName}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={challan.name}
                        onChange={handleInputChange}
                        placeholder="Enter Name"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

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
                          <Button variant="success" onClick={async () => {
                            if (!newClient.trim()) return;
                            await jsonStorage.saveClient(newClient.trim());
                            const clients = await jsonStorage.getClients();
                            setClients(clients);
                            setChallan(prev => ({ ...prev, client: newClient.trim() }));
                            setShowNewClientInput(false);
                            setNewClient("");
                          }}>
                            Save
                          </Button>
                          <Button variant="secondary" onClick={() => setShowNewClientInput(false)}>
                            Cancel
                          </Button>
                        </InputGroup>
                      ) : (
                        <Form.Select
                          value={challan.client || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "new") {
                              setShowNewClientInput(true);
                              setChallan(prev => ({ ...prev, client: "" }));
                            } else {
                              setShowNewClientInput(false);
                              setChallan(prev => ({ ...prev, client: value }));
                            }
                          }}
                          required
                        >
                          <option value="">Select a client</option>
                          {clients.map((client, index) => (
                            <option key={index} value={client}>{client}</option>
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
                          <Button variant="success" onClick={async () => {
                            if (!newLocation.trim()) return;
                            await jsonStorage.saveLocation(newLocation.trim());
                            const locations = await jsonStorage.getLocations();
                            setLocations(locations);
                            setChallan(prev => ({ ...prev, location: newLocation.trim() }));
                            setShowNewLocationInput(false);
                            setNewLocation("");
                          }}>
                            Save
                          </Button>
                          <Button variant="secondary" onClick={() => setShowNewLocationInput(false)}>
                            Cancel
                          </Button>
                        </InputGroup>
                      ) : (
                        <Form.Select
                          value={challan.location || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "new") {
                              setShowNewLocationInput(true);
                              setChallan(prev => ({ ...prev, location: "" }));
                            } else {
                              setShowNewLocationInput(false);
                              setChallan(prev => ({ ...prev, location: value }));
                            }
                          }}
                          required
                        >
                          <option value="">Select a location</option>
                          {locations.map((location, index) => (
                            <option key={index} value={location}>{location}</option>
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
                          name="hasPO"
                          id="hasPO-yes"
                          value="yes"
                          checked={challan.hasPO === "yes"}
                          onChange={handleInputChange}
                          className="me-3"
                        />
                        <Form.Check
                          type="radio"
                          label="No"
                          name="hasPO"
                          id="hasPO-no"
                          value="no"
                          checked={challan.hasPO === "no"}
                          onChange={handleInputChange}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  {challan.hasPO === "yes" && (
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>PO Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="poNumber"
                          value={challan.poNumber}
                          onChange={handleInputChange}
                          placeholder="Enter PO Number"
                          required
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>

            {/* Item Details */}
            <Card className="mb-4 form-card">
              <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                <h5 className="card-title">
                  <i className="bi bi-list-ul me-2"></i>Item Details
                </h5>
                <div>
                  <Button variant="outline-success" size="sm" onClick={addItem} className="me-2" style={{color:'greenyellow'}}>
                    <i className="bi bi-plus-circle me-1"></i>Add Item
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeItem(challan.items.length - 1)}
                    disabled={challan.items.length <= 1}
                    // style={{color:'red'}}
                  >
                    <i className="bi bi-dash-circle me-1"></i>Remove Item
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Table bordered hover className="mb-0">
                  <thead>
                    <tr>
                      <th width="5%">#</th>
                      <th width="20%">Asset Name</th>
                      <th width="25%">Description</th>
                      <th width="10%">Qty</th>
                      <th width="15%">Serial No</th>
                      <th width="10%">Returnable</th>
                      {challan.items.some((item) => item.returnable === "yes") && (
                        <th width="15%">Expected Return Date</th>
                      )}
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
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            name="quantity"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, e)}
                            className="text-center"
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
                          />
                        </td>
                        <td>
                          <Form.Select
                            name="returnable"
                            value={item.returnable}
                            onChange={(e) => handleItemChange(idx, e)}
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </Form.Select>
                        </td>
                        {challan.items.some((i) => i.returnable === "yes") && (
                          <td>
                            {item.returnable === "yes" ? (
                              <Form.Control
                                type="date"
                                name="expectedReturnDate"
                                value={item.expectedReturnDate}
                                onChange={(e) => handleItemChange(idx, e)}
                                required
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
              </Card.Body>
            </Card>

            {/* Form Actions */}
            <div className="d-flex justify-content-end gap-3">
              <Button
                variant="secondary"
                onClick={handleClearForm}
              >
                Clear Form
              </Button>
              <Button
                variant="primary"
                onClick={handlePreview}
              >
                Preview Challan
              </Button>
            </div>
          </Form>

          {/* Preview Modal */}
          {showPreview && (
            <div className="modal-backdrop show">
              <div className="modal d-block">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Challan Preview - {getDcNumber()}</h5>
                      <button type="button" className="btn-close" onClick={() => setShowPreview(false)}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-4">
                        <h6>Challan Information</h6>
                        <div className="row">
                          <div className="col-md-4">
                            <p><strong>Date:</strong> {new Date(challan.date).toLocaleDateString()}</p>
                          </div>
                          <div className="col-md-4">
                            <p><strong>Prepared By:</strong> {challan.name}</p>
                          </div>
                          <div className="col-md-4">
                            <p><strong>Client:</strong> {challan.client}</p>
                          </div>
                          <div className="col-md-4">
                            <p><strong>Location:</strong> {challan.location}</p>
                          </div>
                          {challan.hasPO === "yes" && (
                            <div className="col-md-4">
                              <p><strong>PO Number:</strong> {challan.poNumber}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h6>Items</h6>
                        <Table bordered>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Asset Name</th>
                              <th>Description</th>
                              <th>Qty</th>
                              <th>Serial No</th>
                              <th>Returnable</th>
                              {challan.items.some(i => i.returnable === "yes") && <th>Return Date</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {challan.items.map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.sno}</td>
                                <td>{item.assetName}</td>
                                <td>{item.description}</td>
                                <td>{item.quantity}</td>
                                <td>{item.serialNo}</td>
                                <td>{item.returnable === "yes" ? "Yes" : "No"}</td>
                                {challan.items.some(i => i.returnable === "yes") && (
                                  <td>{item.returnable === "yes" ? item.expectedReturnDate : "N/A"}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowPreview(false)}>
                        Close
                      </button>
                      <button type="button" className="btn btn-primary" onClick={handleSave}>
                        Save Challan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      )}
    </div>
  );
};

export default ChallanForm;