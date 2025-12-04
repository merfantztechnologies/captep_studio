const express=require("express");
const { login } = require(".");
const router=express.Router();

router.post('/login', login);

module.exports=router