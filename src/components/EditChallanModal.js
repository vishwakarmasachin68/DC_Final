import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  InputGroup,
  Table,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { BiCalendar, BiTrash, BiPlus, BiMinus } from "react-icons/bi";
import { getProjects, getClients, getLocations } from "../services/api";

const EditChallanModal = ({
  show,
  onHide,
  challan,
  projects,
  onSave,
  loading,
}) => {
  const [formData, setFormData] = useState({
    dc_number: "",
    dc_sequence: "",
    date: "",
    name: "",
    project_id: "",
    project_name: "",
    client: "",
    location: "",
    has_po: "no",
    po_number: "",
    items: [],
  });
  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projects, clients, locations] = await Promise.all([
          getProjects(),
          getClients(),
          getLocations(),
        ]);
        setAvailableProjects(projects);
        setAvailableClients(clients.map((c) => c.name));
        setAvailableLocations(locations.map((l) => l.name));
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (challan) {
      setFormData({
        dc_number: challan.dc_number || "",
        dc_sequence: challan.dc_sequence || "",
        date: challan.date || "",
        name: challan.name || "",
        project_id: challan.project_id || "",
        project_name: challan.project_name || "",
        client: challan.client || "",
        location: challan.location || "",
        has_po: challan.has_po || "no",
        po_number: challan.po_number || "",
        items: challan.items ? [...challan.items] : [],
      });
    }
  }, [challan]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sno: prev.items.length + 1,
          asset_name: "",
          description: "",
          quantity: 1,
          serial_no: "",
          returnable: "no",
          expected_return_date: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) {
      setError("At least one item is required");
      return;
    }
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    // Update serial numbers
    const itemsWithUpdatedSno = updatedItems.map((item, idx) => ({
      ...item,
      sno: idx + 1,
    }));
    setFormData((prev) => ({ ...prev, items: itemsWithUpdatedSno }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.dc_number || !formData.date || !formData.name) {
      setError("DC Number, Date, and Name are required");
      return;
    }

    if (formData.items.some((item) => !item.asset_name || item.quantity <= 0)) {
      setError("All items must have an asset name and positive quantity");
      return;
    }

    try {
      await onSave(formData);
      onHide();
    } catch (err) {
      console.error("Failed to update challan:", err);
      setError("Failed to update challan. Please try again.");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          Edit Challan: {formData.dc_number}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="dc_number">
                <Form.Label>DC Number</Form.Label>
                <Form.Control
                  type="text"
                  name="dc_number"
                  value={formData.dc_number}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="dc_sequence">
                <Form.Label>DC Sequence</Form.Label>
                <Form.Control
                  type="text"
                  name="dc_sequence"
                  value={formData.dc_sequence}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="date">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="name">
                <Form.Label>Prepared By</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="project_name">
                <Form.Label>Project</Form.Label>
                <Form.Select
                  name="project_name"
                  value={formData.project_name}
                  onChange={(e) => {
                    const projectName = e.target.value;
                    if (!projectName) {
                      setFormData((prev) => ({
                        ...prev,
                        project_name: "",
                        client: "",
                        location: "",
                        has_po: "no",
                        po_number: "",
                      }));
                      return;
                    }

                    const selectedProject = availableProjects.find(
                      (p) => p.project_name === projectName
                    );
                    if (selectedProject) {
                      setFormData((prev) => ({
                        ...prev,
                        project_name: projectName,
                        client: selectedProject.client || "",
                        location: selectedProject.location || "",
                        has_po: selectedProject.has_po || "no",
                        po_number: selectedProject.po_number || "",
                      }));
                    }
                  }}
                >
                  <option value="">Select Project</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.project_name}>
                      {project.project_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="client">
                <Form.Label>Client</Form.Label>
                <Form.Select
                  name="client"
                  value={formData.client}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      client: e.target.value,
                    }));
                  }}
                >
                  <option value="">Select Client</option>
                  {availableClients.map((client, index) => (
                    <option key={index} value={client}>
                      {client}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="location">
                <Form.Label>Location</Form.Label>
                <Form.Select
                  name="location"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }));
                  }}
                >
                  <option value="">Select Location</option>
                  {availableLocations.map((location, index) => (
                    <option key={index} value={location}>
                      {location}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="has_po">
                <Form.Label>Has PO?</Form.Label>
                <Form.Select
                  name="has_po"
                  value={formData.has_po}
                  onChange={handleInputChange}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {formData.has_po === "yes" && (
              <Col md={4}>
                <Form.Group controlId="po_number">
                  <Form.Label>PO Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="po_number"
                    value={formData.po_number}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Items</h5>
              <Button variant="primary" size="sm" onClick={addItem}>
                <BiPlus /> Add Item
              </Button>
            </div>

            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th width="25%">Asset Name</th>
                    <th width="25%">Description</th>
                    <th width="10%">Qty</th>
                    <th width="15%">Serial No</th>
                    <th width="10%">Returnable</th>
                    <th width="10%">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.sno}</td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.asset_name}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "asset_name",
                              e.target.value
                            )
                          }
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.serial_no}
                          onChange={(e) =>
                            handleItemChange(index, "serial_no", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <Form.Select
                          value={item.returnable}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "returnable",
                              e.target.value
                            )
                          }
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </Form.Select>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <BiMinus />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditChallanModal;