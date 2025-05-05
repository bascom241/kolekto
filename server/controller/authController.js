import User from "../models/userSchema.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendEmail } from "../mails/email.js";
const register = async (req,res) => {
    try {
        const {fullName,email,password,confirmPassword,phoneNumber} = req.body;
        const requiredFields = ["fullName","email","password","confirmPassword","phoneNumber"];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if(missingFields.length > 0) {
            return res.status(400).json({message:`Please provide ${missingFields.join(", ")}`});
        }

        const existingUser = await User.findOne({email});
        if(existingUser) {
            return res.status(400).json({message:"User already exists"});
        }
        const existingPhoneNumber = await User.findOne({phoneNumber});
        if(existingPhoneNumber) {
            return res.status(400).json({message:"Phone number already exists"});
        }
        const hashedPassowrd = await bcrypt.hash(password, 10);
        if(!hashedPassowrd) {
            return res.status(500).json({message:"Error hashing password"});
        }


        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            fullName,
            email,
            password:hashedPassowrd,
            phoneNumber,
            verificationToken
        });

        await user.save();
        generateTokenAndSetCookie(user,res);
        await sendEmail(email,verificationToken,fullName);
        return res.status(201).json({message:"User registered successfully",user});
    } catch (error) {
        
    }
}

const login = async(req,res) => {

}

export  {register,login};


