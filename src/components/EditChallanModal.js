import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Table,
  Spinner,
  Alert,
  InputGroup,
  Card,
} from "react-bootstrap";
import { BiTrash } from "react-icons/bi";
import {
  getProjects,
  getClients,
  getLocations,
  getAvailableAssets,
} from "../services/api";

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
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [showNewLocationInput, setShowNewLocationInput] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, clientsData, locationsData, assetsData] =
          await Promise.all([
            getProjects(),
            getClients(),
            getLocations(),
            getAvailableAssets(),
          ]);

        setAvailableProjects(projectsData);
        setAvailableClients(clientsData.map((c) => c.name));
        setAvailableLocations(locationsData.map((l) => l.name));
        setAvailableAssets(assetsData);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Please try again.");
      }
    };

    if (show) {
      loadData();
    }
  }, [show]);

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: name === "quantity" ? Math.max(1, parseInt(value) || 1) : value,
      };

      if (name === "returnable" && value === "no") {
        updatedItems[index].expected_return_date = "";
      }

      return { ...prev, items: updatedItems };
    });
  };

  const handleAssetSelect = (e) => {
    const assetId = e.target.value;
    if (!assetId) return;

    const asset = availableAssets.find((a) => a.asset_id === assetId);
    if (!asset) return;

    // Check if asset is already selected
    if (formData.items.some((a) => a.asset_id === assetId)) {
      setError("This asset is already added to the challan");
      return;
    }

    const newItem = {
      sno: formData.items.length + 1,
      asset_id: asset.asset_id,
      asset_name: asset.asset_name,
      description:
        asset.description ||
        `${asset.make || ""} ${asset.model || ""} ${
          asset.category || ""
        }`.trim(),
      quantity: 1,
      serial_no: asset.serial_number,
      returnable: "no",
      expected_return_date: "",
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setAssetSearchTerm("");
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) {
      setError("At least one item is required");
      return;
    }

    setFormData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      // Update serial numbers
      const itemsWithUpdatedSno = updatedItems.map((item, idx) => ({
        ...item,
        sno: idx + 1,
      }));
      return { ...prev, items: itemsWithUpdatedSno };
    });
  };

  const validateForm = () => {
    if (!formData.dc_sequence || !/^\d{3}$/.test(formData.dc_sequence)) {
      setError("DC Sequence must be a 3-digit number");
      return false;
    }
    if (!formData.name) {
      setError("Name is required");
      return false;
    }
    if (!formData.client) {
      setError("Client is required");
      return false;
    }
    if (!formData.location) {
      setError("Location is required");
      return false;
    }
    if (formData.has_po === "yes" && !formData.po_number) {
      setError("PO Number is required");
      return false;
    }
    if (formData.items.length === 0) {
      setError("Please add at least one asset");
      return false;
    }
    for (const [i, item] of formData.items.entries()) {
      if (!item.asset_name || !item.serial_no) {
        setError(`Please complete all fields for item ${i + 1}`);
        return false;
      }
      if (item.returnable === "yes" && !item.expected_return_date) {
        setError(`Please enter expected return date for item ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      await onSave(formData);
    } catch (err) {
      console.error("Failed to update challan:", err);
      setError("Failed to update challan. Please try again.");
    }
  };

  // Filter available assets based on search term and exclude already selected ones
  const filteredAvailableAssets = availableAssets.filter(
    (asset) =>
      !formData.items.some((a) => a.asset_id === asset.asset_id) &&
      (asset.asset_name.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
        asset.asset_id.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
        (asset.serial_number &&
          asset.serial_number
            .toLowerCase()
            .includes(assetSearchTerm.toLowerCase())))
  );

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
      <Modal.Header className="card-header-custom text-white" closeButton>
        <Modal.Title className="d-flex align-items-center">
          Edit Challan: {formData.dc_number}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "80vh", overflowY: "auto" }}>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Card className="mb-4 form-card">
            <Card.Header className="card-header-custom text-white">
              <h5 className="card-title">
                <i className="bi bi-file-text me-2"></i>Challan Information
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>DC Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="dc_number"
                      value={formData.dc_number}
                      onChange={handleInputChange}
                      required
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>DC Sequence</Form.Label>
                    <Form.Control
                      type="text"
                      name="dc_sequence"
                      value={formData.dc_sequence}
                      onChange={handleInputChange}
                      placeholder="001"
                      required
                      maxLength={3}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
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
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
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
                      <option value="">Select a project</option>
                      {availableProjects.map((project) => (
                        <option key={project.id} value={project.project_name}>
                          {project.project_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
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
                        <Button
                          variant="success"
                          onClick={() => {
                            if (!newClient.trim()) return;
                            setFormData((prev) => ({
                              ...prev,
                              client: newClient.trim(),
                            }));
                            setShowNewClientInput(false);
                            setNewClient("");
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setShowNewClientInput(false)}
                        >
                          Cancel
                        </Button>
                      </InputGroup>
                    ) : (
                      <Form.Select
                        value={formData.client || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "new") {
                            setShowNewClientInput(true);
                            setFormData((prev) => ({ ...prev, client: "" }));
                          } else {
                            setShowNewClientInput(false);
                            setFormData((prev) => ({
                              ...prev,
                              client: value,
                            }));
                          }
                        }}
                        required
                      >
                        <option value="">Select a client</option>
                        {availableClients.map((client, index) => (
                          <option key={index} value={client}>
                            {client}
                          </option>
                        ))}
                        <option value="new">+ Add New Client</option>
                      </Form.Select>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Row>
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
                          variant="success"
                          onClick={() => {
                            if (!newLocation.trim()) return;
                            setFormData((prev) => ({
                              ...prev,
                              location: newLocation.trim(),
                            }));
                            setShowNewLocationInput(false);
                            setNewLocation("");
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setShowNewLocationInput(false)}
                        >
                          Cancel
                        </Button>
                      </InputGroup>
                    ) : (
                      <Form.Select
                        value={formData.location || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "new") {
                            setShowNewLocationInput(true);
                            setFormData((prev) => ({ ...prev, location: "" }));
                          } else {
                            setShowNewLocationInput(false);
                            setFormData((prev) => ({
                              ...prev,
                              location: value,
                            }));
                          }
                        }}
                        required
                      >
                        <option value="">Select a location</option>
                        {availableLocations.map((location, index) => (
                          <option key={index} value={location}>
                            {location}
                          </option>
                        ))}
                        <option value="new">+ Add New Location</option>
                      </Form.Select>
                    )}
                  </Form.Group>
                </Col>
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
                        checked={formData.has_po === "yes"}
                        onChange={handleInputChange}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        label="No"
                        name="has_po"
                        id="has_po-no"
                        value="no"
                        checked={formData.has_po === "no"}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              {formData.has_po === "yes" && (
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>PO Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="po_number"
                        value={formData.po_number}
                        onChange={handleInputChange}
                        placeholder="Enter PO Number"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
          <Card className="mb-4 form-card">
            <Card.Header className="card-header-custom text-white d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0" style={{ fontWeight: "bold" }}>
                <i className="bi bi-box me-2"></i>Asset Details
              </h5>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="text"
                  placeholder="Search assets..."
                  value={assetSearchTerm}
                  onChange={(e) => setAssetSearchTerm(e.target.value)}
                  style={{ width: "200px" }}
                />
                <Form.Select
                  value=""
                  onChange={handleAssetSelect}
                  style={{ width: "250px" }}
                >
                  <option value="">Select an asset...</option>
                  {filteredAvailableAssets.length === 0 ? (
                    <option value="" disabled>
                      No assets available
                    </option>
                  ) : (
                    filteredAvailableAssets.map((asset) => (
                      <option key={asset.asset_id} value={asset.asset_id}>
                        {" "}
                        {asset.asset_id} - {asset.asset_name} -{" "}
                        {asset.serial_number}
                      </option>
                    ))
                  )}{" "}
                </Form.Select>
              </div>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead className="table-header-custom">
                  <tr>
                    <th>S.No</th>
                    <th>Asset ID</th>
                    <th>Asset Name</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Serial No</th>
                    <th>Returnable</th>
                    {formData.items.some(
                      (item) => item.returnable === "yes"
                    ) && <th>Expected Return Date</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.length > 0 ? (
                    formData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.sno}</td>
                        <td>{item.asset_id}</td>
                        <td>{item.asset_name}</td>
                        <td>
                          <Form.Control
                            type="text"
                            name="description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, e)}
                            required
                            placeholder="Enter description"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, e)}
                            min="1"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>{item.serial_no}</td>
                        <td>
                          <Form.Select
                            name="returnable"
                            value={item.returnable}
                            onChange={(e) => handleItemChange(index, e)}
                            style={{ width: "120px" }}
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </Form.Select>
                        </td>
                        {formData.items.some(
                          (item) => item.returnable === "yes"
                        ) && (
                          <td>
                            {item.returnable === "yes" ? (
                              <Form.Control
                                type="date"
                                name="expected_return_date"
                                value={item.expected_return_date}
                                onChange={(e) => handleItemChange(index, e)}
                                style={{ width: "150px" }}
                              />
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        )}
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <BiTrash /> Remove
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          formData.items.some(
                            (item) => item.returnable === "yes"
                          )
                            ? 9
                            : 8
                        }
                        className="text-center text-muted py-4"
                      >
                        No assets selected. Please select assets from the
                        dropdown above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ backgroundColor: "#0e787b", borderColor: "#0e787b" }}
            >
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
