import React from "react";
import { Container, Button, Row, Col, Card, CardBody } from "react-bootstrap";

const Home = () => {
  return (
    <Container className="my-5">
      <Row className="align-items-center">
        <Col sm={12} md={6}>
          <h6 style={{color: "#712cf9"}}>This is a Demo version!</h6>
          <h1>Utrecht Database Manager</h1><br />
          <p>
	  		This is the home page for Utrecht database manager
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
