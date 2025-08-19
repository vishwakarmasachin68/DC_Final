import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Alert,
  Spinner,
  Card,
  InputGroup,
  Badge,
  Form,
  Modal,
  Dropdown,
  Row,
  Col,
} from "react-bootstrap";
import { getAssets, addAsset, updateAsset, deleteAsset } from "../services/api";
import AssetModal from "./AssetModal";
import { BiFilter, BiSearch, BiPlusCircle, BiRefresh } from "react-icons/bi";

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const emptyAsset = {
    asset_id: "",
    asset_name: "",
    category: "",
    make: "",
    model: "",
    serial_number: "",
    supplier_details: "",
    date_of_purchase: null,
    warranty_details: "",
    last_service_date: null,
    covered_under_amc: false,
    amc_vendor_details: "",
    transaction_type: "",
    transaction_date: null,
    vendor_sent_to: "",
    received_from: "",
    purpose: "",
    issued_by: "",
    received_by: "",
    asset_issued_to: "",
    employee_number: "",
    date_of_issue: null,
    expected_return_date: null,
    returned_date: null,
    current_location: "",
    condition: "",
    status: "available",
    disposal_approvals_obtained: false,
    date_of_approval: null,
    approved_by: "",
    media_sanitised: false,
    media_sanitised_by: "",
    date_of_media_sanitisation: null,
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await getAssets();
      setAssets(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load assets:", err);
      setError("Failed to load assets. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditing) {
        await updateAsset(currentAsset.asset_id, currentAsset);
      } else {
        await addAsset(currentAsset);
      }
      setShowModal(false);
      await loadAssets();
    } catch (err) {
      console.error("Failed to save asset:", err);
      setError(err.detail || "Failed to save asset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (asset) => {
    setCurrentAsset({
      ...asset,
      make: asset.make || "",
      model: asset.model || "",
      date_of_purchase: asset.date_of_purchase
        ? new Date(asset.date_of_purchase)
        : null,
      last_service_date: asset.last_service_date
        ? new Date(asset.last_service_date)
        : null,
      transaction_date: asset.transaction_date
        ? new Date(asset.transaction_date)
        : null,
      date_of_issue: asset.date_of_issue ? new Date(asset.date_of_issue) : null,
      expected_return_date: asset.expected_return_date
        ? new Date(asset.expected_return_date)
        : null,
      returned_date: asset.returned_date ? new Date(asset.returned_date) : null,
      date_of_approval: asset.date_of_approval
        ? new Date(asset.date_of_approval)
        : null,
      date_of_media_sanitisation: asset.date_of_media_sanitisation
        ? new Date(asset.date_of_media_sanitisation)
        : null,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (assetId) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        setLoading(true);
        await deleteAsset(assetId);
        await loadAssets();
      } catch (err) {
        console.error("Failed to delete asset:", err);
        setError("Failed to delete asset. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddNew = () => {
    setCurrentAsset(emptyAsset);
    setIsEditing(false);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.asset_issued_to &&
        asset.asset_issued_to
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (asset.current_location &&
        asset.current_location
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (asset.make &&
        asset.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.model &&
        asset.model.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === "all" || asset.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading && assets.length === 0) {
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
    <Container className="mt-4">
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2>Asset Management</h2>
            <p className="text-muted">
              Track all office assets and their movement.
            </p>
          </div>
          <div>
            <Button
              style={{
                backgroundColor: "#0e787b",
                borderColor: "#0e787b",
                fontSize: "1.3rem",
              }}
              onClick={() => (window.location.href = "/AssetTracking")}
              className="ms-2"
            >
              <i className="bi bi-truck"></i> Asset Tracking
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <InputGroup style={{ width: "300px" }}>
              <Form.Control
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary">
                <BiSearch />
              </Button>
            </InputGroup>
          </div>
          <div className="d-flex gap-2">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary">
                <BiFilter className="me-1" />
                {filterStatus === "all"
                  ? "All Status"
                  : filterStatus.charAt(0).toUpperCase() +
                    filterStatus.slice(1)}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setFilterStatus("all")}>
                  All Status
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus("available")}>
                  Available
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus("in-use")}>
                  In Use
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus("disposed")}>
                  Disposed
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Button
              variant="outline-primary"
              onClick={loadAssets}
              disabled={loading}
            >
              <BiRefresh className="me-1" />
              Refresh
            </Button>

            <Button
              style={{ backgroundColor: "#0e787b", borderColor: "#0e787b" }}
              onClick={handleAddNew}
            >
              <BiPlusCircle className="me-2"></BiPlusCircle>Add New Asset
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Make/Model</th>
                  <th>Serial No</th>
                  <th>Purchase Date</th>
                  <th>Condition</th>
                  <th>Current Location</th>
                  <th>Issued To</th>
                  <th>Last Service</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.asset_id}>
                    <td>{asset.asset_id}</td>
                    <td>{asset.asset_name}</td>
                    <td>{asset.category || "N/A"}</td>
                    <td>
                      {asset.make || "N/A"} / {asset.model || "N/A"}
                    </td>
                    <td>{asset.serial_number}</td>
                    <td>{formatDate(asset.date_of_purchase)}</td>
                    <td>
                      <Badge
                        bg={
                          asset.condition === "New"
                            ? "success"
                            : asset.condition === "Good"
                            ? "primary"
                            : asset.condition === "Fair"
                            ? "warning"
                            : asset.condition === "Poor" ||
                              asset.condition === "Not Working"
                            ? "danger"
                            : "secondary"
                        }
                      >
                        {asset.condition || "N/A"}
                      </Badge>
                    </td>
                    <td>{asset.current_location || "N/A"}</td>
                    <td>{asset.asset_issued_to || "N/A"}</td>
                    <td>{formatDate(asset.last_service_date)}</td>
                    <td>
                      <Badge
                        bg={
                          asset.status === "available"
                            ? "success"
                            : asset.status === "in-use"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {asset.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(asset)}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-pencil"></i>
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(asset.asset_id)}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-trash"></i>
                          <span>Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <AssetModal
        show={showModal}
        onHide={() => setShowModal(false)}
        currentAsset={currentAsset}
        setCurrentAsset={setCurrentAsset}
        handleSubmit={handleSubmit}
        loading={loading}
        isEditing={isEditing}
      />
    </Container>
  );
};

export default AssetManagement;
