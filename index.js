const express= require('express')
const app=express()
const cors=require('cors')
const port = process.env.PORT || 5000;

require('dotenv').config()
// const jwt = require('jsonwebtoken');

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vqv383i.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);

const dbConnect = async () => {
    try {
        client.connect()
        console.log('explore DB Connected Successfully')
    } catch (error) {
        console.log(error.name, error.message)
    }
  }
  dbConnect()

const userCollection = client.db("exploreDb").collection("users");
const packageCollection = client.db("exploreDb").collection("package");
const bookCollection = client.db("exploreDb").collection("booking");


app.post('/users',async(req,res)=>{
    const user=req.body
    const query={email:user.email}
    const userExist=await userCollection.findOne(query)
    if (userExist){
      return res.send({ message: 'this user already exists', insertedId: null })
  
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
  
  })
app.post('/booking',async(req,res)=>{
    const book=req.body

    const result = await bookCollection.insertOne(book);
    res.send(result);
  
  })
app.get('/users',async(req,res)=>{
    const users=await userCollection.find().toArray()
    res.send(users)
})
app.get('/package',async(req,res)=>{
  const id=req.query.id
  console.log(id,"id from server")
  let filter={}
if (id){
  filter = { _id: new ObjectId(id) }

}
  const packages=await packageCollection.find(filter).toArray()
  console.log(packages,"pacages frm server")
  res.send(packages)
})
app.get('/', async(req, res) => {
    res.send('explore is sitting')
  })
app.listen(port,()=>{
    console.log(`expic explore is sitting on port ${port}`)
})  