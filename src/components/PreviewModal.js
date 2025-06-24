import React from "react";
import { Modal, Button, Card, Table, Badge, Spinner } from "react-bootstrap";

const PreviewModal = ({ 
  show, 
  onHide, 
  challan, 
  dcNumber, 
  onPrint, 
  onSave, 
  loading 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Find client and location names
  const clientName = challan.clientName || `Client ID: ${challan.client}`;
  const locationName = challan.locationName || `Location ID: ${challan.location}`;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="preview-modal"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-eye-fill me-2"></i>Delivery Challan Preview
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="mb-4 shadow-sm">
          <Card.Header className="card-header-custom">
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
                  <strong>Prepared By:</strong> {challan.name}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Client:</strong> {clientName}
                </p>
                <p>
                  <strong>Location:</strong> {locationName}
                </p>
                {challan.hasPO === "yes" && challan.poNumber && (
                  <p>
                    <strong>PO Number:</strong> {challan.poNumber}
                  </p>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header className="card-header-custom">
            <h5 className="card-title">
              <i className="bi bi-list-ul me-2"></i>Item Details
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table striped bordered hover responsive className="mb-0 items-table">
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
                    <td>{item.assetName}</td>
                    <td>{item.description}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td>{item.serialNo}</td>
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
                          ? formatDate(item.expectedReturnDate)
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
        <div>
          <Button 
            variant="success" 
            onClick={onSave} 
            className="me-2"
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
                <i className="bi bi-save me-2"></i>Generate Challan
              </>
            )}
          </Button>
          <Button variant="primary" onClick={onPrint}>
            <i className="bi bi-printer me-2"></i>Print Preview
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PreviewModal;