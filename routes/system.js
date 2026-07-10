const express = require('express');
const cookieParser = require('cookie-parser');
const { randomInt } = require('node:crypto');
const { db } = require("../db");
const { ObjectId } = require("mongodb");
const router = express.Router();
router.use(cookieParser());

const users = [];




function authenticate(role = null) {
    return (req, res, next) => {

        if (!req.session || !req.session.user) {
            return res.status(401).json({
                error: "Not Logged In"
            });
        }

        if (role && req.session.user.role !== role) {
            return res.status(403).json({
                error: "Access Denied"
            });
        }

        next();
    };
}


router.get("/offers", authenticate("user"), async (req, res) => {
    try {
        const offers = await db()
            .collection("offers")
            .find({})
            .toArray();
        res.json({ offers , user: req.session.user.username });
    } catch (error) {
        console.error("Error fetching offers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
    
});



router.post("/delete-offer", authenticate("user"), async (req, res) => {
    const { offerId } = req.body;

    if (!ObjectId.isValid(offerId)) {
        return res.status(400).json({ error: "Invalid offer ID" });
    }

    const username = req.session.user.username;

    try {
        const result = await db()
            .collection("offers")
            .deleteOne({
                _id: new ObjectId(offerId),
                seller: username
            });

        if (result.deletedCount === 0) {
            return res.status(403).json({
                error: "You cannot delete this offer."
            });
        }

        res.json({
            message: "Offer deleted successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

router.post("/create", authenticate("user"), async (req, res) => {
    const { image, title, offering, wants } = req.body;
    
    if (!image || !title || !offering || !wants) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const clean = (str) => str.trim();

    const newOffer = {
        image: clean(image),
        title: clean(title),
        seller: clean(req.session.user.username),
        offering: clean(offering),
        wants: clean(wants),
        createdAt: new Date()
    };

    if (
    title.length > 100 ||
    
    offering.length > 200 ||
    wants.length > 200 ||
    image.length > 500
    ) {
        return res.status(400).json({ error: "Data too long" });
    }
    await db()
    .collection("offers")
    .insertOne(newOffer)
    .then(result => {
        res.status(201).json({ message: "Offer created successfully", offerId: result.insertedId });
    })
    .catch(error => {
        console.error("Error creating offer:", error);
        res.status(500).json({ error: "Internal Server Error" });
    });
});


module.exports = router;