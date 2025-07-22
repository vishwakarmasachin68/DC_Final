import React from "react";
import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="custom-footer">
      <Container>
        <span className="">
          &copy; {new Date().getFullYear()} Deevia Software. All rights
          reserved.
        </span>
      </Container>
    </footer>
  );
};

export default Footer;
