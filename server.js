const express = require('express')
const dotenv = require('dotenv').config()
const bcrypt = require('bcrypt')
const connectToDb = require('./dbConfig/dbConnection')
const Register = require('./models/registerModel')
const nodemailer = require('nodemailer')
const cors = require('cors')
const Otp = require('./models/otpModel')
const router = express.Router()

dotenv
connectToDb()
const app = express()
app.use(cors())
app.use(express.json())

//setting up nodemailer
let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });

// testing nodemailer success
transporter.verify((error, success) => {
    if(error){
        console.log(error)
    }else{
        console.log("Ready for message")
        console.log(success)
    }
})
  
app.post('/signup', async ( req, res ) => {
    let { name, email, password } = req.body

    try{
        await connectToDb()

        if(!name || !email || !password ){
           res.status(400).json({ message: 'All field are mandatory'})
        }

        const checkEmail = await Register.findOne({ email }) 

        if(!checkEmail){
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(password, salt);

            const newRegister = await Register({
                name,
                email,
                password: hashPassword,
                verified: false
            })
           
            const result = await newRegister.save()
            sendOtpVerification(result, res)
            
            return res.status(201).json({ message: 'Registration Completed'})
            
        }else{
            return res.status(400).json({ message: 'User Already exsit'})
        }
    }catch(err){

    }
})

const sendOtpVerification = async ({ _id, email }, res ) => {
    try{
        const otp = `${Math.floor(1000 + Math.random() * 9999 )}`
    
        const mailDetails = {
            from: 'emmaranking07@gmail.com',
            to: email,
            subject: "Verify your email",
            html: `<p>Enter your otp ${otp} here</p>`
        }

        // hash the otp
        const salt = await bcrypt.genSalt(10)
        const hashOtp = await bcrypt.hash(otp, salt);

        const newOtp = await new Otp({
            userId: _id,
            otp: hashOtp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000
        })

        await newOtp.save()
        await transporter.sendMail(mailDetails)

        return res.json({
            staus: "PENDING",
            message: "Verification otp email send ",
            data: {
                userId: _id,
                email
            }
        })
    }catch(error){
        return res.json({ status: "FAILED", message: error.message })
    }

}

//verifying Otp
app.post('/verifyOtp', async ( req, res ) => {
    try{
        const { userId, otp } = req.body

    if( !userId || !otp ){
        throw Error('Input the opt code')
    }else{
        const otpVerification = await Otp.find({ userId })

        if(otpVerification.length <= 0){
            throw new Error("Account record doesn't exist or has been verify")
        }else{
            
            const { expiresAt } = otpVerification[0]
            const hashedOtp = otpVerification[0].otp

            if(expiresAt < Date.now()){
                await Otp.deleteOne({ userId })

                throw new Error('Code has expired. Request new code')
            }else{
                const validOtp = await bcrypt.compare(otp, hashedOtp)

                if(!validOtp){
                    throw new Error("Invalid Otp")
                } else {
                    await Register.updateOne({ _id: userId }, { verified: true})
                    await Otp.deleteOne({ userId })

                    res.json({
                        status: "VERIFIED",
                        message: "User verify"
                    })
                }
            }
        }
    }
    }catch(err){
        res.json({
            status: "FAILED",
            message: err.message
        })
    }
})

//resend otp
app.post('/resendOtp', async ( req, res ) => {
    try{
        const { userId, email } = req.body

    if( !userId || !email ){
        throw Error('Input the opt code')
    }else{
        await Otp.deleteOne({ userId })
        sendOtpVerification({ _id: userId, email }, res )
    }
    }catch(err){
        res.json({
            status: "FAILED",
            message: err.message
        })
    }
})
app.listen(8000, () => {
    console.log('App is listen')
})