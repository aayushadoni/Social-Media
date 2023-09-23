const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const requireLogin  = require('../middleware/requireLogin')
const Post =  mongoose.model("Post")
const User = mongoose.model("User")
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtp.gmail.com",
       auth: {
            user: 'test.adoni.me@gmail.com',
            pass: 'mbwfpfmfiqpmqdjo',
         },
    secure: true,
    });

router.get('/user/:id', requireLogin, (req,res)=>{
    User.findOne({_id:req.params.id})
    .select("-password")
    .then(user=>{
        Post.find({postedBy:req.params.id})
        .populate("postedBy","_id name")
        .exec((err, posts)=>{
            if(err){
                return res.status(422).json({error:err})
            }
            res.json({user, posts})
        })
    }).catch(err=>{
        return res.status(404).json({error:"User not found"})
    })
})

router.put('/follow',requireLogin,(req,res)=>{
    User.findByIdAndUpdate(req.body.followId,{
        $push:{followers:req.user._id}
    },{
        new:true
    },(err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
        User.findByIdAndUpdate(req.user._id,{
            $push:{following:req.body.followId}
            
        },{new:true}).select("-password").then(result=>{
            res.json(result)
        }).catch(err=>{
            return res.status(422).json({error:err})
        })
    }
    )
})

router.put('/unfollow',requireLogin,(req,res)=>{
    User.findByIdAndUpdate(req.body.unfollowId,{
        $pull:{followers:req.user._id}
    },{
        new:true
    },(err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
        User.findByIdAndUpdate(req.user._id,{
            $pull:{following:req.body.unfollowId}
            
        },{new:true}).select("-password").then(result=>{
            res.json(result)
        }).catch(err=>{
            return res.status(422).json({error:err})
        })

    }
    )
})

router.put('/updatepic',requireLogin,(req,res)=>{
    User.findByIdAndUpdate(req.user._id,{$set:{pic:req.body.pic}},{new:true},
    (err,result)=>{
        if(err){
            return res.status(422).json({error:"pic canot post"})
        }
        res.json(result)
    })
})

// router.post('/search-users',(req,res)=>{
//     let userPattern = new RegExp("^"+req.body.query)
//     User.find({email:{$regex:userPattern}})
//     .select("_id email")
//     .then(user=>{
//         res.json({user})
//     }).catch(err=>{
//         console.log(err)
//     })
// })

router.get('/allusers', requireLogin, (req, res) => {
    User.find()
    .select("-password")
    .then((users) => {
        res.json({users: users})
    })
    .catch((err) => {
        console.log(err)
    })
})

router.put("/password/forget", async (req, res, next) => {
    const { email } = req.body;
    console.log(email);
    
    try {
        const token = crypto.randomBytes(20).toString('hex');

        // Find the user by email and update the reset token and expiration time
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();

        // Send an email with the reset link
        const resetLink = `http://localhost:3000/reset/${token}`;
        const mailOptions = {
            from: '"Test" <test.adoni.me@gmail.com>',
            to: email,
            subject: 'Password Reset',
            html: `Click on the following link to reset your password: <a href="${resetLink}">${resetLink}</a>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Email could not be sent' });
            }
            console.log('Email sent: ' + info.response);
            return res.status(200).json({ message: 'Email sent successfully' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post("/password/reset", async (req, res) => {
    const { newPassword, resetToken } = req.body; // Rename 'token' to 'resetToken'
    try {
        console.log(newPassword)
        // Find the user by the reset token
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            // Ensure the token is not expired
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear the reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        // Optionally, you can generate a new JWT token and send it to the user for automatic login after password reset
        const newToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET); // Use your own JWT secret

        res.json({ message: "Password reset successfully", token: newToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router
