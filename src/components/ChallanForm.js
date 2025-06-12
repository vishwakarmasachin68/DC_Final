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
  Nav,
  Container,
  Dropdown,
} from "react-bootstrap";
import { generateDoc } from "../services/docGenerator";
import DataView from "./DataView";
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
        returnable: "No",
        expectedReturnDate: "",
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDataView, setShowDataView] = useState(false);

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
          returnable: "No",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requiredFields = ["dcNumber", "name", "client", "location"];
    const missing = requiredFields.find((field) => !challan[field]);
    if (missing) {
      setError(`Please fill in the ${missing} field`);
      setLoading(false);
      return;
    }

    if (challan.hasPO === "yes" && !challan.poNumber) {
      setError("Please enter PO Number");
      setLoading(false);
      return;
    }

    for (const [i, item] of challan.items.entries()) {
      if (!item.assetName || !item.description || !item.serialNo) {
        setError(`Please complete all fields for item ${i + 1}`);
        setLoading(false);
        return;
      }

      if (item.returnable === "Yes" && !item.expectedReturnDate) {
        setError(`Please enter expected return date for item ${i + 1}`);
        setLoading(false);
        return;
      }
    }

    try {
      await generateDoc(challan);
    } catch (err) {
      console.error("Document generation failed:", err);
      setError(err.message || "Failed to generate document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container fluid>
          <div className="d-flex w-100 justify-content-between align-items-center">
            <Navbar.Brand href="#" className="d-flex align-items-center">
              <img src="/deevia-logo.png" alt="Deevia Software" height="40" />
            </Navbar.Brand>

            <Dropdown align="end">
              <Dropdown.Toggle
                variant="dark"
                id="dropdown-basic"
                className="menu-toggle"
              >
                <i className="bi bi-list"></i> {/* Hamburger menu icon */}
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
        <Container fluid>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h2 className="main-title">Delivery Challan Generator</h2>
            </Card.Header>

            <Card.Body>
              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Card className="mb-4">
                  <Card.Header className="bg-light">
                    <h5>Challan Details</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group controlId="dcNumber" className="mb-3">
                          <Form.Label>DC Number *</Form.Label>
                          <Form.Control
                            type="text"
                            name="dcNumber"
                            value={challan.dcNumber}
                            onChange={handleInputChange}
                            placeholder="Enter DC Number"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="date" className="mb-3">
                          <Form.Label>Date *</Form.Label>
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

                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Has PO Number?</Form.Label>
                          <div>
                            <Form.Check
                              inline
                              type="radio"
                              label="Yes"
                              name="hasPO"
                              value="yes"
                              checked={challan.hasPO === "yes"}
                              onChange={handleInputChange}
                              id="hasPO-yes"
                            />
                            <Form.Check
                              inline
                              type="radio"
                              label="No"
                              name="hasPO"
                              value="no"
                              checked={challan.hasPO === "no"}
                              onChange={handleInputChange}
                              id="hasPO-no"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    {challan.hasPO === "yes" && (
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group controlId="poNumber">
                            <Form.Label>PO Number *</Form.Label>
                            <Form.Control
                              type="text"
                              name="poNumber"
                              value={challan.poNumber}
                              onChange={handleInputChange}
                              placeholder="Enter PO Number"
                              required={challan.hasPO === "yes"}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}

                    <Row>
                      <Col md={6}>
                        <Form.Group controlId="name" className="mb-3">
                          <Form.Label>Name *</Form.Label>
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
                      <Col md={6}>
                        <Form.Group controlId="client" className="mb-3">
                          <Form.Label>Client *</Form.Label>
                          <Form.Control
                            type="text"
                            name="client"
                            value={challan.client}
                            onChange={handleInputChange}
                            placeholder="Enter Client Name"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group controlId="location" className="mb-3">
                          <Form.Label>Location *</Form.Label>
                          <Form.Control
                            type="text"
                            name="location"
                            value={challan.location}
                            onChange={handleInputChange}
                            placeholder="Enter Location"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="mb-4">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <h5>Item Details</h5>
                    <div>
                      <Button variant="success" size="sm" onClick={addItem}>
                        Add Item
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="ms-2"
                        onClick={() => removeItem(challan.items.length - 1)}
                        disabled={challan.items.length <= 1}
                      >
                        Remove Item
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body className="table-responsive">
                    <Table bordered striped hover>
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Asset Name *</th>
                          <th>Description *</th>
                          <th>Qty</th>
                          <th>Serial No *</th>
                          <th>Returnable</th>
                          {challan.items.some(
                            (item) => item.returnable === "Yes"
                          ) && <th>Expected Return Date</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {challan.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.sno}</td>
                            <td>
                              <Form.Control
                                type="text"
                                name="assetName"
                                value={item.assetName}
                                onChange={(e) => handleItemChange(idx, e)}
                                required
                                placeholder="Asset"
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                name="description"
                                value={item.description}
                                onChange={(e) => handleItemChange(idx, e)}
                                required
                                placeholder="Description"
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                name="quantity"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, e)}
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                name="serialNo"
                                value={item.serialNo}
                                onChange={(e) => handleItemChange(idx, e)}
                                required
                                placeholder="Serial No"
                              />
                            </td>
                            <td>
                              <Form.Select
                                name="returnable"
                                value={item.returnable}
                                onChange={(e) => handleItemChange(idx, e)}
                              >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                              </Form.Select>
                            </td>
                            {challan.items.some(
                              (i) => i.returnable === "Yes"
                            ) && (
                              <td>
                                {item.returnable === "Yes" ? (
                                  <Form.Control
                                    type="date"
                                    name="expectedReturnDate"
                                    value={item.expectedReturnDate}
                                    onChange={(e) => handleItemChange(idx, e)}
                                    required={item.returnable === "Yes"}
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

                <div className="text-end">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate Challan"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Container>
      )}
    </div>
  );
};

export default ChallanForm;
