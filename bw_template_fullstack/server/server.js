// File name: server.js
// Auth: Terminal Swag Disorder
// Desc: Template file containing code for server-side, including express-session, jwt & sqlite3, mysql, api using axios

// General exports
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const multer = require("multer");

// User authentication exports
const jwt = require("jsonwebtoken");
const session = require("express-session");

// Database connection exports
const axios = require("axios");
const mysql = require("mysql2");
const sqlite3 = require("sqlite3").verbose();

// Environment file
require("dotenv").config();

// Session secret for express session
const jwtSecret = process.env.JWT_SECRET;
const sessionSecret = process.env.SESSION_SECRET;
const apiEndpoint = process.env.API_ENDPOINT;
if (!jwtSecret) {
	console.error("Missing JWT_SECRET environment variable. Exiting...\nHave you run env_generator.js yet?");
	process.exit(1);
}
if (!sessionSecret) {
	console.error("Missing SESSION_SECRET environment variable. Exiting...\nHave you run env_generator.js yet?");
	process.exit(1);
}
if (!apiEndpoint) {
	console.error("Missing API_ENDPOINT environment variable. Exiting...\nHave you run env_generator.js yet?");
	process.exit(1);
}



// General setup

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

const app = express();
const port = 4000;
app.use(express.json());

// Cors options to allow the use of user cookies
const corsOptions = {
	origin: "http://localhost:3000", // replace with your applications origin
	credentials: true, // allows the Access-Control-Allow-Credentials: true header
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Helmet for security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "http://localhost:8080", "http://localhost:3000"],
			scriptSrc: ["'self'", "'unsafe-inline'", "http://localhost:3000"],
			// imgSrc: ["'self'", "data:"], // If we need image uploading
        }
    },
    frameguard: {
        action: 'deny'
    },
	crossOriginEmbedderPolicy: false
}));
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



// Database connections

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
// SQLite3
// Component db
const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath);

// User db
const userDbPath = path.resolve(__dirname, "user_data.db");
const userDb = new sqlite3.Database(userDbPath)

// MySQL
// MySQL database connection
const db = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

const promisePool = db.promise();
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



// User authentication middleware

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
// Jwt
// Middleware for checking if user is logged in
const authenticateJWT = (req, res, next) => {
	// Check if cookie exists and retrieve the value, if it does not exist set accessToken to null 
	const token = req.cookies ? req.cookies.accessToken : null;
	//console.log(req.headers)
	//console.log(token)
	if (!token) {
		return res.status(401).json({ message: "Could not verify JWT token" });

	}
	// Verify the token to the jwtSecret
	jwt.verify(token, jwtSecret, (error, user) => {
		if (error) {
			return res.status(403).json({ message: "Authentication failed" });
		}
		// If successful, set req.user to the decoded user info
		req.user = user;
		next();
	});
};

// Express-session
// Cookie settings
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false, // Can be useful, creates a cookie even when user is not logged in to track behaviour. This can be taxing though.
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 3600000 }
}));

// Middleware for checking if user is logged in
const authenticateSession = (req, res, next) => {
	//console.log(req.session)
	if (req.session.user) {
		req.user = req.session.user;
		next();
	} else {
		return res.status(401).json({
			message: "Not authenticated"
		});
	}
};
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////




// General middleware

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
// Middleware for profile images
// File filter for image validation
const imageFileFilter = (req, file, cb) => {
	const allowedFileTypes = ["image/jpeg", "image/png", "image/gif"];
	if (allowedFileTypes.includes(file.mimetype)) {
		cb(null, true); // Accept file
	} else {
		cb(new Error("Only image files are allowed!"), false); // Reject file
	}
};

// Config for multer
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "public/images");
	},
	filename: function (req, file, cb) {
		const uniqueSuffix =
			Date.now() + "-" + Math.round(Math.random() * 1e9);
		const extension = path.extname(file.originalname);
		cb(
			null,
			"ProfileImage" + "-" + uniqueSuffix + extension
		);
	},
});

const profileImgUpload = multer({ storage: storage, fileFilter: imageFileFilter });
const otherFileUpload = multer({ storage: storage });

// Middleware for pagination
const routePagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const items = parseInt(req.query.items) || 100;

    if (items >= 1000) {
        return res.status(400).json({ message: "Please limit items to under 1000" });
    }
	
	// If successful, attach page and items to the req object to be used in the routes
    req.pagination = { page, items };
    next();
}
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////




// Axios & API: Check connection health & status

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
// Check the health status of the API
const checkApiHealth = async () => {
	let statusMessage;
	try {
		// Known good endpoint
		const response = await axios.get(`${apiEndpoint}users`);

		if (!response.headers["x-total-count"] || response.headers["x-total-count"] === "undefined") {
			// If the response was successful, but has no x-total-count header. This means the API is outdated.	
			statusMessage = `Connection to API server established, but there was an error. Have you updated the API?: {Upgrade Required: 426}`;
			console.log(statusMessage)

			return { status: 426, statusText: "Upgrade Required", statusMessage };
		}
		
		if (response.data.length === 0 || response.headers["x-total-count"] === "0") {
			// If the response was successful, but there is no data.	
			statusMessage = `Connection to API server established, but no data exists: {Not Found: 404}`;
			console.log(statusMessage)

			return { status: 404, statusText: "Not Found", statusMessage };
		}

		// If successful
		statusMessage = `Connection to API server established: {${response.statusText}: ${response.status}}`;
		console.log(statusMessage)
		
		return { status: response.status, statusText: response.statusText, statusMessage };


	} catch (error) {
		// For different http errors
		if (error.response) {
			statusMessage = `Connection to API server established, but there was an error: {${error.response.statusText}: ${error.response.status}}`;
		} else if (error.request) {
			statusMessage = "Request was made, but got no response from API";
			// console.error(`Request was made, but got no response from API: ${error.request}`);
		} else {
			statusMessage = `Something went horribly wrong: ${error.message}`;
		}

		console.log(statusMessage)
				
		return { status: error.response ? error.response?.status : 500, statusText: error.response ? error.response?.statusText : "Internal Server Error", statusMessage };
		//process.exit(1); // Exits the program if no connection could be established
	}
};

checkApiHealth();

// Route to check connection to the API
app.get("/api/health", async (req, res) => {
	console.log("API health accessed")
	const response = await checkApiHealth();
	try {
		// Success message & status, with defaults
		const message = response.statusMessage || response.statusText;
        const status = response.status || 500;

		return res.status(status).send(message);
	} catch (error) {
		// Non-success message & status, with defaults
		const message = error.response ? error.response?.data : "Internal Server Error";
        const status = error.response ? error.response?.status : 500;
        return res.status(status).send(message);
		
	}
});
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////





// Server routes
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

app.get("/", async (req, res) => {
	console.log("Index accessed")
	return res.status(400).send("Index page. Navigate elsewhere.");
})



// User routes

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
// Axios & API + JWT

// Route for frontend pagination
app.get("/api/count", async (req, res) => {
	console.log("API pagination accessed")
	const tableName = req.query.tableName; // Get the table name from the query
	const items = parseInt(req.query.items) || 50;

    try {
		const allowedUserTypes = ["otherusers", "users"]
		if (!allowedUserTypes.includes(tableName) || tableName === "") {
			console.log(`tableName "${tableName}" is not allowed!`)
			return res.status(400).json({message: `tableName "${tableName}" is not allowed!`});
		}

		const apiRes = await axios.get(`${apiEndpoint}${tableName}`, { params: { page: 1, items } });
		const index = parseInt(apiRes.headers["x-total-pages"], 10);

		console.log(typeof(index))
        return res.status(200).json({index: index});

    } catch (error) {
        console.error(error);
		// If there is a status message or data then use that, otherwise the defaults
		const message = error.response ? error.response.data : "Internal Server Error";
        const status = error.response ? error.response.status : 500;
        return res.status(status).send(message);
    }
});

// Route for viewing regular users
app.get("/api/users", routePagination, async (req, res) => {
	console.log("API users accessed")
	const { page, items } = req.pagination;
	
    try {
		const apiRes = await axios.get(`${apiEndpoint}users`, { params: { page, items } });

		if (apiRes.data.length === 0) {
			return res.status(400).json({ message: "You have exceeded the amount of items" });
		}

		// Dont need to check for response code as axios hadles them automatically
        return res.status(200).json(apiRes.data);

    } catch (error) {
        console.error(error);
		// If there is a status message or data then use that, otherwise the defaults
		const message = error.response ? error.response.data : "Internal Server Error";
        const status = error.response ? error.response.status : 500;
		return res.status(status).send(message);
    }
});

// Signing up
app.post("/api/users/signup", async (req, res) => {
    console.log("API user signup accessed");

    const { formFields } = req.body;
	const jsonFormFields = JSON.parse(formFields)
	const { name, email, password, phone_number, med_id, role } = jsonFormFields;


    try {
		// Check if email exists
		const apiRes = await axios.get(`${apiEndpoint}users/search`, { params: { email } });
        const emailCheck = apiRes.data;
        if (emailCheck.length > 0) {
            return res.status(409).json({ message: "One or more fields already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const apiPostRes = await axios.post(`${apiEndpoint}register`, {name, email, password: hashedPassword, phone_number, role});
        return res.status(200).json({message: "User registered successfully" });

    } catch (error) {
        console.error(error);
		// If there is a status message or data then use that, otherwise the defaults
		const message = error.response ? error.response.data : "Internal Server Error";
        const status = error.response ? error.response.status : 500;
        return res.status(status).send(message);
    }
});

// Login
app.post("/api/users/login", async (req, res) => {
    console.log("API users login accessed");
    const { email, password } = req.body;
    try {
		if (userType === "user") {
			const apiRes = await axios.get(`${apiEndpoint}users/search`, { params: { email } });

			const user = apiRes.data[0] || apiRes.data;

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			const match = await bcrypt.compare(password, user.password);
			if (match) {

				// Provide an accessToken cookie
				const accessToken = jwt.sign({ user }, jwtSecret, {
					expiresIn: "1h",
				});
				res.cookie("accessToken", accessToken, {
					httpOnly: true,
					sameSite: "lax",
					maxAge: 3600000
				});

				return res.status(200).json({ message: "Logged in successfully", user });
			} else {
				return res.status(401).json({ message: "password incorrect" });
			}
		} else {
			return res.status(403).json({ message: "Not authorised to login as a user" }); 
		}
    } catch (error) {
        console.error(error);
		// If there is a status message or data then use that, otherwise the defaults
		const message = error.response ? error.response.data : "Internal Server Error";
        const status = error.response ? error.response.status : 500;
        return res.status(status).send(message);
    }
});

// Check if the user is logged in
app.get("/api/profile", authenticateJWT, (req, res) => {
	console.log("API profile accessed")
	// If we're here, the JWT was valid and `req.user` contains the payload from the JWT
	// const userData = { userData: req.user };
	res.json({ message: "Authenticated", userData: req.user });
});

// Profile refresh if userdata gets updated
app.get("/api/profile/refresh", authenticateJWT, async (req, res) => {
	console.log("API profile refresh accessed")
	const userId = req.user.user.id;

	try {
		const apiRes = await axios.get(`${apiEndpoint}users/${userId}`);
		const user = apiRes.data;

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json({ userData: user });
			
	} catch (error) {
        console.error(error);
		// If there is a status message or data then use that, otherwise the defaults
		const message = error.response ? error.response.data : "Internal Server Error";
        const status = error.response ? error.response.status : 500;
        return res.status(status).send(message);
	}
});

// Logout route (Frontend will handle removing the token with JWT)
app.post("/api/logout", (req, res) => {
	console.log("API logout accessed")
	res.clearCookie("accessToken");
	res.json({ message: "Logged out successfully" });
});

// Update own user credentials
app.patch("/api/profile", authenticateJWT, async (req, res) => {
	console.log("API update own credentials accessed")
	const userId = req.user.user.id;
	const { formFields } = req.body; // Updated credentials from request body

	try {

		const match = await bcrypt.compare(currentPassword, req.user.password)
		if (!match) {
			return res.status(403).json({ message: "Current password is incorrect" });
		}

		let updateQuery = {};
		const jsonFormFields = JSON.parse(formFields)
		const allowedFields = ["name", "email", "password", "phone_number"];
		// More dynamic way of updating users, used with formFields & FormData
		for (const key in jsonFormFields) {
			if (allowedFields.includes(key)) {
				if (jsonFormFields.hasOwnProperty(key)) {
					if (jsonFormFields[key] !== "") {
						if (key === "password") {
							// Hash the new password before storing it
							hashedPassword = await bcrypt.hash(jsonFormFields[key], 10);
							updateQuery[key] = hashedPassword;
						} else {	
							updateQuery[key] = jsonFormFields[key];
						}
					}
				}
			}
		}
		
		const apiPostRes = await axios.patch(`${apiEndpoint}users/${userId}`, Query);


		return res.status(200).json({ message: "User updated successfully" });
	} catch (error) {
        console.error(error);
		// If there is a status message or data then use that, otherwise the defaults
		const message = error.response ? error.response.data : "Internal Server Error";
        const status = error.response ? error.response.status : 500;
        return res.status(status).send(message);
	}
});
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
// MySQL & Express session

// Route for frontend pagination in MySQL
app.get("/api/count", async (req, res) => {
	console.log("MySQL pagination accessed");
	const tableName = req.query.tableName; // Get the table name from the query
	const items = parseInt(req.query.items) || 50;

	const sql = `SELECT COUNT(*) AS total FROM ??`;
	try {
		const [result] = await promisePool.query(sql, [tableName]);
		const total = result[0].total;
		const pages = Math.ceil(total / items);

		console.log("Total pages calculated:", pages);
		return res.status(200).json({ index: pages });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal Server Error", details: error.message });
	}
});

// Route for viewing regular users
app.get("/api/users", async (req, res) => {
	const sql = "SELECT * FROM users";
	try {
		const [users] = await promisePool.query(sql);
		// Process each user to add isAdmin property
		const processedUsers = users.map(user => {
			const isAdmin = user.RoleID === 4;

			// Exclude sensitive information like hashed password
			const { Password, ...userData } = user;
			return { ...userData, isAdmin };
		});
		return res.status(200).json(processedUsers);
	} catch (err) {
		console.error(err);
		return res.status(500).send(err);
	}
});

app.get("/api/users/:id", async (req, res) => {
	const { id } = req.params;
	const sql = "SELECT * FROM users WHERE UserID = ?";
	try {
		const [users] = await promisePool.query(sql, [id]);
		if (!users.length) {
			return res.status(404).json({ message: "User not found" });
		} else {
		const processedUsers = users.map(user => {
			const isAdmin = user.RoleID === 4;

			// Exclude sensitive information like hashed password
			const { Password, ...userData } = user;
			return { ...userData, isAdmin };
		});
		return res.status(200).json(processedUsers);
		}
	} catch (err) {
		console.error(err);
		return res.status(500).send(err);
	}
});


// Signing up
app.post("/api/users/signup", async (req, res) => {
    const { Name, Email, Password } = req.body;
    console.log("server api user signup accessed");

    try {
        const emailCheckSql = "SELECT Email FROM users WHERE Email = ?";
        const [user] = await promisePool.query(emailCheckSql, [Email]);

        if (user.length > 0) {
            return res.status(409).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(Password, 10);
        const insertSql = "INSERT INTO users (Name, Email, Password) VALUES (?, ?, ?)";
        const [result] = await promisePool.query(insertSql, [Name, Email, hashedPassword]);
        return res.status(200).json({message: "User registered successfully", id: result.insertId });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});



app.post("/api/login", async (req, res) => {
    console.log("server api login accessed");
    const { Email, Password } = req.body;
    const sql = "SELECT * FROM users WHERE Email = ?";
    
    try {
		// [[user]] takes the first user in the array wile [user] returns the whole array and you need to specify user[0] each time otherwise
        const [[user], fields] = await promisePool.query(sql, [Email]);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        
        const match = await bcrypt.compare(Password, user.Password);
        if (match) {
            const isAdmin = user.RoleID === 4;
			req.session.user = { ...user, isAdmin };
            
			return res.status(200).json({ message: "Logged in successfully", user: req.session.user });
        } else {
            return res.status(401).json({ message: "Password incorrect" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

// Check if the user is logged in
app.get("/api/profile", authenticateSession, (req, res) => {
	console.log("server api profile accessed")
	// const userData = { userData: req.user };
	res.json({
		message: "Authenticated",
		userData: req.user,
	});
});


// Profile refresh if userdata gets updated
app.get("/api/profile/refresh", authenticateSession, async (req, res) => {
	console.log("server api profile refresh accessed")
	const userId = req.user.UserID;
	const sql = "SELECT * FROM users WHERE UserID = ?";
	try {
		const [[user], fields] = await promisePool.query(sql, [userId]);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		} else {
			const isAdmin = user.RoleID === 4;
			// Exclude sensitive information like hashed password before sending the user data
			const { ...userData } = user;
			return res.status(200).json( {userData: { ...userData, isAdmin: isAdmin}});
		}
	} catch (err) {
        console.error(err);
        return res.status(500).send(err);
	}
});

// Update own user credentials
api.patch("/api/profile", authenticateSession, profileImgUpload.single("profileImage"), async (req, res) => {
	console.log("server api update own credentials accessed")
	console.log(req.user)
	const userId = req.user.UserID;
	const { Name, Email, Password, Gender, currentPassword } = req.body; // Updated credentials from request body
	const ProfileImage = req.file; // Profile image

	try {

		const match = await bcrypt.compare(currentPassword, req.user.Password)
		if (!match) {
			return res.status(403).json({ message: "Current password is incorrect" });
		}

		let hashedPassword = null;
		if (Password) {
			// Hash the new password before storing it
			hashedPassword = await bcrypt.hash(Password, 10);
		}

		// SQL query to update user data
		// updateQuery allows for multiple fields to be updated simultaneously
		let updateQuery = "UPDATE users SET ";
		let queryParams = [];

		if (Name) {
			updateQuery += "Name = ?, ";
			queryParams.push(Name);
		}
		if (Email) {
			updateQuery += "Email = ?, ";
			queryParams.push(Email);
		}
		if (Gender) {
			updateQuery += "Gender = ?, ";
			queryParams.push(Gender);
		}
		if (hashedPassword) {
			updateQuery += "Password = ?, ";
			queryParams.push(hashedPassword);
		}
		if (ProfileImage) {
			const ProfileImage_name = ProfileImage.filename;
			updateQuery += "ProfileImage = ?, ";
			queryParams.push(ProfileImage_name);
		}

		// Remove trailing comma and space
		if (queryParams.length > 0) {
			updateQuery = updateQuery.slice(0, -2);
		}
		updateQuery += " WHERE UserID = ?";
		queryParams.push(userId);

		const [result] = await promisePool.query(updateQuery, queryParams);
		if (result.affectedRows === 0) {
			return res.status(404).json({ message: "Item not found" });
		}
		if (Name) req.user.Name = Name;
		if (Email) req.user.Email = Email;
		if (Gender) req.user.Gender = Gender;
		if (hashedPassword) req.user.Password = hashedPassword;
		if (ProfileImage) req.user.ProfileImage = ProfileImage.filename;
		console.log(req.user)
		return res.status(200).json({ message: "User updated successfully", id: this.lastID });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
});
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
// SQLite3 & JWT

// Route for frontend pagination in SQLite
app.get("/api/count", async (req, res) => {
	console.log("SQLite pagination accessed");
	const tableName = req.query.tableName; // Get the table name from the query
	const items = parseInt(req.query.items) || 50;

	const allowedUserTypes = ["otherusers", "users"]
	if (!allowedUserTypes.includes(tableName) || tableName === "") {
		console.log(`tableName "${tableName}" is not allowed!`)
		return res.status(400).json({message: `tableName "${tableName}" is not allowed!`});
	}

	const sql = `SELECT COUNT(*) AS total FROM ${tableName}`;
	try {
		userDb.get(sql, [], (err, result) => {
			if (err) {
				console.error(err);
				return res.status(500).json({ message: "Internal Server Error", details: err.message });
			}
			const total = result.total;
			const pages = Math.ceil(total / items);

			console.log(`Total pages calculated: ${totalPages}`);
			return res.status(200).json({ index: pages });
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal Server Error", details: error.message });
	}
});

// All of the users, not used in frontend
app.get("/api/users", (req, res) => {
	const sql = "SELECT * FROM user";
	userDb.all(sql, [], (err, users) => {
		if (err) {
			console.error(err);
			return res.status(500).send(err);
		} else {
			// Exclude sensitive information like hashed password
			const { Password, ...userData } = user;
			return res.status(200).json({userData});
		}
	});
});

// Show single user
app.get("/api/users/:id", (req, res) => {
	const { id } = req.params; 
	const sql = "SELECT * FROM user WHERE ID = ?";
	userDb.get(sql, [id], (err, user) => {
		if (err) {
			console.error(err.message);
			return res.status(500).json({ message: "Internal server error" });
		} 
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		// Exclude sensitive information like hashed password before sending the user data
		const { Password, ...userData } = user;
		return res.status(200).json({userData});
	});
});

// Signing up
app.post("/api/users/signup", async (req, res) => {
	const { Name, Email, Password } = req.body;
	console.log("server api user signup accessed")

	try {
		// Check if a user with the given email already exists
		const emailCheckSql = "SELECT Email FROM user WHERE Email = ?";
		userDb.get(emailCheckSql, [Email], async (err, row) => {
			if (err) {
				console.error(err);
				return res.status(500).json({ message: "Error checking user's email" });
			}
			if (row) {
				return res.status(409).json({ message: "Email already in use" });
			}

			try {
				const hashedPassword = await bcrypt.hash(Password, 10);
				const sql = "INSERT INTO user (Name, Email, Password) VALUES (?, ?, ?)";

				userDb.run(sql, [Name, Email, hashedPassword], function (err) {
					if (err) {
						console.error(err);
						return res.status(500).send({ message: "Failed to insert user" });
					} else {
						return res.status(200).json({ id: this.lastID });
					}
				});
			} catch (error) {
				console.error(error);
				return res.status(500).json({ message: "Internal server error while registering new user" });
			}
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
});

// Login route
app.post("/api/login", (req, res) => {
	console.log("server api login accessed")
	const { Email, Password } = req.body;
	const sql = "SELECT * FROM user WHERE Email = ?";
	userDb.get(sql, [Email], async (err, user) => {
		if (err) {
			return res.status(500).json({ message: err });
			return;
		}
		// If the user does not exist
		else if (!user) {
			return res.status(401).json({ message: "User not found" });
			return;
		} else {

		// Compare hashed password with password in form
		const match = await bcrypt.compare(Password, user.Password);
		if (match) {
			// Provide an accessToken cookie
			const accessToken = jwt.sign({ user, isAdmin, isBanned }, jwtSecret, {
				expiresIn: "1h",
			});
			res.cookie("accessToken", accessToken, {
				httpOnly: true,
				sameSite: "lax",
				maxAge: 3600000
			});
			return res.status(200).json({ message: "Logged in successfully", user });
		} else {
			return res.status(401).json({ message: "Password incorrect" });
			}
		}
	});
});

// Check if the user is logged in
app.get("/api/profile", authenticateJWT, (req, res) => {
	console.log("server api profile accessed")
	// If we're here, the JWT was valid and `req.user` contains the payload from the JWT
	// const userData = { userData: req.user };
	res.json({
		message: "Authenticated",
		userData: req.user,
	});
});

// Profile refresh if userdata gets updated
app.get("/api/profile/refresh", authenticateJWT, (req, res) => {
	const userId = req.user.ID; // Extract user ID from JWT payload
	const sql = "SELECT * FROM user WHERE ID = ?";
	userDb.get(sql, [userId], (err, user) => {
		if (err) {
			console.error(err.message);
			return res.status(500).json({ message: "Internal server error" });
		} 
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		} 

		// Exclude sensitive information like hashed password before sending the user data
		const { Password, ...userData } = user;
		return res.status(200).json({userData});
		
	});
});

// Update own user credentials
api.patch("/api/profile", authenticateJWT, upload.single("profileImage"), async (req, res) => {
	console.log("server api update own credentials accessed")
	const userId = req.user.ID; // User ID from the authenticated JWT, this already makes it secure
	const { Name, Email, Password, currentPassword } = req.body; // Updated credentials from request body
	const Profile_image = req.file; // Profile image

	try {

		const match = await bcrypt.compare(currentPassword, req.user.Password)
		if (!match) {
			return res.status(403).json({ message: "Current password is incorrect" });
		}

		let hashedPassword = null;
		if (Password) {
			// Hash the new password before storing it
			hashedPassword = await bcrypt.hash(Password, 10);
		}

		// SQL query to update user data
		// updateQuery allows for multiple fields to be updated simultaneously
		let updateQuery = "UPDATE user SET ";
		let queryParams = [];

		if (Name) {
			updateQuery += "Name = ?, ";
			queryParams.push(Name);
		}
		if (Email) {
			updateQuery += "Email = ?, ";
			queryParams.push(Email);
		}
		if (hashedPassword) {
			updateQuery += "Password = ?, ";
			queryParams.push(hashedPassword);
		}
		if (Profile_image) {
			const Profile_image_name = Profile_image.filename;
			updateQuery += "Profile_image = ?, ";
			queryParams.push(Profile_image_name);
		}

		// Remove trailing comma and space
		if (queryParams.length > 0 ) {
			updateQuery = updateQuery.slice(0, -2);
		}
		updateQuery += " WHERE ID = ?";
		queryParams.push(userId);

		userDb.run(updateQuery, queryParams, function (err) {
			if (err) {
				console.error(err.message);
				return res.status(500).json({ message: "Internal server error" });
			}
			if (this.changes === 0) {
				return res.status(404).json({ message: "Item not found" });
			}
			return res.status(200).json({ message: "User updated successfully", id: this.lastID });
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
});
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});