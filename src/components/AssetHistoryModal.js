import React, { useState, useEffect } from "react";
import { Modal, Table, Badge, Spinner, Alert } from "react-bootstrap";
import { getAssetTracking, getChallans } from "../services/api";

const AssetHistoryModal = ({ show, onHide, asset }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && asset) {
      loadHistory();
    }
  }, [show, asset]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get tracking records for this asset
      const trackingRecords = await getAssetTracking();
      const assetTracking = trackingRecords.filter(
        (record) => record.asset_id === asset.asset_id
      );

      // Get challans that include this asset
      const allChallans = await getChallans();
      const assetChallans = allChallans.filter((challan) =>
        challan.items.some((item) => item.asset_id === asset.asset_id)
      );

      // Format the history data
      const historyData = [];

      // Add tracking records
      assetTracking.forEach((record) => {
        historyData.push({
          type: "tracking",
          date: record.date,

          action: record.transaction_type === "outward" ? "Outward" : "Inward",
          purpose: record.purpose || "N/A",
          details: `${
            record.transaction_type === "outward"
              ? `Sent to ${record.vendor_sent_to}`
              : `Received from ${record.received_from}`
          }`,
          user:
            record.transaction_type === "outward"
              ? record.issued_by
              : record.received_by,
        });
      });

      // Add challan records
      assetChallans.forEach((challan) => {
        const item = challan.items.find((i) => i.asset_id === asset.asset_id);
        historyData.push({
          type: "challan",
          date: challan.date,
          action: "Challan Generated",
          purpose: challan.purpose || "N/A",
          details: `DC Number: ${challan.dc_number}, Quantity: ${item.quantity}`,
          user: challan.name,
        });
      });

      // Add asset creation/edits (we'll simulate this as we don't have edit history in API)
      historyData.push({
        type: "asset",
        date: asset.date_of_purchase || new Date().toISOString().split("T")[0],
        action: "Asset Created",
        purpose: asset.purpose || "N/A",
        details: "Asset record was created in the system",
        user: "System",
      });

      // Sort by date (newest first)
      historyData.sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistory(historyData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load asset history:", err);
      setError("Failed to load asset history. Please try again.");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getBadgeVariant = (action) => {
    switch (action) {
      case "Inward":
        return "success";
      case "Outward":
        return "warning";
      case "Challan Generated":
        return "info";
      case "Asset Created":
        return "primary";
      default:
        return "secondary";
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="card-header-custom text-white">
        <Modal.Title>Asset History: {asset?.asset_id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" style={{ color: "#085f79ff" }} />
            <p className="mt-2">Loading asset history...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : history.length === 0 ? (
          <div className="text-center py-4">
            <p>No history found for this asset.</p>
          </div>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>purpose</th>
                  <th>Details</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index}>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      <Badge bg={getBadgeVariant(item.action)}>
                        {item.action}
                      </Badge>
                    </td>
                    <td>{item.purpose}</td>
                    <td>{item.details}</td>
                    <td>{item.user}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssetHistoryModal;
