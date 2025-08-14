require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const morgan = require("morgan");

const errorHandler = require("./middlewares/errorHandler");
const ApiError = require("./utils/ApiError");
const cors = require("cors");

const path = require("path");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://dashboard.asasmakeen-mtc.com",
  "https://asasmakeen-mtc.com",
];

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

require("./middlewares/security")(app);

const usersRoute = require("./routes/usersRoutes");
const authRoute = require("./routes/authRouters");
const projectRoute = require("./routes/projectRouters");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ApiError("Not allowed by CORS"));
      }
    },
    methods: ["GET", "PATCH", "POST"],
    credentials: true,
  })
);

connectDB(app);

if (process.env.NODE_MODE === "dev") {
  app.use(morgan("dev"));
}

app.use("/api/v1/user", usersRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/project", projectRoute);

app.get("*", (req, res, next) => {
  if (!req.originalUrl.startsWith("/api")) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  } else {
    next(
      new ApiError(`Sorry, this URL ${req.originalUrl} does not exist`, 400)
    );
  }
  next();
});

app.use((req, res, next) => {
  next(new ApiError(`Cannot find ${req.originalUrl} on this server ⚠️`, 404));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server run in port http://localhost:${PORT} 🚀 `);
});
