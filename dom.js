/**
 * DOM.JS - User Interface & Controls
 *
 * This file manages all user interface elements and interactions:
 * - Title and tooltip
 * - Sequence selector (Pi, Phi, Fibonacci, Linear)
 * - Rhythm selector
 * - Instrument selectors (lead & bass)
 * - Tone (key) selector
 * - Scale selector
 * - Play/pause button
 * - BPM slider
 * - Legato (sustain) slider
 * - Start index slider
 * - Stop index (loop length) selector
 *
 * ARCHITECTURE:
 * - All UI elements created with p5.dom library
 * - Gui class handles creation and responsive positioning
 * - Individual callback functions handle user interactions
 * - Elements positioned dynamically based on window size
 *
 * RESPONSIVE DESIGN:
 * - resize() method recalculates positions when window changes
 * - Positions based on element widths/heights (client dimensions)
 * - Currently has setInterval hack for initial positioning (see sketch.js)
 */

// ============================================================================
// GLOBAL DOM REFERENCES
// ============================================================================
var bpm_label, bpm_selection      // BPM slider and label
var title                          // Main title heading
var scale_selection                // Musical scale dropdown
var button                         // Play/pause button

// ============================================================================
// GUI CLASS - User Interface Manager
// ============================================================================

/**
 * Gui - Creates and manages all user interface controls
 *
 * INITIALIZATION:
 * - Creates all DOM elements (dropdowns, sliders, buttons)
 * - Sets default values
 * - Attaches event handlers
 * - Does NOT position elements (done later in resize())
 *
 * POSITIONING:
 * - All positioning handled in resize() method
 * - Called on window resize and periodically via setInterval hack
 *
 * @param {number} x - Left boundary (currently always 1)
 * @param {number} y - Top boundary (currently always 1)
 * @param {number} w - Width (window width)
 * @param {number} h - Height (window height)
 */
function Gui(x,y,w,h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;

    // Title - large and centered like a piece title
    title = createP("Irrational Duets")
    title.id('title-main');
    title_tooltip = createDiv('<div class="tooltip">? <span class="tooltiptext">This is an experiment exploring the transposition of mathematical sequences of number to music. </span></div>');

    // Sequence selector - prominent like a piece name
    number_selection = createSelect()
    number_selection.id('sequence-select');
    number_selection.option('Pi');
    number_selection.option('Phi');
    number_selection.option('Fibonacci');
    number_selection.option('Linear');
    number_selection.changed(apply_number);


    // subtitle elements
    rythm_selection = createSelect()
    rythm_selection.option('Unisson Walk');
    rythm_selection.option('Dialog');
    rythm_selection.option('Canon Walk');
    rythm_selection.option('Vals');
    rythm_selection.option('Impromptu');
    rythm_selection.changed(apply_rythm);

    lead_selection = createSelect()
    for (var i = 0 ; i <  instrumentTable.length ; i++){
      lead_selection.option("for " + instrumentTable[i]);
    }
    lead_selection.changed(change_lead);

    bass_selection = createSelect()
    for (var i = 0 ; i <  instrumentTable.length ; i++){
      bass_selection.option("and " + instrumentTable[i]);
    }
    bass_selection.changed(change_bass);

    tone_selection = createSelect()
    tone_selection.option('in C');
    tone_selection.option('in C#');
    tone_selection.option('in D');
    tone_selection.option('in Eb');
    tone_selection.option('in E');
    tone_selection.option('in F');
    tone_selection.option('in F#');
    tone_selection.option('in G');
    tone_selection.option('in G#');
    tone_selection.option('in A');
    tone_selection.option('in Bb');
    tone_selection.option('in B');
    tone_selection.changed(change_tone);

    scale_selection = createSelect()
    scale_selection.option('Linear');
    scale_selection.option('Major');
    scale_selection.option('minor');
    scale_selection.option('Harmonic minor');
    scale_selection.option('Lydian dominant');
    scale_selection.option('Chromatic');
    scale_selection.option('Whole Tones');
    scale_selection.option('Diminished');
    scale_selection.option('Pentatonic');
    scale_selection.option('In-Sen');
    scale_selection.option('Octatonic');
    scale_selection.option('Nonatonic');
    scale_selection.changed(apply_scale);

    // control elements
    button = createButton('play');
    // Use native DOM event listener to prevent double-firing
    button.elt.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        makeplay();
    }, false);



    bpm_selection = createSlider(20,160, 45);  // Default to 45 BPM (matches sketch.js)
    bpm_label = createP("♩ = "+bpm_selection.value())
    bpm_label.style("z-index:-1; font-size:16px; font-weight:400; margin:0; padding:0;")
    bpm_selection.mouseClicked(function(){
      var newBPM = bpm_selection.value()
      bpm_label.elt.innerText = "♩ = " + newBPM;
      phraseContainer.setBPM(newBPM);
      noteDur = (60 / (newBPM ))
      bpm = newBPM;  // Update global bpm variable
      console.log(noteDur)
    })

    note_duration_selection = createSlider(0, 150, 25);
    dur_label = createP("legato "+note_duration_selection.value()/50+"")
    dur_label.style("z-index:-1; font-size:16px; font-weight:400; margin:0; padding:0;")
    note_duration_selection.mouseClicked(function(){
      dur_label.elt.innerText = "legato " + note_duration_selection.value()/50;
      sust = note_duration_selection.value()/50
    })

    startIndex = createSlider(0, 8600, 0);
    startIndex_label = createP("start: "+startIndex.value())
    startIndex_label.style("z-index:-1; font-size:16px; font-weight:400; margin:0; padding:0;")
    startIndex.mouseClicked(function(){
      startIndex_label.elt.innerText = "start: " + startIndex.value();
      index = startIndex.value()
    })

    stopIndex = createSelect()
    stopIndex.option('no loop');
    stopIndex.option('loop after 4 digits');
    stopIndex.option('loop after 8 digits');
    stopIndex.option('loop after 16 digits');
    stopIndex.option('loop after 32 digits');
    stopIndex.option('loop after 64 digits');
    stopIndex.option('loop after 128 digits');
    stopIndex.option('loop after 256 digits');
    stopIndex.option('loop after 512 digits');
    stopIndex.option('loop after 1024 digits');
    stopIndex.option('loop after 2048 digits');
    stopIndex.option('loop after 4096 digits');
    stopIndex.changed(stopIndexChanged);

    // ========================================================================
    // Set default selections to match initial values in sketch.js
    // ========================================================================
    // Pi, Canon Walk, Pizzicato Strings & Music Box, D minor
    number_selection.selected('Pi');                      // Pi sequence
    rythm_selection.selected('Canon Walk');               // Canon Walk rhythm
    lead_selection.selected('for pizzicato_strings');     // Pizzicato strings
    bass_selection.selected('and music_box');             // Music box
    tone_selection.selected('in D');                      // D key (index 2)
    scale_selection.selected('minor');                    // Minor scale (index 2)

}

Gui.prototype.resize = function(x,y,w,h){
    this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;

    var margin = 20;
    var yPos = this.y + 10;

    // ========================================================================
    // ROW 1: Title - Centered like a piece title
    // ========================================================================
    var titleW = title.elt.clientWidth;
    var titleH = title.elt.clientHeight;
    title.position(this.w/2 - titleW/2, yPos);
    yPos += titleH + 5;

    // ========================================================================
    // ROW 2: Sequence selector - Centered, prominent
    // ========================================================================
    var seqW = number_selection.elt.clientWidth;
    number_selection.position(this.w/2 - seqW/2, yPos);
    title_tooltip.position(this.w/2 + seqW/2 + 10, yPos + 5);
    yPos += number_selection.elt.clientHeight + 15;

    // ========================================================================
    // ROW 3: Musical parameters - Centered, evenly spaced
    // Format: [Rhythm] [Lead Instr.] [Bass Instr.] [Key] [Scale]
    // ========================================================================
    var spacing = 8;
    var sub_length = rythm_selection.elt.clientWidth +
                     lead_selection.elt.clientWidth +
                     bass_selection.elt.clientWidth +
                     tone_selection.elt.clientWidth +
                     scale_selection.elt.clientWidth +
                     (spacing * 4);

    var xPos = this.w/2 - sub_length/2;

    rythm_selection.position(xPos, yPos);
    xPos += rythm_selection.elt.clientWidth + spacing;

    lead_selection.position(xPos, yPos);
    xPos += lead_selection.elt.clientWidth + spacing;

    bass_selection.position(xPos, yPos);
    xPos += bass_selection.elt.clientWidth + spacing;

    tone_selection.position(xPos, yPos);
    xPos += tone_selection.elt.clientWidth + spacing;

    scale_selection.position(xPos, yPos);

    yPos += lead_selection.elt.clientHeight + 45;  // More space for slider labels

    // ========================================================================
    // ROW 4: Playback controls - Centered horizontally, sliders aligned with button center
    // Format: [Play] [BPM: slider] [Legato: slider] [Start: slider] [Loop]
    // ========================================================================

    // Calculate total width of controls
    var controlSpacing = 30;
    var controlsWidth = button.elt.clientWidth +
                        bpm_selection.elt.clientWidth +
                        note_duration_selection.elt.clientWidth +
                        startIndex.elt.clientWidth +
                        stopIndex.elt.clientWidth +
                        (controlSpacing * 4);

    // Center the controls horizontally
    xPos = this.w/2 - controlsWidth/2;

    // Button height for vertical centering
    var buttonHeight = button.elt.clientHeight;
    var sliderOffset = (buttonHeight / 2) - 4;  // Center slider with button

    button.position(xPos, yPos);
    xPos += button.elt.clientWidth + controlSpacing;

    bpm_label.position(xPos, yPos - 20);
    bpm_selection.position(xPos, yPos + sliderOffset);
    xPos += bpm_selection.elt.clientWidth + controlSpacing;

    dur_label.position(xPos, yPos - 20);
    note_duration_selection.position(xPos, yPos + sliderOffset);
    xPos += note_duration_selection.elt.clientWidth + controlSpacing;

    startIndex_label.position(xPos, yPos - 20);
    startIndex.position(xPos, yPos + sliderOffset);
    xPos += startIndex.elt.clientWidth + controlSpacing;

    stopIndex.position(xPos, yPos);  // Align with button, not with sliders

}



// play & pause button
/**
 * makeplay() - Toggle play/pause state
 *
 * SAFETY CHECKS:
 * - Verifies audio context is loaded before playing
 * - Prevents playback if audio initialization failed
 * - Provides user feedback if audio not ready
 *
 * CALLED BY: Play/Pause button click event
 */
function makeplay(){
    // Check if audio is ready before attempting to play
    if (!play){
        // Verify audio context is initialized
        if (!ctxLoaded) {
            console.warn('Audio not ready yet. Please wait for instruments to load.');
            alert('Audio is still loading. Please wait for instruments to load.');
            return;
        }

        // Check if audio loading failed
        if (audioLoadError) {
            console.error('Cannot play: audio loading failed');
            alert('Cannot play: audio failed to load. Please refresh the page.');
            return;
        }

        // Verify phraseContainer exists
        if (!phraseContainer) {
            console.error('phraseContainer is not initialized!');
            alert('Sequencer not initialized. Please refresh the page.');
            return;
        }

        // CRITICAL: Resume audio context if suspended (browser autoplay policy)
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().then(function() {
                phraseContainer.loop();
                phraseContainer.start(0);  // Start immediately at time 0
            });
        } else {
            phraseContainer.loop();
            phraseContainer.start(0);  // Start immediately at time 0
        }

        play = true;
        button.elt.innerHTML = "Pause";
   }
   else{
        // Stop playback
        phraseContainer.stop(0);
        play = false;
       button.elt.innerHTML = "Play";
   }
}


function apply_rythm(){
	current_rythm = rythm_selection.value();
}

function change_tone(){
    current_tone = tone_selection.elt.selectedIndex
}


function apply_scale(){
    current_scale = scale_selection.elt.selectedIndex
}

function apply_number(){
    var id = number_selection.elt.selectedIndex
    console.log(id)
    if (id == 0){
        current_number = pi
    }
    else if (id == 1){
        current_number = phi
    }
    else if (id == 2){
        current_number = fib
    }
    else if (id == 3){
        current_number = test
        console.log(current_number)
    }
}


function change_bass(){
    if (!ctxLoaded) {
        alert('Please wait for audio to initialize before changing instruments.');
        return;
    }

    ctx = getAudioContext();
    var val = bass_selection.value().split("and ");
    console.log('Loading new bass instrument:', val[1]);

    bass = Soundfont.instrument(ctx, val[1]);
    bass.then(function(inst){
        inst.connect(amplitude);
        console.log('Bass instrument loaded:', val[1]);
    }).catch(function(error) {
        console.error('Failed to load bass instrument:', error);
        alert('Failed to load bass instrument. Please try again.');
    });
}

function change_lead(){
    if (!ctxLoaded) {
        alert('Please wait for audio to initialize before changing instruments.');
        return;
    }

    ctx = getAudioContext();
    var val = lead_selection.value().split("for ");
    console.log('Loading new lead instrument:', val[1]);

    lead = Soundfont.instrument(ctx, val[1]);
    lead.then(function(inst){
        inst.connect(amplitude);
        console.log('Lead instrument loaded:', val[1]);
    }).catch(function(error) {
        console.error('Failed to load lead instrument:', error);
        alert('Failed to load lead instrument. Please try again.');
    });
}

function stopIndexChanged(){
    if(stopIndex.value() == "no loop"){
        stopIndexVal = 8677;
    }
    else {
        var val = stopIndex.value().split("loop after ")[1].split(" digits")[0] // arg ! get the number in the option string
        stopIndexVal = val;
    }
    console.log(stopIndexVal)
}


