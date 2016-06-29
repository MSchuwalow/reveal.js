var http      = require('http');
var express   = require('express');
var fs        = require('fs');
var io        = require('socket.io');
var Mustache  = require('mustache');

var app       = express();
var staticDir = express.static;
var server    = http.createServer(app);

io = io(server);

var opts = {
    port :      1947,
    baseDir :   __dirname + '/../../'
};
console.log("base dir: " + opts.baseDir);

var state = undefined; // store current state on server
var transaction = 1; // transaction ids to handle conflicting requests, avoid lost updates

io.on( 'connection', function( socket ) {
    
    // handshake
    socket.on( 'new-subscriber', function( data ) {
        if (state === undefined) { // client stores last slide in localStorage, fetch it
            socket.emit('fetch-state', "");
        } else { // client already connected, send current state and transaction id
            socket.emit('init-state', { id: transaction, data: state });
        }
    });
    // receive start slide
    socket.on( 'push-state', function(data) {
        state = data.data;
    });

   socket.on('update', function(data) {
        if (transaction + 1 > data.id) { 
            // lost update, notify client, send update again
            socket.emit('discarded', ({ id: transaction, data: state }));
        } else {
            // apply update, broadcast
            socket.broadcast.emit('refresh', data);
            transaction = data.id;
            state = data.data;
        }
    });

});

[ 'css', 'js', 'images', 'plugin', 'lib' ].forEach( function( dir ) {
    app.use( '/' + dir, staticDir( opts.baseDir + dir ) );
});

app.get('/', function( req, res ) {

    res.writeHead( 200, { 'Content-Type': 'text/html' } );
    fs.createReadStream( opts.baseDir + '/index.html' ).pipe( res );

});

// no special id's in url needed anymore
app.get( '/notes/', function( req, res ) {
    res.writeHead( 200, { 'Content-Type': 'text/html' } );
    fs.createReadStream( opts.baseDir + 'plugin/notes-server/notes.html' ).pipe( res );
});

/// Actually listen
server.listen( opts.port || null );

var brown = '\033[33m',
    green = '\033[32m',
    reset = '\033[0m';

var slidesLocation = 'http://localhost' + ( opts.port ? ( ':' + opts.port ) : '' );

console.log( brown + 'reveal.js - Speaker Notes' + reset );
console.log( '1. Open the slides at ' + green + slidesLocation + reset );
console.log( '2. Click on the link in your JS console to go to the notes page' );
console.log( '3. Advance through your slides and your notes will advance automatically' );
