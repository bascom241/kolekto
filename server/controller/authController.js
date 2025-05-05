import User from "../models/userSchema.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendEmail, sendResetSuccessfullEmail, sendPasswordResetEmail } from "../mails/email.js";
const register = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, phoneNumber } = req.body;
        console.log(req.body);
        const requiredFields = ["fullName", "email", "password", "confirmPassword", "phoneNumber"];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ message: `Please provide ${missingFields.join(", ")}` });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        console.log(2, existingUser);
        const existingPhoneNumber = await User.findOne({ phoneNumber });
        if (existingPhoneNumber) {
            return res.status(400).json({ message: "Phone number already exists" });
        }
        const hashedPassowrd = await bcrypt.hash(password, 10);
        if (!hashedPassowrd) {
            return res.status(500).json({ message: "Error hashing password" });
        }


        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            fullName,
            email,
            password: hashedPassowrd,
            confirmPassword,
            phoneNumber,
            verificationToken
        });

        console.log(3,user)

        await user.save();
        generateTokenAndSetCookie(user, res);
        console.log(user.verificationToken);
        await sendEmail(email, verificationToken, fullName);
        return res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const requiredFields = ["email", "password"];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ message: `Please provide ${missingFields.join(", ")}` });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
   
        generateTokenAndSetCookie(user, res);
        res.status(200).json({ message: "User logged in successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

const verifyEmail = async (req, res) => {
    try {


        const { code } = req.body;
        if (!code) return res.status(403).json({ success: false, message: "Verification code is required" });

        const user = await User.findOne({
            verificationToken: { $exists: true },
            verificationTokenExpiresDate: { $gte: Date.now() }
        });

        if (!user) return res.status(403).json({ sucess: false, message: "Token Expired" });

        const isMatch = await bcrypt.compare(code, user.verificationToken);
        if (!isMatch) return res.status(403).json({ success: false, message: "Invalid Token" })

        user.isVerified = true;
        user.verificationTokenExpiresDate = undefined;
        user.verificationToken = undefined;
        await user.save();
        res.status(200).json({ success: true, message: "User Verified" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


const forgetPassord = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(401).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const resetPasswordToken = crypto.randomBytes(32).toString("hex");
        const resetPasswordExpiresDate = Date.now() + 3600000;

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpiresDate = resetPasswordExpiresDate;
        await user.save();
        await sendPasswordResetEmail(email, user.fullName, `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`);
        res.status(200).json({ success: true, message: `Reset Password sent to ${email}` });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

const resetPassword = async (req, res) => {

    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: "Token and password are required" });
        }

        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpiresDate: { $gt: Date.now() } });
        if (!user) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        if (!hashedPassword) {
            return res.status(500).json({ message: "Error hashing password" });
        }
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresDate = undefined;

        await user.save();
        await sendResetSuccessfullEmail(user.email);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

 const logout  = async(req,res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export { register, login, forgetPassord, resetPassword,verifyEmail,logout };


