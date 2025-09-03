import React, { useState, useEffect } from "react";
import { Modal, Form, Row, Col, Button, Spinner, Alert, Tooltip, OverlayTrigger } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getCategories, addCategory, deleteCategory } from "../services/api";

const AssetModal = ({
  show,
  onHide,
  currentAsset,
  setCurrentAsset,
  handleSubmit,
  loading,
  isEditing,
}) => {
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");

  // Initialize currentAsset if it's null
  useEffect(() => {
    if (!currentAsset) {
      setCurrentAsset({
        asset_id: "",
        asset_name: "",
        category: "",
        make: "",
        model: "",
        serial_number: "",
        description: "",
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
      });
    }
  }, [show, currentAsset, setCurrentAsset]);

  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setCategoryError("Category name is required");
      return;
    }

    try {
      await addCategory(newCategory);
      setNewCategory("");
      setShowAddCategory(false);
      fetchCategories(); // Refresh the list
      setCategoryError("");
      setCategorySuccess("Category added successfully!");
      setTimeout(() => setCategorySuccess(""), 3000);
    } catch (error) {
      setCategoryError(
        error.detail || "Failed to add category. It may already exist."
      );
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      try {
        await deleteCategory(categoryName);
        fetchCategories(); // Refresh the list
        
        // If the deleted category was selected, clear the selection
        if (currentAsset.category === categoryName) {
          setCurrentAsset({
            ...currentAsset,
            category: ""
          });
        }
        
        setCategorySuccess("Category deleted successfully!");
        setTimeout(() => setCategorySuccess(""), 3000);
      } catch (error) {
        setCategoryError(
          error.detail || "Failed to delete category. It may be in use."
        );
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentAsset({
      ...currentAsset,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleDateChange = (name, date) => {
    setCurrentAsset({
      ...currentAsset,
      [name]: date,
    });
  };

  // Don't render if currentAsset is still null
  if (!currentAsset) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered >
      <Modal.Header closeButton className="card-header-custom text-white">
        <Modal.Title>
          {isEditing ? "Edit Asset" : "Add New Asset"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
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
                <Form.Label>Category</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Select
                    name="category"
                    value={currentAsset.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                  <OverlayTrigger 
                    placement="top"
                    overlay={<Tooltip id={`tooltip-add`}>Add Category</Tooltip>}
                  >
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                  >
                    +
                  </Button>
                  </OverlayTrigger>
                  {currentAsset.category && (
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip id={`tooltip-delete`}>Delete Category</Tooltip>}
                    >
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteCategory(currentAsset.category)}
                    >
                      &times;
                    </Button>
                    </OverlayTrigger>
                  )}
                  
                </div>
                
              </Form.Group>
            </Col>
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
          </Row>

          {categorySuccess && (
            <Row>
              <Col md={12}>
                <Alert variant="success" className="py-2">
                  {categorySuccess}
                </Alert>
              </Col>
            </Row>
          )}

          {categoryError && (
            <Row>
              <Col md={12}>
                <Alert variant="danger" className="py-2">
                  {categoryError}
                </Alert>
              </Col>
            </Row>
          )}

          {showAddCategory && (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>New Category Name</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddCategory}
                    >
                      Add
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowAddCategory(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Make</Form.Label>
                <Form.Control
                  type="text"
                  name="make"
                  value={currentAsset.make}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Model</Form.Label>
                <Form.Control
                  type="text"
                  name="model"
                  value={currentAsset.model}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date of Purchase</Form.Label>
                <DatePicker
                  selected={currentAsset.date_of_purchase}
                  onChange={(date) => handleDateChange("date_of_purchase", date)}
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Service Date</Form.Label>
                <DatePicker
                  selected={currentAsset.last_service_date}
                  onChange={(date) => handleDateChange("last_service_date", date)}
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                  isClearable
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Warranty Details</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="warranty_details"
                  value={currentAsset.warranty_details}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Supplier Details</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="supplier_details"
                  value={currentAsset.supplier_details}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={currentAsset.description}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="covered_under_amc"
                  label="Covered under AMC"
                  checked={currentAsset.covered_under_amc}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            {currentAsset.covered_under_amc && (
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>AMC Vendor Details</Form.Label>
                  <Form.Control
                    type="text"
                    name="amc_vendor_details"
                    value={currentAsset.amc_vendor_details}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Current Location</Form.Label>
                <Form.Control
                  type="text"
                  name="current_location"
                  value={currentAsset.current_location}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Condition</Form.Label>
                <Form.Select
                  name="condition"
                  value={currentAsset.condition}
                  onChange={handleInputChange}
                >
                  <option value="">Select Condition</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={currentAsset.status}
                  onChange={handleInputChange}
                >
                  <option value="available">Available</option>
                  <option value="in-use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              {isEditing ? " Updating..." : " Adding..."}
            </>
          ) : isEditing ? (
            "Update Asset"
          ) : (
            "Add Asset"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssetModal;