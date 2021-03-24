// import { send } from "@material-ui/icons";
import express from "express";
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from  'cors';
// iport to use in place of headers
//import

//app config
const app = express();
const port =process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1176246",
    key: "92258fab840fa0382a3b",
    secret: "543f7d4043287fa064b4",
    cluster: "eu",
    useTLS: true,
});
//middleware
app.use(express.json());

app.use(cors());

// setting the headers to allow requet come from any enfd point
// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*");
//     res.setHeader("Access-Control-Allow-Headers","*");
//     next();

// });

//db config
const connection_url =`mongodb+srv://root:admin@cluster0.mkpfl.mongodb.net/whatsappdb?retryWrites=true&w=majority`
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true,
});

//?? 

const db=mongoose.connection;
    // oncedb is open fire up an action
db.once('open',()=>{
    console.log("DB connected");

    const msgCollection=db.collection("messagecontents");
    const changeStream =msgCollection.watch();

    changeStream.on("change",(change) =>{
        console.log("a change occured",change);

        if (change.operationType ==="insert"){
            const messageDetails =change.fullDocument;
            pusher.trigger("messages","inserted",{
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received:messageDetails.received,

            });
        }else{
            console.log("Error triggering pusher");
        }
    });
});

//api route
app.get('/',(req,res)=>res.status(200).send('hello world'));

app.get("/messages/sync",(req,res)=>{
    Messages.find((err,data)=>{
        if (err){
            res.status(500).send(err);

        }else{
            res.status(200).send(data);  
        }
    });
});

app.post("/messages/new",(req,res)=>{
    const dbMessage = req.body;
    Messages.create(dbMessage,(err,data)=>{
        if (err){
            res.status(500).send(err);

        }else{
            res.status(201).send(data);
        }
    });
});

//listen
app.listen(port,()=>console.log(`listening on localhost:${port}`));