const express = require("express");
const router = express.Router();
const { createJob, getAllJobs } = require("../controllers/jobController");
const authenticate = require("../middleware/auth");

router.post("/", authenticate, createJob);
router.get("/", getAllJobs);

module.exports = router;
