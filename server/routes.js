// Routes.js - Módulo de rutas
const express = require('express');
const router = express.Router();
const push = require('./push');


const mensajes = [

  {
    _id: 'XXX',
    user: 'spiderman',
    mensaje: 'Hola Mundo'
  }

];


// Get mensajes
router.get('/', function (req, res) {
  // res.json('Obteniendo mensajes');
  res.json( mensajes );
});


// Post mensaje
router.post('/', function (req, res) {
  
  const mensaje = {
    mensaje: req.body.mensaje,
    user: req.body.user
  };

  mensajes.push( mensaje );

  console.log(mensajes);


  res.json({
    ok: true,
    mensaje
  });
});

// Store subscription
router.post('/subscribe', (req, res) => {

  const subscription = req.body;
  // console.log(subscription);
  push.addSubscription(subscription);

  res.json('subscribe');
});


// Get public key
router.get('/key', (req, res) => {

  const key = push.getKey();

  res.send(key);
});

// Route to send push notifications to the users we want
// ESTO NO ES ALGO QUE NO SE HACE HABITUALMENTE DESDE UN SERVICIO REST, SINO QUE SE SUELE HACER DESDE EL LADO DEL SERVER. ASI PODEMOS HACER ENVIO DE NOTIFICACIONES DESDE APLICACIONES COMO INSOMNIA O POSTMAN (p.ej.). NO DEBE SER UN SERVICIO EXPUESTO (SOLO DEBE EJECUTARSE EN EL BACKEND. PUEDE AGREGARSE UN TOKEN COMO PROTECCION)
router.post('/push', (req, res) => {

  const post = {
    title: req.body.title,
    body: req.body.body,
    user: req.body.user
  };

  push.sendPush(post);

  res.json(post);
});

module.exports = router;