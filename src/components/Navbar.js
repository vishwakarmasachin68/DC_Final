import React from "react";
import { Navbar as BSNavbar, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <BSNavbar
      bg="primary"
      variant="dark"
      expand="lg"
      className="app-navbar py-2"
    >
      <Container fluid className="d-flex justify-content-between align-items-center position-relative">
        <div className="d-flex align-items-center">
          <BSNavbar.Brand href="#" className="d-flex align-items-center">
            <Link to="/">
              <img
                src="/deevia-logo.png"
                alt="Deevia Software"
                height="50"
                className="navbar-logo me-2"
              />
            </Link>
          </BSNavbar.Brand>
        </div>

        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <span className="navbar-brand-title text-white fs-2 fw-semibold">
            Delivery Challan Generator
          </span>
        </div>

        <div className="d-flex align-items-center ms-auto">
          <div className="d-flex gap-2">
            <Button
              as={Link}
              to="/"
              variant="outline-light"
              className="d-flex align-items-center"
            >
              <i className="bi bi-card-checklist me-2"></i>Dashboard
            </Button>
            <Button
              as={Link}
              to="/challan"
              variant="outline-light"
              className="d-flex align-items-center"
            >
              <i className="bi bi-house me-2"></i>Generate Challan
            </Button>
            <Button
              as={Link}
              to="/projects"
              variant="outline-light"
              className="d-flex align-items-center"
            >
              <i className="bi bi-folder-plus me-2"></i> Manage Project
            </Button>
          </div>
        </div>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;