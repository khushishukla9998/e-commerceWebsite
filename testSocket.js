const { io}  = require("socket.io-client")
    console.log("connected:")

const socket = io("http://localhost:3001",{
    query:{
        
token:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTUxNjQ2MzVlOTEzYjZlZWQ2M2JiNSIsImlhdCI6MTc3MjQ1MzgwMiwiZXhwIjoxNzczMDU4NjAyfQ.ejTXXpOqbafa8lFPYYlEWGJBIqY1tyrw9Mb_dewk67w" }
});


  socket.on("connect",()=>{
        console.log("connected:", socket.id)
    })

    socket.on("connect_error",(err)=>{
        console.log("error:", err.message)
    })
socket.on("notifoication", (data)=>{
    console.log("notification recieved",data)
});
