const { Router } = require("express");
const userSchema = require("../validations/user.validation");
const userModel = require("../models/user.model");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const isAuth = require("../middlewares/isAuth.middleware");
require('dotenv').config()

const authRouter = Router()

authRouter.post('/sign-up', async (req, res) => {
    const {error} = userSchema.validate(req.body || {})
    if(error){
        return res.status(400).json(error)
    }
    const {fullName, email, password} = req.body

    const existUser = await userModel.findOne({email})
    if(existUser){
        return res.status(400).json({message: 'user already exist'})
    }

    const hashedPass = await bcrypt.hash(password, 10)
    await userModel.create({fullName, password: hashedPass, email})
    res.status(201).json({message: "user regisgted successfully"})

})


authRouter.post('/sign-in', async (req, res) => {
    const {email, password} = req.body
    if(!email || !password) {
        return res.status(400).json({message: 'email and password is required'})
    }

    const existUser = await userModel.findOne({email}).select('password role')
    if(!existUser){
        return res.status(400).json({message: 'emial or password is invalid'})
    }

    const isPassEqual = await bcrypt.compare(password, existUser.password)
    if(!isPassEqual){
        return res.status(400).json({message: 'emial or password is invalid'})
    }

    const payload = {
        userId: existUser._id,
        role: existUser.role
    }

    const token = await jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'})

    res.json(token)
})

authRouter.get('/current-user', isAuth, async (req, res) => {
    const user = await userModel.findById(req.userId)
    res.json(user)
})

module.exports = authRouter