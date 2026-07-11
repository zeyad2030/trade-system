const express = require('express');
const path = require('path');
const app = express();
const accountsRouter = require('./routes/account');
const systemrouter = require('./routes/system');
const session = require('express-session');
const messagesRouter = require('./routes/messages');
const { connectDB } = require("./db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
app.set("io", io);

const sessionMiddleware = session({
    secret: "zezo2222",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true
    }
});

app.use(sessionMiddleware);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});
connectDB()

 // Serve static files from the "web" directory
// Middleware to parse JSON requests
app.use(express.static(path.join(__dirname, 'web')));
    
app.use('/accounts', accountsRouter);
app.use('/messages', messagesRouter);   
app.get('/', (req, res) => {
    
    if (req.session.user) {
        return res.redirect('/trade');
    }
    res.sendFile(path.join(__dirname, 'web', 'login.html'));

});

app.get("/trade", (req, res) => {
    
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'web', 'main.html'));
});
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'about.html'));
});
app.use('/system', systemrouter);

io.on("connection", (socket) => {

    const user = socket.request.session.user;

    if (!user) {
        socket.disconnect();
        return;
    }

    socket.join(user.username);

    console.log(user.username + " connected");

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});