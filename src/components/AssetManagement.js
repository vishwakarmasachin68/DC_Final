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
} from "react-bootstrap";
import { getAssets, addAsset, updateAsset, deleteAsset } from "../services/api";
import AssetModal from "./AssetModal";

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyAsset = {
    asset_id: "",
    asset_name: "",
    serial_number: "",
    category: "",
    make_model: "",
    condition: "",
    status: "active",
    transaction_date: null,
    transaction_type: "",
    received_from: "",
    purpose: "",
    issued_by: "",
    received_by: "",
    expected_return_date: null,
    returned_date: null,
    is_received: false,
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
      transaction_date: asset.transaction_date
        ? new Date(asset.transaction_date)
        : null,
      expected_return_date: asset.expected_return_date
        ? new Date(asset.expected_return_date)
        : null,
      returned_date: asset.returned_date ? new Date(asset.returned_date) : null,
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

  const filteredAssets = assets.filter(
    (asset) =>
      asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2>Asset Management</h2>
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
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </div>
          <Button
            style={{ backgroundColor: "#0e787b", borderColor: "#0e787b" }}
            onClick={handleAddNew}
          >
            <i className="bi bi-plus-circle me-2"></i>Add New Asset
          </Button>
        </Card.Header>
        <Card.Body>
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Asset Name</th>
                  <th>Serial No</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Received From</th>
                  <th>Purpose</th>
                  <th>Issued/Received By</th>
                  <th>Return Date</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.asset_id}>
                    <td>{asset.asset_id}</td>
                    <td>{asset.asset_name}</td>
                    <td>{asset.serial_number}</td>
                    <td>
                      {asset.transaction_date
                        ? new Date(asset.transaction_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <Badge
                        bg={
                          asset.transaction_type === "inward"
                            ? "success"
                            : "primary"
                        }
                      >
                        {asset.transaction_type || "N/A"}
                      </Badge>
                    </td>
                    <td>{asset.received_from || "N/A"}</td>
                    <td>{asset.purpose || "N/A"}</td>
                    <td>
                      {asset.transaction_type === "inward"
                        ? asset.received_by || "N/A"
                        : asset.issued_by || "N/A"}
                    </td>
                    <td>
                      {asset.expected_return_date
                        ? new Date(
                            asset.expected_return_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <Badge bg={asset.is_received ? "success" : "danger"}>
                        {asset.is_received ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        bg={
                          asset.status === "active"
                            ? "success"
                            : asset.status === "inactive"
                            ? "secondary"
                            : "danger"
                        }
                      >
                        {asset.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(asset)}
                        className="me-2"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(asset.asset_id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
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
