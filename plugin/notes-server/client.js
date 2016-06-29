(function() {


    function setState(state) {
        Reveal.setState(state);
        window.localStorage.setItem('reveal-state', JSON.stringify(state));
    }

    // don't emit events from inside the previews themselves
    var receiver = window.location.search.match( /receiver/gi );
    var upcoming = window.location.search.match( /upcoming/gi );

    var socket = io.connect( window.location.origin );

    var transaction = 0;

    socket.emit('new-subscriber', ""); // register at server

    console.log( 'View slide notes at ' + window.location.origin + '/notes/');

    //window.open( window.location.origin + '/notes/', 'notes');


    // collect slide data
    function makePackage() {
	var slideElement = Reveal.getCurrentSlide(),
	    notesElement = slideElement.querySelector( 'aside.notes' );
	var messageData = {
	    notes: '',
	    markdown: false,
	    state: Reveal.getState()
	};

	// Look for notes defined in a slide attribute
	if( slideElement.hasAttribute( 'data-notes' ) ) {
	    messageData.notes = slideElement.getAttribute( 'data-notes' );
	}

	// Look for notes defined in an aside element
	if( notesElement ) {
	    messageData.notes = notesElement.innerHTML;
	    messageData.markdown = typeof notesElement.getAttribute( 'data-markdown' ) === 'string';
	}
        return messageData;
    }        

    // send update to server
    function post() {
        if (receiver) return;

        transaction++; // next transaction - server checks if there was an update in the meantime
        var msg = { id: transaction, data: makePackage() };
        setState(msg.data.state); // save state locally
        socket.emit( 'update', msg); 
        
        // send notes 
        if (notesWindow) {
            notesWindow.postMessage(msg.data, window.location.origin + "/notes");
        }
    }

    // request from server for slide data
    socket.on('fetch-state', function (data) {
        var state = window.localStorage.getItem("reveal-state");
        if (state == undefined) { // start at slide 0 if no slide saved
            Reveal.slide(0);
            state = Reveal.getState();
        } else { // fetch last slide
            state = JSON.parse(state);
        }
        setState(state);
        socket.emit('push-state', makePackage());
        transaction = 1;
    });
    var updateStuff = function (data) {
        // save id from last update
        transaction = data.id;
        setState(data.data.state);
        if (upcoming) { 
            // preview is one fragment/slide ahead
            if (!Reveal.nextFragment()) {
                Reveal.next();
            } 
        }
    };
    // monitor server updates
    socket.on('init-state', updateStuff);
    socket.on('discarded', updateStuff);
    socket.on('refresh', updateStuff);

    // Monitor events that trigger a change in state
    Reveal.addEventListener( 'slidechanged', post );
    Reveal.addEventListener( 'fragmentshown', post );
    Reveal.addEventListener( 'fragmenthidden', post );
    Reveal.addEventListener( 'overviewhidden', post );
    Reveal.addEventListener( 'overviewshown', post );
    Reveal.addEventListener( 'paused', post );
    Reveal.addEventListener( 'resumed', post );

    // for easier control on touch devices
    document.addEventListener("click", function() {
        if (!Reveal.nextFragment()) {
            Reveal.next();
        }
    });

    var notesWindow = null;
    // communication with note window (parent of this iframe)
    window.addEventListener('message', function(event) {
        if (event.data == 'note-updates') { // subscribes to updates
            notesWindow = event.source;
        }
    });

}());
