import RegisterCollection from '../models/registerCollectionSchema.js';
import Contributor from '../models/contributorSchema.js';
import Payment from '../models/Payment.js';

const createCollection = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      amountBreakdown,
      deadline,
      numberOfParticipants,
      participantInformation,
      generateUniqueCodes,
      codePrefix,
    } = req.body;
console.log(participantInformation);

    const requiredFields = ['title', 'amount', 'amountBreakdown', 'numberOfParticipants'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Please provide ${missingFields.join(', ')}` });
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
          message: 'Unable to generate a unique collection code',
        });
      }
    }

    const collection = new RegisterCollection({
      user: req.user?.userId,
      title,
      description,
      amount,
      amountBreakdown,
      deadline,
      numberOfParticipants,
      participantInformation,
      code: collectionCode,
    });

    await collection.save();
    res.status(201).json({ success: true, message: 'Collection created successfully', collection });
  } catch (error) {
    console.error('Error in createCollection:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const editCollection = async (req, res) => {
  try {
    const { title, description, deadline, numberOfParticipants } = req.body;
    const requiredFields = ['title', 'description', 'numberOfParticipants'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Please provide ${missingFields.join(', ')}` });
    }

    const collection = await RegisterCollection.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        deadline,
        numberOfParticipants,
      },
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    res.status(200).json({ success: true, message: 'Collection updated successfully', collection });
  } catch (error) {
    console.error('Error in editCollection:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCollections = async (req, res) => {
  try {
    const collections = await RegisterCollection.find({ user: req.user?.userId }).lean();

    const formattedCollections = await Promise.all(
      collections.map(async (collection) => {
        const participantsCount =
          (await Contributor.find({ collection: collection._id, status: 'paid' }).countDocuments()) || 0;

        return {
          id: collection._id.toString(),
          title: collection.collectionTitle,
          description: collection.description,
          amount: collection.amount,
          deadline: collection.deadline ? new Date(collection.deadline).toISOString() : null,
          status:
            collection.deadline && new Date(collection.deadline) < new Date()
              ? 'expired'
              : collection.numberOfParticipants && collection.numberOfParticipants <= participantsCount
              ? 'completed'
              : 'active',
          participants_count: participantsCount,
          max_participants: collection.numberOfParticipants,
          created_at: collection.created_at ? new Date(collection.created_at).toISOString() : null,
          participantInformation: collection.participantInformation,
        };
      })
    );

    res.status(200).json({ success: true, collections: formattedCollections });
  } catch (error) {
    console.error('Error in getCollections:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getSingleCollection = async (req, res) => {
  try {
    const collection = await RegisterCollection.findById(req.params.id).lean();

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const participantsCount =
      (await Contributor.find({ collection: collection._id, status: 'paid' }).countDocuments()) || 0;

    const formattedCollection = {
      id: collection._id.toString(),
      title: collection.title,
      description: collection.description,
      amount: collection.amount,
      deadline: collection.deadline ? new Date(collection.deadline).toISOString() : null,
      status:
        collection.deadline && new Date(collection.deadline) < new Date()
          ? 'expired'
          : collection.numberOfParticipants && collection.numberOfParticipants <= participantsCount
          ? 'completed'
          : 'active',
      participants_count: participantsCount,
      max_participants: collection.numberOfParticipants,
      created_at: collection.created_at ? new Date(collection.created_at).toISOString() : null,
      participantInformation: collection.participantInformation,
    };

    res.status(200).json({ success: true, collection: formattedCollection });
  } catch (error) {
    console.error('Error in getSingleCollection:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createContributor = async (req, res) => {
  try {
    const { contributors, amount } = req.body; // contributors: [{ fields: [{ name, type, required, value }] }]
    const { id: collectionId } = req.params;

    const requiredFields = ['contributors', 'amount'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Please provide ${missingFields.join(', ')}` });
    }

    if (!Array.isArray(contributors) || contributors.length === 0) {
      return res.status(400).json({ success: false, message: 'Contributors must be a non-empty array' });
    }

    const collection = await RegisterCollection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const currentParticipants = await Contributor.find({ collection: collectionId, status: 'paid' }).countDocuments();
    if (collection.numberOfParticipants && currentParticipants + contributors.length > collection.numberOfParticipants) {
      return res.status(400).json({ success: false, message: 'Maximum participants reached' });
    }

    // Create a payment record
    const nameField = contributors[0].fields.find(f => f.name.toLowerCase() === 'name')?.value || 'Unknown';
    const emailField = contributors[0].fields.find(f => f.name.toLowerCase() === 'email')?.value || 'N/A';
    const phoneField = contributors[0].fields.find(f => f.name.toLowerCase() === 'phone')?.value || 'N/A';

    const payment = new Payment({
      fullName: nameField,
      email: emailField,
      phoneNumber: phoneField,
      paymentReference: `ref_${Math.floor(100000 + Math.random() * 900000)}`,
      amount,
      status: 'pending',
    });
    await payment.save();

    // Create contributor records
    const contributorDocs = contributors.map(contributor => ({
      collection: collectionId,
      payment: payment._id,
      fields: contributor.fields,
      amount: amount / contributors.length, // Split amount evenly
      status: 'pending',
    }));

    const savedContributors = await Contributor.insertMany(contributorDocs);

    const paymentResponse = {
      status: true,
      message: 'Payment initialized',
      data: {
        authorization_url: `https://checkout.paystack.com/mock_${payment._id}`,
        access_code: `mock_${payment._id}`,
        reference: payment.paymentReference,
      },
    };

    res.status(201).json({
      success: true,
      message: 'Contributors added, payment initialized',
      contributors: savedContributors,
      payment: paymentResponse.data,
    });
  } catch (error) {
    console.error('Error in createContributor:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getContributors = async (req, res) => {
  try {
    const { id: collectionId } = req.params;

    // Validate collectionId
    if (!collectionId || !collectionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid collection ID' });
    }

    const collection = await RegisterCollection.findById(collectionId).lean();
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const contributors = await Contributor.find({ collection: collectionId }).lean();

    const formattedContributors = contributors.map((contributor) => ({
      id: contributor._id.toString(),
      fields: contributor.fields || [],
      paymentId: contributor.payment ? contributor.payment.toString() : null,
      amount: contributor.amount || 0,
      created_at: contributor.createdAt ? new Date(contributor.createdAt).toISOString() : null,
      status: contributor.status || 'pending',
    }));

    res.status(200).json({ success: true, contributors: formattedContributors });
  } catch (error) {
    console.error('Error in getContributors:', {
      message: error.message,
      stack: error.stack,
      collectionId: req.params.id,
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
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
        fields: contributor.fields || [],
        paymentId: contributor.payment ? contributor.payment.toString() : null,
        amount: contributor.amount || 0,
        created_at: contributor.createdAt ? new Date(contributor.createdAt).toISOString() : null,
        status: contributor.status || 'pending',
        collection_title: collection ? collection.title : 'Unknown Collection',
      };
    });

    res.status(200).json({ success: true, contributors: formattedContributors });
  } catch (error) {
    console.error('Error in getAllContributors:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getPayments = async (req, res) => {
  try {
    const { id: collectionId } = req.params;

    if (!collectionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid collection ID' });
    }

    const collection = await RegisterCollection.findById(collectionId).lean();
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const contributors = await Contributor.find({ collection: collectionId }).lean();
    const paymentIds = [...new Set(contributors.map(c => c.payment?.toString()).filter(id => id))]; // Unique, non-null payment IDs
    const payments = await Payment.find({ _id: { $in: paymentIds } }).lean();

    const formattedPayments = payments.map((payment) => ({
      id: payment._id.toString(),
      fullName: payment.fullName,
      email: payment.email,
      amount: payment.amount,
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : null,
      status: payment.status,
    }));

    res.status(200).json({ success: true, payments: formattedPayments });
  } catch (error) {
    console.error('Error in getPayments:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export { createCollection, editCollection, getCollections, getSingleCollection, createContributor, getContributors, getAllContributors, getPayments };