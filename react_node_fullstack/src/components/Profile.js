// File name: Profile.js
// Auth: Terminal Swag Disorder
// Desc: File containing code for profile page

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCameraRetro } from "react-icons/fa";
import { AiTwotoneDelete } from "react-icons/ai";
import { Container, Card, Form, Button, Row, Col, Tab, Nav, Image, CloseButton, ListGroup } from "react-bootstrap";

const Profile = ({ currentUser, setCurrentUser, handleCredentialChange, handleSignout, refreshProfileData }) => {

  const [currentOperation, setCurrentOperation] = useState("");
  const navigate = useNavigate();

const closeForm = () => {
    setCurrentOperation("");
  };

  const handleModifyProfile = (user) => {
    setCurrentOperation(user);
  };

  const renderUserForm = () => {
    if (currentOperation === "edit") {
		if (currentUser.role === "user") {
			
      // For modifying existing users
      return (
        <div className="d-flex justify-content-center align-items-center"  >
          <Form onSubmit={handleSubmit}>
            <CloseButton onClick={closeForm} />
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Enter new name"
                name="name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Enter new email"
                name="email"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="phone_number"
                placeholder="Enter new phone number"
                name="phone_number"
		  		disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Enter new password"
                name="password"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Enter current password"
                name="currentpassword"
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Change credentials
            </Button>
          </Form>
        </div>
      );
		
      } else if (currentUser.role !== "user") {
      return (
        <div className="d-flex justify-content-center align-items-center"  >
          <Form onSubmit={handleSubmit}>
            <CloseButton onClick={closeForm} />
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Enter new name"
                name="name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Enter new email"
                name="email"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="phone_number"
                placeholder="Enter new phone number"
                name="phone_number"
		  		disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="organisation"
                placeholder="Enter new organisation"
                name="organisation"
		  		disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Enter new password"
                name="password"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Enter current password"
                name="currentpassword"
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Change credentials
            </Button>
          </Form>
        </div>
      );
	  }
      } else {
      	return (
        <div style={{textAlign: "center"}} className="userCredentialChange">
          <div>
            <Button onClick={() => handleModifyProfile("edit")}>
              Edit your profile
            </Button>
          </div>
        </div>
      );
    }
  };

	const renderUserData = () => {
		if (currentUser.role === "user") {
			return (
				<ListGroup className="profile-details">
				  <ListGroup.Item>Name: <span>{currentUser.name}</span></ListGroup.Item>
				  <ListGroup.Item>Email: <span>{currentUser.email}</span></ListGroup.Item>
				  <ListGroup.Item>Phone number: <span>{currentUser.phone_number}</span></ListGroup.Item>
				</ListGroup>
			);
		} else {
			return(
            <ListGroup className="profile-details">
              <ListGroup.Item>Name: <span>{currentUser.name}</span></ListGroup.Item>
              <ListGroup.Item>Email: <span>{currentUser.email}</span></ListGroup.Item>
              <ListGroup.Item>Phone number: <span>{currentUser.phone_number}</span></ListGroup.Item>
              <ListGroup.Item>Role: <span>{currentUser.role}</span></ListGroup.Item>
            </ListGroup>
		)}
	};
	

  // Function for when the user submits the sign in form
  const handleSubmit = async (event) => {
    event.preventDefault();
    const newName = event.target.name.value;
    const newEmail = event.target.email.value;
    const newPassword = event.target.password.value;

    const currentPassword = event.target.currentpassword.value;

    // Check if any field is filled
    if (!newName && !newEmail && !newPassword) {
      alert("No credentials entered!");
      return;
    }

    // Check for changes in name and email
    if (newName === currentUser.Name || newEmail === currentUser.Email) {
      alert("You cannot use the same credentials!");
      return;
    }

    if (!currentPassword) {
      alert("You must enter your current password!");
    }

    try {
      await handleCredentialChange(event);
      await refreshProfileData();
    } catch (error) {
      console.error("Error updating credentials:", error);
      alert("Error updating credentials.");
    }
  };

  return (
    <Container>
      <Row className="justify-content-center modal-body">
        <Col lg={8}>
          <h6 className="persInfo">Personal information</h6>
          <Row className="align-items-center border border-1">
            <Col md={4} className="text-center">
              <div>
                <Button>
                  <FaCameraRetro /> Change picture
                </Button>
                <Button className="btn-danger">
                  <AiTwotoneDelete /> Remove
                </Button>
              </div>
            </Col>
            <Col md={8}>
	  		
              {renderUserData()}
              {/* User Form */}
              {renderUserForm()}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
