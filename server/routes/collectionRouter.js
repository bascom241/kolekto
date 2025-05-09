import express from "express";
import {
  createCollection,
  editCollection,
  getCollections,
  getSingleCollection,
  createContributor,
  getContributors,
  getAllContributors,
} from "../controller/createCollectionControler.js"; // Adjusted to match existing controller
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

// Collection routes
router.post("/create", verifyToken, createCollection);
router.put("/:id", verifyToken, editCollection);
router.get("/", verifyToken, getCollections);
router.get("/collection/:id", verifyToken, getSingleCollection);

// Contributor routes
router.post("/:id/contributors", createContributor); // Public for contribution
router.get("/:id/contributors", verifyToken, getContributors);
router.get("/contributors", verifyToken, getAllContributors); // Required for DashboardPage

export default router;