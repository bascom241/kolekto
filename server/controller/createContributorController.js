import Contributor from "../models/contributorSchema.js";
import RegisterCollection from "../models/registerCollectionSchema.js";

const createContributor = async (req, res) => {
  try {
    const { name, email, phoneNumber, amount, collectionId } = req.body;

    // Validate input
    if (!name || !email || !phoneNumber || !amount || !collectionId) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Check if collection exists
    const collection = await RegisterCollection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ 
        success: false,
        message: "Collection not found" 
      });
    }

    // Create new contributor
    const contributor = new Contributor({
      name,
      email,
      phoneNumber,
      amount,
      collection: collectionId,
      status: "pending"
    });

    await contributor.save();

    const responseData = {
      success: true,
      message: "Contributor created successfully",
      contributor: {
        id: contributor._id.toString(), // Ensure we return string ID
        name: contributor.name,
        email: contributor.email
      }
    };

    console.log('Sending response:', responseData);
    res.status(201).json(responseData);

  } catch (error) {
    console.error("Error creating contributor:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
};

export { createContributor };