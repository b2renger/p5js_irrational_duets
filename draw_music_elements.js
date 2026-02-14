/**
 * DRAW_MUSIC_ELEMENTS.JS - Musical Notation Rendering System
 *
 * This file contains classes for drawing musical notation elements:
 * - DrawBackGraphics: Staff lines and clefs (background elements)
 * - DrawBars: Measure/bar lines (vertical dividers)
 * - DrawNote: Musical notes with stems, flags, accidentals, ledger lines
 * - DrawPause: Rest symbols
 *
 * RENDERING APPROACH:
 * - Uses p5.scribble library for hand-drawn aesthetic
 * - All elements drawn with sketchyline effects (no perfect lines)
 * - Audio amplitude modulates scribble parameters for reactivity
 *
 * COORDINATE SYSTEM:
 * - offset: Vertical position of staff (moves down as notes fill screen)
 * - spacing: Base unit for all measurements (default 16px)
 * - Staff lines are spaced by 'spacing' pixels
 *
 * MUSICAL NOTATION STANDARDS:
 * - 5-line staff (treble clef)
 * - Note heads: filled for shorter durations, hollow for longer
 * - Stems: vertical lines for quarter notes and shorter
 * - Flags: curves on stems for eighth notes
 * - Accidentals: sharps (#) and flats (b) shown before notes
 * - Ledger lines: extra lines for notes outside staff range
 */

// ============================================================================
// BACKGROUND GRAPHICS: STAFF LINES & CLEFS
// ============================================================================

/**
 * DrawBackGraphics - Renders musical staff and clef symbols
 *
 * RESPONSIBILITIES:
 * 1. Draw 5-line staff systems across the screen
 * 2. Draw treble clef symbols
 *
 * @param {number} offset - Vertical starting position for first staff
 */
function DrawBackGraphics(offset){
    this.offset = offset;  // Store initial vertical position
}

/**
 * drawStave() - Render all staff systems vertically down the screen
 *
 * LAYOUT:
 * - Each system = 2 staves (treble + bass) = 10 lines total
 * - Gap between systems = spacing * 2
 * - Continues for ylimit*2 systems (fills vertical space)
 *
 * CALLED BY: draw() function in sketch.js every frame
 */
DrawBackGraphics.prototype.drawStave = function(){
    var tempOffset = this.offset;  // Start at initial offset

    // Draw ylimit*2 staff systems (2 staves each)
    for (var i = 0 ; i < ylimit*2 ; i++){
        this.drawLines(tempOffset, spacing);   // Draw one 5-line staff

        // Move down by full staff height
        // Each staff = 5 lines, so 2 staves = 10 spacing units
        tempOffset +=  spacing * (5+5);
    }
}

/**
 * drawLines() - Render a single 5-line staff across the screen
 *
 * WHY 8 SEGMENTS?
 * - Splits each line into 8 horizontal segments (windowWidth/8 each)
 * - Allows scribble to vary each segment independently
 * - Creates more natural hand-drawn look (avoids perfectly straight lines)
 *
 * PERFORMANCE NOTE:
 * - 5 lines × 8 segments = 40 scribbleLine() calls per staff
 * - With ylimit*2 staves, this is ~400-800 line segments total
 * - Consider caching to an off-screen buffer for better performance
 *
 * @param {number} offset - Vertical position for this staff
 * @param {number} spacing - Distance between lines
 */
DrawBackGraphics.prototype.drawLines = function(offset,spacing){
    stroke(0);           // Black lines
    strokeWeight(1);     // Thin lines for staff
    noFill();            // No fill for lines

    // Draw 5 horizontal lines (standard musical staff)
    for (var i = 0 ; i < 5 ; i++){
        // Each line broken into 8 segments across window width
        // This creates a more organic, hand-drawn appearance
        scribble.scribbleLine(  windowWidth*0/8, offset + i*spacing, windowWidth*1/8, offset + i*spacing );
        scribble.scribbleLine(  windowWidth*1/8, offset + i*spacing, windowWidth*2/8, offset + i*spacing );
        scribble.scribbleLine(  windowWidth*2/8, offset + i*spacing, windowWidth*3/8, offset + i*spacing );
        scribble.scribbleLine(  windowWidth*3/8, offset + i*spacing, windowWidth*4/8, offset + i*spacing );
        scribble.scribbleLine(  windowWidth*4/8, offset + i*spacing, windowWidth*5/8, offset + i*spacing );
        scribble.scribbleLine(  windowWidth*5/8, offset + i*spacing, windowWidth*6/8, offset + i*spacing );
        scribble.scribbleLine(  windowWidth*6/8, offset + i*spacing, windowWidth*7/8, offset + i*spacing );
        scribble.scribbleLine(  windowWidth*7/8, offset + i*spacing, windowWidth*8/8, offset + i*spacing );
    }
}

/**
 * drawTrebbleClef() - Render treble clef symbol (G clef)
 *
 * MUSICAL CONTEXT:
 * - Treble clef indicates pitch range (G above middle C is on 2nd line)
 * - Symbol wraps around 2nd line of staff (the "G" line)
 * - Traditional in Western music notation since 16th century
 *
 * VISUAL DESIGN:
 * - Based on stylized letter "G"
 * - Consists of curves, loops, and a vertical spine
 * - Hand-drawn using p5.scribble for organic look
 *
 * IMPLEMENTATION:
 * - Uses translate() and scale() to position and size
 * - Drawn with Bézier curves and line segments
 * - Scale 0.3 reduces size to fit staff
 * - IMPORTANT: resetMatrix() at end restores coordinate system
 *
 * SOURCE: https://www.khanacademy.org/computer-programming/treble/5306378526654464
 *
 * BUG NOTE: Currently drawn on BOTH staves (treble and bass)
 * Bass staff should show bass clef (F clef) instead
 *
 * @param {number} anchor - Vertical position for staff
 */
DrawBackGraphics.prototype.drawTrebbleClef = function (anchor){

    noFill();              // Hollow curves
    stroke(0);             // Black ink
    strokeWeight(10);      // Thick lines for visibility

    // Position clef at left edge of staff, slightly above
    translate(0, anchor - spacing*2)
    scale(0.3, 0.3)       // Scale down to 30% for proper sizing

    // TREBLE CLEF CONSTRUCTION (scaled coordinates, not pixels)

    // Top right curve (head of clef)
    scribble.scribbleCurve(75, 25, 75, 150, 125, 75, 125, 100);

    // Outer left curve (main body)
    scribble.scribbleCurve(75, 150,   75, 300, 5, 200, 0, 290);

    // Lower right curve
    scribble.scribbleCurve(75, 200,  75, 300, 150, 205, 150, 295);

    // Inner left curve
    scribble.scribbleCurve(75, 200, 80, 265, 30, 200, 20, 280);

    // Inner dot (filled circle at center)
    fill(0);
    scribble.scribbleEllipse(75, 250, 25, 25);

    // Bottom curl - decorative element

    // Dot at top of curl
    scribble.scribbleEllipse(40, 340, 20, 20);

    // Left curve of curl (drawn as connected line segments)
    noFill();
    scribble.scribbleLine(40,325,35,326); scribble.scribbleLine(35,326,25,330); scribble.scribbleLine(25,330,15,350);
    scribble.scribbleLine(15,350,15,360); scribble.scribbleLine(15,360,20,370); scribble.scribbleLine(20,370,25,375);
    scribble.scribbleLine(25,375,30,380); scribble.scribbleLine(30,380,35,382); scribble.scribbleLine(35,382,40,383);

    // Bottom segment (horizontal)
    scribble.scribbleLine(40, 383, 50, 383);

    // Right curve of curl (bottom to top)
    scribble.scribbleLine(50,383,55,382); scribble.scribbleLine(55,382,60,380); scribble.scribbleLine(60,380,65,375);
    scribble.scribbleLine(65,375,70,370); scribble.scribbleLine(70,370,73,360); scribble.scribbleLine(73,360,74,350);
    scribble.scribbleLine(74,350,75,345);

    // Vertical spine (main stem of clef)
    scribble.scribbleLine(75, 345, 75, 25);

    // CRITICAL: Reset transformation matrix
    // Without this, all subsequent drawing would be scaled/translated!
    resetMatrix()
}

// ============================================================================
// BAR LINES - Measure Dividers
// ============================================================================

/**
 * DrawBars - Vertical lines that divide music into measures/bars
 *
 * MUSICAL PURPOSE:
 * - Organize music into regular time units (measures/bars)
 * - Help musicians read and count beats
 * - Typically placed every 4 or 8 beats depending on time signature
 *
 * PLACEMENT:
 * - Created in pulseIncr() function based on beatCount
 * - Dialog, Unisson, Canon: every 8 beats (2 measures of 4/4)
 * - Vals: every 6 beats (2 measures of 3/4)
 *
 * VISUAL:
 * - Vertical line spanning height of staff (5 lines = 4 spacing units)
 * - Thicker than staff lines (strokeWeight 3 vs 1)
 *
 * @param {number} offset - Vertical position of the staff
 */
function DrawBars(offset){
    // Calculate horizontal position based on current beat
    // spacing*5 = initial margin + (beat position × note width)
    this.xpos = spacing*5 + (beatCount % (xlimit)) * spacing*5

    this.ypos = offset + (spacing*4)  // Bottom of staff
    this.offset = offset;             // Store staff position
}

/**
 * draw() - Render the bar line
 *
 * VISUAL SPECS:
 * - Thick black line (strokeWeight 3)
 * - Spans from top to bottom of 5-line staff
 * - Slightly offset right (spacing*6/4) for centering
 */
DrawBars.prototype.draw = function() {
    stroke(0);                    // Black
    strokeWeight(3);              // Thicker than staff lines

    // Draw vertical line from top to bottom of staff
    // offset = top line
    // offset + spacing*4 = bottom line (5 lines = 4 gaps)
    scribble.scribbleLine(
        this.xpos + spacing*6/4, this.offset,           // Top point
        this.xpos + spacing*6/4, this.offset + spacing*4  // Bottom point
    );
}

// ============================================================================
// MUSICAL NOTES
// ============================================================================

/**
 * DrawNote - Renders a musical note with all standard notation elements
 *
 * COMPONENTS DRAWN:
 * - Note head (filled or hollow oval)
 * - Stem (vertical line for quarter notes and shorter)
 * - Flag (curved tail for eighth notes)
 * - Accidentals (# sharp or b flat symbols)
 * - Ledger lines (extra lines for notes outside staff range)
 * - Optional: Digit display (synesthesia mode)
 *
 * MUSICAL NOTATION RULES:
 * - Whole note (ffff): Hollow, no stem
 * - Half note (ff): Hollow, with stem
 * - Quarter note (f): Filled, with stem
 * - Eighth note: Filled, with stem and flag
 *
 * POSITION CALCULATION:
 * - xpos: Horizontal - based on beat count and xlimit
 * - ypos: Vertical - calculated from notes2position mapping
 * - Higher notes = lower ypos (inverted coordinate system)
 *
 * @param {number} val - Original digit from sequence (0-9)
 * @param {number} newNote - MIDI interval number after scale mapping
 * @param {string} arg - Duration encoding ("f"=quarter, "ff"=half, etc.)
 * @param {number} offset - Vertical position of staff
 * @param {color} c - Color for outline (black for treble, white for bass)
 */
function DrawNote(val, newNote, arg, offset, c){
    // Color from synesthesia mapping (based on original digit)
    this.c = color(synesthesisTable[val]);

    this.newNote = newNote;  // MIDI interval number
    this.val = val;          // Original sequence digit
    this.offset = offset;    // Staff vertical position

    // Horizontal position: left margin + beat position × note width
    this.xpos = spacing*9 + (beatCount % (xlimit)) * spacing*5;

    // Vertical position: staff reference - note position × spacing
    // notes2position maps note names to staff positions
    // Higher notes have higher position values, but lower y coordinates
    this.ypos = this.offset + (spacing*4) - notes2position[interval2notes[newNote]] * spacing;

    this.arg = arg;  // Duration encoding ("f", "ff", "fff", "ffff")
}

/**
 * draw() - Render the complete musical note with all notation elements
 *
 * RENDERING ORDER:
 * 1. Note head (filled or hollow based on duration)
 * 2. Stem (vertical line for shorter durations)
 * 3. Flag (eighth note tail)
 * 4. Accidentals (# or b symbols)
 * 5. Ledger lines (for notes outside staff)
 * 6. Optional digit display (synesthesia mode)
 *
 * DURATION ENCODING (arg parameter):
 * - "ffff" = whole note: hollow head, no stem
 * - "fff"  = dotted half: hollow head, stem
 * - "ff"   = half note: hollow head, stem
 * - "f"    = eighth note: filled head, stem + flag
 */
DrawNote.prototype.draw = function (){

    strokeWeight(2);

    // ========================================================================
    // NOTE HEAD FILL LOGIC
    // ========================================================================
    // Traditional notation:
    // - Filled heads: quarter notes and shorter (faster notes)
    // - Hollow heads: half notes and longer (slower notes)
    if(this.arg == "ff" || this.arg =="f"){
        fill(this.c);  // Fill with synesthesia color for quarter/eighth
    }
    else{
        noFill();      // Hollow for half/whole notes
    }
    stroke(this.c);    // Outline color (black or white)

    // ========================================================================
    // DRAW NOTE HEAD (oval)
    // ========================================================================
    scribble.scribbleEllipse(this.xpos, this.ypos, spacing, spacing);

    // ========================================================================
    // DRAW STEM (vertical line)
    // ========================================================================
    // Stems are drawn for half notes, quarter notes, eighth notes
    // (all except whole notes)
    if (this.arg == "ff" || this.arg == "fff" || this.arg == "f") {
        // Stem: From right edge of note head, extending up 3 spacing units
        scribble.scribbleLine(
            this.xpos + spacing/2, this.ypos,              // Bottom (at note head)
            this.xpos + spacing/2, this.ypos - spacing*3   // Top
        );
    }

    // ========================================================================
    // DRAW FLAG (eighth note tail)
    // ========================================================================
    // Only eighth notes ("f") get a flag
    // Flag is a diagonal line from top of stem
    if(this.arg =="f"){
        scribble.scribbleLine(
            this.xpos + spacing/2, this.ypos - spacing*3,        // Top of stem
            this.xpos + spacing/2 + spacing/2, this.ypos - spacing*2  // Flag endpoint
        );
    }

    // ========================================================================
    // DRAW SHARP (#) ACCIDENTAL
    // ========================================================================
    // Check if note name contains '#' (e.g., "C#4", "F#3")
    // Sharp symbol = 4 lines (2 vertical, 2 diagonal)
    if(interval2notes[this.newNote].split('#').length > 1){
        // First vertical line
        scribble.scribbleLine(
            this.xpos - spacing*2, this.ypos + spacing/2,
            this.xpos - spacing*2 + spacing/2, this.ypos - spacing + spacing/2
        );
        // Second vertical line
        scribble.scribbleLine(
            this.xpos - spacing*2 + spacing/2, this.ypos + spacing/2,
            this.xpos - spacing*2 + spacing/2 + spacing/2, this.ypos - spacing + spacing/2
        );
        // First horizontal line
        scribble.scribbleLine(
            this.xpos - spacing*2, this.ypos - spacing/3 + spacing/2,
            this.xpos - spacing, this.ypos - spacing/2.5 + spacing/2
        );
        // Second horizontal line
        scribble.scribbleLine(
            this.xpos - spacing*2, this.ypos - spacing/1.75 + spacing/2,
            this.xpos - spacing, this.ypos - spacing/1.5 + spacing/2
        );
    }

    // ========================================================================
    // DRAW FLAT (b) ACCIDENTAL
    // ========================================================================
    // Check if note name contains 'b' (e.g., "Bb4", "Eb3")
    // Flat symbol = vertical line + curved bottom
    if(interval2notes[this.newNote].split('b').length > 1){
        // Vertical line (stem of flat)
        scribble.scribbleLine(
            this.xpos - spacing*1.5 + spacing/4, this.ypos + spacing/2,
            this.xpos - spacing*1.5, this.ypos - spacing
        );
        // Curved bottom (Bézier curve)
        scribble.scribbleCurve(
            this.xpos - spacing*1.5 + spacing/4, this.ypos + spacing/2,  // Start
            this.xpos - spacing*1.5, this.ypos - spacing/4,              // Control 1
            this.xpos - spacing*1, this.ypos + spacing*0.5,              // Control 2
            this.xpos - spacing*1, this.ypos - spacing*1.5               // End
        );
    }

    // Unused code - would display note name as text
    // if (this.arg!=1){
    //     text(interval2notes[newNote], this.xpos , ypos+50);
    // }

    // ========================================================================
    // DRAW LEDGER LINES (for notes outside staff range)
    // ========================================================================
    // Ledger lines are short horizontal lines that extend the staff
    // for notes too high or too low to fit on the 5 main lines

    // Notes at position 10/2 (A4) or -2/2 (C3) - need 1 ledger line
    if (notes2position[interval2notes[this.newNote]] == 10/2 ||
        notes2position[interval2notes[this.newNote]] == -2/2) {
        scribble.scribbleLine(this.xpos - 15, this.ypos, this.xpos + 15, this.ypos)
    }

    // Notes at position 12/2 (C5) - need 2 ledger lines
    if (notes2position[interval2notes[this.newNote]] == 12/2) {
        scribble.scribbleLine(this.xpos - 15, this.ypos, this.xpos + 15, this.ypos)
        scribble.scribbleLine(this.xpos - 15, this.ypos + spacing, this.xpos + 15, this.ypos + spacing)
    }

    // Notes at position 14/2 (D5) - need 3 ledger lines
    if (notes2position[interval2notes[this.newNote]] == 14/2) {
        scribble.scribbleLine(this.xpos - 15, this.ypos, this.xpos + 15, this.ypos)
        scribble.scribbleLine(this.xpos - 15, this.ypos + spacing, this.xpos + 15, this.ypos + spacing)
        scribble.scribbleLine(this.xpos - 15, this.ypos + spacing*2, this.xpos + 15, this.ypos + spacing*2)
    }

    // Notes at position 16/2 (E5) - need 4 ledger lines
    if (notes2position[interval2notes[this.newNote]] == 16/2) {
        scribble.scribbleLine(this.xpos - 15, this.ypos, this.xpos + 15, this.ypos)
        scribble.scribbleLine(this.xpos - 15, this.ypos + spacing, this.xpos + 15, this.ypos + spacing)
        scribble.scribbleLine(this.xpos - 15, this.ypos + spacing*2, this.xpos + 15, this.ypos + spacing*2)
        scribble.scribbleLine(this.xpos - 15, this.ypos + spacing*3, this.xpos + 15, this.ypos + spacing*3)
    }

    // ========================================================================
    // SYNESTHESIA MODE - Display digit
    // ========================================================================
    // If drawPi flag is true, show the original sequence digit below the note
    if (drawPi) {
        textSize(24)
        text(this.val, this.xpos, this.offset + 125)
    }
}

// ============================================================================
// RESTS/PAUSES
// ============================================================================

/**
 * DrawPause - Renders rest symbols (silence in music)
 *
 * MUSICAL PURPOSE:
 * - Indicates silence/pause in the musical line
 * - Created when rhythm pattern specifies "s" (silence)
 * - Maintains rhythm while one voice rests
 *
 * CURRENT IMPLEMENTATION:
 * - Always draws eighth rest symbol (regardless of actual duration)
 * - Consists of curved line + filled circle
 *
 * IMPROVEMENT OPPORTUNITY:
 * - Could vary rest symbol based on duration:
 *   - Whole rest: solid rectangle hanging from line
 *   - Half rest: solid rectangle sitting on line
 *   - Quarter rest: squiggly vertical symbol
 *   - Eighth rest: diagonal with flag (current implementation)
 *
 * POSITION:
 * - Horizontal: same as notes (based on beat count)
 * - Vertical: centered on staff
 *
 * @param {number} offset - Vertical position of staff
 */
function DrawPause(offset){
    this.offset = offset;

    // Calculate horizontal position (same logic as DrawNote)
    this.xpos = spacing*9 + (beatCount % (xlimit)) * spacing*5

    this.ypos = offset + (spacing*4)  // Bottom reference of staff
}

/**
 * draw() - Render the rest symbol
 *
 * VISUAL DESIGN:
 * - Eighth rest style (closest to current implementation)
 * - Curved diagonal line + filled circle
 * - Positioned in middle of staff
 *
 * COMPONENTS:
 * 1. Bézier curve: Swooping line from top to bottom
 * 2. Small filled circle: At base of curve
 */
DrawPause.prototype.draw = function(){

    stroke(0);              // Black outline
    strokeWeight(1.5);      // Thin line
    noFill();               // Hollow curve

    // Main curve of rest symbol
    // Bézier curve parameters: (x1, y1, x2, y2, cx1, cy1, cx2, cy2)
    scribble.scribbleCurve(
        this.xpos + spacing*0 + spacing/4, this.offset + spacing*2,    // Start point
        this.xpos + spacing*0, this.offset + spacing*3,                // Control point 1
        this.xpos + spacing*1, this.offset + spacing*2.5,              // Control point 2
        this.xpos + spacing*1, this.offset - spacing*2.5               // End point
    );

    // Small filled circle at base of rest
    scribble.scribbleEllipse(
        this.xpos + spacing*0, this.offset + spacing*2,  // Center position
        spacing/2, spacing/2                             // Width, height
    );

    // Commented out: alternative stem design
    // scribble.scribbleLine(this.xpos+spacing/2,this.ypos, this.xpos+spacing/2,this.ypos -spacing*1);
}

