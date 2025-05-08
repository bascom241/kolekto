import RegisterCollection from "../models/registerCollectionSchema.js";

const createCollection = async (req, res) => {
    try {
        const {
            collectionTittle,
            collectionDescription,
            amount,
            amountBreakdown,
            deadline,
            numberOfParticipants,
            participantInformation,
            generateUniqueCodes,
            codePrefix
        } = req.body;

        console.log("Create collection request body:", req.body);

        const requiredFields = ["collectionTittle", "amount", "amountBreakdown", "numberOfParticipants"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ success: false, message: `Please provide ${missingFields.join(", ")}` });
        }

        if (participantInformation && Array.isArray(participantInformation)) {
            for (const field of participantInformation) {
                if (!field.name) {
                    return res.status(400).json({
                        success: false,
                        message: "Each participant information field must have a 'name'"
                    });
                }
            }
        }

        let collectionCode = null;
        if (generateUniqueCodes && codePrefix) {
            let attempts = 0;
            const maxAttempts = 10;
            while (attempts < maxAttempts) {
                collectionCode = `${codePrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
                const existing = await RegisterCollection.findOne({ code: collectionCode });
                if (!existing) {
                    break;
                }
                attempts++;
            }
            if (attempts >= maxAttempts) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to generate a unique collection code"
                });
            }
        }

        const collection = new RegisterCollection({
            user: req.user?.userId,
            collectionTittle,
            collectionDescription,
            amount,
            amountBreakdown: amountBreakdown.feeBearer,
            deadline,
            numberOfParticipants,
            participantInformation,
            code: collectionCode
        });

        await collection.save();
        res.status(201).json({ success: true, message: "Collection created successfully", collection });
    } catch (error) {
        console.error("Error in createCollection:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

const editCollection = async (req, res) => {
    try {
        const { collectionTittle, collectionDescription, deadline, numberOfParticipants } = req.body;
        const requiredFields = ["collectionTittle", "collectionDescription", "amountBreakdown", "numberOfParticipants"];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ success: false, message: `Please provide ${missingFields.join(", ")}` });
        }

        const collection = await RegisterCollection.findByIdAndUpdate(
            req.params.id,
            {
                collectionTittle,
                collectionDescription,
                deadline,
                numberOfParticipants
            },
            { new: true }
        );

        if (!collection) {
            return res.status(404).json({ success: false, message: "Collection not found" });
        }

        res.status(200).json({ success: true, message: "Collection updated successfully", collection });
    } catch (err) {
        console.error("Error in editCollection:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getCollections = async (req, res) => {
    try {
        const collections = await RegisterCollection.find({ user: req.user?.userId }).lean();

        // Map collections to match CollectionCard props
        const formattedCollections = collections.map(collection => ({
            id: collection._id.toString(),
            title: collection.collectionTittle,
            description: collection.collectionDescription,
            amount: collection.amount,
            deadline: collection.deadline ? new Date(collection.deadline).toISOString() : null,
            status: collection.deadline && new Date(collection.deadline) < new Date()
                ? 'expired'
                : collection.participantInformation?.every(field => field.required && field.value)
                ? 'completed'
                : 'active',
            participants_count: collection.participantInformation?.filter(field => field.value).length || 0,
            max_participants: collection.numberOfParticipants,
            created_at: collection.createdAt ? new Date(collection.createdAt).toISOString() : null
        }));

        res.status(200).json({ success: true, collections: formattedCollections });
    } catch (error) {
        console.error("Error in getCollections:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
const getSingleCollection = async (req, res) => {
    try {
        const collection = await RegisterCollection.findById(req.params.id).lean();

        console.log(collection);
        if (!collection) {
            return res.status(404).json({ success: false, message: "Collection not found" });
        }

        // Format the single collection to match CollectionCard props, similar to getCollections
        const formattedCollection = {
            id: collection._id.toString(),
            title: collection.collectionTittle,
            description: collection.collectionDescription,
            amount: collection.amount,
            deadline: collection.deadline ? new Date(collection.deadline).toISOString() : null,
            status: collection.deadline && new Date(collection.deadline) < new Date()
                ? 'expired'
                : collection.participantInformation?.every(field => field.required && field.value)
                ? 'completed'
                : 'active',
            participants_count: collection.participantInformation?.filter(field => field.value).length || 0,
            max_participants: collection.numberOfParticipants,
            created_at: collection.createdAt ? new Date(collection.createdAt).toISOString() : null
        };

        res.status(200).json({ success: true, collection: formattedCollection });
    } catch (error) {
        console.error("Error in getSingleCollection:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export { createCollection, editCollection, getCollections, getSingleCollection };