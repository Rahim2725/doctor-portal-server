const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

// middiel wear 
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kuser.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("doctor_portal").collection("service");
    const bookingCollection = client.db("doctor_portal").collection("booking");

    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get('/available', async (req, res) => {
      const date = req.query.date ;

      // step 1 : get all service 
      const services = await serviceCollection.find().toArray();

      // step 2 : get the booking that day
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      // step 3 : forEach  
      services.forEach(service => {
        // step 4 : find booking for that service 
        const serviceBookings = bookings.filter(b => b.treatment === service.name);
        const booked = serviceBookings.map(s => s.slot) ;
        const available = service.slots.filter(s => !booked.includes(s)) ;
        service.slots = available ;
       })
      res.send(services)
    })
    /**
         * API Naming Convention
         * app.get('/booking') // all get booking in this collection. or get more then one by filter
         * app.get('/booking/:id') // get a specific booking
         * app.post('booking) // add new booking 
         * app.patch('/booking/:id') //
         * app.patch('/booking/:id') //
        */
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
      const exists = await bookingCollection.findOne(query)
      if (exists) {
        return res.send({ success: false, booking: exists })
      }
      const result = await bookingCollection.insertOne(booking)
      res.send({ success: true, result });
    })


  }
  finally {
    // await client.close();
  }

}

run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})