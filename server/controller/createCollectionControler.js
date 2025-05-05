import RegisterCollection from "../models/registerCollectionSchema.js";

const createCollection = async (req, res) => {
    try {
        const { collectionTittle, collectionDescription, amount, amountBreakdown, deadline, numberOfParticipants,participantInformation } = req.body;
        const requiredFields = ["collectionTittle", "amount", "amountBreakdown", "numberOfParticipants"];
        const misingFields = requiredFields.filter(field => !req.body[field]);

        if (misingFields.length > 0) {
            return res.status(400).json({ message: `Please provide ${misingFields.join(", ")}` });
        }

        if (participantInformation) {
            for (const field of participantInformation) {
                if (field.required && !field.value) {
                    return res.status(400).json({ message: `Value for required Custom field ${field.value} is required` });
                }
            }
        }

        const collection = new RegisterCollection({
            collectionTittle,
            collectionDescription,
            amount,
            amountBreakdown,
            deadline,
            numberOfParticipants,
            participantInformation

        });
        await collection.save();
        res.status(201).json({ message: "Collection created successfully", collection });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


const editCollection = async (req,res) => {
    try{
        const { collectionTittle, collectionDescription, deadline, numberOfParticipants } = req.body;
        const requiredFields = ["collectionTittle", "collectionDescription","amountBreakdown", "numberOfParticipants"];
        const misingFields = requiredFields.filter(field => !req.body[field]);

        if (misingFields.length > 0) {
            return res.status(400).json({ message: `Please provide ${misingFields.join(", ")}` });
        }

        const collection = await RegisterCollection.findByIdAndUpdate(req.params.id, {
            collectionTittle,
            collectionDescription,
            deadline,
            numberOfParticipants
        }, { new: true });

        if (!collection) {
            return res.status(404).json({ message: "Collection not found" });
        }

        res.status(200).json({ message: "Collection updated successfully", collection });
    }catch(err){
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}
export { createCollection,editCollection };