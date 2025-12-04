const jsonwebtoke=require('jsonwebtoken');

const login=(request,response)=>{
    const {username,password}=request.body;
    try{
        response.status(200).json({status:"success", message:"Login Successful"})
    }catch(error){
        response.status(500).json({status:"error", message:"Internal Server Error"});
    }
}

module.exports={login}