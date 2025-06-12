import React from 'react';
import { Table, Card, Container } from 'react-bootstrap';

const DataView = ({ challan }) => {
  return (
    <Container fluid>
      <Card>
        <Card.Header className="bg-primary text-white">
          <h2 className="main-title">Challan Data View</h2>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
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
                <td>{challan.dcNumber || '-'}</td>
                <td>{challan.date || '-'}</td>
                <td>{challan.name || '-'}</td>
                <td>{challan.client || '-'}</td>
                <td>{challan.location || '-'}</td>
                <td>{challan.poNumber || '-'}</td>
                <td>{challan.items.length}</td>
              </tr>
            </tbody>
          </Table>
          
          <h5 className="mt-4">Items Details</h5>
          <Table striped bordered hover responsive className="mt-2">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Asset Name</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Serial No</th>
                <th>Returnable</th>
                <th>Expected Return Date</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.sno}</td>
                  <td>{item.assetName || '-'}</td>
                  <td>{item.description || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{item.serialNo || '-'}</td>
                  <td>{item.returnable}</td>
                  <td>{item.expectedReturnDate || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DataView;