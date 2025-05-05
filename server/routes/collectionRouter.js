import express from "express";
import { createCollection, editCollection} from "../controller/createCollectionControler.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();


router.post("/create",verifyToken, createCollection);
router.put("/edit/:id", verifyToken, editCollection)
export default router;