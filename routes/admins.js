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
            const admindb = await admin.findById('680c959ddfeac2853ad8d78f');
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
            // res.status(201).json(1);
        })
    }
    catch(e)
    {
        res.status(401).json(0);
    }
    
});


module.exports = router;