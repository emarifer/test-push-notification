// imports
importScripts('https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js')

importScripts('js/sw-db.js');
importScripts('js/sw-utils.js');


const STATIC_CACHE    = 'static-v2';
const DYNAMIC_CACHE   = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';


const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js',
    'js/sw-utils.js',
    'js/libs/plugins/mdtoast.min.js',
    'js/libs/plugins/mdtoast.min.css'
];

const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js'
];



self.addEventListener('install', e => {


    const cacheStatic = caches.open( STATIC_CACHE ).then(cache => 
        cache.addAll( APP_SHELL ));

    const cacheInmutable = caches.open( INMUTABLE_CACHE ).then(cache => 
        cache.addAll( APP_SHELL_INMUTABLE ));



    e.waitUntil( Promise.all([ cacheStatic, cacheInmutable ])  );

});


self.addEventListener('activate', e => {

    const respuesta = caches.keys().then( keys => {

        keys.forEach( key => {

            if (  key !== STATIC_CACHE && key.includes('static') ) {
                return caches.delete(key);
            }

            if (  key !== DYNAMIC_CACHE && key.includes('dynamic') ) {
                return caches.delete(key);
            }

        });

    });

    e.waitUntil( respuesta );

});





self.addEventListener( 'fetch', e => {

    let respuesta;

    if ( e.request.url.includes('/api') ) {

        // return respuesta????
        respuesta = manejoApiMensajes( DYNAMIC_CACHE, e.request );

    } else {

        respuesta = caches.match( e.request ).then( res => {

            if ( res ) {
                
                actualizaCacheStatico( STATIC_CACHE, e.request, APP_SHELL_INMUTABLE );
                return res;
                
            } else {
    
                return fetch( e.request ).then( newRes => {
    
                    return actualizaCacheDinamico( DYNAMIC_CACHE, e.request, newRes );
    
                });
    
            }
    
        });

    }

    e.respondWith( respuesta );

});


// tareas asíncronas
self.addEventListener('sync', e => {

    console.log('SW: Sync');

    if ( e.tag === 'nuevo-post' ) {

        // postear a BD cuando hay conexión
        const respuesta = postearMensajes();
        
        e.waitUntil( respuesta );
    }



});

// Escuchar Push Notifications
self.addEventListener('push', e => {

    // console.log(e);
    // console.log(e.data.text());

    const data = JSON.parse(e.data.text());
    console.log(data);
    const title = data.title;
    const options = {
        body: data.body,
        // icon: 'img/icons/icon-72x72.png',
        icon: `img/avatars/${data.user}.jpg`,
        badge: 'img/favicon.ico',
        image: 'https://vignette.wikia.nocookie.net/marvelcinematicuniverse/images/5/5b/Torre_de_los_Avengers.png/revision/latest?cb=20150626220613&path-prefix=es',
        vibrate: [125,75,125,275,200,275,125,75,125,275,200,600,200,600],
        openUrl: '/',
        data: {
            // url: 'https://emarifer-landing-page.netlify.app/views/',
            url: '/',
            id: data.user
        },
        actions: [
            {
                action: 'thor-action',
                title: 'Thor',
                icon: 'img/avatar/thor.jpg'
            },
            {
                action: 'ironman-action',
                title: 'Ironman',
                icon: 'img/avatar/ironman.jpg'
            }
        ]
    };

    e.waitUntil(self.registration.showNotification(title, options));
});


// Al cerrar la notificacion
self.addEventListener('notificationclose', e => {

    console.log('Notificacion cerrada', e);
});

// Al tocar la notificacion
self.addEventListener('notificationclick', e => {

    const notification = e.notification;
    const action = e.action;
    console.log({ notification, action});

    const resp = clients.matchAll()
        .then(tabs => {
            const tab = tabs.find(t => t.visibilityState === 'visible');

            if(tab !== undefined) {
                tab.navigate(notification.data.url);
                tab.focus();
            } else {
                clients.openWindow(notification.data.url)
            }

            return notification.close();
        });

    e.waitUntil(resp);
});

/**
 * SOBRE WAITUNTIL. VER:
 * https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil
 * https://stackoverflow.com/questions/37902441/what-does-event-waituntil-do-in-service-worker-and-why-is-it-needed
 * https://www.w3.org/TR/service-workers/#service-worker-lifetime
 */

/**
 * CONRIGURAR DESKTOP PARA DEPURAR DESDE DEVTOOLS DE CRHOME.
 * 
 * INSTALAR ADB E INCIAR ADB SERVER:
 * https://www.altaruru.com/como-instalar-y-configurar-adb-en-ubuntu/
 * 
 * TIENE QUE ESTA CORRIENDO EL ADB SERVER Y VERSE EL DISPOSITVO EL LA LISTA DE DISPOSITIVOS:
 * adb start-server
 * adb devices
 * 
 * EN EL DISPOSITIVO TIENE QUE ESTAR HABILITADA LA DEPURACION USB EN OPCIONES PARA DESARROLLADORES Y EL PROTOCOLO PTP EN PREFERENCIAS DE USB.
 * 
 * DIRECCION DE ACCESO A DISPOSITIVOS REMOTOS:
 * chrome://inspect/#devices
 * 
 * CONFIGURACION EN CHROME;
 * 
 * DISPOSITIVOS ANDROID DE DEPURACIÓN REMOTA:
 * https://developer.chrome.com/docs/devtools/remote-debugging/
 * 
 * ACCEDER A SERVIDORES LOCALES;
 * https://developer.chrome.com/docs/devtools/remote-debugging/local-server/
 * 
 * SI EL PUERTO ESTA HABILITADO (Port forwarding is active), APARECERA EN VERDE JUNTO AL NOMBRE DEL TELEFONO. PODEMOS PONER EN LA VENTANA JUNTO A LA IP DEL DISPOSITIVO LA DIRECCION QUE QUEREMOS QUE SE ABRA, SIEMPRE QUE CHROME ESTE ABIERTO EN EL DISPOSITIVO. PRESIONAR EN INSPECT BAJO EL NOMBRE DE LA APLICACION: SE MOSTRARA LA DEVTOOLS PARA EL DISPOSITIVO
 * 
 * ALGUNAS REFERENCIAS ACCESORIAS EN STACKOVERFLOW:
 * https://stackoverflow.com/questions/21925992/chrome-devtools-devices-does-not-detect-device-when-plugged-in
 */