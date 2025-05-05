import mongoose from 'mongoose';
import crypto from 'crypto'


let counter = 0;

const generateRandomString = () => {
    counter++;
    return counter.toString().padStart(5, '0');
};
// const generateRandomString = () => {
//     return Math.floor(100000 + Math.random() * 900000).toString();
// };
const registerCollectionSchema = new mongoose.Schema({
    collectionTittle: {
        type: String,
        required: [true, "Please enter a collection title"],
        trim: true
    },
    collectionDescription: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: [true, "Please enter a collection amount"],

    },

    amountBreakdown: {
        type: String,
        required: [true, "Please enter a collection amount breakdown"],
        enum: ["organizer", "contributor"]
    },
    deadline: {
        type: Date,
        default: Date.now()
    },
    numberOfParticipants: {
        type: Number,
        default: 1,
        minLength: 1
    },
    code: {
        type: String,
        unique: true,
        sparse: true,
    },
    participantInformation: [
        {
            key: {
                type: String,
                required: [true, "Please enter a key"],
                trim: true
            },
            value: {
                type: String,
                required: function () {
                    return this.required
                },
                trim: true
            },
            required: {
                type: Boolean,
                default: false
            }
        }
    ]
});

registerCollectionSchema.pre("validate", function (next) {
    const keys = this.participantInformation.map(item => item.key);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
        return next(new Error("Duplicate keys found in participant information"));
    }
    next();
})

registerCollectionSchema.pre("save", async function (next) {


    if (!this.participantInformation || this.participantInformation.length === 0) {
        return next()
    }

    const customKey = this.participantInformation.find(item => item.key === "code");
    if (!customKey) {
        return next()
    }

    if (!this.isNew && this.isModified("participantInformation")) {
        return next()
    }

    const baseValue = customKey.value.trim().toLowerCase() === 'mycode' ? 'mycode' : customKey.value.trim();
    let newValue;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        newValue = `${baseValue}-${generateRandomString()}`;
        const existing = await this.constructor.findOne({
            'participantInformation.key': 'code',
            'participantInformation.value': newValue,
        });
        if (!existing) {
            customKey.value = newValue;
            return next();
        }
        attempts++;

        return next(new Error('Unable to generate a unique code for custom field "code"'));
    }

})

registerCollectionSchema.index(
    { 'customFields.key': 1, 'participantInformation.value': 1 },
    { unique: true, sparse: true, partialFilterExpression: { 'participantInformation.key': 'code' } }
);

const RegisterCollection = mongoose.model("RegisterCollection", registerCollectionSchema);
export default RegisterCollection;