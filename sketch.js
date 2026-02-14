/**
 * IRRATIONAL DUETS - Main Sketch File
 *
 * This file orchestrates the entire musical experience, converting mathematical sequences
 * (Pi, Phi, Fibonacci) into generative music with hand-drawn visual notation.
 *
 * ARCHITECTURE:
 * - Global state management for music playback and visualization
 * - Event-driven audio synthesis using p5.sound and soundfont-player
 * - Beat-based sequencer (pulseIncr called on each beat)
 * - Canvas-based rendering with p5.scribble for hand-drawn aesthetic
 */

// ============================================================================
// TODO LIST (Future Enhancements)
// ============================================================================
// TODO: Create dedicated page for Fibonacci sequences (patterns emerge at iteration 17+)
// TODO: Replace startIndex slider with input field + tooltip for precise control
// TODO: Add more loop options for shorter/longer repetition cycles
// TODO: Add slider to control drawing distortion/scribble intensity
// TODO: Display time signature notation (4/4, 3/4) based on selected rhythm
// TODO: Implement multiple "Impromptu" variations and canon rhythm patterns
// Reference: http://stackoverflow.com/questions/7944239/generating-fibonacci-sequence



// ============================================================================
// GLOBAL STATE - Audio Context & Playback Control
// ============================================================================

var ctx;                    // Web Audio API context (initialized on first user interaction)
let ctxLoaded = false;      // Flag: true when audio instruments are loaded and ready
var play = false;           // Playback state: true = playing, false = paused

// ============================================================================
// SEQUENCE MANAGEMENT
// ============================================================================

var current_number = pi;    // Currently selected mathematical sequence (default: Pi)
var index = 0;              // Current position in the sequence (which digit we're playing)
var stopIndexVal = 8677;    // Loop boundary: reset to startIndex after this many digits

// ============================================================================
// MUSIC PARAMETERS
// ============================================================================

var bpm = 45;               // Tempo: beats per minute (default 45, range 20-160)
var noteDur = 60 / 45;      // Base note duration in seconds (calculated from BPM: 60/bpm)
var sust = 1;               // Sustain multiplier for note duration (NOT traditional sustain pedal)
                            // Note: "sust" is misleading name - it's actually a duration multiplier
                            // Range: 0-3x, controlled by "legato" slider

var phraseContainer;        // p5.Part object - container for musical phrase with BPM timing
var pulse;                  // p5.Phrase - triggers pulseIncr() on each beat (4 beats per measure)
var beatCount = 0;          // Global beat counter (increments with each pulse)
var barCount = 0;           // Bar/measure counter (currently unused - potential future use)

var current_tone = 2;       // Root note/key transposition (0-11, maps to C through B) - D=2
var current_rythm = "Vals"; // Selected rhythm pattern (Vals = 3/4 waltz)
var current_scale = 2;      // Selected scale index (2 = minor scale - see utils.js)

var soundBass = "celesta";      // MIDI instrument name for bass voice
var soundLead = "harpsichord";  // MIDI instrument name for lead/treble voice

// Audio Analysis
var amplitude;              // p5.Amplitude analyzer - measures audio level for visual reactivity

// ============================================================================
// DRAWING SYSTEM
// ============================================================================

// Hand-drawn aesthetic library
var scribble = new Scribble();  // p5.scribble instance for sketchy, hand-drawn lines
var seed;                       // Random seed for consistent scribble variation per session
var drawPi = false;             // Debug flag: if true, display digit values on notation

// Graphics positioning & layout
var offset = 300;           // Current vertical position for drawing staff (moves down as notes fill up)
var anchor = offset;        // Fixed starting position for offset (reset point)
var spacing = 16;           // Base spacing unit in pixels (controls staff line spacing)
var xlimit;                 // How many notes fit horizontally before wrapping
var ylimit;                 // How many staff systems fit vertically before clearing screen

// Graphics components
var backGraphics;           // DrawBackGraphics instance - renders staff lines and clefs
var gui;                    // Gui instance - DOM elements for user controls (see dom.js)

// ============================================================================
// DRAWING ELEMENT ARRAYS
// ============================================================================
// WARNING: These arrays grow unbounded until screen wrap - potential memory leak!
// Consider implementing object pooling or periodic cleanup for long sessions

var notes;                  // Array of DrawNote objects for treble/lead voice
var bassnotes;              // Array of DrawNote objects for bass voice
var pauses;                 // Array of DrawPause objects (rest symbols)
var bars;                   // Array of DrawBars objects (measure/bar lines)

// ============================================================================
// AUDIO INITIALIZATION
// ============================================================================

// Variables for audio instruments (loaded asynchronously)
var lead, bass;
var audioLoadError = false;  // Flag to track if audio loading failed

/**
 * initializeAudio() - Initialize Web Audio system with instruments
 *
 * BROWSER REQUIREMENT: Modern browsers require user interaction before playing audio
 * (autoplay policy). This function is called from the initialization button.
 *
 * PROCESS:
 * 1. Get/create Web Audio context
 * 2. Load MIDI instruments via soundfont-player (async with timeout)
 * 3. Create p5.Part sequencer with BPM timing
 * 4. Connect instruments to amplitude analyzer for visual reactivity
 * 5. Update UI with loading status
 * 6. Hide overlay when ready
 *
 * ERROR HANDLING:
 * - Try/catch around initialization
 * - 10-second timeout for instrument loading
 * - Console errors for debugging
 * - UI feedback via status messages
 * - Sets audioLoadError flag on failure
 */
function initializeAudio() {
    if (ctxLoaded || audioLoadError) {
        return; // Already initialized or failed
    }

    // Get UI elements
    const statusEl = document.getElementById('initStatus');
    const buttonEl = document.getElementById('initAudioBtn');
    const overlayEl = document.getElementById('audioInitOverlay');

    // Update UI: show loading state
    if (statusEl) statusEl.textContent = 'Initializing audio...';
    if (buttonEl) buttonEl.disabled = true;

    console.log('Initializing audio context...');

    try {
        // Initialize Web Audio API context
        ctx = getAudioContext();

        if (!ctx) {
            throw new Error('Failed to create Audio Context');
        }

        /**
         * Helper function to load instrument with timeout
         * @param {string} instrumentName - MIDI instrument name
         * @param {number} timeout - Timeout in milliseconds (default 10000)
         * @returns {Promise} - Resolves with instrument or rejects on timeout/error
         */
        function loadInstrumentWithTimeout(instrumentName, timeout = 10000) {
            return Promise.race([
                Soundfont.instrument(ctx, instrumentName),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Instrument loading timeout')), timeout)
                )
            ]);
        }

        // Update status: loading instruments
        if (statusEl) statusEl.textContent = `Loading ${soundLead} and ${soundBass}...`;
        console.log('Loading instruments:', soundLead, soundBass);

        lead = loadInstrumentWithTimeout(soundLead);
        bass = loadInstrumentWithTimeout(soundBass);

        // Create musical sequencer
        phraseContainer = new p5.Part();  // Container for timing and playback
        pulse = new p5.Phrase('pulse', pulseIncr, [1, 1, 1, 1]);  // Call pulseIncr() on beat 1-4
        phraseContainer.setBPM(bpm);      // Set initial tempo
        phraseContainer.addPhrase(pulse); // Add the phrase to play

        // Wait for both instruments to load, then connect to analyzer
        // Note: amplitude is already initialized in setup()
        Promise.all([bass, lead])
            .then(function(instruments) {
                // Successfully loaded both instruments
                instruments[0].connect(amplitude);  // Bass
                instruments[1].connect(amplitude);  // Lead
                ctxLoaded = true;  // Mark audio as ready
                console.log('Audio initialized successfully');

                // Update UI: success
                if (statusEl) statusEl.textContent = '✓ Ready to play!';

                // Hide overlay after brief delay
                setTimeout(function() {
                    if (overlayEl) {
                        overlayEl.classList.add('hidden');
                        // Remove from DOM after transition
                        setTimeout(function() {
                            overlayEl.style.display = 'none';
                        }, 500);
                    }
                }, 800);
            })
            .catch(function(error) {
                // Handle loading errors
                console.error('Failed to load instruments:', error);
                audioLoadError = true;

                // Update UI: error
                if (statusEl) {
                    statusEl.textContent = '✗ Failed to load. Please refresh.';
                    statusEl.style.color = 'red';
                }
                if (buttonEl) {
                    buttonEl.textContent = 'Failed - Refresh Page';
                    buttonEl.style.backgroundColor = 'rgba(255, 100, 100, 0.3)';
                }
            });

    } catch (error) {
        // Handle initialization errors
        console.error('Audio initialization error:', error);
        audioLoadError = true;

        // Update UI: error
        if (statusEl) {
            statusEl.textContent = '✗ Audio system error. Please refresh.';
            statusEl.style.color = 'red';
        }
        if (buttonEl) {
            buttonEl.textContent = 'Failed - Refresh Page';
            buttonEl.style.backgroundColor = 'rgba(255, 100, 100, 0.3)';
        }
    }
}

// Attach initialization to button when DOM is ready
window.addEventListener('DOMContentLoaded', function() {
    const buttonEl = document.getElementById('initAudioBtn');
    if (buttonEl) {
        buttonEl.addEventListener('click', initializeAudio);
    }
});



// ============================================================================
// P5.JS LIFECYCLE FUNCTIONS
// ============================================================================

/**
 * preload() - Load assets before setup runs
 *
 * Loads the "Homemade Apple" font for handwritten aesthetic throughout UI
 */
function preload() {
    font = loadFont("assets/HomemadeApple.ttf")
}

/**
 * setup() - Initialize canvas and application state (runs once)
 *
 * RESPONSIBILITIES:
 * 1. Create full-window canvas
 * 2. Calculate grid layout (how many notes fit on screen)
 * 3. Initialize drawing arrays
 * 4. Configure p5.scribble for hand-drawn effect
 * 5. Create GUI controls
 * 6. Set initial bar lines
 *
 * CRITICAL ISSUE: setInterval hack at the end (see comment below)
 */
function setup() {

    createCanvas(windowWidth, windowHeight);

    // ========================================================================
    // Calculate drawing grid boundaries
    // ========================================================================
    // ylimit: How many staff systems (pairs of 5-line staves) fit vertically
    // Each staff system = (5 lines × spacing) × 2 staves + gaps = 25 × spacing
    ylimit = int((windowHeight) / (spacing * (25)));

    // xlimit: How many notes fit horizontally per staff line
    // Each note takes 5 × spacing, account for 5 × spacing margin on right
    xlimit = int((windowWidth - (spacing * 5)) / (spacing * 5));

    console.log(xlimit, ylimit)

    // ========================================================================
    // Initialize drawing element arrays
    // ========================================================================
    notes = [];
    bassnotes = [];
    pauses = [];
    bars = [];

    // ========================================================================
    // Configure scribble (hand-drawn aesthetic)
    // ========================================================================
    seed = random(500);  // Random seed for this session's scribble variation
    offset = anchor;     // Reset drawing position to top

    // Scribble parameters (will be modulated by audio amplitude in draw loop)
    scribble.bowing = 1;          // Affects curve/bow of lines (1 = moderate)
    scribble.roughness = 1;       // Affects sketchiness (1 = moderate)
    // scribble.maxOffset = 2;    // Commented out - max random offset per point
    // scribble.numEllipseSteps = 3; // Commented out - curve segments for ellipses

    background(206, 190, 190);  // Light grayish-brown background

    // ========================================================================
    // Initialize graphics components
    // ========================================================================
    backGraphics = new DrawBackGraphics(offset);  // Staff lines & clefs
    gui = new Gui(1, 1, width, height);           // DOM controls

    // Draw initial measure bar lines (one per staff)
    bars.push(new DrawBars(offset))              // Treble staff bar
    bars.push(new DrawBars(offset + spacing * 10))  // Bass staff bar

    textFont(font)  // Set font for text rendering

    // Initialize amplitude analyzer early (before audio loads)
    amplitude = new p5.Amplitude();

    // ========================================================================
    // GUI Positioning - Optimized Approach
    // ========================================================================
    /**
     * SOLUTION: Delay initial resize until DOM elements are rendered,
     * then use ResizeObserver for efficient resize handling
     *
     * BENEFITS:
     * - No continuous polling (saves battery/CPU)
     * - Only runs when actual resize occurs
     * - Falls back gracefully if ResizeObserver unavailable
     */

    // Initial resize after DOM elements render
    setTimeout(function () {
        gui.resize(1, 1, windowWidth, windowHeight);
    }, 100);

    // Use ResizeObserver for efficient resize detection (modern browsers)
    if (typeof ResizeObserver !== 'undefined') {
        const guiResizeObserver = new ResizeObserver(function() {
            gui.resize(1, 1, windowWidth, windowHeight);
        });
        guiResizeObserver.observe(document.body);
    }
}





/**
 * draw() - Main render loop (runs ~60 times per second)
 *
 * RENDERING ORDER:
 * 1. Clear background
 * 2. Modulate scribble based on audio amplitude (audio-reactive visuals)
 * 3. Draw static elements (staff lines, clefs)
 * 4. Draw musical elements (pauses, bars, notes)
 * 5. Draw debug info (sequence index, current digit, note name)
 *
 * PERFORMANCE NOTE:
 * - Redraws entire canvas every frame (no dirty rectangle optimization)
 * - Multiple array iterations
 * - Scribble rendering is CPU-intensive (hand-drawn curves)
 *
 * MOBILE OPTIMIZATION:
 * Consider reducing frame rate to 30fps for mobile:
 *   if (frameCount % 2 === 0) return;
 */
function draw() {

    background(206, 190, 190)  // Clear canvas with background color
    randomSeed(seed);          // Reset random seed for consistent scribble variation

    // ========================================================================
    // Audio-reactive scribble modulation
    // ========================================================================
    // Amplitude range: 0.0 (silence) to ~0.3 (loud)
    // Adding 1 gives range: 1.0 to ~1.3
    // Effect: Louder music = sketchier/wobblier drawing
    var level = amplitude ? amplitude.getLevel() : 0;
    scribble.bowing = level + 1;
    scribble.roughness = level + 1;
    scribble.maxOffset = level + 1;

    // ========================================================================
    // Draw static background elements
    // ========================================================================
    backGraphics.drawStave();                          // All staff lines across screen
    backGraphics.drawTrebbleClef(anchor);              // Treble clef on first staff
    backGraphics.drawTrebbleClef(anchor + spacing * 10);  // Treble clef on second staff
    // BUG: Second staff should show BASS clef, not treble clef!

    // ========================================================================
    // Draw musical notation elements in layers
    // ========================================================================
    // Layer 1: Pauses (rests)
    for (var i = 0; i < pauses.length; i++) {
        pauses[i].draw();
    }
    // Layer 2: Bar lines
    for (var i = 0; i < bars.length; i++) {
        bars[i].draw();
    }
    // Layer 3: Treble notes
    for (var i = 0; i < notes.length; i++) {
        notes[i].draw();
    }
    // Layer 4: Bass notes
    for (var i = 0; i < bassnotes.length; i++) {
        bassnotes[i].draw();
    }

    // ========================================================================
    // Debug info display (bottom-left corner)
    // ========================================================================
    strokeWeight(1);
    fill(0);
    stroke(0);
    textSize(20);
    text("sequence index : " + index, 5, windowHeight - 65);
    text("sequence value : " + pi[index], 5, windowHeight - 35);  // BUG: Always shows pi, not current_number
    text("note name : " + interval2notes[pi[index]].toLocaleLowerCase(), 5, windowHeight - 5);  // BUG: Same issue
}

/**
 * pulseIncr() - Beat sequencer callback (called on each musical beat)
 *
 * CALLED BY: p5.Part phraseContainer based on BPM timing
 * FREQUENCY: bpm/60 times per second (e.g., 45 BPM = 0.75 Hz)
 *
 * RESPONSIBILITIES:
 * 1. Check if we need to wrap to next staff line
 * 2. Execute rhythm pattern logic
 * 3. Play notes on instruments
 * 4. Draw corresponding notation
 * 5. Advance sequence index
 * 6. Handle looping
 *
 * RHYTHM PATTERNS:
 * - "Dialog": Bass and lead alternate on even/odd beats
 * - "Unisson Walk": Bass and lead play together on even beats
 * - "Canon Walk": Lead enters 4 beats after bass (delayed canon)
 * - "Vals": 3/4 time waltz pattern
 * - "Impromptu": Empty placeholder for future rhythm
 *
 * NOTE DURATION ENCODING (in "arg" parameter):
 * - "ffff" = whole note (4 beats)
 * - "fff"  = dotted half note
 * - "ff"   = half note (2 beats)
 * - "f"    = quarter note (1 beat)
 * - "s"    = silence/rest
 *
 * This encoding system multiplies noteDur by arg.length to get actual duration
 */
function pulseIncr() {

    checkDrawingMargins();  // Wrap to next line if we've filled current staff

    // ========================================================================
    // RHYTHM: Dialog - Call and response pattern
    // ========================================================================
    // Pattern: Bass and lead alternate playing on even/odd beats
    // Time signature: 4/4
    // Visual: Bar lines every 8 beats (2 measures)
    if (current_rythm == "Dialog") {
        if (beatCount % 8 == 0) {
            bars.push(new DrawBars(offset))              // Treble staff bar
            bars.push(new DrawBars(offset + spacing * 10))  // Bass staff bar
        }
        if (beatCount % 2 == 0) {  // Even beats: bass plays, lead rests
            bassPlay(0, "f", index);   // Quarter note
            leadPlay(0, "s", index);   // Rest
        }
        if (beatCount % 2 == 1) {  // Odd beats: lead plays, bass rests
            bassPlay(0, "s", index);   // Rest
            leadPlay(0, "f", index);   // Quarter note
        }
        index += 1;  // Advance to next digit in sequence
    }

    // ========================================================================
    // RHYTHM: Unisson Walk - Both voices together
    // ========================================================================
    // Pattern: Bass and lead play same note in unison
    // Time signature: 4/4
    // Note: Only plays on even beats (creates half-note rhythm feel)
    if (current_rythm == "Unisson Walk") {
        if (beatCount % 8 == 0) {
            bars.push(new DrawBars(offset))
            bars.push(new DrawBars(offset + spacing * 10))
        }
        if (beatCount % 2 == 0) {  // Play on even beats only
            bassPlay(0, "ff", index);  // Half note
            leadPlay(0, "ff", index);  // Half note (same pitch, same time)
            index += 1  // Advance sequence
        }
    }

    // ========================================================================
    // RHYTHM: Canon Walk - Delayed imitation
    // ========================================================================
    // Pattern: Bass starts alone, lead enters 4 beats later playing same sequence
    // Creates round/canon effect with mathematical sequence
    if (current_rythm == "Canon Walk") {
        if (beatCount % 8 == 0) {
            bars.push(new DrawBars(offset))
            bars.push(new DrawBars(offset + spacing * 10))
        }
        if (beatCount % 2 == 0) {
            if (beatCount < 2 * 4) {
                // First 4 beats (2 measures): Bass plays alone
                bassPlay(0, "ff", index);
            }
            else {
                // After beat 8: Both voices play
                // Lead plays 4 digits behind bass (delayed index)
                if (beatCount % 1 == 0) {  // Always true - redundant condition!
                    var delayed_index = constrain(index - 4, 0, pi.length);
                    // BUG: Uses pi.length instead of current_number.length
                    bassPlay(0, "ff", index);
                    leadPlay(0, "ff", delayed_index);  // 4 notes behind
                }
            }
            index += 1
        }
    }

    // ========================================================================
    // RHYTHM: Vals (Waltz) - 3/4 time signature
    // ========================================================================
    // Pattern: Bass on downbeat (every 6 beats = 2 measures of 3/4)
    //          Lead on every beat
    // Creates classic waltz feel: STRONG-weak-weak
    if (current_rythm == "Vals") {
        if (beatCount % 6 == 0) {
            bars.push(new DrawBars(offset))
            bars.push(new DrawBars(offset + spacing * 10))
            bassPlay(0, "ffff", index);  // Whole note bass (pedal tone)
            //index+=1;  // Commented out - bass doesn't advance sequence
        }
        if (beatCount % 2 == 0) {  // Even beats: quarter note
            leadPlay(0, "f", index);
            index += 1;
        }
        else {  // Odd beats: rest (creates 3/4 feel)
            leadPlay(0, "s", index);
        }
    }

    // ========================================================================
    // RHYTHM: Impromptu - Placeholder for future implementation
    // ========================================================================
    // TODO: Implement improvised/random rhythm patterns
    // Ideas: Random note durations, probabilistic rest placement, syncopation
    if (current_rythm == "Impromptu") {
        // Empty - not implemented yet
    }

    // ========================================================================
    // Beat counter & loop management
    // ========================================================================
    beatCount += 1;  // Increment global beat counter

    // Loop back to start when we reach the stop index
    // Also check against actual sequence length to prevent out-of-bounds access
    var maxIndex = current_number ? current_number.length : 0;
    var loopEnd = Math.min(startIndex.value() + stopIndexVal, maxIndex);

    if (index >= loopEnd) {
        index = startIndex.value();  // Reset to loop start point
        // Note: startIndex is a p5 DOM slider element, .value() gets current value
    }

}

/**
 * getSequenceValue() - Safely retrieve a digit from the current sequence with bounds checking
 *
 * SAFETY:
 * - Validates that current_number exists
 * - Validates index is within array bounds
 * - Returns 0 as fallback for invalid indices
 * - Logs warnings for debugging
 *
 * @param {number} index - Position in sequence to read
 * @returns {number} - Digit at that position (0-9), or 0 if invalid
 */
function getSequenceValue(index) {
    // Check if sequence exists
    if (!current_number || !current_number.length) {
        console.warn('No sequence loaded');
        return 0;
    }

    // Check if index is within bounds
    if (index < 0 || index >= current_number.length) {
        console.warn(`Index out of bounds: ${index} (sequence length: ${current_number.length})`);
        // Return 0 as safe fallback
        return 0;
    }

    // Return the digit at this index
    return parseInt(current_number[index]) || 0;
}

/**
 * leadPlay() - Play a note on the lead (treble) voice
 *
 * PROCESS:
 * 1. Check if this is a rest ("s") or a note
 * 2. If rest: draw pause symbol
 * 3. If note:
 *    a. Get digit from current sequence
 *    b. Map digit through selected scale to get MIDI note number
 *    c. Transpose by current_tone (key change)
 *    d. Convert to note name (e.g., "C4", "F#3")
 *    e. Play note with calculated duration
 *    f. Draw notation on treble staff
 *
 * @param {number} time - Unused parameter (legacy from p5.Phrase callback)
 * @param {string} arg - Duration encoding ("s"=rest, "f"=quarter, "ff"=half, etc.)
 * @param {number} index - Position in sequence to read digit from
 *
 * MATH MAPPING EXAMPLE:
 * - Sequence digit: 3
 * - Scale: Major (scales[1] = [0,2,4,5,7,9,11,12,14,16])
 * - scales[1][3] = 5 (MIDI interval)
 * - current_tone: 0 (key of C)
 * - newNote = 5 + 0 = 5
 * - interval2notes[5] = "F3"
 * - Result: Plays F3
 *
 * NOTE DURATION CALCULATION:
 * duration = noteDur × arg.length × sust
 * - noteDur: Base duration from BPM (60/bpm seconds)
 * - arg.length: Number of characters ("ff" = 2, "ffff" = 4)
 * - sust: User-controlled legato multiplier (0-3x)
 *
 * BUG: index += 1 increments parameter, not global index (no effect)
 */
function leadPlay(time, arg, index) {
    if (arg == "s") {
        // Draw a rest symbol on treble staff
        pauses.push(new DrawPause(offset));
    }
    else {
        // Get the digit from the sequence at this index (with bounds checking)
        var value = getSequenceValue(index);

        // Map digit → scale interval → MIDI note → transpose
        var newNote = int(scales[current_scale][value]) + current_tone;

        // Convert MIDI note number to note name string
        var noteName = interval2notes[(int(newNote))]

        // Play the note (lead is a Promise, use .then() to access instrument)
        lead.then(function (inst) {
            inst.play(noteName, 0, { duration: noteDur * (arg.length) * sust });
        });
        //console.log("lead : " + noteDur*(arg.length)*sust)

        index += 1;  // BUG: This increments local parameter, not global index!

        // Draw the note on the treble staff
        // color(0) = black outline for treble notes
        notes.push(new DrawNote(value, newNote, arg, offset, color(0)));
    }
}


/**
 * bassPlay() - Play a note on the bass voice
 *
 * Identical logic to leadPlay(), but:
 * - Uses bass instrument instead of lead
 * - Draws on bass staff (offset + spacing*10)
 * - Uses color(255) = white outline for bass notes
 *
 * @param {number} time - Unused parameter
 * @param {string} arg - Duration encoding
 * @param {number} index - Position in sequence
 *
 * DIFFERENCE FROM LEAD:
 * - Bass notes drawn 10 spacing units lower (second staff)
 * - Color coded differently (white instead of black outline)
 * - Both use same sequence and scale mapping
 *
 * NOTE: In musical notation, bass clef should show different note positions,
 * but currently both staves show treble clef (see draw() function bug)
 */
function bassPlay(time, arg, index) {
    if (arg == "s") {
        // Draw a rest symbol on bass staff
        pauses.push(new DrawPause(offset + spacing * 10));
    }
    else {
        // Get digit from sequence (with bounds checking)
        var value = getSequenceValue(index);
        //console.log("bass value : "+value)

        // Map through scale and transpose
        var newNote = scales[current_scale][value] + current_tone;
        //console.log("bass scale value : "+newNote)

        // Convert to note name
        var noteName = interval2notes[(int(newNote))]
        //console.log("bass noteName : "+noteName)

        // Play the note
        bass.then(function (inst) {
            inst.play(noteName, 0, { duration: noteDur * (arg.length) * sust });
        });
        //console.log("bass : " + noteDur*(arg.length)*sust)

        index += 1;  // BUG: Same issue as leadPlay()

        // Draw the note on bass staff
        // color(255) = white outline for bass notes (different from treble)
        bassnotes.push(new DrawNote(value, newNote, arg, offset + spacing * 10, color(255)));
    }
}



/**
 * cleanupOffScreenObjects() - Remove drawing objects that are no longer visible
 *
 * MEMORY OPTIMIZATION:
 * Filters out objects that have scrolled off-screen to prevent unbounded array growth.
 * Objects are considered off-screen if they're more than one screen height above current view.
 *
 * CALLED BY: checkDrawingMargins() periodically during playback
 *
 * PERFORMANCE:
 * - Only keeps objects within visible range + buffer
 * - Prevents memory accumulation during long sessions
 * - Filter operations are O(n) but much cheaper than unbounded growth
 */
function cleanupOffScreenObjects() {
    // Keep objects that are still on screen or within reasonable buffer
    // Objects with offset < (current offset - screen height) are definitely off-screen
    const offscreenThreshold = offset - windowHeight;

    // Only cleanup if we have objects that could be off-screen
    if (offscreenThreshold > anchor) {
        notes = notes.filter(n => n.offset > offscreenThreshold);
        bassnotes = bassnotes.filter(n => n.offset > offscreenThreshold);
        pauses = pauses.filter(p => p.offset > offscreenThreshold);
        bars = bars.filter(b => b.offset > offscreenThreshold);
    }
}

/**
 * checkDrawingMargins() - Handle screen wrapping for musical notation
 *
 * CALLED BY: pulseIncr() at the start of each beat
 *
 * LOGIC:
 * 1. Horizontal wrap: When we've filled current staff line (xlimit notes)
 *    → Move down to next staff system
 * 2. Vertical wrap: When we've filled all vertical space (ylimit systems)
 *    → Clear all drawing arrays and reset to top
 *
 * LAYOUT:
 * - Each staff system = 2 staves (treble + bass) = 20 spacing units
 * - Gap between systems = spacing * 2
 * - Total per system = spacing * (5+5) * 2
 *
 * MEMORY MANAGEMENT:
 * - Cleans up off-screen objects periodically to prevent unbounded growth
 * - Full reset occurs at vertical wrap
 */
function checkDrawingMargins() {
    // Check if we've reached the right edge of current staff
    if (beatCount % (xlimit) == 0) {
        // Move down by 2 full staff heights (each staff = 5 lines × spacing)
        offset += spacing * (5 + 5) * 2;

        // Clean up off-screen objects to prevent memory leak
        cleanupOffScreenObjects();

        // Check if we've run out of vertical space
        if (int(beatCount / xlimit) % (ylimit) == 0) {
            // Clear all drawing arrays (free memory)
            notes = [];
            bassnotes = [];
            pauses = [];
            bars = [];
            // Reset to top of screen
            offset = anchor;
        }
    }
}


/**
 * windowResized() - Handle browser window resize events
 *
 * CALLED BY: p5.js automatically when window size changes
 *
 * RESPONSIBILITIES:
 * 1. Resize canvas to new window dimensions
 * 2. Generate new random seed for scribble variation
 * 3. Recalculate grid layout (xlimit, ylimit)
 * 4. Recreate background graphics
 * 5. Reposition GUI elements
 * 6. Clear screen
 *
 * NOTE: This does NOT preserve current notation on screen
 * All drawn notes are lost on resize (not saved/repositioned)
 *
 * MOBILE CONSIDERATION:
 * - Orientation change triggers this
 * - Rotating device will clear current notation
 * - Music playback continues (sequence index preserved)
 */
function windowResized() {
    // Resize canvas to match new window size
    resizeCanvas(windowWidth, windowHeight);

    // New random seed for fresh scribble variation
    seed = random(500);

    // Reset drawing position to top
    offset = anchor;

    // Recalculate how many notes fit in new dimensions
    ylimit = int((windowHeight) / (spacing * (25)));
    xlimit = int((windowWidth - (spacing * 5)) / (spacing * 5));
    console.log(xlimit, ylimit)

    // Recreate background graphics with new offset
    backGraphics = new DrawBackGraphics(offset);

    // Reposition GUI controls for new window size
    gui.resize(1, 1, windowWidth, windowHeight);

    // Clear screen
    background(206, 190, 190)
}
