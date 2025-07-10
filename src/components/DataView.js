import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-bootstrap';
import { 
  BiBarChartAlt2, 
  BiPieChartAlt,
  BiFilterAlt,
  BiCalendar,
  BiTrash,
  BiSearch,
} from 'react-icons/bi';
import Chart from 'react-apexcharts';
import jsonStorage from '../services/jsonStorage';

const DataView = ({ challans: initialChallans }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [timeRange, setTimeRange] = useState('all');
  const [chartData, setChartData] = useState({
    items: [],
    returnStatus: []
  });
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [challans, setChallans] = useState(initialChallans || []);
  const [error, setError] = useState(null);

  // Load all challans if not passed as prop
  useEffect(() => {
    if (!initialChallans) {
      const loadChallans = async () => {
        try {
          setLoading(true);
          const loadedChallans = await jsonStorage.getChallans();
          setChallans(loadedChallans);
          if (loadedChallans.length > 0) {
            setSelectedChallan(loadedChallans[0]);
          }
          setLoading(false);
        } catch (err) {
          console.error("Failed to load challans:", err);
          setError("Failed to load challan data. Please try again.");
          setLoading(false);
        }
      };
      loadChallans();
    } else {
      if (initialChallans.length > 0) {
        setSelectedChallan(initialChallans[0]);
      }
    }
  }, [initialChallans]);

  // Filter challans based on search term and time range
  const filteredChallans = challans.filter(challan => {
    // Search filter
    const matchesSearch = 
      challan.dcNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Time range filter
    const challanDate = new Date(challan.date);
    const now = new Date();
    
    let matchesTimeRange = true;
    if (timeRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      matchesTimeRange = challanDate >= startOfMonth;
    } else if (timeRange === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      matchesTimeRange = challanDate >= startOfWeek;
    }
    
    return matchesSearch && matchesTimeRange;
  });

  // Process data for charts when selected challan changes
  useEffect(() => {
    if (selectedChallan?.items && selectedChallan.items.length > 0) {
      // Items quantity chart data
      const itemsData = selectedChallan.items.map(item => ({
        name: item.assetName || 'Unnamed Asset',
        quantity: item.quantity
      }));

      // Return status pie chart data
      const returnableCount = selectedChallan.items.filter(item => item.returnable === "yes").length;
      const nonReturnableCount = selectedChallan.items.length - returnableCount;

      setChartData({
        items: itemsData,
        returnStatus: [
          { name: 'Returnable', value: returnableCount },
          { name: 'Non-Returnable', value: nonReturnableCount }
        ]
      });
    } else {
      setChartData({
        items: [],
        returnStatus: []
      });
    }
  }, [selectedChallan]);

  // Delete a challan
  const handleDeleteChallan = async (dcNumber) => {
    if (!window.confirm('Are you sure you want to delete this challan?')) return;
    
    try {
      setLoading(true);
      await jsonStorage.deleteChallan(dcNumber);
      const updatedChallans = await jsonStorage.getChallans();
      setChallans(updatedChallans);
      
      // Update selected challan if it was deleted
      if (selectedChallan?.dcNumber === dcNumber) {
        setSelectedChallan(updatedChallans[0] || null);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Failed to delete challan:", err);
      setError("Failed to delete challan. Please try again.");
      setLoading(false);
    }
  };

  // Chart options
  const barChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: chartData.items.map(item => item.name),
      labels: { style: { fontSize: '12px' } }
    },
    yaxis: { title: { text: 'Quantity' } },
    fill: { opacity: 1 },
    colors: ['#4361ee', '#3a0ca3', '#4895ef'],
    tooltip: {
      y: { formatter: (val) => `${val} units` }
    }
  };

  const pieChartOptions = {
    chart: {
      type: 'donut',
      height: 350,
      toolbar: { show: false }
    },
    labels: chartData.returnStatus.map(item => item.name),
    colors: ['#4cc9f0', '#f72585'],
    responsive: [{
      breakpoint: 480,
      options: { chart: { width: 300 } }
    }],
    legend: { position: 'bottom' },
    dataLabels: { enabled: false }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
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

      <h2 className="mb-4">
        <BiBarChartAlt2 className="me-2" />
        Challan Analytics Dashboard
      </h2>

      {/* Search and Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
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
            <Col md={6}>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary">
                  <BiFilterAlt className="me-1" /> Filter: {timeRange === 'all' ? 'All Time' : timeRange === 'month' ? 'This Month' : 'This Week'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item active={timeRange === 'all'} onClick={() => setTimeRange('all')}>
                    All Time
                  </Dropdown.Item>
                  <Dropdown.Item active={timeRange === 'month'} onClick={() => setTimeRange('month')}>
                    This Month
                  </Dropdown.Item>
                  <Dropdown.Item active={timeRange === 'week'} onClick={() => setTimeRange('week')}>
                    This Week
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
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
                    {filteredChallans.reduce((sum, c) => sum + (c.items?.length || 0), 0)}
                  </h3>
                  <Badge bg="success">All Saved</Badge>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <h6 className="text-muted">Avg. Items/Challan</h6>
                  <h3>
                    {filteredChallans.length > 0 ? 
                      Math.round(filteredChallans.reduce((sum, c) => sum + (c.items?.length || 0), 0) / 
                      filteredChallans.length) : 0}
                  </h3>
                  <Badge bg="secondary">Average</Badge>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Content */}
          <Row>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>Generated Challans</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <Accordion defaultActiveKey="0" flush>
                      {filteredChallans.map((challan, index) => (
                        <Accordion.Item 
                          key={index} 
                          eventKey={index.toString()}
                          onClick={() => setSelectedChallan(challan)}
                        >
                          <Accordion.Header>
                            <div className="d-flex justify-content-between w-100">
                              <span className="fw-bold">{challan.dcNumber}</span>
                              <span className="text-muted small">
                                {formatDate(challan.date)}
                              </span>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body className="p-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div><strong>Client:</strong> {challan.client || '-'}</div>
                                <div><strong>Location:</strong> {challan.location || '-'}</div>
                                <div><strong>Items:</strong> {challan.items?.length || 0}</div>
                              </div>
                              <div className="d-flex gap-1">
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
                              series={[{ name: 'Quantity', data: chartData.items.map(item => item.quantity) }]}
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
                              series={chartData.returnStatus.map(item => item.value)}
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
                      <h5>Challan Details</h5>
                      <Badge bg="light" text="dark">
                        <BiCalendar className="me-1" />
                        {formatDate(selectedChallan.date) || 'No date set'}
                      </Badge>
                    </Card.Header>
                    <Card.Body>
                      <Row className="mb-4">
                        <Col md={3}>
                          <div>
                            <h6>DC Number</h6>
                            <p>{selectedChallan.dcNumber || '-'}</p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>Prepared By</h6>
                            <p>{selectedChallan.name || '-'}</p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>Client</h6>
                            <p>{selectedChallan.client || '-'}</p>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div>
                            <h6>Location</h6>
                            <p>{selectedChallan.location || '-'}</p>
                          </div>
                        </Col>
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
                                  <td className="text-center">{item.sno || index + 1}</td>
                                  <td>
                                    {item.assetName || <span className="text-muted">-</span>}
                                  </td>
                                  <td>
                                    {item.description || <span className="text-muted">-</span>}
                                  </td>
                                  <td className="text-center">{item.quantity}</td>
                                  <td>
                                    {item.serialNo || <span className="text-muted">-</span>}
                                  </td>
                                  <td className="text-center">
                                    <Badge bg={item.returnable === "yes" ? "success" : "secondary"}>
                                      {item.returnable === "yes" ? "Yes" : "No"}
                                    </Badge>
                                  </td>
                                  <td>
                                    {item.returnable === "yes" ? (
                                      formatDate(item.expectedReturnDate) || <span className="text-muted">-</span>
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
    </Container>
  );
};

export default DataView;