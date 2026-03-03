const { Server } = require("socket.io");
const User = require("../user/model/userModel");
const appString = require("../utils/appString")
const ENUM = require("../utils/enum")
let io;

const userSockets = new Map();
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            credentials: true,
        },
    });
    const activeConnections = {};

    // io.use(verifySocket);
    io.on('connection', async (socket) => {
        console.log('A user connected and verified');
        const authHeader = socket.handshake.headers.userid;
        const deviceType = socket.handshake.headers.devicetype || ENUM.DEVICE_TYPE.WEB;

        if (!authHeader) {
            return (new Error(appString.NOT_PROVIDED));
        }

        // const userId = socket.userId.toString();
        const userId = authHeader;
        const connectionKey = `${userId}-${deviceType}`;


        socket.deviceType = deviceType;
        console.log(`Socket ${socket.id} (User: ${userId}, Device: ${deviceType}) connected`);
        socket.join(userId);
        userSockets[userId] = socket.id;
        console.log(`Socket ${socket.id} joined room (UserID): ${userId}`);


        if (activeConnections[connectionKey] && activeConnections[connectionKey] !== socket.id) {
            console.log(`Disconnecting old socket ${activeConnections[connectionKey]} for user ${userId} on ${deviceType}`);
            // Find and disconnect the old socket
            const oldSocket = io.sockets.sockets.get(activeConnections[connectionKey]);
            if (oldSocket) {
                oldSocket.disconnect(true);
            }
        }
        activeConnections[connectionKey] = socket.id;
        //     console.log(`New socket ${socket.id} connected for user ${userId} on ${deviceType}`);

        try {
            const user = await User.findById(userId);
            if (user) {
                socket.user = user;
                // console.log(`User ${user.email} connected. Socket ID: ${socket.id}`);
                console.log(`User ${user.email} (Device: ${socket.deviceType}) connected. Socket ID: ${socket.id}`);
                socket.emit('user:connected', { status: 'success', user: user.toJSON() });

                if (!userSockets.has(userId)) {
                    userSockets.set(userId, []);
                }
                userSockets.get(userId).push({ socketId: socket.id, deviceType: deviceType });

            } else {
                console.log('User not found in DB, disconnecting socket');
                return socket.disconnect();
            }
            console.log("map", userSockets)

            userSockets.forEach((user) => {
                console.log("userId::", user[0].userId)
                console.log("socketId", user[0].socketId)
                console.log("deviceType", user[0].deviceType)
            });

        } catch (err) {
            console.error('Error retrieving user from DB:', err.message);
            socket.disconnect();
        }
        socket.on('disconnect', () => {
            if (socket.user) {
                console.log(`User ${socket.user.email} (Socket ${socket.id})
                    disconnected`);
            } else {
                console.log(`Socket ${socket.id} disconnected`);
            }
            if (activeConnections[connectionKey] === socket.id) {
                delete activeConnections[connectionKey];
                console.log(`Socket ${socket.id} disconnected and removed.`);
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





// // Example function to send to a specific device type
// const sendNotificationToDeviceType = (userId, deviceType, data) => {
//     const userIdStr = userId.toString();
//     if (io && userSockets.has(userIdStr)) {
//         const sockets = userSockets.get(userIdStr);
//         sockets.forEach(socketInfo => {
//             if (socketInfo.deviceType === deviceType) {
//                 console.log(`Emitting notification to specific socket ${socketInfo.socketId} (Device: ${deviceType})`);
//                 io.to(socketInfo.socketId).emit("notification", data);
//             }
//         });
//     }
// };


// Identify: connectionKey uniquely maps a user to a device type.
// Check: activeConnections[connectionKey] checks if that user is already logged in on that specific device.
// Clean: If found, the old socket is disconnected, replacing it with the new socket.id.
