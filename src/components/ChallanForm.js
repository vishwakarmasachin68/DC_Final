import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Table,
  Row,
  Col,
  Card,
  Alert,
  InputGroup,
  Spinner,
  Container,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PreviewModal from "./PreviewModal";
import {
  getChallans,
  addChallan,
  getProjects,
  getClients,
  getLocations,
  addClient,
  addLocation,
  getAvailableAssets,
  getAssets,
} from "../services/api";
import { generateDoc } from "../services/docGenerator";
import "../styles/ChallanForm.css";

const ChallanForm = ({ onSave }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDcNumber = (challan) => {
    const prefix = "DSI/";
    const middle =
      challan.has_po === "yes" && challan.po_number
        ? challan.po_number
        : formatDate(challan.date).replace(/\//g, "");
    return `${prefix}${middle}/${challan.dc_sequence}`;
  };

  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [showNewLocationInput, setShowNewLocationInput] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [nextSequence, setNextSequence] = useState("001");
  const [assetSearchTerm, setAssetSearchTerm] = useState("");

  const [challan, setChallan] = useState({
    dc_sequence: nextSequence,
    date: new Date().toISOString().split("T")[0],
    name: "",
    project_id: "",
    project_name: "",
    client: "",
    location: "",
    has_po: "no",
    po_number: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        projectsData,
        clientsData,
        locationsData,
        challansData,
        assetsData,
      ] = await Promise.all([
        getProjects(),
        getClients(),
        getLocations(),
        getChallans(),
        getAvailableAssets(),
      ]);

      setProjects(projectsData);
      setClients(clientsData.map((c) => c.name));
      setLocations(locationsData.map((l) => l.name));
      setAssets(assetsData);

      if (challansData.length > 0) {
        const sequences = challansData.map((c) => {
          const parts = c.dc_number?.split("/") || [];
          return parts.length > 2 ? parseInt(parts[2]) : 0;
        });
        const maxSequence = Math.max(...sequences);
        setNextSequence(String(maxSequence + 1).padStart(3, "0"));
      } else {
        setNextSequence("001");
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Please refresh the page.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setChallan((prev) => ({
      ...prev,
      dc_sequence: nextSequence,
    }));
  }, [nextSequence]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallan((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAssetSelect = (e) => {
    const assetId = e.target.value;
    if (!assetId) return;
    if (assetId === "add") {
      navigate("/AssetManagement");
      return;
    }

    const asset = assets.find((a) => a.asset_id === assetId);
    if (!asset) return;

    // Check if asset is already selected
    if (selectedAssets.some((a) => a.asset_id === assetId)) {
      return;
    }

    const newItem = {
      sno: selectedAssets.length + 1,
      asset_id: asset.asset_id, // Include asset_id
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

    setSelectedAssets((prev) => [...prev, newItem]);
    setAssetSearchTerm("");
  };

  const removeSelectedAsset = (index) => {
    setSelectedAssets((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({
          ...item,
          sno: idx + 1,
        }))
    );
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    setSelectedAssets((prev) => {
      const updatedItems = [...prev];
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: name === "quantity" ? Math.max(1, parseInt(value) || 1) : value,
      };

      if (name === "returnable" && value === "no") {
        updatedItems[index].expected_return_date = "";
      }

      return updatedItems;
    });
  };

  const validateForm = () => {
    if (!challan.dc_sequence || !/^\d{3}$/.test(challan.dc_sequence)) {
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
    if (challan.has_po === "yes" && !challan.po_number) {
      setError("PO Number is required");
      return false;
    }
    if (selectedAssets.length === 0) {
      setError("Please add at least one asset");
      return false;
    }
    for (const [i, item] of selectedAssets.entries()) {
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

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const handleSaveAndGenerate = async () => {
    if (!validateForm()) return;

    setGenerating(true);
    try {
      const dcNumber = getDcNumber(challan);
      const selectedProject = projects.find((p) => p.id === challan.project_id);

      const challanData = {
        dc_number: dcNumber,
        dc_sequence: challan.dc_sequence,
        date: challan.date,
        name: challan.name,
        project_id: challan.project_id,
        project_name: selectedProject?.project_name || challan.project_name,
        client: challan.client,
        location: challan.location,
        has_po: challan.has_po,
        po_number: challan.po_number,
        items: selectedAssets.map((item) => ({
          sno: item.sno,
          asset_id: item.asset_id, // Include asset_id
          asset_name: item.asset_name,
          description: item.description,
          quantity: item.quantity,
          serial_no: item.serial_no,
          returnable: item.returnable,
          expected_return_date:
            item.returnable === "yes" ? item.expected_return_date : null,
        })),
      };

      // Save to backend
      const savedChallan = await addChallan(challanData);

      if (onSave) onSave(savedChallan);

      const newSequence = String(parseInt(nextSequence) + 1).padStart(3, "0");
      setNextSequence(newSequence);

      // Generate document
      await generateDoc({
        ...challanData,
        dcNumber,
        projectName: selectedProject?.project_name || challan.project_name,
      });

      setShowPreview(false);
      setSelectedAssets([]);
      setError(null);

      // ✅ Refresh available assets so used ones disappear
      const availableAssets = await getAvailableAssets();
      setAssets(availableAssets);

      navigate("/");
    } catch (err) {
      console.error("Failed to save/generate challan:", err);
      setError(
        err.message || "Failed to save/generate challan. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleClearForm = ()  => {
    setChallan({
      dc_sequence: nextSequence,
      date: new Date().toISOString().split("T")[0],
      name: "",
      project_id: "",
      project_name: "",
      client: "",
      location: "",
      has_po: "no",
      po_number: "",
    });
    setSelectedAssets([]);
    setShowNewClientInput(false);
    setShowNewLocationInput(false);
    setAssetSearchTerm("");
  };

  // Filter available assets based on search term and exclude already selected ones
  const availableAssets = assets.filter(
    (asset) =>
      !selectedAssets.some((a) => a.asset_id === asset.asset_id) &&
      (asset.asset_name.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
        asset.asset_id.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
        (asset.serial_number &&
          asset.serial_number
            .toLowerCase()
            .includes(assetSearchTerm.toLowerCase())))
  );

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" style={{ color: "#085f79ff" }} />
      </div>
    );
  }

  return (
    <Container fluid className="main-content-container py-4">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Form>
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
                  <InputGroup>
                    <InputGroup.Text>DSI/</InputGroup.Text>
                    <InputGroup.Text>
                      {challan.has_po === "yes" && challan.po_number
                        ? challan.po_number
                        : formatDate(challan.date).replace(/\//g, "")}
                    </InputGroup.Text>
                    <InputGroup.Text>/</InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="dc_sequence"
                      value={challan.dc_sequence}
                      onChange={handleInputChange}
                      placeholder="001"
                      required
                      maxLength={3}
                    />
                  </InputGroup>
                  <div className="mt-2">
                    Full DC Number: <strong>{getDcNumber(challan)}</strong>
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
                    name="project_id"
                    value={challan.project_id}
                    onChange={(e) => {
                      const projectId = e.target.value;
                      if (projectId === "add") {
                        navigate("/projects");
                        return;
                      }
                      if (!projectId) {
                        setChallan((prev) => ({
                          ...prev,
                          project_id: "",
                          project_name: "",
                          client: "",
                          location: "",
                          has_po: "no",
                          po_number: "",
                        }));
                        return;
                      }

                      const selectedProject = projects.find(
                        (p) => p.id == projectId
                      );
                      if (selectedProject) {
                        setChallan((prev) => ({
                          ...prev,
                          project_id: projectId,
                          project_name: selectedProject.project_name,
                          client: selectedProject.client || "",
                          location: selectedProject.location || "",
                          has_po: selectedProject.has_po || "no",
                          po_number: selectedProject.po_number || "",
                        }));
                      }
                    }}
                  >
                    <option value="">Select a project</option>
                    <option value="add">+ Add Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_name}
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
                      <Button
                        variant="success"
                        onClick={async () => {
                          if (!newClient.trim()) return;
                          try {
                            await addClient(newClient.trim());
                            const clients = await getClients();
                            setClients(clients.map((c) => c.name));
                            setChallan((prev) => ({
                              ...prev,
                              client: newClient.trim(),
                            }));
                            setShowNewClientInput(false);
                            setNewClient("");
                          } catch (err) {
                            setError("Failed to add client. Please try again.");
                          }
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
                      value={challan.client || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "new") {
                          setShowNewClientInput(true);
                          setChallan((prev) => ({ ...prev, client: "" }));
                        } else {
                          setShowNewClientInput(false);
                          setChallan((prev) => ({
                            ...prev,
                            client: value,
                          }));
                        }
                      }}
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
                        variant="success"
                        onClick={async () => {
                          if (!newLocation.trim()) return;
                          try {
                            await addLocation(newLocation.trim());
                            const locations = await getLocations();
                            setLocations(locations.map((l) => l.name));
                            setChallan((prev) => ({
                              ...prev,
                              location: newLocation.trim(),
                            }));
                            setShowNewLocationInput(false);
                            setNewLocation("");
                          } catch (err) {
                            setError(
                              "Failed to add location. Please try again."
                            );
                          }
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
                      value={challan.location || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "new") {
                          setShowNewLocationInput(true);
                          setChallan((prev) => ({ ...prev, location: "" }));
                        } else {
                          setShowNewLocationInput(false);
                          setChallan((prev) => ({
                            ...prev,
                            location: value,
                          }));
                        }
                      }}
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
                      checked={challan.has_po === "yes"}
                      onChange={handleInputChange}
                      className="me-3"
                    />
                    <Form.Check
                      type="radio"
                      label="No"
                      name="has_po"
                      id="has_po-no"
                      value="no"
                      checked={challan.has_po === "no"}
                      onChange={handleInputChange}
                    />
                  </div>
                </Form.Group>
              </Col>
              {challan.has_po === "yes" && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>PO Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="po_number"
                      value={challan.po_number}
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
                {availableAssets.length === 0 ? (
                  <option value="add">
                    No assets available. Click to add assets
                  </option>
                ) : (
                  availableAssets.map((asset) => (
                    <option key={asset.asset_id} value={asset.asset_id}>
                      {asset.asset_id} - {asset.asset_name} -{" "}
                      {asset.serial_number}
                    </option>
                  ))
                )}
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
                  {selectedAssets.some(item => item.returnable === "yes") && (
                    <th>Expected Return Date</th>
                  )}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedAssets.length > 0 ? (
                  selectedAssets.map((item, index) => (
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
                      {selectedAssets.some(item => item.returnable === "yes") && (
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
                          onClick={() => removeSelectedAsset(index)}
                        >
                          <i className="bi bi-trash"> </i>
                          <span> Remove</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={selectedAssets.some(item => item.returnable === "yes") ? 9 : 8} 
                      className="text-center text-muted py-4"
                    >
                      No assets selected. Please select assets from the dropdown above.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-between">
          <Button variant="secondary" onClick={handleClearForm}>
            Clear Form
          </Button>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={handlePreview}
              disabled={selectedAssets.length === 0}
            >
              Preview
            </Button>
            <Button
              variant="success"
              onClick={handleSaveAndGenerate}
              disabled={selectedAssets.length === 0}
            >
              {generating ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Generating...
                </>
              ) : (
                "Save & Generate"
              )}
            </Button>
          </div>
        </div>
      </Form>

      <PreviewModal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        challan={{
          ...challan,
          dc_number: getDcNumber(challan),
          items: selectedAssets,
        }}
        onGenerate={handleSaveAndGenerate}
        generating={generating}
      />
    </Container>
  );
};

export default ChallanForm;