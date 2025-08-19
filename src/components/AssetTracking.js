import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Alert,
  Spinner,
  Card,
  InputGroup,
  Form,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import {
  getAssetTracking,
  addAssetTracking,
  updateAssetTracking,
  deleteAssetTracking,
  getAssets,
} from "../services/api";
import { BiSearch, BiPlusCircle, BiRefresh } from "react-icons/bi";

const AssetTracking = () => {
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyRecord = {
    date: new Date(),
    asset_id: "",
    asset_name: "",
    serial_number: "",
    transaction_type: "outward",
    vendor_sent_to: "",
    received_from: "",
    purpose: "",
    issued_by: "",
    received_by: "",
    return_date: null,
    notes: "",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trackingData, assetsData] = await Promise.all([
        getAssetTracking(),
        getAssets(),
      ]);
      setTrackingRecords(trackingData);
      setAssets(assetsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditing) {
        await updateAssetTracking(currentRecord.id, currentRecord);
      } else {
        await addAssetTracking(currentRecord);
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error("Failed to save record:", err);
      setError(err.detail || "Failed to save record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setCurrentRecord({
      ...record,
      date: record.date ? new Date(record.date) : new Date(),
      return_date: record.return_date ? new Date(record.return_date) : null,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tracking record?")) {
      try {
        setLoading(true);
        await deleteAssetTracking(id);
        await loadData();
      } catch (err) {
        console.error("Failed to delete record:", err);
        setError("Failed to delete record. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddNew = () => {
    setCurrentRecord(emptyRecord);
    setIsEditing(false);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleAssetSelect = (assetId) => {
    const selectedAsset = assets.find((asset) => asset.asset_id === assetId);
    if (selectedAsset) {
      setCurrentRecord((prev) => ({
        ...prev,
        asset_name: selectedAsset.asset_name,
        serial_number: selectedAsset.serial_number,
      }));
    }
  };

  const filteredRecords = trackingRecords.filter((record) => {
    return (
      record.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.serial_number &&
        record.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.vendor_sent_to &&
        record.vendor_sent_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.received_from &&
        record.received_from.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (loading && trackingRecords.length === 0) {
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
        <h2>Asset Tracking</h2>
        <p className="text-muted">Track all asset movements in and out of office</p>
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
                placeholder="Search tracking records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary">
                <BiSearch />
              </Button>
            </InputGroup>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={loadData}
              disabled={loading}
            >
              <BiRefresh className="me-1" />
              Refresh
            </Button>

            <Button
              style={{ backgroundColor: "#0e787b", borderColor: "#0e787b" }}
              onClick={handleAddNew}
            >
              <BiPlusCircle className="me-2"></BiPlusCircle>Add New Record
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Asset ID</th>
                  <th>Asset Name</th>
                  <th>Serial No</th>
                  <th>Type</th>
                  <th>Vendor/Recipient</th>
                  <th>Purpose</th>
                  <th>Issued/Received By</th>
                  <th>Return Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.asset_id}</td>
                    <td>{record.asset_name}</td>
                    <td>{record.serial_number || "N/A"}</td>
                    <td>{record.transaction_type}</td>
                    <td>
                      {record.transaction_type === "outward"
                        ? record.vendor_sent_to
                        : record.received_from}
                    </td>
                    <td>{record.purpose || "N/A"}</td>
                    <td>
                      {record.transaction_type === "outward"
                        ? record.issued_by
                        : record.received_by}
                    </td>
                    <td>{formatDate(record.return_date)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(record)}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-pencil"></i>
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
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

      {/* Tracking Record Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="card-header-custom text-white">
          <Modal.Title>
            {isEditing ? "Edit Tracking Record" : "Add New Tracking Record"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={
                      currentRecord?.date
                        ? currentRecord.date.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        date: new Date(e.target.value),
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Transaction Type *</Form.Label>
                  <Form.Select
                    name="transaction_type"
                    value={currentRecord?.transaction_type || "outward"}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        transaction_type: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="outward">Outward</option>
                    <option value="inward">Inward</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Asset ID *</Form.Label>
                  <Form.Select
                    name="asset_id"
                    value={currentRecord?.asset_id || ""}
                    onChange={(e) => {
                      setCurrentRecord({
                        ...currentRecord,
                        asset_id: e.target.value,
                      });
                      handleAssetSelect(e.target.value);
                    }}
                    required
                  >
                    <option value="">Select Asset</option>
                    {assets.map((asset) => (
                      <option key={asset.asset_id} value={asset.asset_id}>
                        {asset.asset_id} - {asset.asset_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Asset Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="asset_name"
                    value={currentRecord?.asset_name || ""}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        asset_name: e.target.value,
                      })
                    }
                    required
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Serial Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="serial_number"
                    value={currentRecord?.serial_number || ""}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        serial_number: e.target.value,
                      })
                    }
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {currentRecord?.transaction_type === "outward"
                      ? "Vendor/Sent To *"
                      : "Received From *"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name={
                      currentRecord?.transaction_type === "outward"
                        ? "vendor_sent_to"
                        : "received_from"
                    }
                    value={
                      currentRecord?.transaction_type === "outward"
                        ? currentRecord?.vendor_sent_to || ""
                        : currentRecord?.received_from || ""
                    }
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        [currentRecord.transaction_type === "outward"
                          ? "vendor_sent_to"
                          : "received_from"]: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purpose</Form.Label>
                  <Form.Control
                    type="text"
                    name="purpose"
                    value={currentRecord?.purpose || ""}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        purpose: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {currentRecord?.transaction_type === "outward"
                      ? "Issued By *"
                      : "Received By *"}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name={
                      currentRecord?.transaction_type === "outward"
                        ? "issued_by"
                        : "received_by"
                    }
                    value={
                      currentRecord?.transaction_type === "outward"
                        ? currentRecord?.issued_by || ""
                        : currentRecord?.received_by || ""
                    }
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        [currentRecord.transaction_type === "outward"
                          ? "issued_by"
                          : "received_by"]: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {currentRecord?.transaction_type === "outward" && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Expected Return Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="return_date"
                      value={
                        currentRecord?.return_date
                          ? currentRecord.return_date.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setCurrentRecord({
                          ...currentRecord,
                          return_date: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="notes"
                    value={currentRecord?.notes || ""}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        notes: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-3">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                Cancel
              </Button>
              <Button
                style={{ backgroundColor: "#0e787b", borderColor: "#0e787b" }}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                ) : isEditing ? (
                  "Update Record"
                ) : (
                  "Save Record"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AssetTracking;