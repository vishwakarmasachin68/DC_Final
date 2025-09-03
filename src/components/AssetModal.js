import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Button,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getCategories, addCategory, deleteCategory } from "./../services/api";

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
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    setCategoryLoading(true);
    try {
      await addCategory(newCategory.trim());
      setNewCategory("");
      setShowAddCategory(false);
      await fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      alert(error.detail || "Failed to add category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the category "${categoryName}"?`
      )
    ) {
      return;
    }

    try {
      await deleteCategory(categoryName);
      // If the current asset has this category, clear it
      if (currentAsset.category === categoryName) {
        setCurrentAsset((prev) => ({ ...prev, category: "" }));
      }
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(error.detail || "Failed to delete category");
    }
  };

  if (!currentAsset) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable>
      <Modal.Header closeButton className="card-header-custom text-white">
        <Modal.Title className="d-flex align-items-center">
          {isEditing ? "Edit Asset" : "Add New Asset"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={4}>
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
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Select
                    name="category"
                    value={currentAsset.category || ""}
                    onChange={handleInputChange}
                    required
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
                      overlay={
                        <Tooltip id={`tooltip-delete`}>Delete Category</Tooltip>
                      }
                    >
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() =>
                          handleDeleteCategory(currentAsset.category)
                        }
                      >
                        &times;
                      </Button>
                    </OverlayTrigger>
                  )}
                </div>
                {showAddCategory && (
                  <div className="d-flex gap-2 mt-2">
                    <Form.Control
                      type="text"
                      placeholder="Enter new category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAddCategory()
                      }
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddCategory}
                      disabled={categoryLoading || !newCategory.trim()}
                    >
                      {categoryLoading ? <Spinner size="sm" /> : "Add"}
                    </Button>
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
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
                <Form.Label>Make</Form.Label>
                <Form.Control
                  type="text"
                  name="make"
                  value={currentAsset.make || ""}
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
                  value={currentAsset.model || ""}
                  onChange={handleInputChange}
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
                <Form.Label>Asset Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  value={currentAsset.description || ""}
                  onChange={handleInputChange}
                  placeholder="Enter asset description"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
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
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Date of Purchase</Form.Label>
                <DatePicker
                  selected={currentAsset.date_of_purchase}
                  onChange={(date) =>
                    handleDateChange(date, "date_of_purchase")
                  }
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Last Service Date</Form.Label>
                <DatePicker
                  selected={currentAsset.last_service_date}
                  onChange={(date) =>
                    handleDateChange(date, "last_service_date")
                  }
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Covered Under AMC"
                  name="covered_under_amc"
                  checked={currentAsset.covered_under_amc || false}
                  onChange={handleCheckboxChange}
                />
              </Form.Group>
            </Col>
          </Row>

          {currentAsset.covered_under_amc && (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>AMC Vendor Details</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="amc_vendor_details"
                    value={currentAsset.amc_vendor_details}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Asset Issued To</Form.Label>
                <Form.Control
                  type="text"
                  name="asset_issued_to"
                  value={currentAsset.asset_issued_to}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Employee Number</Form.Label>
                <Form.Control
                  type="text"
                  name="employee_number"
                  value={currentAsset.employee_number}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date of Issue</Form.Label>
                <DatePicker
                  selected={currentAsset.date_of_issue}
                  onChange={(date) => handleDateChange(date, "date_of_issue")}
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
                <Form.Label>Condition</Form.Label>
                <Form.Select
                  name="condition"
                  value={currentAsset.condition || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Condition</option>
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Not Working">Not Working</option>
                </Form.Select>
              </Form.Group>
            </Col>
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
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Current Status of Device</Form.Label>
                <Form.Select
                  name="status"
                  value={currentAsset.status || "available"}
                  onChange={handleInputChange}
                >
                  <option value="available">Available</option>
                  <option value="in-use">In Use</option>
                  <option value="disposed">Disposed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {currentAsset.status === "disposed" && (
            <>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Disposal Approvals Obtained"
                      name="disposal_approvals_obtained"
                      checked={
                        currentAsset.disposal_approvals_obtained || false
                      }
                      onChange={handleCheckboxChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date Of Approval</Form.Label>
                    <DatePicker
                      selected={currentAsset.date_of_approval}
                      onChange={(date) =>
                        handleDateChange(date, "date_of_approval")
                      }
                      className="form-control"
                      dateFormat="dd/MM/yyyy"
                      isClearable
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Approved by</Form.Label>
                    <Form.Control
                      type="text"
                      name="approved_by"
                      value={currentAsset.approved_by}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Media Sanitised if Disposed off"
                      name="media_sanitised"
                      checked={currentAsset.media_sanitised || false}
                      onChange={handleCheckboxChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Media Sanitised by</Form.Label>
                    <Form.Control
                      type="text"
                      name="media_sanitised_by"
                      value={currentAsset.media_sanitised_by}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date Of Media Sanitisation</Form.Label>
                    <DatePicker
                      selected={currentAsset.date_of_media_sanitisation}
                      onChange={(date) =>
                        handleDateChange(date, "date_of_media_sanitisation")
                      }
                      className="form-control"
                      dateFormat="dd/MM/yyyy"
                      isClearable
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}

          <div className="d-flex justify-content-end mt-3">
            <Button variant="secondary" onClick={onHide} className="me-2">
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
