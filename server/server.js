const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors()); 

const PORT = 5000;
const DATA_FOLDER = path.join(__dirname, "data"); 

const USERS_FILE = path.join(__dirname, "users.json"); 
const SECRET_KEY = "my secret key ";

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

app.use(express.json());
//simluating registering and adding new users

// Register a new user
app.post("/api/register", async (req, res) => {
    const { username, password,email,confirm_password } = req.body;
    if (!username || !password || !email || !confirm_password) {
        return res.status(400).json({ error: "Enter valid details" });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ error: "User already exists" });
    }

    if(password != confirm_password){
        return res.status(500).json({ error: "Pswords do not match" });
    }

    // Hash password before storing
    users.push({ email, password: password });

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return res.status(200).json({ message: "User registered successfully" });

});

// Login user
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and Password are required" });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const user = users.find(user => user.email === email);

    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }

    // Compare passwords
    if (password!=user.password) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    return res.status(200).json({ message:"Login successful"});


});



// validating OTP
app.post("/api/validate-otp", async (req, res) => {
    const { otp } = req.body;
    if (!otp) {
        return res.status(400).json({ error: "One Time Password is required" });
    }

    
    return res.status(200).json({ message:"OTP validation successful"});


});

// handling assignment
app.post("/api/unassign-bike", async (req, res) => {
    const { driverIdEncrypted,vehicleIdEncrypted } = req.body;
    if (!driverIdEncrypted || !vehicleIdEncrypted) {
        return res.status(500).json({ error: "Missing details" });
    }

    
    return res.status(200).json({ message:"bike unassignment successful"});


});

// handling assignment
app.post("/api/assign-bike", async (req, res) => {
    const { driverIdEncrypted,vehicleIdEncrypted } = req.body;
    if (!driverIdEncrypted || !vehicleIdEncrypted) {
        return res.status(500).json({ error: "Missing details" });
    }

    
    return res.status(200).json({ message:"bike assignment successful"});


});


// Route to list available endpoints
app.get("/", (req, res) => {
    fs.readdir(DATA_FOLDER, (err, files) => {
        if (err) return res.status(500).json({ error: "Error reading files" });

        const endpoints = files.map(file => `/api/${file.replace(".json", "")}`);
        res.json({ message: "Available Endpoints", endpoints });
    });
});

// Dynamic route to serve each JSON file
app.get("/api/:filename", (req, res) => {
    const filePath = path.join(DATA_FOLDER, `${req.params.filename}.json`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
    }

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Error reading file" });

        res.json(JSON.parse(data));
    });
});

//serving info from history
app.post("/api/:filename", (req, res) => {
    const { licensePlate, startDate, endDate } = req.body;
    
    if (!licensePlate || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required parameters: licensePlate, startDate, endDate" });
    }
    
    const filePath = path.join(DATA_FOLDER, `${req.params.filename}.json`);
    
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Error reading file" });
        
        try {
            const vehicleData = JSON.parse(data);
            const filteredData = vehicleData.features.filter(feature => {
                return (
                    feature.properties.licensePlate === licensePlate &&
                    new Date(feature.properties.timestamp) >= new Date(startDate) &&
                    new Date(feature.properties.timestamp) <= new Date(endDate)
                );
            });
            
            res.json(filteredData);
        } catch (error) {
            res.status(500).json({ error: "Error parsing JSON data" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});