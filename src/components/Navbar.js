import React from "react";
import {
  Navbar as BSNavbar,
  Container,
  Button,
  NavDropdown,
} from "react-bootstrap";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <BSNavbar
      bg="primary"
      variant="dark"
      expand="lg"
      className="app-navbar py-2"
    >
      <Container fluid>
        {/* Logo */}
        <BSNavbar.Brand
          as={Link}
          to="/"
          className="d-flex align-items-center me-3"
        >
          <img
            src="/deevia-logo.png"
            alt="Deevia Software"
            height="40"
            className="navbar-logo"
          />
        </BSNavbar.Brand>

        {/* Title - always visible */}
        <div className="navbar-title-container">
          <span className="navbar-brand-title text-white">
            Delivery Challan Generator
          </span>
        </div>

        <div className="d-none d-lg-flex ms-auto">
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
              to="/GenerateChallan"
              variant="outline-light"
              className="d-flex align-items-center"
            >
              <i className="bi bi-house me-2"></i>Generate Challan
            </Button>
            <Button
              as={Link}
              to="/Projects"
              variant="outline-light"
              className="d-flex align-items-center"
            >
              <i className="bi bi-folder-plus me-2"></i>Manage Project
            </Button>
            <Button
              as={Link}
              to="/AssetManagement"
              variant="outline-light"
              className="d-flex align-items-center"
            >
              <i className="bi bi-gear me-2"></i>Asset Management
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - shows dropdown on smaller screens */}
        <div className="d-lg-none ms-auto">
          <NavDropdown
            title={<i className="bi bi-list"></i>}
            id="basic-nav-dropdown"
            className="mobile-menu-dropdown"
            align="end"
          >
            <NavDropdown.Item as={Link} to="/">
              <i className="bi bi-card-checklist me-2"></i>Dashboard
            </NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/GenerateChallan">
              <i className="bi bi-house me-2"></i>Generate Challan
            </NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/Projects">
              <i className="bi bi-folder-plus me-2"></i>Manage Project
            </NavDropdown.Item>
          </NavDropdown>
        </div>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
