const { io } = require("socket.io-client")
console.log("connected:")

const socket = io("http://localhost:3001", {
    query: {

        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OWRmMzlkZmI2MDhiYTA5MzFkMjYyZiIsImlhdCI6MTc3MjQ3MTI4OCwiZXhwIjoxNzczMDc2MDg4fQ.JaiCs-D9SbXEWrq2n_NkOHzN9nAYiXJd7_nonAnCi3A"
    },
    transports: ['websocket']
});


socket.on("connect", () => {
    console.log("connected:", socket.id)
})

socket.on("connect_error", (err) => {
    console.log("error:", err.message)
})
socket.on("disconnect", () => {
    console.log("disconnected from server");
});

socket.on("notification", (data) => {
    console.log("notification received", data);
});
