import jwt from 'jsonwebtoken'
const verifyToken = (req,res,next) =>{
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({message:"Unauthorized"})
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err){
            return res.status(403).json({message:"Forbidden"})
        }
        req.user = decoded;
        next();
    })
}

export default verifyToken;