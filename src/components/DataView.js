import React from 'react';
import { Table, Card, Container, Button, Badge } from 'react-bootstrap';

const DataView = ({ challan }) => {
  return (
    <Container fluid className="main-content-container">
      <div className="page-header mb-4">
        <h2 className="page-title">
          <i className="bi bi-card-checklist me-2"></i>
          Challan Data View
        </h2>
      </div>

      <Card className="mb-4 form-card">
        <Card.Header className="card-header-custom">
          <h5 className="card-title">
            <i className="bi bi-file-text me-2"></i>Challan Summary
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover className="items-table">
              <thead className="table-header">
                <tr>
                  <th>DC Number</th>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Location</th>
                  <th>PO Number</th>
                  <th>Items Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{challan.dcNumber || <span className="text-muted">Not provided</span>}</td>
                  <td>{challan.date || <span className="text-muted">Not provided</span>}</td>
                  <td>{challan.name || <span className="text-muted">Not provided</span>}</td>
                  <td>{challan.client || <span className="text-muted">Not provided</span>}</td>
                  <td>{challan.location || <span className="text-muted">Not provided</span>}</td>
                  <td>
                    {challan.hasPO === "yes" ? (
                      challan.poNumber || <span className="text-muted">Not provided</span>
                    ) : (
                      <Badge bg="secondary">No PO</Badge>
                    )}
                  </td>
                  <td>
                    <Badge bg="info" pill>
                      {challan.items.length}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Card className="form-card">
        <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
          <h5 className="card-title">
            <i className="bi bi-list-ul me-2"></i>Item Details
          </h5>
          <div>
            <Button variant="outline-primary" size="sm">
              <i className="bi bi-download me-1"></i>Export
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped bordered hover className="items-table mb-0">
              <thead className="table-header">
                <tr>
                  <th width="5%">S.No</th>
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
                    <td>{item.assetName || <span className="text-muted">Not provided</span>}</td>
                    <td>{item.description || <span className="text-muted">Not provided</span>}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td>{item.serialNo || <span className="text-muted">Not provided</span>}</td>
                    <td className="text-center">
                      <Badge bg={item.returnable === "yes" ? "success" : "secondary"}>
                        {item.returnable === "yes" ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td>
                      {item.returnable === "yes" ? (
                        item.expectedReturnDate || <span className="text-muted">Not provided</span>
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
      </Card>
    </Container>
  );
};

export default DataView;