// le mapping notes midi + affichage ne va pas !
// ajouter elements  - selection de preset mode simple - selection de preset mode avancé

// affichage de la signature rythmique 4/4 et 3/4 ?
// travailler les rythmes proposés ne pas hésiter à aller vers des trucs chelous) et faire des choix


// shadow pour les boutons ?

// permettre de boucler entre deux index ? de sauter à un index // option pour afficher les valeurs numériques des notes ou légende avec les couleurs suffisante ?
// afficher index courant.


var ctx ;
var play = false;

var current_number = pi;
var index =0; // track which decimal we are on

// music stuff
var bpm = 60 ;
var noteDur = 0.5;
var sust = 1 ; // not sustain , multiplication of noteDuration instead
var phraseContainer; //
var pulse;
var beatCount = 0; // musical beat
var barCount =0; // musical bars
var current_rythm = "Unisson"; // pulse Incr function
var current_scale = 0; // see utils it's major
var soundBass = "accordion";
var soundLead = "accordion";
// audio analyser
var amplitude;

// drawing lib
var scribble = new Scribble();
var seed;

// graphics boundary parameters
var offset = 200; // will move
var anchor = offset; // will stay the same
var spacing = 14;
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
}



function setup(){

	createCanvas(windowWidth,windowHeight);
    //console.log(pi.size())
    // audio
    phraseContainer = new p5.Part();
    pulse = new p5.Phrase('pulse', pulseIncr, [1,1,1,1]);   
    phraseContainer.setBPM(bpm);
    phraseContainer.addPhrase(pulse);

    ylimit = int((windowHeight)/(spacing*(20)));
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

    scribble.bowing = (amplitude.getLevel()+0.1)*mouseX/5;
    scribble.roughness = (amplitude.getLevel()+0.1)*mouseX/50 ;
    scribble.maxOffset =  pow(amplitude.getLevel()+0.1,2)*mouseX/75 ; 
  
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
}

function leadPlay(time,arg,index){    
        if (arg == "s"){
            pauses.push(new DrawPause(offset));
        }
        else{   
            var value = current_number[index];
            var newNote = int(scales[current_scale][value]) + 12;
            var noteName = interval2notes[(int(newNote))]
            lead.then(function(inst){
                 inst.play(noteName,0,{ duration: noteDur*(arg.length)*sust});
            });
            //console.log("lead : " + noteDur*(arg.length)*sust)
            index +=1;
            notes.push(new DrawNote(value,newNote,arg, offset, color(0)));
        }     
    console.log(value)
}


function bassPlay(time,arg,index){
    if (arg == "s"){       
        pauses.push(new DrawPause(offset+spacing*10));
    }
    else{   
        var value = current_number[index];
        var newNote = scales[current_scale][value];    
        var noteName =interval2notes[(int(newNote))]
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
    background(206,190,190)
    seed = random(500);
    offset = anchor;
    ylimit = int((windowHeight)/(spacing*(20)));
    xlimit = int((windowWidth-(spacing*5)) / (spacing*5));
    console.log(xlimit,ylimit)

    backGraphics = new DrawBackGraphics(offset);
    gui.resize(1,1,windowWidth,windowHeight);   
}