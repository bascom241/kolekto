import mongoose from 'mongoose';
import crypto from 'crypto';

let counter = 0;

const generateRandomString = () => {
    counter++;
    return counter.toString().padStart(5, '0');
};

const registerCollectionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please provide a user"]
    },
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
        required: [true, "Please enter a collection amount"]
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
        min: [1, "Number of participants must be at least 1"]
    },
    code: {
        type: String,
        unique: true,
        sparse: true
    },
    participantInformation: [
        {
            name: {
                type: String,
                required: [true, "Please enter a field name"],
                trim: true
            },
            type: {
                type: String,
                enum: ['text', 'email', 'tel', 'number'],
                default: 'text'
            },
            value: {
                type: String,
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
    const names = this.participantInformation.map(item => item.name);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
        return next(new Error("Duplicate field names found in participant information"));
    }
    next();
});

registerCollectionSchema.pre("save", async function (next) {
    if (!this.participantInformation || this.participantInformation.length === 0) {
        return next();
    }

    const customField = this.participantInformation.find(item => item.name === "code");
    if (!customField) {
        return next();
    }

    if (!this.isNew && this.isModified("participantInformation")) {
        return next();
    }

    const baseValue = customField.value?.trim().toLowerCase() === 'mycode' ? 'mycode' : customField.value?.trim() || 'code';
    let newValue;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        newValue = `${baseValue}-${generateRandomString()}`;
        const existing = await this.constructor.findOne({
            'participantInformation.name': 'code',
            'participantInformation.value': newValue
        });
        if (!existing) {
            customField.value = newValue;
            return next();
        }
        attempts++;
    }

    return next(new Error('Unable to generate a unique code for custom field "code"'));
});

registerCollectionSchema.index(
    { 'participantInformation.name': 1, 'participantInformation.value': 1 },
    { unique: true, sparse: true, partialFilterExpression: { 'participantInformation.name': 'code' } }
);

const RegisterCollection = mongoose.model("RegisterCollection", registerCollectionSchema);
export default RegisterCollection;