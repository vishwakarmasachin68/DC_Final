import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Badge,
  Alert,
  Row,
  Col,
  Spinner,
  Form,
  InputGroup,
  Card,
  Table,
  Accordion,
} from "react-bootstrap";
import { format, differenceInDays, parseISO, isAfter, isValid } from "date-fns";
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
  BiInfoCircle,
} from "react-icons/bi";
// import { getChallans } from "../services/api";

const ReturnableItemsModal = ({ show, onHide, challans, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmReturn, setConfirmReturn] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [returnableItems, setReturnableItems] = useState([]);
  const [expandedChallans, setExpandedChallans] = useState({});

  const safeParseISO = (dateString) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return isValid(date) ? date : null;
    } catch (e) {
      return null;
    }
  };

  const groupItemsByChallan = (items) => {
    const grouped = {};
    items.forEach((item) => {
      if (!grouped[item.challanNumber]) {
        grouped[item.challanNumber] = {
          challan: {
            dcNumber: item.challanNumber,
            date: item.challanDate,
            client: item.client,
            location: item.location,
            projectName: item.projectName,
          },
          items: [],
        };
      }
      grouped[item.challanNumber].items.push(item);
    });
    return grouped;
  };

  const getReturnableItems = () => {
    const items = [];
    challans.forEach((challan) => {
      challan.items
        .filter((item) => item.returnable === "yes")
        .forEach((item) => {
          items.push({
            ...item,
            challanNumber: challan.dc_number,
            challanDate: challan.date,
            client: challan.client,
            location: challan.location,
            projectName: challan.project_name,
          });
        });
    });
    return items;
  };

  useEffect(() => {
    if (show) {
      const items = getReturnableItems();
      setReturnableItems(items);
      const initialExpandedState = {};
      Object.keys(groupItemsByChallan(items)).forEach((dcNumber) => {
        initialExpandedState[dcNumber] = false;
      });
      setExpandedChallans(initialExpandedState);
    }
  }, [challans, show]);

  const toggleChallanExpansion = (dcNumber) => {
    setExpandedChallans((prev) => ({
      ...prev,
      [dcNumber]: !prev[dcNumber],
    }));
  };

  const filteredItems = returnableItems.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.asset_name.toLowerCase().includes(searchLower) ||
      (item.challanNumber &&
        item.challanNumber.toLowerCase().includes(searchLower)) ||
      (item.projectName &&
        item.projectName.toLowerCase().includes(searchLower)) ||
      (item.client && item.client.toLowerCase().includes(searchLower)) ||
      (item.location && item.location.toLowerCase().includes(searchLower)) ||
      (item.serial_no && item.serial_no.toLowerCase().includes(searchLower))
    );
  });

  const getItemStatus = (item) => {
    if (item.returned_date) {
      return {
        status: "Returned",
        variant: "success",
        icon: <BiCheckCircle size={18} className="me-1" />,
      };
    }

    const today = new Date();
    const returnDate = safeParseISO(item.expected_return_date);

    if (!returnDate) {
      return {
        status: "No return date",
        variant: "secondary",
        icon: <BiTime size={18} className="me-1" />,
      };
    }

    const daysLeft = differenceInDays(returnDate, today);

    if (daysLeft < 0) {
      return {
        status: `${Math.abs(daysLeft)} days overdue`,
        variant: "danger",
        icon: <BiXCircle size={18} className="me-1" />,
      };
    } else if (daysLeft <= 3) {
      return {
        status: `${daysLeft} days left`,
        variant: "warning",
        icon: <BiTime size={18} className="me-1" />,
      };
    } else {
      return {
        status: `${daysLeft} days left`,
        variant: "primary",
        icon: <BiCalendar size={18} className="me-1" />,
      };
    }
  };

  const safeFormatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = safeParseISO(dateString);
    return date ? format(date, "dd MMM yyyy") : "Invalid date";
  };

  const handleMarkAsReturned = async (item) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, you would call an API endpoint to update the item
      // For now, we'll just refresh the data
      await refreshData();
      setSuccess(`${item.asset_name} marked as returned successfully!`);
      setConfirmReturn(null);
    } catch (err) {
      console.error("Failed to mark item as returned:", err);
      setError(err.message || "Failed to update item status");
    } finally {
      setLoading(false);
    }
  };

  const calculateChallanSummary = (items) => {
    const totalItems = items.length;
    const returnedItems = items.filter((i) => i.returned_date).length;
    const pendingItems = totalItems - returnedItems;

    const overdueItems = items.filter((item) => {
      if (item.returned_date) return false;
      const returnDate = safeParseISO(item.expected_return_date);
      return returnDate && isAfter(new Date(), returnDate);
    }).length;

    const dueSoonItems = items.filter((item) => {
      if (item.returned_date) return false;
      const returnDate = safeParseISO(item.expected_return_date);
      if (!returnDate) return false;
      const daysLeft = differenceInDays(returnDate, new Date());
      return daysLeft > 0 && daysLeft <= 3;
    }).length;

    return {
      totalItems,
      returnedItems,
      pendingItems,
      overdueItems,
      dueSoonItems,
    };
  };

  const groupedItems = groupItemsByChallan(filteredItems);

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
            <small className="text-white-50">
              Track and manage all returnable assets
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        className="p-0"
        style={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            dismissible
            className="m-3"
          >
            <div className="d-flex align-items-center">
              <BiXCircle size={20} className="me-2" />
              <span>{error}</span>
            </div>
          </Alert>
        )}

        {success && (
          <Alert
            variant="success"
            onClose={() => setSuccess(null)}
            dismissible
            className="m-3"
          >
            <div className="d-flex align-items-center">
              <BiCheckCircle size={20} className="me-2" />
              <span>{success}</span>
            </div>
          </Alert>
        )}

        <Card className="border-0 shadow-sm m-3">
          <Card.Header className="card-header-custom text-white">
            <Row className="align-items-center">
              <Col md={6}>
                <h5 className="card-title d-flex align-items-center mb-0">
                  <BiListUl size={20} className="me-2" />
                  Returnable Assets Dashboard
                </h5>
              </Col>
              <Col md={6}>
                <Form.Group controlId="searchItems">
                  <InputGroup>
                    <InputGroup.Text>
                      <BiSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by serial no, asset, challan, project..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body>
            {Object.keys(groupedItems).length === 0 ? (
              <div className="text-center py-5">
                <BiCheckCircle size={48} className="text-success mb-3" />
                <h4 className="mb-2">No pending returnable items</h4>
                <p className="text-muted">
                  All assets have been returned or no items match your search
                </p>
              </div>
            ) : (
              <Accordion flush>
                {Object.entries(groupedItems).map(([dcNumber, challanData]) => {
                  const summary = calculateChallanSummary(challanData.items);
                  const isExpanded = expandedChallans[dcNumber];

                  return (
                    <Accordion.Item
                      key={dcNumber}
                      eventKey={dcNumber}
                      className="mb-3 border rounded-3"
                    >
                      <Accordion.Header
                        onClick={() => toggleChallanExpansion(dcNumber)}
                        className="p-3"
                      >
                        <Row className="w-100 align-items-center">
                          <Col md={4}>
                            <div className="d-flex align-items-center">
                              <BiClipboard
                                size={20}
                                className="me-2 text-primary"
                              />
                              <div>
                                <h6 className="mb-0">{dcNumber}</h6>
                                <small className="text-muted">
                                  {safeFormatDate(challanData.challan.date)}
                                </small>
                              </div>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div className="d-flex align-items-center">
                              <BiBuilding
                                size={16}
                                className="me-2 text-muted"
                              />
                              <span>
                                {challanData.challan.projectName || "N/A"}
                              </span>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div className="d-flex align-items-center">
                              <BiMapPin size={16} className="me-2 text-muted" />
                              <span>
                                {challanData.challan.location || "N/A"}
                              </span>
                            </div>
                          </Col>
                          <Col md={2} className="text-end">
                            <div className="d-flex align-items-center justify-content-end">
                              <Badge
                                bg={
                                  summary.overdueItems > 0
                                    ? "danger"
                                    : summary.dueSoonItems > 0
                                    ? "warning"
                                    : "primary"
                                }
                                className="me-2"
                              >
                                {summary.pendingItems}/{summary.totalItems}{" "}
                                pending
                              </Badge>
                            </div>
                          </Col>
                        </Row>
                      </Accordion.Header>
                      <Accordion.Body className="p-0">
                        <Table striped bordered hover className="mb-0">
                          <thead className="table-header">
                            <tr>
                              <th>Asset</th>
                              <th>Serial No</th>
                              <th>Status</th>
                              <th>Due Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {challanData.items.map((item, idx) => {
                              const { status, variant, icon } =
                                getItemStatus(item);
                              const returnDate = safeParseISO(
                                item.expected_return_date
                              );
                              const isOverdue =
                                returnDate &&
                                isAfter(new Date(), returnDate) &&
                                !item.returned_date;

                              return (
                                <tr
                                  key={idx}
                                  className={isOverdue ? "table-danger" : ""}
                                >
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <BiPackage
                                        size={20}
                                        className="me-2 text-primary"
                                      />
                                      <div>
                                        <h6 className="mb-0">
                                          {item.asset_name}
                                        </h6>
                                        <small className="text-muted">
                                          {item.description}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{item.serial_no || "N/A"}</td>
                                  <td>
                                    <Badge
                                      bg={variant}
                                      className="d-flex align-items-center"
                                    >
                                      {icon}
                                      {status}
                                    </Badge>
                                  </td>
                                  <td>
                                    {safeFormatDate(item.expected_return_date)}
                                  </td>
                                  <td className="text-center">
                                    {!item.returned_date && (
                                      <Button
                                        variant={
                                          isOverdue ? "danger" : undefined
                                        }
                                        style={
                                          !isOverdue
                                            ? {
                                                backgroundColor: "#0e787b",
                                                borderColor: "#0e7b2fff",
                                              }
                                            : {}
                                        }
                                        size="sm"
                                        onClick={() => setConfirmReturn(item)}
                                        disabled={loading}
                                      >
                                        <BiCheckCircle className="me-1" />
                                        Mark Returned
                                      </Button>
                                    )}
                                    {item.returned_date && (
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
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            )}
          </Card.Body>
        </Card>

        <Modal
          show={!!confirmReturn}
          onHide={() => setConfirmReturn(null)}
          centered
          backdrop="static"
        >
          <Modal.Header closeButton className="card-header-custom text-white">
            <Modal.Title>Confirm Asset Return</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center mb-4">
              <BiCheckCircle size={48} className="text-primary mb-3" />
              <h5>Confirm Return Completion</h5>
            </div>

            <Card className="mb-4">
              <Card.Header className="card-header-custom text-white">
                <h6 className="mb-0 d-flex align-items-center">
                  <BiInfoCircle className="me-2" />
                  Asset Details
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Asset:</strong>
                    <span>{confirmReturn?.asset_name}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Serial No:</strong>
                    <span>{confirmReturn?.serial_no || "N/A"}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Challan:</strong>
                    <span>{confirmReturn?.challanNumber}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Expected Return:</strong>
                    <span>
                      {safeFormatDate(confirmReturn?.expected_return_date)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <strong>Status:</strong>
                    <Badge
                      bg={
                        confirmReturn?.returned_date
                          ? "success"
                          : isAfter(
                              new Date(),
                              safeParseISO(confirmReturn?.expected_return_date)
                            )
                          ? "danger"
                          : "warning"
                      }
                    >
                      {confirmReturn?.returned_date
                        ? "Returned"
                        : isAfter(
                            new Date(),
                            safeParseISO(confirmReturn?.expected_return_date)
                          )
                        ? "Overdue"
                        : "Pending"}
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
              onClick={() => handleMarkAsReturned(confirmReturn)}
              disabled={loading}
              style={{ backgroundColor: "#0e787b", borderColor: "#0e787b" }}
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
        </div>
        <Button variant="outline-primary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReturnableItemsModal;
