import React from "react";
import { Modal, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AssetModal = ({
  show,
  onHide,
  currentAsset,
  setCurrentAsset,
  handleSubmit,
  loading,
  isEditing,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAsset((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setCurrentAsset((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (date, field) => {
    setCurrentAsset((prev) => ({ ...prev, [field]: date }));
  };
  if (!currentAsset) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton className="custom-modal-header bg-primary text-white">
        <Modal.Title>{isEditing ? "Edit Asset" : "Add New Asset"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Asset ID *</Form.Label>
                <Form.Control
                  type="text"
                  name="asset_id"
                  value={currentAsset.asset_id}
                  onChange={handleInputChange}
                  required
                  disabled={isEditing}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Asset Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="asset_name"
                  value={currentAsset.asset_name}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Serial Number *</Form.Label>
                <Form.Control
                  type="text"
                  name="serial_number"
                  value={currentAsset.serial_number}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Control
                  type="text"
                  name="category"
                  value={currentAsset.category}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Make/Model</Form.Label>
                <Form.Control
                  type="text"
                  name="make_model"
                  value={currentAsset.make_model}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Condition</Form.Label>
                <Form.Control
                  type="text"
                  name="condition"
                  value={currentAsset.condition}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Transaction Type</Form.Label>
                <Form.Select
                  name="transaction_type"
                  value={currentAsset.transaction_type || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Type</option>
                  <option value="inward">Inward</option>
                  <option value="outward">Outward</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Transaction Date</Form.Label>
                <DatePicker
                  selected={currentAsset.transaction_date}
                  onChange={(date) =>
                    handleDateChange(date, "transaction_date")
                  }
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Received From</Form.Label>
                <Form.Control
                  type="text"
                  name="received_from"
                  value={currentAsset.received_from}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Purpose</Form.Label>
                <Form.Control
                  type="text"
                  name="purpose"
                  value={currentAsset.purpose}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Issued By</Form.Label>
                <Form.Control
                  type="text"
                  name="issued_by"
                  value={currentAsset.issued_by}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Received By</Form.Label>
                <Form.Control
                  type="text"
                  name="received_by"
                  value={currentAsset.received_by}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Expected Return Date</Form.Label>
                <DatePicker
                  selected={currentAsset.expected_return_date}
                  onChange={(date) =>
                    handleDateChange(date, "expected_return_date")
                  }
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Returned Date</Form.Label>
                <DatePicker
                  selected={currentAsset.returned_date}
                  onChange={(date) => handleDateChange(date, "returned_date")}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Is Received"
                  name="is_received"
                  checked={currentAsset.is_received}
                  onChange={handleCheckboxChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={currentAsset.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="disposed">Disposed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-3">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              ) : isEditing ? (
                "Update Asset"
              ) : (
                "Save Asset"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AssetModal;
