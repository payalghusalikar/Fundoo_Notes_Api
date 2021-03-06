/**
 * @module       app
 * @file         server.js
 * @description  connecting to server and rendering all routes
 * @author       Payal Ghusalikar <payal.ghusalikar9@gmail.com>
*  @since        27/01/2021  
-----------------------------------------------------------------------*/

const express = require("express");
var session = require("express-session");
const bodyParser = require("body-parser");
require("./config/mongoDB.js")();
// create express app
const app = express();
require("./config").set(process.env.NODE_ENV, app);
const config = require("./config").get();
const logger = require("../../logger/logger.js");
const uuid = require("uuid").v4;
const cookieParser = require("cookie-parser");

require("dotenv").config();

/**
 * @description require swagger-ui and swagger.json
 */
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./lib/swagger.json");

//set express view engine
app.set("view engine", "ejs");

// parse requests of content-type - application/x-www-form-urlencoded - extended is a key
app.use(bodyParser.urlencoded({ extended: true }));

// parse requests of content-type - application/json
app.use(bodyParser.json());
app.use(cookieParser());

app.set("trust proxy", 1); // trust first proxy
app.use(
    session({
        genid: function(req) {
            return uuid(); // use UUIDs for session IDs
        },
        secret: "sessionpassword",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, secure: true },
    })
);

// define a simple route and data in json format
app.get("/", (req, res) => {
    res.json({ message: "Welcome to FundooNotes Application. " });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Require Notes routes
require("./app/routes/note.js")(app);

// Require User routes

require("./app/routes/user.js")(app);

// Require label routes
require("./app/routes/label.js")(app);

const port = config.port || 2001;
app.listen(port, () => {
    logger.info(`Server is listening on port: ${port}`);
});

module.exports = app;