import React, { useState } from "react";
import { 
  Modal, 
  Button, 
  Badge, 
  Alert, 
  Row,
  Col,
  Spinner,
  Form,
  ListGroup, 
  InputGroup,
  Card,
  Table
} from "react-bootstrap";
import { 
  format, 
  differenceInDays, 
  parseISO,
  isAfter,
  isValid
} from "date-fns";
import { 
  BiCheckCircle, 
  BiXCircle, 
  BiCalendar,
  BiTime,
  BiPackage,
  BiBuilding,
  BiMapPin,
  BiClipboard,
  BiArrowFromBottom,
  BiSearch,
  BiListUl,
  BiFileText,
  BiInfoCircle
} from "react-icons/bi";
import jsonStorage from "../services/jsonStorage";

const ReturnableItemsModal = ({ show, onHide, challans, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmReturn, setConfirmReturn] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Safe date parsing function
  const safeParseISO = (dateString) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return isValid(date) ? date : null;
    } catch (e) {
      return null;
    }
  };

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

  // Filter items based on search term
  const filteredItems = returnableItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.assetName.toLowerCase().includes(searchLower) ||
      item.challanNumber.toLowerCase().includes(searchLower) ||
      (item.projectName && item.projectName.toLowerCase().includes(searchLower)) ||
      (item.client && item.client.toLowerCase().includes(searchLower)) ||
      (item.location && item.location.toLowerCase().includes(searchLower))
    );
  });

  // Calculate status with safe date handling
  const getItemStatus = (item) => {
    if (item.returnedDate) {
      return { 
        status: "Returned", 
        variant: "success",
        icon: <BiCheckCircle size={18} className="me-1" />
      };
    }

    const today = new Date();
    const returnDate = safeParseISO(item.expectedReturnDate);
    
    if (!returnDate) {
      return { 
        status: "No return date", 
        variant: "secondary",
        icon: <BiTime size={18} className="me-1" />
      };
    }

    const daysLeft = differenceInDays(returnDate, today);

    if (daysLeft < 0) {
      return { 
        status: `${Math.abs(daysLeft)} days overdue`, 
        variant: "danger",
        icon: <BiXCircle size={18} className="me-1" />
      };
    } else if (daysLeft <= 3) {
      return { 
        status: `${daysLeft} days left`, 
        variant: "warning",
        icon: <BiTime size={18} className="me-1" />
      };
    } else {
      return { 
        status: `${daysLeft} days left`, 
        variant: "primary",
        icon: <BiCalendar size={18} className="me-1" />
      };
    }
  };

  // Format date safely
  const safeFormatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = safeParseISO(dateString);
    return date ? format(date, "dd MMM yyyy") : "Invalid date";
  };

  // Mark item as returned
  const handleMarkAsReturned = async (item) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const challanToUpdate = challans.find(
        (c) => c.dcNumber === item.challanNumber
      );

      if (!challanToUpdate) {
        throw new Error("Challan not found");
      }

      const updatedItems = challanToUpdate.items.map((i) => {
        if (i.sno === item.sno && i.assetName === item.assetName) {
          return {
            ...i,
            returnedDate: new Date().toISOString().split("T")[0],
            returnNotes: "Marked as returned"
          };
        }
        return i;
      });

      const updatedChallan = {
        ...challanToUpdate,
        items: updatedItems
      };

      await jsonStorage.saveChallan(updatedChallan);
      
      setSuccess(`${item.assetName} marked as returned successfully!`);
      setConfirmReturn(null);
      refreshData();
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
          <BiArrowFromBottom size={28} className="me-3" />
          <div>
            <h3 className="mb-0">Returnable Assets Management</h3>
            <small className="text-white-50">Track and manage all returnable assets</small>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0" style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible className="m-3">
            <div className="d-flex align-items-center">
              <BiXCircle size={20} className="me-2" />
              <span>{error}</span>
            </div>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="m-3">
            <div className="d-flex align-items-center">
              <BiCheckCircle size={20} className="me-2" />
              <span>{success}</span>
            </div>
          </Alert>
        )}

        <Card className="border-0 shadow-sm m-3">
          <Card.Header className="card-header-custom">
            <h5 className="card-title d-flex align-items-center">
              <BiListUl size={20} className="me-2" />
              Returnable Assets Dashboard
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="align-items-center mb-3">
              <Col md={6}>
                <div className="d-flex align-items-center">
                  <h5 className="mb-0 me-3">Pending Returns</h5>
                  <Badge pill bg="primary" className="fs-6">
                    {returnableItems.filter(i => !i.returnedDate).length} items
                  </Badge>
                </div>
              </Col>
              <Col md={6}>
                <Form.Group controlId="searchItems">
                  <InputGroup>
                    <InputGroup.Text>
                      <BiSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by asset, challan, project..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            {filteredItems.length === 0 ? (
              <div className="text-center py-5">
                <BiCheckCircle size={48} className="text-success mb-3" />
                <h4 className="mb-2">No pending returnable items</h4>
                <p className="text-muted">All assets have been returned or no items match your search</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="table-header">
                    <tr>
                      <th>Asset</th>
                      <th>Challan</th>
                      <th>Project</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => {
                      const { status, variant, icon } = getItemStatus(item);
                      const returnDate = safeParseISO(item.expectedReturnDate);
                      const isOverdue = returnDate && isAfter(new Date(), returnDate) && !item.returnedDate;
                      
                      return (
                        <tr key={idx} className={isOverdue ? "table-danger" : ""}>
                          <td>
                            <div className="d-flex align-items-center">
                              <BiPackage size={20} className="me-2 text-primary" />
                              <div>
                                <h6 className="mb-0">{item.assetName}</h6>
                                <small className="text-muted">{item.serialNo}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <BiClipboard size={16} className="me-2 text-muted" />
                              <span>{item.challanNumber}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <BiBuilding size={16} className="me-2 text-muted" />
                              <span>{item.projectName || "N/A"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <BiMapPin size={16} className="me-2 text-muted" />
                              <span>{item.client || "N/A"}</span>
                            </div>
                          </td>
                          <td>
                            <Badge bg={variant} className="d-flex align-items-center">
                              {icon}
                              {status}
                            </Badge>
                          </td>
                          <td>
                            <small className="text-muted">Due:</small>
                            <div>{safeFormatDate(item.expectedReturnDate)}</div>
                          </td>
                          <td className="text-center">
                            {!item.returnedDate && (
                              <Button
                                variant={isOverdue ? "danger" : "primary"}
                                size="sm"
                                onClick={() => setConfirmReturn(item)}
                                disabled={loading}
                              >
                                <BiCheckCircle className="me-1" />
                                Return
                              </Button>
                            )}
                            {item.returnedDate && (
                              <Badge bg="success" className="px-2">
                                <BiCheckCircle className="me-1" />
                                Returned
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Confirmation Modal */}
        <Modal
          show={!!confirmReturn}
          onHide={() => setConfirmReturn(null)}
          centered
          backdrop="static"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>Confirm Asset Return</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center mb-4">
              <BiCheckCircle size={48} className="text-primary mb-3" />
              <h5>Confirm Return Completion</h5>
            </div>
            
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0 d-flex align-items-center">
                  <BiInfoCircle className="me-2" />
                  Asset Details
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Asset:</strong>
                    <span>{confirmReturn?.assetName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Challan:</strong>
                    <span>{confirmReturn?.challanNumber}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Expected Return:</strong>
                    <span>
                      {safeFormatDate(confirmReturn?.expectedReturnDate)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <strong>Status:</strong>
                    <Badge bg={
                      confirmReturn?.returnedDate ? "success" : 
                      isAfter(new Date(), safeParseISO(confirmReturn?.expectedReturnDate)) ? "danger" : "warning"
                    }>
                      {confirmReturn?.returnedDate ? "Returned" : 
                      isAfter(new Date(), safeParseISO(confirmReturn?.expectedReturnDate)) ? "Overdue" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            <p className="text-center text-muted">
              Are you sure this asset has been physically returned?
            </p>
          </Modal.Body>
          <Modal.Footer className="justify-content-center">
            <Button
              variant="secondary"
              onClick={() => setConfirmReturn(null)}
              className="me-3"
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
      
      <Modal.Footer className="d-flex justify-content-between border-top">
        <div className="d-flex flex-wrap gap-2">
          <Badge bg="success" className="d-flex align-items-center px-3 py-2">
            <BiCheckCircle size={16} className="me-2" /> Returned
          </Badge>
          <Badge bg="primary" className="d-flex align-items-center px-3 py-2">
            <BiCalendar size={16} className="me-2" /> Pending
          </Badge>
          <Badge bg="warning" className="d-flex align-items-center px-3 py-2">
            <BiTime size={16} className="me-2" /> Due Soon
          </Badge>
          <Badge bg="danger" className="d-flex align-items-center px-3 py-2">
            <BiXCircle size={16} className="me-2" /> Overdue
          </Badge>
          <Badge bg="secondary" className="d-flex align-items-center px-3 py-2">
            <BiTime size={16} className="me-2" /> No Date
          </Badge>
        </div>
        <Button variant="outline-primary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReturnableItemsModal;