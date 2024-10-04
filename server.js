const express = require('express');
// const next = require('next');
// const dev = process.env.NODE_ENV !== "production";
const app = express();
const server = require('http').Server(app);
// const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const {v4:uuidv4} = require('uuid');
const {ExpressPeerServer} = require('peer')
const peer = ExpressPeerServer(server , {
  debug:true
});
app.use('/peerjs', peer);
// app.use('/peerjs', peer);
app.set('view engine', 'ejs')
app.use(express.static('pages'))
app.get('/' , (req,res)=>{
  res.send(uuidv4());
});
// app.get('/:room' , (req,res)=>{
//     res.render('index' , {RoomId:req.params.room});
// });
// io.on("connection" , (socket)=>{
//   socket.on('newUser' , (id , room)=>{
//     socket.join(room);
//     socket.to(room).emit('userJoined' , id);
//     socket.on('disconnect' , ()=>{
//         socket.to(room).emit('userDisconnect' , id);
//     })
//   })
// })
server.listen(port , ()=>{
  console.log("Server running on port : " + port);
})

