import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Card, 
  Container, 
  Badge, 
  Row, 
  Col,
  Dropdown
} from 'react-bootstrap';
import { 
  BiBarChartAlt2, 
  BiPieChartAlt,
  BiFilterAlt,
  BiCalendar
} from 'react-icons/bi';
import Chart from 'react-apexcharts';

const DataView = ({ challan }) => {
  const [timeRange, setTimeRange] = useState('all');
  const [chartData, setChartData] = useState({
    items: [],
    returnStatus: []
  });

  // Process data for charts
  useEffect(() => {
    if (challan.items && challan.items.length > 0) {
      // Items quantity chart data
      const itemsData = challan.items.map(item => ({
        name: item.assetName || 'Unnamed Asset',
        quantity: item.quantity
      }));

      // Return status pie chart data
      const returnableCount = challan.items.filter(item => item.returnable === "yes").length;
      const nonReturnableCount = challan.items.length - returnableCount;

      setChartData({
        items: itemsData,
        returnStatus: [
          { name: 'Returnable', value: returnableCount },
          { name: 'Non-Returnable', value: nonReturnableCount }
        ]
      });
    }
  }, [challan]);

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

  return (
    <Container fluid className="data-view-container">
      {/* Header with filters */}
      <div className="page-header mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="page-title">
            <BiBarChartAlt2 className="me-2" />
            Challan Analytics Dashboard
          </h2>
          <p className="page-subtitle text-muted mb-0">
            Detailed view and statistics for delivery challans
          </p>
        </div>
        
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" size="sm">
            <BiFilterAlt className="me-1" /> Filter
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
      </div>

      {/* Stats Cards Row */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="stat-card">
            <Card.Body>
              <h6 className="stat-label">Total Items</h6>
              <h2 className="stat-value">{challan.items.length}</h2>
              <Badge bg="info">This Challan</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card">
            <Card.Body>
              <h6 className="stat-label">Returnable Items</h6>
              <h2 className="stat-value">
                {chartData.returnStatus[0]?.value || 0}
              </h2>
              <Badge bg="success">
                {chartData.returnStatus[0] ? 
                  Math.round((chartData.returnStatus[0].value / challan.items.length) * 100) : 0}%
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card">
            <Card.Body>
              <h6 className="stat-label">Avg. Items/Challan</h6>
              <h2 className="stat-value">8</h2>
              <Badge bg="secondary">All Time</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="chart-card">
            <Card.Header className="card-header-custom">
              <h5 className="card-title">
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
          <Card className="chart-card">
            <Card.Header className="card-header-custom">
              <h5 className="card-title">
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

      {/* Challan Details Section */}
      <Row>
        <Col md={12}>
          <Card className="detail-card">
            <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
              <h5 className="card-title">
                <i className="bi bi-file-text me-2"></i>
                Challan Details
              </h5>
              <Badge bg="light" text="dark">
                <BiCalendar className="me-1" />
                {challan.date}
              </Badge>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={3}>
                  <div className="detail-item">
                    <h6 className="detail-label">DC Number</h6>
                    <p className="detail-value">{challan.dcNumber || '-'}</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="detail-item">
                    <h6 className="detail-label">Prepared By</h6>
                    <p className="detail-value">{challan.name || '-'}</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="detail-item">
                    <h6 className="detail-label">Client</h6>
                    <p className="detail-value">{challan.client_name || '-'}</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="detail-item">
                    <h6 className="detail-label">Location</h6>
                    <p className="detail-value">{challan.location_name || '-'}</p>
                  </div>
                </Col>
              </Row>

              {/* Items Table */}
              <div className="table-responsive">
                <Table striped bordered hover className="items-table">
                  <thead className="table-header">
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
                    {challan.items.map((item, index) => (
                      <tr key={index}>
                        <td className="text-center">{item.sno}</td>
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
                            item.expectedReturnDate || <span className="text-muted">-</span>
                          ) : (
                            <Badge bg="secondary">N/A</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="text-muted text-center">
              Generated on {new Date().toLocaleDateString()}
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DataView;