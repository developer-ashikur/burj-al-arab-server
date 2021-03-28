const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config()
// const bodyParser = require('body-parser');

const port = 4000;
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oeq97.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = require("./configs/burj-al-arab-ashikur-firebase-adminsdk-yxqca-7a0a8c2a10.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.get('/', (req, res) => {
  res.send('Hello World!')
});

client.connect(err => {
  const collection = client.db("burjAlArab").collection("booking");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    collection.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;

    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail === queryEmail) {
            collection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents);
              })
          }
        })
        .catch((error) => {
          res.status(401).send('unauthorized user');
        });
    }
    else{
      res.status(401).send('unauthorized user');
    }
  })
});



app.listen(port);