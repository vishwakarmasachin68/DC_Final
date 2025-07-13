import React, { useState } from "react";
import { 
  Modal, 
  Button, 
  Table, 
  Badge, 
  Alert, 
  Container,
  Row,
  Col,
  Spinner,
  InputGroup,
  Form
} from "react-bootstrap";
import { 
  format, 
  differenceInDays, 
  parseISO,
  isAfter
} from "date-fns";
import { BiCheckCircle, BiXCircle, BiCalendar } from "react-icons/bi";
import jsonStorage from "../services/jsonStorage";

const ReturnableItemsModal = ({ show, onHide, challans, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmReturn, setConfirmReturn] = useState(null);
  const [returnNotes, setReturnNotes] = useState("");

  // Get all returnable items from all challans
  const getReturnableItems = () => {
    const returnableItems = [];
    challans.forEach((challan) => {
      challan.items
        .filter((item) => item.returnable === "yes")
        .forEach((item) => {
          returnableItems.push({
            ...item,
            challanNumber: challan.dcNumber,
            challanDate: challan.date,
            client: challan.client,
            location: challan.location,
            projectName: challan.projectName
          });
        });
    });
    return returnableItems;
  };

  const returnableItems = getReturnableItems();

  // Calculate status
  const getItemStatus = (item) => {
    if (item.returnedDate) {
      return { 
        status: "Returned", 
        variant: "success",
        icon: <BiCheckCircle className="me-1" />
      };
    }

    const today = new Date();
    const returnDate = parseISO(item.expectedReturnDate);
    const daysLeft = differenceInDays(returnDate, today);

    if (daysLeft < 0) {
      return { 
        status: `${Math.abs(daysLeft)} days overdue`, 
        variant: "danger",
        icon: <BiXCircle className="me-1" />
      };
    } else {
      return { 
        status: `${daysLeft} days remaining`, 
        variant: daysLeft <= 3 ? "warning" : "primary",
        icon: <BiCalendar className="me-1" />
      };
    }
  };

  // Mark item as returned
  const handleMarkAsReturned = async (item) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Find the challan containing this item
      const challanToUpdate = challans.find(
        (c) => c.dcNumber === item.challanNumber
      );

      if (!challanToUpdate) {
        throw new Error("Challan not found");
      }

      // Update the specific item
      const updatedItems = challanToUpdate.items.map((i) => {
        if (i.sno === item.sno && i.assetName === item.assetName) {
          return {
            ...i,
            returnedDate: new Date().toISOString().split("T")[0],
            returnNotes: returnNotes || "Marked as returned"
          };
        }
        return i;
      });

      // Update the challan
      const updatedChallan = {
        ...challanToUpdate,
        items: updatedItems
      };

      // Save to storage
      await jsonStorage.saveChallan(updatedChallan);
      
      setSuccess("Item marked as returned successfully!");
      setConfirmReturn(null);
      setReturnNotes("");
      refreshData(); // Refresh parent component data
    } catch (err) {
      console.error("Failed to mark item as returned:", err);
      setError(err.message || "Failed to update item status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered 
      backdrop="static"
      className="returnable-items-modal"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <i className="bi bi-clock-history me-2"></i>
          <div>
            <h4 className="mb-0">Returnable Items Tracker</h4>
            <small className="text-white-50">Track all pending returns</small>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        {returnableItems.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "3rem" }}></i>
            <h5 className="mt-3">No pending returnable items</h5>
            <p className="text-muted">All items have been returned</p>
          </div>
        ) : (
          <Table striped bordered hover responsive className="mb-0">
            <thead className="table-dark">
              <tr>
                <th width="5%">#</th>
                <th width="15%">Challan</th>
                <th width="15%">Project</th>
                <th width="15%">Asset</th>
                <th width="10%">Client</th>
                <th width="10%">Location</th>
                <th width="15%">Expected Return</th>
                <th width="15%">Status</th>
                <th width="10%">Action</th>
              </tr>
            </thead>
            <tbody>
              {returnableItems.map((item, idx) => {
                const { status, variant, icon } = getItemStatus(item);
                const isOverdue = isAfter(new Date(), parseISO(item.expectedReturnDate)) && !item.returnedDate;
                
                return (
                  <tr 
                    key={idx} 
                    className={isOverdue ? "table-danger" : item.returnedDate ? "table-success" : ""}
                  >
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <div className="fw-bold">{item.challanNumber}</div>
                      <small className="text-muted">
                        {format(parseISO(item.challanDate), "dd/MM/yyyy")}
                      </small>
                    </td>
                    <td>{item.projectName || "N/A"}</td>
                    <td>
                      <div className="fw-bold">{item.assetName}</div>
                      <small className="text-muted">{item.serialNo}</small>
                    </td>
                    <td>{item.client || "N/A"}</td>
                    <td>{item.location || "N/A"}</td>
                    <td>
                      {format(parseISO(item.expectedReturnDate), "dd MMM yyyy")}
                    </td>
                    <td>
                      <Badge bg={variant} className="d-flex align-items-center">
                        {icon}
                        {status}
                      </Badge>
                    </td>
                    <td className="text-center">
                      {!item.returnedDate && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setConfirmReturn(item)}
                          disabled={loading}
                        >
                          <i className="bi bi-check-circle me-1"></i> Return
                        </Button>
                      )}
                      {item.returnedDate && (
                        <small className="text-success">
                          <i className="bi bi-check2-circle me-1"></i>
                          Returned
                        </small>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        {/* Confirmation Modal */}
        <Modal
          show={!!confirmReturn}
          onHide={() => {
            setConfirmReturn(null);
            setReturnNotes("");
          }}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Confirm Return</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to mark <strong>{confirmReturn?.assetName}</strong> from challan{" "}
              <strong>{confirmReturn?.challanNumber}</strong> as returned?
            </p>
            <Form.Group className="mb-3">
              <Form.Label>Return Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Any notes about the return condition"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmReturn(null);
                setReturnNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleMarkAsReturned(confirmReturn)}
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
                  Processing...
                </>
              ) : (
                "Confirm Return"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Modal.Body>
      
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Badge bg="success" className="me-2">
            <BiCheckCircle className="me-1" /> Returned
          </Badge>
          <Badge bg="warning" className="me-2">
            <BiCalendar className="me-1" /> Pending
          </Badge>
          <Badge bg="danger">
            <BiXCircle className="me-1" /> Overdue
          </Badge>
        </div>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReturnableItemsModal;