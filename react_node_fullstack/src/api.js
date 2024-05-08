// File name: api.js
// Auth: Terminal Swag Disorder
// Desc: File containing code for api functionality

import React, { useEffect, useState, createContext, useContext } from "react";
import "./App.scss";


// Light & Darkmode switch
// Create a context for the theme
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize theme from local storage or default to "light"
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    // Update local storage when theme changes
    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.body.setAttribute("data-theme", theme);  // Apply the theme to the document body
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === "light" ? "dark" : "light");
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};


// All of the user data handling
// Fetch users using pagination
export const fetchUsers = async (page) => {
	try {
		const response = await fetch(`http://localhost:4000/api/users?page=${page}&items=50`);
		const data = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${data.message}`);
            alert(`HTTP error ${response.status}: ${data.message}`);
        }

		// If data is not correct format
		if (!Array.isArray(data)) {
		  return Object.values(data);
		}
		
		return data;
	} catch (error) {
		console.error(error);
		//throw new Error(error);
	}
};

// Fetch different types of data from pages
export const fetchDynamicData = async (page, tableName) => {
	// Only allow the specified tableNames
	const allowedTableNames = ["other/users", "users"]
	if (!allowedTableNames.includes(tableName) || tableName === "") {
		console.error(`tableName "${tableName}" is not allowed!`)
		throw new Error(`tableName "${tableName}" is not allowed!`)
	}

	try {
		const response = await fetch(`http://localhost:4000/api/${tableName}?page=${page}&items=50`);
		const data = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${data.message}`);
            alert(`HTTP error ${response.status}: ${data.message}`);
        }

		// If data is not correct format
		if (!Array.isArray(data)) {
		  return Object.values(data);
		}
		
		return data;
	} catch (error) {
		console.error(error);
		//throw new Error(error);
	}
};

// Search function for users/otherusers using id
export const fetchSearchIdData = async (UserId, tableName) => {
	console.log(UserId, tableName)
	// Only allow the specified tableNames
	const allowedTableNames = ["other/users", "users"]
	if (!allowedTableNames.includes(tableName) || tableName === "") {
		console.error(`tableName "${tableName}" is not allowed!`)
		throw new Error(`tableName "${tableName}" is not allowed!`)
	}
	try {
		const response = await fetch(`http://localhost:4000/api/${tableName}/${UserId}`);
		const data = await response.json(); // Note for some reason this is a different format from email search

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${data.message}`);
            alert(`HTTP error ${response.status}: ${data.message}`);
        }

		// If data is not correct format
		if (!Array.isArray(data)) {
		  return Object.values(data);
		}
		console.log(data)
		
		return data;
	} catch (error) {
		console.error(error);
		//throw new Error(error);
	}
};

// For pagination
export const fetchDataAmount = async (tableName) => {
	try {	
		const response = await fetch(`http://localhost:4000/api/count?tableName=${tableName}&items=50`);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.message}`);
        }

		const count = await response.json();
		return count;
	} catch (error) {
		console.error("Error while getting pagination:", error);
		//throw new Error(error);
	}
    
};


// Do all of the user data handling async
// Signin
export const handleSignin = async (event, handleUserChange) => {
	const email = event.target.email.value;
	const password = event.target.password.value;

	// api call to the server to log in the user
	try {
		if (email && password) {
			const response = await fetch(`http://localhost:4000/api/users/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include", // For all fetch requests, do this!
				body: JSON.stringify({ email, password, userType })
			});
			const data = await response.json();
			//console.log("data.userData", data.user)

			// If successful, set the current user to the provided credentials and return the data
			if (response.ok) {
				alert("Successfully signed in!")
				handleUserChange(data.user);
				return data.user;
			} else {
				console.log(data)
				if (data.message) {
					alert(`HTTP error ${response.status}: ${data.message}`)
					throw new Error(data.error);
				} else {
					alert("Failed sign in. Please try again.");
					throw new Error(data.error);
					}
				}
			}
	} catch (error) {
		console.error("Error signing user in:", error);
		//throw new Error(error);
	}
};


// Signup
export const handleSignup = async (event, formFields) => {
	try {
		if (formFields && typeof formFields === "object" && !Array.isArray(formFields)) formFields = JSON.stringify(formFields);
		console.log(formFields)
		// api call to register a new user
		const response = await fetch(`http://localhost:4000/api/users/signup`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			credentials: "include", // Important, because we're using cookies
			body: JSON.stringify({ formFields }),
		});

		const data = await response.json();

		if (response.ok) {
			alert("Signed up successfully");
			return true;
		} else {
			if (data.message) {
				alert(`HTTP error ${response.status}: ${data.message}`)
				throw new Error(data.error);
			} else {
				alert("Failed sign up. Please try again.");
				throw new Error(data.error);
			}
		}
	} catch (error) {
		console.error("Error adding user:", error);
		if (error.message) alert(error.message)
		//throw new Error(error);

	}
};

// Signout
export const handleSignout = async (handleUserChange) => {
	
	// api call to log out the user
	const response = await fetch("http://localhost:4000/api/logout", {
		method: "POST",
		credentials: "include",  // Important, because we're using cookies
	});

	const data = await response.json();
	
	// If successful, reload the current window
	if (response.ok) {
		localStorage.removeItem("accessToken");
		sessionStorage.removeItem("accessToken");
		
		window.location.reload();
		return "Logged out successfully";
	} else {
		console.error(data.error);
	}
};


// Signin status check
export const checkIfSignedIn = async () => {

	// api call to get the user's profile information
	try {
		const response = await fetch("http://localhost:4000/api/profile", {
			method: "GET",
			credentials: "include", // Important, because we're using cookies
		});

		const data = await response.json();
		console.log(data)

		// If the user is authenticated, return user data
		if (response.ok) {
			return data.userData;
		} else {
			// If authentication fails
			// User is not signed in (invalid token or other error)
			return null;
		}
	} catch (error) {
		console.error("Error while fetching user:", error);
	}
};

// Profile refresh
export const refreshProfile = async () => {

	// api call to get the user's profile information
	try {
		const response = await fetch("http://localhost:4000/api/profile/refresh", {
			method: "GET",
			credentials: "include", // Important, because we're using cookies
		});

		const data = await response.json();

		// If the user is authenticated, return user data
		if (response.ok) {
			//handleUserChange(data.userData)
			return data.userData;
		} else {
			// If authentication fails
			// User is not signed in (invalid token or other error)
			return null;
		}
	} catch (error) {
		console.error("Error while fetching user:", error);
	}
};

// User credential change
export const handleCredentialChange = async (formFields) => {

    try {
		if (formFields && typeof formFields === "object" && !Array.isArray(formFields)) formFields = JSON.stringify(formFields);
		const response = await fetch("http://localhost:4000/api/profile", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include", // Important, because we're using cookies
				body: JSON.stringify({ formFields }),
			});

		const data = await response.json();

		// Handle update
		if (response.ok) {
			console.log("User updated successfully:", data);
			alert("Successfully changed credentials!");
		} else {
			if (data.message) {
				alert(`HTTP error ${response.status}: ${data.message}`)
				throw new Error(data.error);
			} else {
				alert("Failed change credentials. Please try again.");
				throw new Error(data.error);
			}
		}
    } catch (error) {
        console.error("Error updating credentials:", error);
    }
};
