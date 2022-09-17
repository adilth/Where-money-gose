const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("express-flash");
const logger = require("morgan");
const connectDB = require("./config/db");
// const indexRouter = require("./routes/index");
// const homeRouter = require("./routes/home");
// const userRouter = require("./routes/user");

require("dotenv").config({ path: "./config/.env" });

// Passport config
//require('./config/passport')(passport)

connectDB();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger("dev"));
// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // store: new MongoStore({ mongooseConnection: mongoose.connection }),
    store: MongoStore.create({ mongoUrl: process.env.CONNECT_DB }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// app.use("/", indexRouter);
// app.use("/menu", homeRouter);
// app.use("/user", userRouter);

app.listen(process.env.PORT, () => {
  console.log("Server is running, you better catch it!");
});
