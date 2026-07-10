const express = require('express');
const path = require('path');
const app = express();
const accountsRouter = require('./routes/account');

const session = require('express-session');

const { connectDB } = require("./db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "zezo2222",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // يوم
        httpOnly: true
    }
}));
connectDB()

app.use(express.static(path.join(__dirname, 'web'))); // Serve static files from the "web" directory
// Middleware to parse JSON requests

    
app.use('/accounts', accountsRouter);

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/trade');
    }
    res.sendFile(path.join(__dirname, 'web', 'index.html'));

});
app.get("/trade", (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'web', 'main.html'));
});
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'about.html'));
});

app.get('/', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.send("hello " + req.session.user.username);
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});