import React from "react";
import { Modal, Button, Card, Table, Badge, Spinner } from "react-bootstrap";

const PreviewModal = ({
  show,
  onHide,
  challan,
  dcNumber,
  onSave,
  loading,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Find client and location names
  const clientName = challan.client || "Not specified";
  const locationName = challan.location || "Not specified";

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      className="preview-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-eye-fill me-2"></i>Delivery Challan Preview
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="mb-4 shadow-sm">
          <Card.Header className="card-header-custom text-white">
            <h5 className="card-title">
              <i className="bi bi-file-text me-2"></i>Challan Information
            </h5>
          </Card.Header>
          <Card.Body>
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>DC Number:</strong> {dcNumber}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(challan.date)}
                </p>
                <p>
                  <strong>Prepared By:</strong>{" "}
                  {challan.name || "Not specified"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Client:</strong> {clientName}
                </p>
                <p>
                  <strong>Location:</strong> {locationName}
                </p>
                {challan.has_po === "yes" && challan.po_number && (
                  <p>
                    <strong>PO Number:</strong> {challan.po_number}
                  </p>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header className="card-header-custom text-white">
            <h5 className="card-title">
              <i className="bi bi-list-ul me-2"></i>Item Details
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table
              striped
              bordered
              hover
              responsive
              className="mb-0 items-table"
            >
              <thead className="table-header">
                <tr>
                  <th>#</th>
                  <th>Asset Name</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Serial No</th>
                  <th>Returnable</th>
                  {challan.items.some((item) => item.returnable === "yes") && (
                    <th>Return Date</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {challan.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{item.sno}</td>
                    <td>{item.asset_name || "N/A"}</td>
                    <td>{item.description || "N/A"}</td>
                    <td className="text-center">{item.quantity || 1}</td>
                    <td>{item.serial_no || "N/A"}</td>
                    <td className="text-center">
                      <Badge
                        bg={item.returnable === "yes" ? "success" : "secondary"}
                      >
                        {item.returnable === "yes" ? "Yes" : "No"}
                      </Badge>
                    </td>
                    {challan.items.some((i) => i.returnable === "yes") && (
                      <td>
                        {item.returnable === "yes"
                          ? formatDate(item.expected_return_date)
                          : "N/A"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={onHide}>
          <i className="bi bi-arrow-left me-2"></i>Back to Edit
        </Button>
        <Button
          variant="success"
          onClick={onSave}
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
                className="me-2"
              />
              Generating...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>Generate & Save Challan
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PreviewModal;