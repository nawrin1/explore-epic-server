const express= require('express')
const app=express()
const cors=require('cors')
const port = process.env.PORT || 5000;

require('dotenv').config()
const jwt = require('jsonwebtoken');

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
const guideCollection = client.db("exploreDb").collection("allGuide");
const wishCollection = client.db("exploreDb").collection("wishlist");


app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
  res.send({ token });
})
const verifyToken = (req, res, next) => {
  console.log('inside verify', req.headers.authorization);
  if (!req.headers.authorization) {
    console.log('token prob?')

    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log('token prob')
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })

}
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  console.log(email,"is it admin? verify admin")
  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    console.log('.......')
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}
app.get('/users/admin/:email', verifyToken,async (req, res) => {
  const email = req.params.email;

  if (email !== req.decoded.email) {
    console.log('nottt veridyyy')
    return res.status(403).send({ message: 'forbidden access' })
  }

  const query = { email: email };
  const user = await userCollection.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === 'admin';
    // console.log('admin found')
  }
  res.send({ admin });
})
app.post('/users',async(req,res)=>{
    const user=req.body
    // console.log(user,"from server user")
    const query={email:user.email}
    const userExist=await userCollection.findOne(query)
    if (userExist){
      return res.send({ message: 'this user already exists', insertedId: null })
  
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
  
  })
app.post('/booking',verifyToken,async(req,res)=>{
    const book=req.body

    const result = await bookCollection.insertOne(book);
    res.send(result);
  
  })
app.post('/package',verifyToken,verifyAdmin,async(req,res)=>{
    const pack=req.body

    const result = await packageCollection.insertOne(pack);
    res.send(result);
  
  })
app.post('/wishlist',verifyToken,async(req,res)=>{
    const wishes=req.body

    const result = await wishCollection.insertOne(wishes);
    res.send(result);
  
  })

app.get('/users',verifyToken,async(req,res)=>{
    const users=await userCollection.find().toArray()
    res.send(users)
})
app.get('/booking',verifyToken,async(req,res)=>{
  console.log(req.query)
    const userEmail=req.query.email
    // console.log(userEmail,"from bac")
    let filter={}
    if (userEmail){
      filter={email:userEmail}
    }
    const book=await bookCollection.find(filter).toArray()
    console.log(book)
    res.send(book)
})
app.get('/wishlist',verifyToken,async(req,res)=>{
  console.log(req.query)
    const userEmail=req.query.email
    console.log(userEmail,"from wish back")
    let filter={}
    if (userEmail){
      filter={email:userEmail}
    }
    const wish=await wishCollection.find(filter).toArray()
    console.log(wish)
    res.send(wish)
})
app.get('/package',async(req,res)=>{
  const id=req.query.id
  // console.log(id,"id from server")
  let filter={}
if (id){
  filter = { _id: new ObjectId(id) }

}
  const packages=await packageCollection.find(filter).toArray()
  // console.log(packages,"pacages frm server")
  res.send(packages)
})


app.patch('/admin/:email', verifyToken,verifyAdmin, async (req, res) => {
  const userEmail = req.params.email;
  // console.log(userEmail);

  const filter = { email: userEmail };
  const updated = {
    $set: {
      role: "admin"
    }
  };

  try {
    const result = await userCollection.updateOne(filter, updated);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.send(error.message);
  }
});
app.patch('/guide/:email', verifyToken,verifyAdmin, async (req, res) => {
  const userEmail = req.params.email;
  // console.log(userEmail);

  const filter = { email: userEmail };
  const updated = {
    $set: {
      role: "guide"
    }
  };

  try {
    const result = await userCollection.updateOne(filter, updated);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.send(error.message);
  }
});
app.post('/guide',async(req,res)=>{
  const guide=req.body

  const result = await guideCollection.insertOne(guide);
  res.send(result);

})

app.get('/', async(req, res) => {
    res.send('explore is sitting')
  })
app.listen(port,()=>{
    console.log(`expic explore is sitting on port ${port}`)
})  