const helmet = require("helmet");
const hpp = require("hpp");
// const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const suspiciousBlocker = (req, res, next) => {
  const patterns = [
    "cmd",
    "sco",
    "shell",
    "upload",
    "config",
    ".env",
    "php",
    "admin",
    "wp",
  ];

  const isBad =
    patterns.some((p) => req.url.toLowerCase().includes(p)) ||
    req.url.endsWith(".php");

  if (isBad) {
    return res.status(403).send("⛔ Forbidden");
  }

  next();
};

// const limiter = rateLimit({
//   windowMs: 10 * 60 * 1000,
//   max: 2,
//   message: "⛔ Too many requests, try again later.",
//   handler: (req, res, next) => {
//     res.status(429).send({
//       message: "⛔ تم حظر الوصول مؤقتًا بسبب عدد كبير من الطلبات. حاول لاحقًا.",
//     });
//   },
// });

module.exports = function (app) {
  app.use(helmet());
  app.use(hpp());
  // app.use(limiter);
  app.use(suspiciousBlocker);
  app.use(mongoSanitize());
  app.use(xss());
};
