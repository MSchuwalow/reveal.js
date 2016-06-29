(function() {

    var notes,
	notesValue,
	currentState,
	currentSlide,
	upcomingSlide;

    setupKeyboard();
    setupNotes();
    setupTimer();


    // Load our presentation iframes
    setupIframes();

    // Once the iframes have loaded, emit a signal saying there's
    // a new subscriber which will trigger a 'statechanged'
    // message to be sent back
    
    /**
     * update notes, sent by currentSlide-frame
     */
    window.addEventListener('message', function(event) {
        var data = event.data;

	// No need for updating the notes in case of fragment changes
	if ( data.notes ) {
	    notes.classList.remove( 'hidden' );
	    if( data.markdown ) {
		notesValue.innerHTML = marked( data.notes );
	    }
	    else {
		notesValue.innerHTML = data.notes;
	    }
	} else {
	    notes.classList.add( 'hidden' );
	}
    });

    /**
     * Forward keyboard events to the current slide window.
     * This enables keyboard events to work even if focus
     * isn't set on the current slide iframe.
     */
    function setupKeyboard() {

	document.addEventListener( 'keydown', function( event ) {
	    currentSlide.contentWindow.postMessage( JSON.stringify({ method: 'triggerKey', args: [ event.keyCode ] }), '*' );
	} );


    }

    /**
     * Creates the preview iframes.
     */
    function setupIframes() {

	var params = [
	    //'receiver',
	    'progress=false',
	    'history=false',
	    'transition=none',
	    'backgroundTransition=none'
	].join( '&' );

	var currentURL = '/?' + params;// + '&postMessageEvents=true';
	var upcomingURL = '/?' + params + "&controls=false&upcoming&receiver"; //'/?' + params + '&controls=false&showNext';

	currentSlide = document.createElement( 'iframe' );
	currentSlide.setAttribute( 'width', 1280 );
	currentSlide.setAttribute( 'height', 1024 );
	currentSlide.setAttribute( 'src', currentURL );
	document.querySelector( '#current-slide' ).appendChild( currentSlide );
        // subscribe to updates by notifying iframe
        currentSlide.contentWindow.addEventListener("load", function (e) {
            currentSlide.contentWindow.postMessage("note-updates", window.location.origin.replace("notes/", ""));
        });

	upcomingSlide = document.createElement( 'iframe' );
	upcomingSlide.setAttribute( 'width', 640 );
	upcomingSlide.setAttribute( 'height', 512 );
	upcomingSlide.setAttribute( 'src', upcomingURL );
	document.querySelector( '#upcoming-slide' ).appendChild( upcomingSlide );

    }

    /**
     * Setup the notes UI.
     */
    function setupNotes() {

	notes = document.querySelector( '.speaker-controls-notes' );
	notesValue = document.querySelector( '.speaker-controls-notes .value' );
    }

    /**
     * Create the timer and clock and start updating them
     * at an interval.
     */
    function setupTimer() {

	var start = new Date(),
	    timeEl = document.querySelector( '.speaker-controls-time' ),
	    clockEl = timeEl.querySelector( '.clock-value' ),
	    hoursEl = timeEl.querySelector( '.hours-value' ),
	    minutesEl = timeEl.querySelector( '.minutes-value' ),
	    secondsEl = timeEl.querySelector( '.seconds-value' );

	function _updateTimer() {

	    var diff, hours, minutes, seconds,
		now = new Date();

	    diff = now.getTime() - start.getTime();
	    hours = Math.floor( diff / ( 1000 * 60 * 60 ) );
	    minutes = Math.floor( ( diff / ( 1000 * 60 ) ) % 60 );
	    seconds = Math.floor( ( diff / 1000 ) % 60 );

	    clockEl.innerHTML = now.toLocaleTimeString( 'en-US', { hour12: true, hour: '2-digit', minute:'2-digit' } );
	    hoursEl.innerHTML = zeroPadInteger( hours );
	    hoursEl.className = hours > 0 ? '' : 'mute';
	    minutesEl.innerHTML = ':' + zeroPadInteger( minutes );
	    minutesEl.className = minutes > 0 ? '' : 'mute';
	    secondsEl.innerHTML = ':' + zeroPadInteger( seconds );

	}

	// Update once directly
	_updateTimer();

	// Then update every second
	setInterval( _updateTimer, 1000 );

	timeEl.addEventListener( 'click', function() {
	    start = new Date();
	    _updateTimer();
	    return false;
	} );

    }

    function zeroPadInteger( num ) {

	var str = '00' + parseInt( num );
	return str.substring( str.length - 2 );

    }

})();
