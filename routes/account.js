const express = require('express');
const cookieParser = require('cookie-parser');
const { randomInt } = require('node:crypto');
const { db } = require("../db");
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


router.get('/', authenticate("user"),(req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not Logged In' });
    }

    res.json(req.session.user);
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    });
});

router.post('/login', async(req, res) => {
    const { username, password } = req.body;
    const normalizedUsername = (username || '').trim().toLowerCase();
    const user = await db()
    .collection("users")
    .findOne({
        username: normalizedUsername
    });
    if (!user) {
        return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    if (user.password !== password ) {
        return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    

    

    req.session.user = {
        id: user.id,
        role: user.role || 'user',
        username: user.username,
        email: user.email
    };
    

    res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', user: { username: user.username, email: user.email, role: user.role } });
});

router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'يرجى تعبئة جميع الحقول' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'كلمتا المرور غير متطابقتين' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = users.find((item) =>
        item.username.toLowerCase() === normalizedUsername || item.email.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
        return res.status(409).json({ success: false, message: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
    }

    const user = {
        id: randomInt(1000, 9999),
        username: username.trim(),
        role: 'user',
        email: email.trim(),
        password
    };
    const result = await db().collection("users").insertOne({
        ...user,
        createdAt: new Date()
    });

    users.push(user);
    req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
    };

    res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح', user: { username: user.username, email: user.email, role: user.role } });
});

module.exports = router;