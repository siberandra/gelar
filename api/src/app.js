const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middlewares/error");

const app = express();

app.use(cors({ origin: process.env.WEB_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api", require("./routes/profile.routes"));
app.use("/api", require("./routes/event.routes"));
app.use("/api", require("./routes/transaction.routes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
