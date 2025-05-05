import mongoose from "mongoose";
import validator from "validator";



const phoneRegex = /^(?:\+88)?01[3-9]\d{8}$/;
const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:[true, "Please provide your Full name"],
        trim:true,
    },
    email:{
        type:String,
        required:[true, "Please Provide Your Email"],
        unique:true,
        validate:{
            validator:function(v){
                return validator.isEmail(v)
            },
            message:(props) => `${props.value} is not a valid email!`
        }
    },
    password:{
        type:String,
        required:[true, "Please Provide Your Password"],
        minlength:6,
        select:false
    },
    confirmPassword:{
        type:String,
        required:[true, "Please Provide Your Password"],
        validate:{
            validator:function(v){
                return v === this.password
            },
            message:(props) => `${props.value} is not the same as password!`
        }
    },
    phoneNumber:{
        type:String,
        required:[true, "Please Provide Your Phone Number"],
        unique:true,
        validate:{
            validator:function(v){
                return phoneRegex.test(v)
            },
            message:(props) => `${props.value} is not a valid phone number!`
        }
    },
    role:{
        type:String,
        enum:["user", "admin"],
        default:"user"
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    lastLogin:{
        type:Date,
        default:Date.now()
    },
    resetPasswordToken:String,
    resetPasswordExpiresDate:Date,
    verificationToken:String,
    verificationTokenExpiresDate:Date
},{timestamps:true});

const User = mongoose.model("User", userSchema);
export default User;