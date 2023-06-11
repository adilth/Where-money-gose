const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("express-flash");
const logger = require("morgan");
const moment = require("moment");
const helmet = require("helmet");
const cors = require("cors");
const methodOverride = require("method-override");
const connectDB = require("./config/db");
const homeRouter = require("./routes/home");
const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");
const profileRouter = require("./routes/profile");
const errorHandler = require("./middleware/errorHandler");

require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ contentSecurityPolicy: false }));

// Method overwrite
app.use(
  methodOverride((req, res) => {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      let method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);
//ejs
app.use((req, res, next) => {
  res.locals.moment = moment;
  next();
});
app.use(cors());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(logger("dev"));
app.set("trust proxy", 1);
// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: "lax" },
    store: MongoStore.create({ mongoUrl: process.env.CONNECT_DB }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use("/", indexRouter);
app.use("/home", homeRouter);
app.use("/user", userRouter);
app.use("/profile", profileRouter);
app.use((req, res, next) => {
  res.status(404).render("error404.ejs");
});
app.use(errorHandler);
app.listen(process.env.PORT, () => {
  console.log("Server is running, you better catch it!");
});
