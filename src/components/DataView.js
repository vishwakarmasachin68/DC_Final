import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Container,
  Badge,
  Row,
  Col,
  Dropdown,
  Button,
  Accordion,
  Spinner,
  InputGroup,
  Form,
  Alert,
  ListGroup,
  Modal,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import {
  BiBarChartAlt2,
  BiPieChartAlt,
  BiFilterAlt,
  BiCalendar,
  BiTrash,
  BiSearch,
  BiArrowFromBottom,
  BiDownload,
  BiBell,
  BiError,
  BiTime,
  BiEdit,
} from "react-icons/bi";
import Chart from "react-apexcharts";
import { getChallans, deleteChallan, getProjects, updateChallan } from "../services/api";
import ReturnableItemsModal from "./ReturnableItemsModal";
import { generateDoc } from "../services/docGenerator";
import { differenceInDays, parseISO, isAfter, isValid } from "date-fns";
import EditChallanModal from "./EditChallanModal";

const DataView = () => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [timeRange, setTimeRange] = useState("all");
  const [chartData, setChartData] = useState({
    items: [],
    returnStatus: [],
  });
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [challans, setChallans] = useState([]);
  const [originalChallans, setOriginalChallans] = useState([]); // To maintain original order
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReturnableModal, setShowReturnableModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notificationItems, setNotificationItems] = useState({
    overdue: [],
    dueSoon: [],
  });
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const safeParseISO = (dateString) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return isValid(date) ? date : null;
    } catch (e) {
      return null;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedChallans, loadedProjects] = await Promise.all([
        getChallans(),
        getProjects(),
      ]);

      // Sort challans by dc_sequence to maintain order
      const sortedChallans = [...loadedChallans].sort((a, b) => {
        return a.dc_sequence - b.dc_sequence;
      });

      setChallans(sortedChallans);
      setOriginalChallans(sortedChallans); // Store original order
      setProjects(loadedProjects);

      if (sortedChallans.length > 0) {
        const currentChallan = selectedChallan
          ? sortedChallans.find((c) => c.id === selectedChallan.id)
          : null;

        setSelectedChallan(currentChallan || sortedChallans[0]);

        if (currentChallan || sortedChallans[0]) {
          const project = loadedProjects.find(
            (p) =>
              p.project_name ===
              (currentChallan || sortedChallans[0]).project_name
          );
          setSelectedProject(project || null);
        }
      } else {
        setSelectedChallan(null);
        setSelectedProject(null);
      }

      checkReturnableItems(sortedChallans);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  };

  const handleSaveChallan = async (updatedChallan) => {
    try {
      setLoading(true);
      await updateChallan(selectedChallan.id, updatedChallan);
      
      // Update the challan in the list while maintaining original order
      const updatedChallans = originalChallans.map(challan => 
        challan.id === selectedChallan.id ? updatedChallan : challan
      );
      
      setChallans(updatedChallans);
      setOriginalChallans(updatedChallans);
      setSelectedChallan(updatedChallan);
      
      setLoading(false);
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to update challan:", err);
      setError("Failed to update challan. Please try again.");
      setLoading(false);
    }
  };

  const checkReturnableItems = (allChallans) => {
    const today = new Date();
    const overdueItems = [];
    const dueSoonItems = [];

    allChallans.forEach((challan) => {
      challan.items
        .filter((item) => item.returnable === "yes" && !item.returned_date)
        .forEach((item) => {
          const returnDate = safeParseISO(item.expected_return_date);
          if (!returnDate) return;

          const daysLeft = differenceInDays(returnDate, today);

          if (daysLeft < 0) {
            overdueItems.push({
              ...item,
              challanNumber: challan.dc_number,
              daysOverdue: Math.abs(daysLeft),
            });
          } else if (daysLeft <= 3) {
            dueSoonItems.push({
              ...item,
              challanNumber: challan.dc_number,
              daysLeft,
            });
          }
        });
    });

    if (overdueItems.length > 0 || dueSoonItems.length > 0) {
      setNotificationItems({
        overdue: overdueItems,
        dueSoon: dueSoonItems,
      });
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedChallans = [...challans].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChallan) {
      const project = projects.find(
        (p) => p.project_name === selectedChallan.project_name
      );
      setSelectedProject(project || null);

      if (selectedChallan.items && selectedChallan.items.length > 0) {
        const itemsData = selectedChallan.items.map((item) => ({
          name: item.asset_name || "Unnamed Asset",
          quantity: item.quantity,
        }));

        const returnableCount = selectedChallan.items.filter(
          (item) => item.returnable === "yes"
        ).length;
        const nonReturnableCount =
          selectedChallan.items.length - returnableCount;

        setChartData({
          items: itemsData,
          returnStatus: [
            { name: "Returnable", value: returnableCount },
            { name: "Non-Returnable", value: nonReturnableCount },
          ],
        });
      }
    }
  }, [selectedChallan, projects]);

  const filteredChallans = sortedChallans.filter((challan) => {
    const matchesSearch =
      challan.dc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.project_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const challanDate = new Date(challan.date);
    const now = new Date();

    let matchesTimeRange = true;
    if (timeRange === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      matchesTimeRange = challanDate >= startOfMonth;
    } else if (timeRange === "week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      matchesTimeRange = challanDate >= startOfWeek;
    }

    return matchesSearch && matchesTimeRange;
  });

  const handleDeleteChallan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this challan?"))
      return;

    try {
      setLoading(true);
      await deleteChallan(id);
      await loadData();
      setLoading(false);
    } catch (err) {
      console.error("Failed to delete challan:", err);
      setError("Failed to delete challan. Please try again.");
      setLoading(false);
    }
  };

  const handleDownloadChallan = async (challan) => {
    try {
      setDownloading(true);

      const challanData = {
        dc_number: challan.dc_number,
        dc_sequence: challan.dc_sequence,
        date: challan.date,
        name: challan.name,
        project_id: challan.project_id,
        project_name: challan.project_name,
        client: challan.client,
        location: challan.location,
        has_po: challan.has_po,
        po_number: challan.po_number,
        items: challan.items.map((item) => ({
          sno: item.sno,
          asset_name: item.asset_name,
          description: item.description,
          quantity: item.quantity,
          serial_no: item.serial_no,
          returnable: item.returnable,
          expected_return_date: item.expected_return_date,
          returned_date: item.returned_date,
        })),
        dcNumber: challan.dc_number,
      };

      await generateDoc(challanData);
      setDownloading(false);
      setShowDownloadModal(false);
    } catch (err) {
      console.error("Failed to download challan:", err);
      setError("Failed to download challan. Please try again.");
      setDownloading(false);
    }
  };

  const barChartOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: chartData.items.map((item) => item.name),
      labels: { style: { fontSize: "12px" } },
    },
    yaxis: { title: { text: "Quantity" } },
    fill: { opacity: 1 },
    colors: ["#4361ee", "#3a0ca3", "#4895ef"],
    tooltip: {
      y: { formatter: (val) => `${val} units` },
    },
  };

  const pieChartOptions = {
    chart: {
      type: "donut",
      height: 350,
      toolbar: { show: false },
    },
    labels: chartData.returnStatus.map((item) => item.name),
    colors: ["#4cc9f0", "#f72585"],
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { width: 300 } },
      },
    ],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <ToastContainer className="custom-toast-container">
        <Toast
          show={showNotification}
          onClose={() => setShowNotification(false)}
          delay={6000}
          autohide
          className="border-0 shadow"
        >
          <Toast.Header className="card-header-custom text-white">
            <strong className="me-auto d-flex align-items-center">
              <BiBell className="me-2" /> Returnable Items Alert
            </strong>
          </Toast.Header>
          <Toast.Body>
            {notificationItems.overdue.length > 0 && (
              <div className="mb-2">
                <h6 className="d-flex align-items-center text-danger">
                  <BiError className="me-2" /> Overdue Items
                </h6>
                <ul className="small">
                  {notificationItems.overdue.slice(0, 3).map((item, index) => (
                    <li key={`overdue-${index}`}>
                      {item.asset_name} (Challan: {item.challanNumber}) -{" "}
                      {item.daysOverdue} days overdue
                    </li>
                  ))}
                  {notificationItems.overdue.length > 3 && (
                    <li>...and {notificationItems.overdue.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
            {notificationItems.dueSoon.length > 0 && (
              <div>
                <h6 className="d-flex align-items-center text-warning">
                  <BiTime className="me-2" /> Due Soon Items
                </h6>
                <ul className="small">
                  {notificationItems.dueSoon.slice(0, 3).map((item, index) => (
                    <li key={`duesoon-${index}`}>
                      {item.asset_name} (Challan: {item.challanNumber}) - due in{" "}
                      {item.daysLeft} days
                    </li>
                  ))}
                  {notificationItems.dueSoon.length > 3 && (
                    <li>...and {notificationItems.dueSoon.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
            <div className="mt-2 text-center">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setShowReturnableModal(true);
                  setShowNotification(false);
                }}
                style={{ backgroundColor: "#0e787b", borderColor: "#ffffffff" }}
              >
                View All Returnable Items
              </Button>
            </div>
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <h2 className="mb-0">
            <BiBarChartAlt2 className="me-2" />
            Challan Analytics Dashboard
          </h2>
        </Col>
        
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <BiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search challans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex justify-content-end gap-3">
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary">
                  <BiFilterAlt className="me-1" /> Filter:{" "}
                  {timeRange === "all"
                    ? "All Time"
                    : timeRange === "month"
                    ? "This Month"
                    : "This Week"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    active={timeRange === "all"}
                    onClick={() => setTimeRange("all")}
                  >
                    All Time
                  </Dropdown.Item>
                  <Dropdown.Item
                    active={timeRange === "month"}
                    onClick={() => setTimeRange("month")}
                  >
                    This Month
                  </Dropdown.Item>
                  <Dropdown.Item
                    active={timeRange === "week"}
                    onClick={() => setTimeRange("week")}
                  >
                    This Week
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Button
                onClick={() => setShowReturnableModal(true)}
                className="d-flex align-items-center"
                style={{ backgroundColor: "#0e787b", borderColor: "#0e787b" }}
              >
                <BiArrowFromBottom className="me-1" /> Track Returnable Items
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filteredChallans.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h5 className="text-muted">No challans found</h5>
            <p>Generate some challans to see them here</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Generated Challans</h5>
                  <Badge bg="light" text="dark" pill>
                    {filteredChallans.length} items
                  </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                    <Accordion defaultActiveKey="0" flush>
                      {filteredChallans.map((challan, index) => (
                        <Accordion.Item
                          key={index}
                          eventKey={index.toString()}
                          onClick={() => setSelectedChallan(challan)}
                          active={selectedChallan?.id === challan.id}
                        >
                          <Accordion.Header>
                            <div className="d-flex justify-content-between w-100">
                              <span className="fw-bold">
                                {challan.dc_number}
                              </span>
                              <span className="text-muted small">
                                {formatDate(challan.date)}
                              </span>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body className="p-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div>
                                  <strong>Project:</strong>{" "}
                                  {challan.project_name || "-"}
                                </div>
                                <div>
                                  <strong>Client:</strong>{" "}
                                  {challan.client || "-"}
                                </div>
                                <div>
                                  <strong>Location:</strong>{" "}
                                  {challan.location || "-"}
                                </div>
                                <div>
                                  <strong>Items:</strong>{" "}
                                  {challan.items?.length || 0}
                                </div>
                              </div>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChallan(challan);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <BiEdit size={16} />
                                </Button>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChallan(challan);
                                    setShowDownloadModal(true);
                                  }}
                                >
                                  <BiDownload size={16} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChallan(challan.id);
                                  }}
                                >
                                  <BiTrash size={16} />
                                </Button>
                              </div>
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={8}>
              {selectedChallan ? (
                <>
                  <Row className="mb-4">
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Header className="bg-light">
                          <h5 className="mb-0">Summary</h5>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6} className="mb-3">
                              <Card className="h-100">
                                <Card.Body className="text-center">
                                  <h6 className="text-muted">Total Challans</h6>
                                  <h3>{filteredChallans.length}</h3>
                                  <Badge bg="info">Saved</Badge>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Card className="h-100">
                                <Card.Body className="text-center">
                                  <h6 className="text-muted">Total Items</h6>
                                  <h3>
                                    {filteredChallans.reduce(
                                      (sum, c) => sum + (c.items?.length || 0),
                                      0
                                    )}
                                  </h3>
                                  <Badge bg="success">All Saved</Badge>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={12}>
                              <Card>
                                <Card.Header className="bg-light">
                                  <h5 className="mb-0">
                                    <BiBarChartAlt2 className="me-2" />
                                    Items Quantity Distribution
                                  </h5>
                                </Card.Header>
                                <Card.Body>
                                  <Chart
                                    options={barChartOptions}
                                    series={[
                                      {
                                        name: "Quantity",
                                        data: chartData.items.map(
                                          (item) => item.quantity
                                        ),
                                      },
                                    ]}
                                    type="bar"
                                    height={300}
                                  />
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Header className="bg-light">
                          <h5 className="mb-0">Return Status</h5>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6} className="mb-3">
                              <Card className="h-100">
                                <Card.Body className="text-center">
                                  <h6 className="text-muted">
                                    Returnable Items
                                  </h6>
                                  <h3>
                                    {filteredChallans.reduce(
                                      (sum, c) =>
                                        sum +
                                        (c.items?.filter(
                                          (item) => item.returnable === "yes"
                                        ).length || 0),
                                      0
                                    )}
                                  </h3>
                                  <Badge bg="warning">Returnable</Badge>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Card className="h-100">
                                <Card.Body className="text-center">
                                  <h6 className="text-muted">
                                    Non Returnable Items
                                  </h6>
                                  <h3>
                                    {filteredChallans.reduce(
                                      (sum, c) =>
                                        sum +
                                        (c.items?.filter(
                                          (item) => item.returnable !== "yes"
                                        ).length || 0),
                                      0
                                    )}
                                  </h3>
                                  <Badge bg="danger">Non Returnable</Badge>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={12}>
                              <Card>
                                <Card.Header className="bg-light">
                                  <h5 className="mb-0">
                                    <BiPieChartAlt className="me-2" />
                                    Return Status
                                  </h5>
                                </Card.Header>
                                <Card.Body>
                                  <Chart
                                    options={pieChartOptions}
                                    series={chartData.returnStatus.map(
                                      (item) => item.value
                                    )}
                                    type="donut"
                                    height={300}
                                  />
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                      <h5 className="mb-0">Challan Details</h5>
                      <Badge bg="light" text="dark">
                        <BiCalendar className="me-1" />
                        {formatDate(selectedChallan.date) || "No date set"}
                      </Badge>
                    </Card.Header>
                    <Card.Body>
                      <Row className="mb-4">
                        <Col md={3}>
                          <div className="mb-3">
                            <h6 className="text-muted">DC Number</h6>
                            <p className="fw-bold">
                              {selectedChallan.dc_number || "-"}
                            </p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-3">
                            <h6 className="text-muted">Project</h6>
                            <p className="fw-bold">
                              {selectedChallan.project_name || "-"}
                            </p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-3">
                            <h6 className="text-muted">Prepared By</h6>
                            <p className="fw-bold">
                              {selectedChallan.name || "-"}
                            </p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-3">
                            <h6 className="text-muted">Client</h6>
                            <p className="fw-bold">
                              {selectedChallan.client || "-"}
                            </p>
                          </div>
                        </Col>
                      </Row>
                      <Row className="mb-4">
                        <Col md={3}>
                          <div className="mb-3">
                            <h6 className="text-muted">Location</h6>
                            <p className="fw-bold">
                              {selectedChallan.location || "-"}
                            </p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-3">
                            <h6 className="text-muted">PO Number</h6>
                            <p className="fw-bold">
                              {selectedChallan.po_number || "-"}
                            </p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-3">
                            <h6 className="text-muted">Returnable Items</h6>
                            <p className="fw-bold">
                              {selectedChallan.items?.filter(
                                (item) => item.returnable === "yes"
                              ).length || 0}
                            </p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-3">
                            <h6 className="text-muted">Non-Returnable Items</h6>
                            <p className="fw-bold">
                              {selectedChallan.items?.filter(
                                (item) => item.returnable !== "yes"
                              ).length || 0}
                            </p>
                          </div>
                        </Col>
                      </Row>
                      <Row className="mb-4">
                        <Col md={6}>
                          <div className="mb-3">
                            <h6 className="text-muted">
                              Project Lead / Person who is visiting
                            </h6>
                            <p className="fw-bold">
                              {selectedProject?.field_supervisor ||
                                "Not specified"}
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <h6 className="text-muted">Project Details</h6>
                            <p className="fw-bold">
                              {selectedProject?.project_details ||
                                "No details provided"}
                            </p>
                          </div>
                        </Col>
                      </Row>

                      {selectedProject?.persons_involved && (
                        <Row className="mb-4">
                          <Col>
                            <Card>
                              <Card.Header className="bg-light">
                                <h6 className="mb-0">Team Members</h6>
                              </Card.Header>
                              <Card.Body>
                                <Row>
                                  {JSON.parse(
                                    selectedProject.persons_involved
                                  ).map((person, index) => (
                                    <Col md={4} key={index} className="mb-2">
                                      <Badge
                                        bg="light"
                                        text="dark"
                                        className="w-100 text-start p-2"
                                      >
                                        {person || `Team member ${index + 1}`}
                                      </Badge>
                                    </Col>
                                  ))}
                                </Row>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      )}

                      {selectedChallan.items?.length > 0 ? (
                        <div className="table-responsive">
                          <Table striped bordered hover>
                            <thead className="table-light">
                              <tr>
                                <th width="5%">#</th>
                                <th width="20%">Asset Name</th>
                                <th width="25%">Description</th>
                                <th width="10%">Qty</th>
                                <th width="15%">Serial No</th>
                                <th width="10%">Returnable</th>
                                <th width="15%">Return Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedChallan.items.map((item, index) => (
                                <tr key={index}>
                                  <td className="text-center">
                                    {item.sno || index + 1}
                                  </td>
                                  <td>
                                    {item.asset_name || (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                  <td>
                                    {item.description || (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {item.quantity}
                                  </td>
                                  <td>
                                    {item.serial_no || (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    <Badge
                                      bg={
                                        item.returnable === "yes"
                                          ? "success"
                                          : "secondary"
                                      }
                                    >
                                      {item.returnable === "yes" ? "Yes" : "No"}
                                    </Badge>
                                  </td>
                                  <td>
                                    {item.returnable === "yes" ? (
                                      formatDate(item.expected_return_date) || (
                                        <span className="text-muted">-</span>
                                      )
                                    ) : (
                                      <Badge bg="secondary">N/A</Badge>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">No items in this challan</p>
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer className="text-muted text-center">
                      Generated on {formatDate(selectedChallan.date)}
                    </Card.Footer>
                  </Card>
                </>
              ) : (
                <Card className="text-center py-5">
                  <Card.Body>
                    <h5 className="text-muted">No challan selected</h5>
                    <p>Select a challan from the list to view details</p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </>
      )}

      <Modal
        show={showDownloadModal}
        onHide={() => setShowDownloadModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Download Challan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to download the challan{" "}
          {selectedChallan?.dc_number}?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDownloadModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDownloadChallan(selectedChallan)}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Downloading...
              </>
            ) : (
              "Download"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <ReturnableItemsModal
        show={showReturnableModal}
        onHide={() => setShowReturnableModal(false)}
        challans={filteredChallans}
      />
      
      <EditChallanModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        challan={selectedChallan}
        projects={projects}
        onSave={handleSaveChallan}
        loading={loading}
      />
    </Container>
  );
};

export default DataView;