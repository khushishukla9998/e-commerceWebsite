const { Server } = require("socket.io");
const { verifySocket } = require("../../middleware/index");
const User = require("../user/model/userModel");

let io;
const userSockets = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            credentials: true,
        },
    });

    io.use(verifySocket);

    io.on('connection', async (socket) => {
        console.log('A user connected and verified');

        const userId = socket.userId.toString();

        // Join a room named after the userId to support multiple connections for the same user
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room (UserID): ${userId}`);

        try {
            const user = await User.findById(userId);
            if (user) {
                socket.user = user;
                console.log(`User ${user.email} connected. Socket ID: ${socket.id}`);
                socket.emit('user:connected', { status: 'success', user: user.toJSON() });
            } else {
                console.log('User not found in DB, disconnecting socket');
                socket.disconnect();
            }
        } catch (err) {
            console.error('Error retrieving user from DB:', err.message);
            socket.disconnect();
        }

        socket.on('disconnect', () => {
            if (socket.user) {
                console.log(`User ${socket.user.email} (Socket ${socket.id}) disconnected`);
            } else {
                console.log(`Socket ${socket.id} disconnected`);
            }
        });
    });

    return io;
};

const sendNotificationToUser = (userId, data) => {
    const userIdStr = userId.toString();

    if (io) {
        console.log(`Emitting notification to room (UserID): ${userIdStr}`, data);
        io.to(userIdStr).emit("notification", data);
        return true;
    }
    console.log(`IO not initialized, notification skipped for ${userIdStr}`);
    return false;
};

module.exports = { initSocket, sendNotificationToUser };
