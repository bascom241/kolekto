import RegisterCollection from "../models/registerCollectionSchema.js";
import Contributor from "../models/contributorSchema.js";

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
      codePrefix,
    } = req.body;

    const requiredFields = ["collectionTittle", "amount", "amountBreakdown", "numberOfParticipants"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Please provide ${missingFields.join(", ")}` });
    }

    if (participantInformation && Array.isArray(participantInformation)) {
      for (const field of participantInformation) {
        if (!field.name) {
          return res.status(400).json({
            success: false,
            message: "Each participant information field must have a 'name'",
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
          message: "Unable to generate a unique collection code",
        });
      }
    }

    const collection = new RegisterCollection({
      user: req.user?.userId,
      collectionTittle,
      collectionDescription,
      amount,
      amountBreakdown,
      deadline,
      numberOfParticipants,
      participantInformation,
      code: collectionCode,
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
    const requiredFields = ["collectionTittle", "collectionDescription", "numberOfParticipants"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Please provide ${missingFields.join(", ")}` });
    }

    const collection = await RegisterCollection.findByIdAndUpdate(
      req.params.id,
      {
        collectionTittle,
        collectionDescription,
        deadline,
        numberOfParticipants,
      },
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    res.status(200).json({ success: true, message: "Collection updated successfully", collection });
  } catch (error) {
    console.error("Error in editCollection:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getCollections = async (req, res) => {
  try {
    const collections = await RegisterCollection.find({ user: req.user?.userId }).lean();

    const formattedCollections = await Promise.all(
      collections.map(async (collection) => {
        const participantsCount =
          (await Contributor.find({ collection: collection._id, status: "paid" }).countDocuments()) || 0;

        return {
          id: collection._id.toString(),
          title: collection.collectionTittle,
          description: collection.collectionDescription,
          amount: collection.amount,
          deadline: collection.deadline ? new Date(collection.deadline).toISOString() : null,
          status:
            collection.deadline && new Date(collection.deadline) < new Date()
              ? "expired"
              : collection.numberOfParticipants && collection.numberOfParticipants <= participantsCount
              ? "completed"
              : "active",
          participants_count: participantsCount,
          max_participants: collection.numberOfParticipants,
          created_at: collection.createdAt ? new Date(collection.createdAt).toISOString() : null,
        };
      })
    );

    res.status(200).json({ success: true, collections: formattedCollections });
  } catch (error) {
    console.error("Error in getCollections:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getSingleCollection = async (req, res) => {
  try {
    const collection = await RegisterCollection.findById(req.params.id).lean();

    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    const participantsCount =
      (await Contributor.find({ collection: collection._id, status: "paid" }).countDocuments()) || 0;

    const formattedCollection = {
      id: collection._id.toString(),
      title: collection.collectionTittle,
      description: collection.collectionDescription,
      amount: collection.amount,
      deadline: collection.deadline ? new Date(collection.deadline).toISOString() : null,
      status:
        collection.deadline && new Date(collection.deadline) < new Date()
          ? "expired"
          : collection.numberOfParticipants && collection.numberOfParticipants <= participantsCount
          ? "completed"
          : "active",
      participants_count: participantsCount,
      max_participants: collection.numberOfParticipants,
      created_at: collection.createdAt ? new Date(collection.createdAt).toISOString() : null,
    };

    res.status(200).json({ success: true, collection: formattedCollection });
  } catch (error) {
    console.error("Error in getSingleCollection:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createContributor = async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;
    const { id: collectionId } = req.params;

    const requiredFields = ["name", "email", "amount"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Please provide ${missingFields.join(", ")}` });
    }

    const collection = await RegisterCollection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    if (
      collection.numberOfParticipants &&
      (await Contributor.find({ collection: collectionId, status: "paid" }).countDocuments()) >=
        collection.numberOfParticipants
    ) {
      return res.status(400).json({ success: false, message: "Maximum participants reached" });
    }

    const contributor = new Contributor({
      collection: collectionId,
      name,
      email,
      phone,
      amount,
      status: "pending",
    });

    await contributor.save();

    const paymentResponse = {
      status: true,
      message: "Payment initialized",
      data: {
        authorization_url: `https://checkout.paystack.com/mock_${contributor._id}`,
        access_code: `mock_${contributor._id}`,
        reference: `ref_${contributor._id}`,
      },
    };

    res.status(201).json({
      success: true,
      message: "Contributor added, payment initialized",
      contributor,
      payment: paymentResponse.data,
    });
  } catch (error) {
    console.error("Error in createContributor:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const getContributors = async (req, res) => {
  try {
    const { id: collectionId } = req.params;

    if (!collectionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID" });
    }

    const collection = await RegisterCollection.findById(collectionId).lean();
    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    const contributors = await Contributor.find({ collection: collectionId }).lean();

    const formattedContributors = contributors.map((contributor) => ({
      id: contributor._id.toString(),
      contributor_name: contributor.name || "Unknown",
      contributor_email: contributor.email || "N/A",
      contributor_phone: contributor.phone || null,
      created_at: contributor.createdAt ? new Date(contributor.createdAt).toISOString() : null,
      amount: contributor.amount || 0,
      status: contributor.status || "pending",
    }));

    res.status(200).json({ success: true, contributors: formattedContributors });
  } catch (error) {
    console.error("Error in getContributors:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllContributors = async (req, res) => {
  try {
    const collections = await RegisterCollection.find({ user: req.user?.userId }).lean();
    if (!collections.length) {
      return res.status(200).json({ success: true, contributors: [] });
    }

    const collectionIds = collections.map((c) => c._id);
    const contributors = await Contributor.find({ collection: { $in: collectionIds } })
      .sort({ createdAt: -1 })
      .lean();

    const formattedContributors = contributors.map((contributor) => {
      const collection = collections.find((c) => c._id.toString() === contributor.collection.toString());
      return {
        id: contributor._id.toString(),
        contributor_name: contributor.name || "Unknown",
        contributor_email: contributor.email || "N/A",
        contributor_phone: contributor.phone || null,
        created_at: contributor.createdAt ? new Date(contributor.createdAt).toISOString() : null,
        amount: contributor.amount || 0,
        status: contributor.status || "pending",
        collection_title: collection ? collection.collectionTittle : "Unknown Collection",
      };
    });

    res.status(200).json({ success: true, contributors: formattedContributors });
  } catch (error) {
    console.error("Error in getAllContributors:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export { createCollection, editCollection, getCollections, getSingleCollection, createContributor, getContributors, getAllContributors };