// Message name: env_generator.js
// Auth: Terminal Swag Disorder
// Desc: File containing code for generating an env file for development time

// Never run this in actual production

const crypto = require("crypto");
const fs = require("fs");

const newSecret = crypto.randomBytes(64).toString("hex");
const secret = `JWT_SECRET=${newSecret}`
const apiEndpoint = "API_ENDPOINT=http://localhost:8080/"
const env_data = `${secret}\n${apiEndpoint}\n`;

fs.writeFile("./.env", env_data, err => {
if (err) {
	console.error("Error generating env file: ", err);
} else {
	console.log("Env file successfully generated")
}
});