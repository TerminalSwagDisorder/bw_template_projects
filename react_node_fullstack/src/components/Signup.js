// File name: Signup.js
// Auth: Terminal Swag Disorder
// Desc: File containing code for signing up page

import React, { useState, useEffect } from "react";
import { Container, Button, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";


// Function for rendering sign up page, takes onSubmit as a prop
export const Signup = ({ handleSignup }) => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [formFields, setFormFields] = useState(
		{
		name: "",
		email: "",
		password: "",
		phone_number: "",
		});

	const toggleUserType = (userType) => {
		setUserType(userType)
	}

	const handleInputChange = (event) => {
		setInputValue(event.target.value);
		setFormFields((prevFields) => ({
			...prevFields,
			[event.target.name]: event.target.value,
		}));
	};
		  
  // Function for when the user submits the sign up form
	const handleSubmit = async (event) => {
		const newName = event.target.name.value;
		const newEmail = event.target.email.value;
		const newPassword = event.target.password.value;
		const newPhoneNumber = event.target.phone_number.value;

		if (!newName && !newEmail && !newPassword && !newPhoneNumber && !newMedId) {
			alert("All required fields must be filled!");
			return;
		}

		if (!newName && !newEmail && !newPassword && !newPhoneNumber && !newOrganisation) {
			alert("All required fields must be filled!");
			return;
		}

		// Need this to prevent regular js from ruining the form submission
		event.preventDefault();
		setIsLoading(true);
		try {
			const signedUp = await handleSignup(event, formFields);
			if (signedUp) navigate("/signin")


			} catch (error) {
				console.log(error.message);
			} finally {
				setIsLoading(false);
			}
		};
	
	const renderSignupForm = () => {
		let userTypeSignup;
		if (userType === "user" || userType !== "meduser") {
			userTypeSignup = (
				  <div>
    <Container
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "90vh",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Form style={{ textAlign: "left" }} onSubmit={handleSubmit}>
          <h1>Sign up</h1>
	  
		<Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter name"
              required
              name="name"
				value={formFields.name}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicEmail" >
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              required
              name="email"
				value={formFields.email}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              required
              name="password"
				value={formFields.password}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter phone number"
              required
              name="phone_number"
				value={formFields.phone_number}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Med id</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter med id"
              required
              name="med_id"
				value={formFields.med_id}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Button type="submit" style={{ width: "100%" }} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </>
            ) : (
              'Sign up'
            )}
          </Button>
        </Form>
      </div>
    </Container>
</div>
		)} else if (userType === "meduser") {
			userTypeSignup = (
			<div>
    <Container
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "90vh",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Form style={{ textAlign: "left" }} onSubmit={handleSubmit}>
          <h1>Sign up</h1>
	  
		<Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter name"
              required
              name="name"
				value={formFields.name}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicEmail" >
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              required
              name="email"
				value={formFields.email}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              required
              name="password"
				value={formFields.password}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter phone number"
              required
              name="phone_number"
				value={formFields.phone_number}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Organisation</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter organisation"
              required
              name="organisation"
				value={formFields.organisation}
				onChange={handleInputChange}
            />
          </Form.Group>

          <Button type="submit" style={{ width: "100%" }} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </>
            ) : (
              'Sign up'
            )}
          </Button>
        </Form>
      </div>
    </Container>
</div>
		)}
		return (
		<>
		{userTypeSignup}
		</>
			)};
	
  return (
	  <>
	  {renderSignupForm()}
	  </>
  );
};

export default Signup;
