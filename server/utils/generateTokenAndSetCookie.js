import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

export const generateTokenAndSetCookie = (user, res) => {
    const token = jwt.sign({userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    // Set the cookie with the token
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        sameSite: 'Strict'
    });

    return token;
}
