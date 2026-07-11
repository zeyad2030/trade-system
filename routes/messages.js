const express = require('express');
const cookieParser = require('cookie-parser');
const { randomInt } = require('node:crypto');
const { db } = require("../db");
const { ObjectId } = require("mongodb");
const router = express.Router();
router.use(cookieParser());
let messages = [];
let nextId = 1;


function authenticate(role = null) {
    return (req, res, next) => {
        // Debugging line
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

router.get('/getmessages/:name', authenticate("user"),async (req, res) => {
const from = req.params.name;
var messages = await db()
.collection("messages")
.find({
    $or: [
        { from: req.session.user.username },
        { to: req.session.user.username }
    ]
})
.toArray();
messages = messages.filter(message => (message.from === from || message.to === from));
res.json({ messages , user: req.session.user.username });
});


router.post('/', authenticate("user"), async(req, res) => {
    const { to, text } = req.body;
    const io = req.app.get("io");
    
    from = req.session.user.username; // Assuming the sender is the logged-in user
    if (!from || !to || !text) {
        return res.status(400).json({ error: 'يرجى إرسال from و to و text' });
    }
    const userExists = await db()
    .collection("users")
    .findOne({
            username: to
        });
        
    if (!userExists) {
        return res.status(404).json({ error: 'المستخدم المستلم غير موجود' });
    }

    const message = {
        from,
        to,
        text,
        createdAt: new Date().toISOString(),
    };

    await db()
    .collection("messages")
    .insertOne(message);
    io.to(message.to).emit("receive-message", message);
    res.status(201).json(message);
});

router.delete('/deletechat/:name', authenticate("user"), async (req, res) => {
    const name = req.params.name;
    const io = req.app.get("io");
    const userExists = await db()
    .collection("users")
    .findOne({
            username: name
        });
    if (!userExists) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
    }



    const result = await db()
        .collection("chats")
        .deleteOne({ $or: [{ from: req.session.user.username,to: name }, { to: req.session.user.username, from: name }] });
    await db()
    .collection("messages")
    .deleteMany({ $or: [{ from: req.session.user.username, to: name }, { from: name, to: req.session.user.username }] });
    if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'المحادثه غير موجودة' });
    }
    io.to(name).emit("refresh-chats");
    res.json({ success: true });
});


router.post("/chatcreate", authenticate("user"), async (req, res) => {
    const { to} = req.body;
    const from = req.session.user.username; // Assuming the sender is the logged-in user
    const io = req.app.get("io");
    if (!from || !to ) {
        return res.status(400).json({ error: 'يرجى إرسال from و to و text' });
    }
    const chat = {
        id: randomInt(1, 1000000),
        from,
        to,
        
    }
    const userExists = await db()
    .collection("users")
    .findOne({
            username: to
        });
        
    if (!userExists) {
        return res.status(404).json({ error: 'المستخدم المستلم غير موجود' });
    }
    const chatExists = await db()
    .collection("chats")
    .findOne({
        $or: [
            { from: from, to: to },
            { from: to, to: from }
        ]
    });
    if (chatExists) {
        return res.status(400).json({ error: 'الدردشة موجودة بالفعل' });
    }
    await db()
    .collection("chats")
    .insertOne(chat);
    io.to(chat.to).emit("receive-chat", from);
    res.status(201).json(chat);
});
router.get("/chats", authenticate("user"), async (req, res) => {
    try {  
        console.log("Fetching chats for user:", req.session.user.username);
        const chats = await db()
            .collection("chats")
            .find({
                $or: [
                    { "from": req.session.user.username },
                    { "to": req.session.user.username }
                ]
            })
            .toArray();
        res.json({ chats , user: req.session.user.username });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }});


module.exports = router;