import express from "express";
import { createCollection, editCollection, getCollections,getSingleCollection } from "../controller/createCollectionControler.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/create", verifyToken, createCollection);
router.put("/edit/:id", verifyToken, editCollection);
router.get("/", verifyToken, getCollections);
router.get("/collection/:id", verifyToken, getSingleCollection);

export default router;