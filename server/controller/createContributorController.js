import Contributor from "../models/contributorSchema.js";
import RegisterCollection from "../models/registerCollectionSchema.js";

const createContributor = async (req, res) => {

console.log("Creating contributor...");
  console.log("Request body:", req.body);

  try {
    const { name, email, phoneNumber, amount, collectionId, participantInformation } = req.body;
console.log(req.body);

    // Validate input
    if (!name || !email || !phoneNumber || !amount || !collectionId || !participantInformation) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }
console.log(participantInformation);

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
      participantInformation: [...participantInformation],
      collection: collectionId,
      status: "pending"
    });

    await contributor.save();

    const responseData = {
      success: true,
      message: "Contributor created successfully",
      contributor: {
        id: contributor._id.toString(), 
        name: contributor.name,
        email: contributor.email,
        participantInformation: contributor.participantInformation,
      }
    };

    console.log('Sending response:', responseData);
    res.status(201).json(responseData);

  } catch (error) {
    console.log("Error creating contributor:", error);
    
    console.error("Error creating contributor:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error" 
    });
  }
};

export { createContributor };