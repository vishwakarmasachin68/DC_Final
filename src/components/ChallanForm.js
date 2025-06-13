import React, { useState } from "react";
import {
Form,Button,Table,Row,Col,Card,Alert,Navbar,Container,Dropdown,InputGroup,
} from "react-bootstrap";
import { generateDoc } from "../services/docGenerator";
import DataView from "./DataView";
import PreviewModal from "./PreviewModal";
import "../styles/ChallanForm.css";

const ChallanForm = () => {
  const [challan, setChallan] = useState({
    dcNumber: "",
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
  const [showDataView, setShowDataView] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  const validateForm = () => {
    const requiredFields = ["dcNumber", "name", "client", "location"];
    const missing = requiredFields.find((field) => !challan[field]);
    if (missing) {
      setError(`Please fill in the ${missing} field`);
      return false;
    }

    if (challan.hasPO === "yes" && !challan.poNumber) {
      setError("Please enter PO Number");
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
      await generateDoc(challan);
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

  return (
    <div className="challan-app-container">
      <Navbar bg="primary" variant="dark" expand="lg" className="app-navbar py-2">
        <Container fluid className="d-flex justify-content-between align-items-center position-relative">
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
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="primary"
                id="dropdown-basic"
                className="menu-toggle border-0"
              >
                {/* <i className="bi b  i-three-dots-vertical fs-5"></i> */}
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-menu-end custom-dropdown">
                <Dropdown.Item
                  onClick={() => setShowDataView(!showDataView)}
                  className="dropdown-item-custom"
                >
                  <i
                    className={`bi ${
                      showDataView ? "bi-card-checklist" : "bi-house"
                    } me-2`}
                  ></i>
                  {showDataView ? "Dashboard" : "Data View"}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      {showDataView ? (
        <DataView challan={challan} />
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
            {/* Challan Details Card */}
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
                        <Form.Control
                          type="text"
                          name="dcNumber"
                          value={challan.dcNumber}
                          onChange={handleInputChange}
                          placeholder="Enter DC Number"
                          required
                          className="form-control-custom"
                        />
                      </InputGroup>
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
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-building"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="client"
                          value={challan.client}
                          onChange={handleInputChange}
                          placeholder="Enter Client Name"
                          required
                          className="form-control-custom"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group controlId="location" className="mb-3">
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
                          value={challan.location}
                          onChange={handleInputChange}
                          placeholder="Enter Location"
                          required
                          className="form-control-custom"
                        />
                      </InputGroup>
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

            {/* Items Card */}
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

            {/* Form Actions */}
            <div className="form-actions">
              <Button
                variant="outline-secondary"
                size="lg"
                className="me-3"
                onClick={() => {
                  setChallan({
                    dcNumber: "",
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
                }}
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
        onSave={handleSave}
        onPrint={handlePrint}
        loading={loading}
      />
    </div>
  );
};

export default ChallanForm;