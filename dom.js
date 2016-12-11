var bpm_label,bpm_selection
var title
var scale_selection
var button

function Gui(x,y,w,h){
	this.x = x; 
	this.y = y;
	this.w = w;
	this.h = h;

    button = createButton('play');
    button.mousePressed(makeplay);
    
    title = createP("Irrational   Duets")
    
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

    scale_selection = createSelect()
    scale_selection.option('in C Linear');
    scale_selection.option('in C Major');
    scale_selection.option('in C minor');
    scale_selection.option('in C Harmonic minor');
    scale_selection.option('in C Lydian dominant');
    scale_selection.option('in C Chromatic');
    scale_selection.option('in C Whole Tones');
    scale_selection.option('in C Diminished');
    scale_selection.option('in C Pentatonic');
    scale_selection.option('in C In-Sen');
    scale_selection.option('in C Octatonic');
    scale_selection.option('in C Nonatonic');
    scale_selection.changed(apply_scale);

    bpm_selection = createSlider(20,160, 90);
    bpm_label = createP(""+bpm_selection.value()+" bpm")
    bpm_label.style("z-index :-1; font-size : 20px  ")
    bpm_selection.mouseClicked(function(){
      var newBPM = bpm_selection.value()
      bpm_label.elt.innerText = " " +newBPM+"  bpm";
      phraseContainer.setBPM(newBPM);
      noteDur = (60 / (newBPM ))
      console.log(noteDur)
    })

    note_duration_selection = createSlider(0, 150, 25);
    
    dur_label = createP("legato  "+note_duration_selection.value()/50+"")
    dur_label.style("z-index :-1; font-size : 20px  ")
    note_duration_selection.mouseClicked(function(){
      dur_label.elt.innerText = " legato  " +note_duration_selection.value()/50 +" ";
      sust = note_duration_selection.value()/50
    })
    
    startIndex = createSlider(0, 8600, 0);
    startIndex_label = createP("start at index : "+startIndex.value()+"")
    startIndex_label.style("z-index :-1; font-size : 20px  ")
    startIndex.mouseClicked(function(){
      startIndex_label.elt.innerText = " start at index : " +startIndex.value() +" ";
        index = startIndex.value()
      //sust = note_duration_selection.value()/50
    })

    stopIndex = createSelect()
    stopIndex.option('no loop');
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

    checkbox = createCheckbox('draw pi', false);
    checkbox.changed(check_changed);
}

Gui.prototype.resize = function(x,y,w,h){
    this.x = x; 
	this.y = y;
	this.w = w;
	this.h = h;
    // title
    var titleW = title.elt.clientWidth;
    var titleH = title.elt.clientHeight;
    title.position(this.w/2 - titleW/2  , this.y - titleH/2 );
    // substitcle
    var sub_length = rythm_selection.elt.clientWidth + lead_selection.elt.clientWidth + bass_selection.elt.clientWidth + scale_selection.elt.clientWidth;
    rythm_selection.position(this.w/2 -sub_length/2, this.y+title.elt.clientHeight*0.75);
    lead_selection.position(this.w/2 -sub_length/2 + rythm_selection.elt.clientWidth +5 ,this.y+title.elt.clientHeight*.75);
    bass_selection.position(this.w/2-sub_length/2	+ rythm_selection.elt.clientWidth + lead_selection.elt.clientWidth +10, this.y+title.elt.clientHeight*.75);
    scale_selection.position(this.w/2 -sub_length/2+ rythm_selection.elt.clientWidth + lead_selection.elt.clientWidth + bass_selection.elt.clientWidth +15,          this.y+title.elt.clientHeight*.75);
    // play instructions
    var control_length = button.clientWidth + bpm_selection.elt.clientWidth
    button.position(0, this.y + title.elt.clientHeight + lead_selection.elt.clientHeight);

    bpm_selection.position(this.x + button.elt.clientWidth*2 , this.y+button.elt.clientHeight*2/3 + title.elt.clientHeight + lead_selection.elt.clientHeight)
    bpm_label.position(this.x+button.elt.clientWidth*2, this.y+button.elt.clientHeight*2/3-50 + title.elt.clientHeight + lead_selection.elt.clientHeight)

    note_duration_selection.position(this.x+ button.elt.clientWidth*2 + bpm_selection.elt.clientWidth*1.5, this.y + this.y+button.elt.clientHeight*2/3 +title.elt.clientHeight + lead_selection.elt.clientHeight)
    dur_label.position(this.x+button.elt.clientWidth*2+bpm_selection.elt.clientWidth*1.5, this.y+this.y+button.elt.clientHeight*2/3-50+title.elt.clientHeight + lead_selection.elt.clientHeight)
    
    startIndex.position(this.x+ button.elt.clientWidth*2 + bpm_selection.elt.clientWidth*1.5 + note_duration_selection.elt.clientWidth*1.5, this.y + this.y+button.elt.clientHeight*2/3 +title.elt.clientHeight + lead_selection.elt.clientHeight)
    startIndex_label.position(this.x+ button.elt.clientWidth*2 + bpm_selection.elt.clientWidth*1.5 + note_duration_selection.elt.clientWidth*1.5, this.y+this.y+button.elt.clientHeight*2/3-50+title.elt.clientHeight + lead_selection.elt.clientHeight)

    stopIndex.position(this.x+ button.elt.clientWidth*2 + bpm_selection.elt.clientWidth*1.5 + note_duration_selection.elt.clientWidth*1.5 + startIndex.elt.clientWidth*1.5, this.y + this.y+button.elt.clientHeight*2/3 +title.elt.clientHeight*.75 + lead_selection.elt.clientHeight)

}



// play & pause button
function makeplay(){
    if (!play){
        phraseContainer.loop();
        phraseContainer.start();
        play = true;    
        button.elt.innerHTML = "Pause";
   }
   else{
        phraseContainer.stop(0);    
        play = false;
       button.elt.innerHTML = "Play";
   } 
}


function apply_rythm(){
	current_rythm = rythm_selection.value();
}

function apply_scale(){
    current_scale = scale_selection.elt.selectedIndex
}

function change_bass(){
    ctx = getAudioContext();
    var val = bass_selection.value().split("and ");
    bass = Soundfont.instrument(ctx,val[1]);
    bass.then(function(inst){
        inst.connect(amplitude)
    });  
}

function change_lead(){
    ctx = getAudioContext();
    var val = lead_selection.value().split("for ");
    lead = Soundfont.instrument(ctx,val[1]);
    lead.then(function(inst){
        inst.connect(amplitude)
    });  
}

function check_changed(){
    drawPi = !drawPi
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

function apply_preset(){

}
