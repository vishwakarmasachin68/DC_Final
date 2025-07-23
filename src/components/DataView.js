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
} from "react-icons/bi";
import Chart from "react-apexcharts";
import jsonStorage from "../services/jsonStorage";
import ReturnableItemsModal from "./ReturnableItemsModal";
import { generateDoc } from "../services/docGenerator";

const DataView = ({ challans: initialChallans }) => {
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
  const [challans, setChallans] = useState(initialChallans || []);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReturnableModal, setShowReturnableModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const loadedChallans = await jsonStorage.getChallans();
      const loadedProjects = await jsonStorage.getProjects();

      setChallans(loadedChallans);
      setProjects(loadedProjects);

      if (loadedChallans.length > 0) {
        const currentChallan = selectedChallan
          ? loadedChallans.find((c) => c.dcNumber === selectedChallan.dcNumber)
          : null;

        setSelectedChallan(currentChallan || loadedChallans[0]);

        const project = loadedProjects.find(
          (p) =>
            p.projectName === (currentChallan || loadedChallans[0]).projectName
        );
        setSelectedProject(project || null);
      } else {
        setSelectedChallan(null);
        setSelectedProject(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChallan) {
      const project = projects.find(
        (p) => p.projectName === selectedChallan.projectName
      );
      setSelectedProject(project || null);

      if (selectedChallan.items && selectedChallan.items.length > 0) {
        const itemsData = selectedChallan.items.map((item) => ({
          name: item.assetName || "Unnamed Asset",
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

  const filteredChallans = challans.filter((challan) => {
    const matchesSearch =
      challan.dcNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.projectName?.toLowerCase().includes(searchTerm.toLowerCase());

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

  const handleDeleteChallan = async (dcNumber) => {
    if (!window.confirm("Are you sure you want to delete this challan?"))
      return;

    try {
      setLoading(true);
      await jsonStorage.deleteChallan(dcNumber);
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
      await generateDoc(challan);
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

      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <h2 className="mb-0">
            <BiBarChartAlt2 className="me-2" />
            Challan Analytics Dashboard
          </h2>
        </Col>
      </Row>

      {/* Search and Filter */}
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
                <Dropdown.Toggle variant="outline-secondary">
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
                variant="primary"
                onClick={() => setShowReturnableModal(true)}
                className="d-flex align-items-center"
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
          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={4}>
              <Card>
                <Card.Body>
                  <h6 className="text-muted">Total Challans</h6>
                  <h3>{filteredChallans.length}</h3>
                  <Badge bg="info">Saved</Badge>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
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
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Row>
                    <Col>
                      <h6 className="text-muted">Returnable Items</h6>
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
                    </Col>
                    <Col>
                      <h6 className="text-muted">Non Returnable Items</h6>
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
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Content */}
          <Row>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
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
                          active={
                            selectedChallan?.dcNumber === challan.dcNumber
                          }
                        >
                          <Accordion.Header>
                            <div className="d-flex justify-content-between w-100">
                              <span className="fw-bold">
                                {challan.dcNumber}
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
                                  {challan.projectName || "-"}
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
                                    setShowDownloadModal(true);
                                  }}
                                  className="me-1"
                                >
                                  <BiDownload size={16} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChallan(challan.dcNumber);
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
                  {/* Charts */}
                  {selectedChallan.items?.length > 0 && (
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <h5>
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
                              height={350}
                            />
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <h5>
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
                              height={350}
                            />
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}

                  {/* Challan Details */}
                  <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Challan Details</h5>
                      <Badge bg="light" text="dark">
                        <BiCalendar className="me-1" />
                        {formatDate(selectedChallan.date) || "No date set"}
                      </Badge>
                    </Card.Header>
                    <Card.Body>
                      <Row className="mb-4">
                        <Col md={3}>
                          <div>
                            <h6>DC Number</h6>
                            <p>{selectedChallan.dcNumber || "-"}</p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>Project</h6>
                            <p>{selectedChallan.projectName || "-"}</p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>Prepared By</h6>
                            <p>{selectedChallan.name || "-"}</p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>Client</h6>
                            <p>{selectedChallan.client || "-"}</p>
                          </div>
                        </Col>
                      </Row>
                      <Row className="mb-4">
                        <Col md={3}>
                          <div>
                            <h6>Location</h6>
                            <p>{selectedChallan.location || "-"}</p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>PO Number</h6>
                            <p>
                              {selectedChallan.poNumber || selectedChallan.data}
                            </p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>Returnable Items</h6>
                            <p>
                              {selectedChallan.items?.filter(
                                (item) => item.returnable === "yes"
                              ).length || 0}
                            </p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>Non-Returnable Items</h6>
                            <p>
                              {selectedChallan.items?.filter(
                                (item) => item.returnable !== "yes"
                              ).length || 0}
                            </p>
                          </div>
                        </Col>
                      </Row>
                      <Row className="mb-4">
                        <Col md={3}>
                          <h6>Project Lead / Person who is visiting</h6>
                          <p>
                            {selectedProject?.fieldSupervisor ||
                              "Not specified"}
                          </p>
                        </Col>

                        <Col md={6}>
                          <h6>Project Details</h6>
                          <p>
                            {selectedProject?.projectDetails ||
                              "No details provided"}
                          </p>
                        </Col>
                      </Row>
                      <Row className="mb-4">
                        {/* Project Details Section */}
                        {selectedProject?.personsInvolved?.length > 0 && (
                          <Row className="mb-4">
                            <Col>
                              <Card>
                                <Card.Header>
                                  <h6 className="mb-0">Team Members</h6>
                                </Card.Header>
                                <Card.Body>
                                  <ListGroup variant="flush">
                                    {selectedProject.personsInvolved.map(
                                      (person, index) => (
                                        <ListGroup.Item key={index}>
                                          {person || `Team member ${index + 1}`}
                                        </ListGroup.Item>
                                      )
                                    )}
                                  </ListGroup>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        )}
                      </Row>

                      {/* Items Table */}
                      {selectedChallan.items?.length > 0 ? (
                        <div className="table-responsive">
                          <Table striped bordered hover>
                            <thead>
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
                                    {item.assetName || (
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
                                    {item.serialNo || (
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
                                      formatDate(item.expectedReturnDate) || (
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

      {/* Download Confirmation Modal */}
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
          {selectedChallan?.dcNumber}?
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
        refreshData={loadData}
      />
    </Container>
  );
};

export default DataView;
