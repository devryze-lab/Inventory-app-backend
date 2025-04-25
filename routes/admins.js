const express = require('express');
const admin = require("../models/admin")
const router = express.Router();
const bycrpt = require('bcrypt')

const saltRounds = 10;

router.post("/", async(req,res)=>
{
    // console.log(req.body);

    try
    {
        const { name, password } = req.body;
        bycrpt.hash(password,saltRounds, async(err,hash)=>
        {
            const admindb = await admin.findById('680a8719837324c01f3da700');
            // console.log(admindb);
            if(admindb.username == name)
            {
                bycrpt.compare(password,admindb.password,(err,result)=>
                {
                    if(result)
                    {
                        res.status(201).json(1);
                    }
                    else{
                        res.status(401).json(0);
                    }
                })
            }
            // const newadmin = new admin({
            //     username:name,
            //     password:hash
            // });
            // await newadmin.save();
            
        })
    }
    catch(e)
    {
        res.status(401).json(0);
    }
    
});


module.exports = router;