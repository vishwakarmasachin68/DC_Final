import React from 'react';
import { Modal, Table, Badge } from 'react-bootstrap';

const AssetPreviewModal = ({ show, onHide, asset }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge bg="success">Available</Badge>;
      case 'in-use':
        return <Badge bg="warning">In Use</Badge>;
      case 'disposed':
        return <Badge bg="danger">Disposed</Badge>;
      default:
        return <Badge bg="secondary">N/A</Badge>;
    }
  };

  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'New':
        return <Badge bg="success">New</Badge>;
      case 'Good':
        return <Badge bg="primary">Good</Badge>;
      case 'Fair':
        return <Badge bg="warning">Fair</Badge>;
      case 'Poor':
      case 'Not Working':
        return <Badge bg="danger">{condition}</Badge>;
      default:
        return <Badge bg="secondary">N/A</Badge>;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="card-header-custom text-white">
        <Modal.Title>Asset Details: {asset?.asset_id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h5>{asset?.asset_name}</h5>
          <p className="text-muted">{asset?.category}</p>
          <div className="d-flex gap-2 mb-3">
            {getStatusBadge(asset?.status)}
            {getConditionBadge(asset?.condition)}
          </div>
        </div>

        <Table striped bordered hover responsive>
          <tbody>
            <tr>
              <th>Asset ID</th>
              <td>{asset?.asset_id || "N/A"}</td>
            </tr>
            <tr>
              <th>Serial Number</th>
              <td>{asset?.serial_number || "N/A"}</td>
            </tr>
            <tr>
              <th>Make/Model</th>
              <td>{asset?.make || "N/A"} / {asset?.model || "N/A"}</td>
            </tr>
            <tr>
              <th>Supplier Details</th>
              <td>{asset?.supplier_details || "N/A"}</td>
            </tr>
            <tr>
              <th>Purchase Date</th>
              <td>{formatDate(asset?.date_of_purchase)}</td>
            </tr>
            <tr>
              <th>Warranty Details</th>
              <td>{asset?.warranty_details || "N/A"}</td>
            </tr>
            <tr>
              <th>Last Service Date</th>
              <td>{formatDate(asset?.last_service_date)}</td>
            </tr>
            <tr>
              <th>AMC Coverage</th>
              <td>{asset?.covered_under_amc ? "Yes" : "No"}</td>
            </tr>
            {asset?.covered_under_amc && (
              <tr>
                <th>AMC Vendor Details</th>
                <td>{asset?.amc_vendor_details || "N/A"}</td>
              </tr>
            )}
            <tr>
              <th>Current Location</th>
              <td>{asset?.current_location || "N/A"}</td>
            </tr>
            <tr>
              <th>Issued To</th>
              <td>{asset?.asset_issued_to || "N/A"}</td>
            </tr>
            <tr>
              <th>Employee Number</th>
              <td>{asset?.employee_number || "N/A"}</td>
            </tr>
            <tr>
              <th>Issue Date</th>
              <td>{formatDate(asset?.date_of_issue)}</td>
            </tr>
            <tr>
              <th>Expected Return Date</th>
              <td>{formatDate(asset?.expected_return_date)}</td>
            </tr>
            <tr>
              <th>Actual Return Date</th>
              <td>{formatDate(asset?.returned_date)}</td>
            </tr>
            {asset?.status === 'disposed' && (
              <>
                <tr>
                  <th>Disposal Approvals Obtained</th>
                  <td>{asset?.disposal_approvals_obtained ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <th>Approval Date</th>
                  <td>{formatDate(asset?.date_of_approval)}</td>
                </tr>
                <tr>
                  <th>Approved By</th>
                  <td>{asset?.approved_by || "N/A"}</td>
                </tr>
                <tr>
                  <th>Media Sanitized</th>
                  <td>{asset?.media_sanitised ? "Yes" : "No"}</td>
                </tr>
                {asset?.media_sanitised && (
                  <>
                    <tr>
                      <th>Sanitized By</th>
                      <td>{asset?.media_sanitised_by || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Sanitization Date</th>
                      <td>{formatDate(asset?.date_of_media_sanitisation)}</td>
                    </tr>
                  </>
                )}
              </>
            )}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssetPreviewModal;