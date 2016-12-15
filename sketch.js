// faire une autre page pour les sequences des fibonnacci ? à partir d'iteration 17 on a des patterns de 4 temps / 36 huit temps // http://stackoverflow.com/questions/7944239/generating-fibonacci-sequence
// change start index slider to an Input field, maybe with a tooltip ?
// add other loop options
// add select for numbers (Pi phi linearsequence fibonaccisequence)
// add slider to control drawing distortion
// add tooltip for title with an explanation
// affichage de la signature rythmique 4/4 et 3/4
// travailler les rythmes proposés : créer plusieurs impromptus et des variation sur les canons



var ctx ;
var play = false;

var current_number = test;
var index =0; // track which decimal we are on
var stopIndexVal = 8677; // to loop

// music stuff
var bpm = 45 ;
var noteDur = 0.5;
var sust = 1 ; // not sustain , multiplication of noteDuration instead
var phraseContainer; //
var pulse;
var beatCount = 0; // musical beat
var barCount =0; // musical bars
var current_tone = 0;
var current_rythm = "Unisson Walk"; // pulse Incr function
var current_scale = 0; // see utils, it's "linear"
var soundBass = "acoustic_guitar_nylon"
var soundLead = "acoustic_guitar_nylon";
// audio analyser
var amplitude;

// drawing lib
var scribble = new Scribble();
var seed;
var drawPi =  false;

// graphics boundary parameters
var offset = 300; // will move
var anchor = offset; // will stay the same
var spacing = 16;
var xlimit;
var ylimit;

var backGraphics; // draw some musical elements
var gui; // dom elements see dom.js

// arrays to hold musical elements drawn
var notes;
var bassnotes;
var pauses;
var bars;



function preload(){
    ctx = getAudioContext();
    lead = Soundfont.instrument(ctx,soundLead);
    bass = Soundfont.instrument(ctx,soundBass);
    font = loadFont("assets/HomemadeApple.ttf")
}



function setup(){

	createCanvas(windowWidth,windowHeight);
    //console.log(pi.size())
    // audio
    phraseContainer = new p5.Part();
    pulse = new p5.Phrase('pulse', pulseIncr, [1,1,1,1]);   
    phraseContainer.setBPM(bpm);
    phraseContainer.addPhrase(pulse);

    ylimit = int((windowHeight)/(spacing*(25)));
    xlimit = int((windowWidth-(spacing*5)) / (spacing*5));

    console.log(xlimit,ylimit)

    notes = [];
    bassnotes = [];
    pauses = [];
    bars=[];

    seed = random(500);
    offset = anchor;
   
    // scribble values to play with on audio reactive or other stuff
    scribble.bowing = 1;          // changes the bowing of lines
    scribble.roughness = 1  ;       // changes the roughness of lines
    // scribble.maxOffset = 2 ;       // coordinates will get an offset, here you define the max offset
    // scribble.numEllipseSteps = 3; // defines how much curves will be used to draw an ellipse
    background(206,190,190);
   
    // connect audio output to analyser to get the level to animate drawing
    amplitude = new p5.Amplitude();
    bass.then(function(inst){
        inst.connect(amplitude)
    });  
    lead.then(function(inst){
        inst.connect(amplitude)
    });  
    
    backGraphics = new DrawBackGraphics(offset);
    gui = new Gui(1,1,width,height);
    //gui.resize(1,1,width,height);

    
    bars.push(new DrawBars(offset))
    bars.push(new DrawBars(offset+spacing*10))

    textFont(font)
    
    /*
    ugly hack ! to make the gui get the right position after a refresh
    the pb seems to be that elements don't have their properties filled up during the setup
    thus you accessing *.elt.clientWidth for instance returns something that is wrong
    */
    setInterval(function(){
        gui.resize(1,1,windowWidth,windowHeight);
    },1)
}





function draw(){
   
    background(206,190,190)
    randomSeed(seed);

    //console.log(amplitude.getLevel())
    scribble.bowing = amplitude.getLevel()+1;
    scribble.roughness = amplitude.getLevel()+1 ;
    scribble.maxOffset =  amplitude.getLevel()+1;
  
    backGraphics.drawStave();
    backGraphics.drawTrebbleClef(anchor);
    backGraphics.drawTrebbleClef(anchor+spacing*10);
   
    for (var i = 0 ; i < pauses.length ; i++){
         pauses[i].draw();
    }
    for (var i = 0 ; i < bars.length ; i++){
         bars[i].draw();
    }   
    for (var i = 0 ; i < notes.length ; i++)    {
         notes[i].draw();
    }
    for (var i = 0 ; i < bassnotes.length ; i++)    {
         bassnotes[i].draw();
    }

    strokeWeight(1);
    fill(0)
    stroke(0)
    textSize(20)
    text("sequence index : " + index, 5, windowHeight-65)
    text("sequence value : " + pi[index], 5, windowHeight-35)
    text("note name : " + interval2notes[pi[index]].toLocaleLowerCase(), 5, windowHeight-5)
}

function pulseIncr(){
    
    checkDrawingMargins();
    
    if (current_rythm == "Dialog"){
        if (beatCount%8 == 0) {
         bars.push(new DrawBars(offset))
         bars.push(new DrawBars(offset+spacing*10))
        }
        if (beatCount%2 == 0){
            bassPlay(0,"f",index);
            leadPlay(0,"s",index);
        }
        if (beatCount%2 == 1){
            bassPlay(0,"s",index);
            leadPlay(0,"f",index);
        }
        index += 1;
    }

    if (current_rythm == "Unisson Walk"){
        if (beatCount%8 == 0) {
            bars.push(new DrawBars(offset))
            bars.push(new DrawBars(offset+spacing*10))
        }
        if (beatCount%2 == 0){
            bassPlay(0,"ff",index);
            leadPlay(0,"ff",index);
            index+=1
        }
    }

    if (current_rythm == "Canon Walk"){
        if (beatCount%8 == 0) {
         bars.push(new DrawBars(offset))
         bars.push(new DrawBars(offset+spacing*10))
        }
        if (beatCount% 2 == 0){
            if (beatCount < 2 * 4){
                bassPlay(0,"ff",index);
            }
            else{
                if (beatCount%1 == 0){
                    var delayed_index = constrain(index - 4,0,pi.length);
                    bassPlay(0,"ff",index);
                    leadPlay(0,"ff",delayed_index);
                }
            }
            index+=1
        }
    }
    
    if (current_rythm == "Vals"){
        if (beatCount%6 == 0) {
            bars.push(new DrawBars(offset))
            bars.push(new DrawBars(offset+spacing*10))
            bassPlay(0,"ffff",index);
            //index+=1;
        }
        if(beatCount%2 == 0){
            leadPlay(0,"f",index);
            index+=1;
        }
        else{
            leadPlay(0,"s",index);
        }
    }
    
    if (current_rythm == "Impromptu"){
        
        
    }
    beatCount+=1;

    if (index >= startIndex.value()+stopIndexVal){
        index = startIndex.value()
    }

}

function leadPlay(time,arg,index){    
        if (arg == "s"){
            pauses.push(new DrawPause(offset));
        }
        else{   
            var value = current_number[index];
            var newNote = int(scales[current_scale][value]) + current_tone;
            var noteName = interval2notes[(int(newNote))]
            lead.then(function(inst){
                 inst.play(noteName,0,{ duration: noteDur*(arg.length)*sust});
            });
            //console.log("lead : " + noteDur*(arg.length)*sust)
            index +=1;
            notes.push(new DrawNote(value,newNote,arg, offset, color(0)));
        }
}


function bassPlay(time,arg,index){
    if (arg == "s"){       
        pauses.push(new DrawPause(offset+spacing*10));
    }
    else{   
        var value = current_number[index];
        //console.log("bass value : "+value)
        var newNote = scales[current_scale][value]+current_tone;
        //console.log("bass scale value : "+newNote)
        var noteName =interval2notes[(int(newNote))]
        //console.log("bass noteName : "+noteName)
        bass.then(function(inst){
             inst.play(noteName,0,{ duration: noteDur*(arg.length)*sust});
        });
        //console.log("bass : " + noteDur*(arg.length)*sust)
        index+=1;
        bassnotes.push(new DrawNote(value,newNote,arg, offset+spacing*10, color(255)));
    }
}
   


function checkDrawingMargins() { 
  if (beatCount % (xlimit) == 0 ){
        offset +=  spacing * (5+5)*2;      
        if (int(beatCount / xlimit) % (ylimit) ==0 ){    
            notes = [];
            bassnotes = [];
            pauses = [];
            bars =[];
            offset = anchor;
        }
    }
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

    seed = random(500);
    offset = anchor;
    ylimit = int((windowHeight)/(spacing*(25)));
    xlimit = int((windowWidth-(spacing*5)) / (spacing*5));
    console.log(xlimit,ylimit)

    backGraphics = new DrawBackGraphics(offset);
    gui.resize(1,1,windowWidth,windowHeight);   
    background(206,190,190)
}
