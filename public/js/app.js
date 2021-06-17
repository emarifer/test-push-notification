
const url = window.location.href;
let swLocation = '/twittor/sw.js';
let swReg;


if ( navigator.serviceWorker ) {


    if ( url.includes('localhost') ) {
        swLocation = '/sw.js';
    }

    window.addEventListener('load', function() {

        navigator.serviceWorker.register( swLocation )
            .then(function(reg){
                swReg = reg;
                swReg.pushManager.getSubscription().then(verifySubscription);
            })
    });


}





// Referencias de jQuery

var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');

var modal       = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns  = $('.seleccion-avatar');
var txtMensaje  = $('#txtMensaje');

var btnActivadas    = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;




// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje) {

    var content =`
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}



// Globals
function logIn( ingreso ) {

    if ( ingreso ) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');
    
    }

}


// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function() {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );

});


// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             txtMensaje.val('');
         });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if ( mensaje.length === 0 ) {
        cancelarBtn.click();
        return;
    }

    var data = {
        mensaje: mensaje,
        user: usuario
    };


    fetch('api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
    })
    .then( res => res.json() )
    .then( res => console.log( 'app.js', res ))
    .catch( err => console.log( 'app.js error:', err ));



    crearMensajeHTML( mensaje, usuario );

});



// Obtener mensajes del servidor
function getMensajes() {

    fetch('api')
        .then( res => res.json() )
        .then( posts => {

            console.log(posts);
            posts.forEach( post =>
                crearMensajeHTML( post.mensaje, post.user ));


        });


}

getMensajes();



// Detectar cambios de conexión
function isOnline() {

    if ( navigator.onLine ) {
        // tenemos conexión
        // console.log('online');
        $.mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });


    } else{
        // No tenemos conexión
        $.mdtoast('Offline', {
            interaction: true,
            actionText: 'OK',
            type: 'warning'
        });
    }

}

window.addEventListener('online', isOnline );
window.addEventListener('offline', isOnline );

isOnline();

// Notifications

function verifySubscription(activated) {

    // console.log(activated);

    if (activated) {
        btnActivadas.removeClass('oculto');
        btnDesactivadas.addClass('oculto');
    } else {
        btnActivadas.addClass('oculto');
        btnDesactivadas.removeClass('oculto');
    }
}

// verifySubscription(); // Al mandarle un undefined muestra el btnDesactivadas

function sendNotification() {
    
    const notificationOpts = {
        body: 'This is the body of the notification',
        icon: 'img/icons/icon-72x72.png'
    };

    const n = new Notification('Hello, Enrique!! 😀', notificationOpts);

    n.onclick = () => {
        console.log('Click');
    };
}

function notifyMe() {
    
    if (!window.Notification) {
        return console.log('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
        // new Notification('Hola, Enrique!! 😀 -- granted');
        sendNotification();
    } else if (Notification.permission !== 'denied' || Notification.permission === 'default') {
        Notification.requestPermission(function(permission) {
            console.log(permission);

            if (permission === 'granted') {
                // new Notification('Hola, Enrique!! 😀 -- from the question');
                sendNotification();
            }
        });
    }
}

// notifyMe();

// Get Key
function getPublicKey() {
    
    /* fetch('api/key')
        .then(res => res.text())
        .then(console.log); */

    return fetch('api/key')
        .then(res => res.arrayBuffer())
        // Retornamos la respuesta como un Uint8array
        .then(key => new Uint8Array(key));
}

// getPublicKey().then(console.log);
btnDesactivadas.on('click', function() {

    // Aunque no es necesario, porque con la logica que hicimos al principio este boton no aparecera hasta que tengamos el registro del service-worker, verificamos si existe el swReg

    if(!swReg) return console.log('No SW registration');

    getPublicKey().then(function(key) {
        swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        })
        .then(res => res.toJSON())
        .then(subscription => {
            // console.log(subscription);
            fetch('api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            })
            .then(verifySubscription)
            .catch(cancelSubscription);
            // verifySubscription(subscription);
        });
    });
});

// Cancelar suscripcion
function cancelSubscription() {
    
    swReg.pushManager.getSubscription().then(subs => {

        subs.unsubscribe().then(() => verifySubscription(false));
    })
}

btnActivadas.on('click', function() {

    cancelSubscription();
});

/**
 * SOBRE ARRAYBUFFER Y UINT8ARRAY. VER:
 * https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
 * https://developer.mozilla.org/es/docs/Web/JavaScript/Typed_arrays
 * https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
 */