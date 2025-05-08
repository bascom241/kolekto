import mongoose from 'mongoose'
import validator from 'validator'


const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/; 
const PaymentSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:String,
        required:true,
        // validate:{
        //     validator:function(v){
        //         return phoneRegex.test(v)
        //     },
        //     message:(props) => `${props.value} is not a valid phone number!`
        // }
    },
    paymentReference:{
        type:String,
        required:true,
        unique:true
    },
    amount:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        enum:["pending", "successful", "failed"],
        default:"pending"
    },
    paymentDate:{
        type:Date,
        default:Date.now
    },
    expiryDate:{
        type:Date,
      
    }

})

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;