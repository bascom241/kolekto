import contributorSchema from "../models/contributorSchema.js";
import registerCollectionSchema from "../models/registerCollectionSchema.js";

export const generateParticipantUniqueCode = async(collectionId) => {

   // 1. Find the collection
   const collection = await registerCollectionSchema.findById(collectionId);
   if (!collection) {
     return res.status(404).json({ success: false, message: "Collection not found" });
   }

   // 2. Count existing contributors for this collection
   const count = await contributorSchema.countDocuments({ collection: collectionId });

   // 3. Generate next sequence number, padded to 3 digits
   const nextNumber = String(count + 1).padStart(3, '0');

   // 4. Use collection prefix and next number
   const contributorUniqueCode = `${collection.code}_${nextNumber}`;

   return contributorUniqueCode;
}