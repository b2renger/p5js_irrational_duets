/*
Draw some musical elements : 
    - stave
    - clef
    - bars
    - notes
    - pauses
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// stave and clef
function DrawBackGraphics(offset){
    this.offset = offset;
}

DrawBackGraphics.prototype.drawStave = function(){
    var tempOffset = this.offset;
     for (var i = 0 ; i < ylimit*2 ; i++){
        this.drawLines(tempOffset,spacing);   
        tempOffset += spacing * (5+5); // 2 times a full height (there's five lines)
    }
}

DrawBackGraphics.prototype.drawLines = function(offset,spacing){
    stroke(0);
    strokeWeight(1);
    noFill();
    for (var i = 0 ; i < 5 ; i++){
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

DrawBackGraphics.prototype.drawTrebbleClef = function (anchor){
   
    noFill();
    stroke(0);
    strokeWeight(10);
    translate(0,anchor-spacing*2.5)
    scale(0.3,0.3)
    //treble clef based on : https://www.khanacademy.org/computer-programming/treble/5306378526654464
    // treble clef - top right curve
    scribble.scribbleCurve(75, 25, 75, 150, 125, 75, 125, 100);
    // treble clef - outer left curve
    scribble.scribbleCurve(75, 150,   75, 300, 5, 200, 0, 290);
    // treble clef - lower right curve
    scribble.scribbleCurve(75, 200,  75, 300, 150, 205, 150, 295);
    // treble clef - inner left curve
    scribble.scribbleCurve(75, 200, 80, 265, 30, 200, 20, 280);
    // treble cleff - inner dot
    fill(0);
    scribble.scribbleEllipse(75, 250, 25, 25);
    // bottom curl, dot and lefthand curve (top to bottom)
    scribble.scribbleEllipse(40,340,20,20   ); 
    noFill();
    scribble.scribbleLine(40,325,35,326); scribble.scribbleLine(35,326,25,330); scribble.scribbleLine(25,330,15,350);
    scribble.scribbleLine(15,350,15,360); scribble.scribbleLine(15,360,20,370); scribble.scribbleLine(20,370,25,375); scribble.scribbleLine(25,375,30,380);
    scribble.scribbleLine(30,380,35,382); scribble.scribbleLine(35,382,40,383);
    // bottom curl, bottom segment 
    scribble.scribbleLine(40, 383, 50, 383);
    // treble clef - bottom curl, right curve (bottom to top)
    scribble.scribbleLine(50,383,55,382); scribble.scribbleLine(55,382,60,380); scribble.scribbleLine(60,380,65,375); scribble.scribbleLine(65,375,70,370);
    scribble.scribbleLine(70,370,73,360); scribble.scribbleLine(73,360,74,350); scribble.scribbleLine(74,350,75,345);
    // treble clef - straight line
    scribble.scribbleLine(75, 345, 75, 25);
    resetMatrix() // we used scale at the top so we want to reset it
   
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
// bars
function DrawBars(offset){

    this.xpos = spacing*5+(beatCount % (xlimit )) *spacing*5
    this.ypos = offset  + (spacing*4)
    this.offset = offset;
}

DrawBars.prototype.draw = function() {
    
    stroke(0);  
    strokeWeight(3);
    scribble.scribbleLine(this.xpos+spacing*6/4,this.offset, this.xpos+spacing*6/4,this.offset +spacing*4);

 
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
// notes
function DrawNote(val,newNote, arg, offset, c){
    this.c = color(synesthesisTable[val]);
    this.newNote = newNote;

    this.offset = offset;
    this.xpos = spacing*9 +(beatCount % (xlimit )) *spacing*5;
    this.ypos = this.offset  + (spacing*4) - notes2position[interval2notes[newNote]]*spacing;
    //this.val = val;
    this.arg = arg; 
}

DrawNote.prototype.draw = function (){
     
        strokeWeight(2);       
        if(this.arg == "ff" || this.arg =="f"){
            fill(this.c);
        }
        else{
            noFill();
        }
        stroke(this.c);
        // draw the note
        scribble.scribbleEllipse( this.xpos, this.ypos, spacing, spacing);
        // draw a vertical bar if black or eight-note
        if (this.arg == "ff" || this.arg == "fff" || this.arg == "f") {
            scribble.scribbleLine(this.xpos+spacing/2,this.ypos, this.xpos+spacing/2,this.ypos -spacing*3);
        }
        // oblique for eight-note and eight rest
        if(this.arg =="f"){
            scribble.scribbleLine(this.xpos+spacing/2,this.ypos -spacing*3, this.xpos+spacing/2 +spacing/2 , this.ypos-spacing*2);
        }    
        // draw a "#"
        if(interval2notes[this.newNote].split('#').length > 1){
            scribble.scribbleLine(this.xpos-spacing*2,this.ypos+spacing/2, this.xpos-spacing*2 +spacing/2 , this.ypos-spacing+spacing/2);
            scribble.scribbleLine(this.xpos-spacing*2+spacing/2,this.ypos+spacing/2, this.xpos-spacing*2 +spacing/2 + spacing /2 , this.ypos-spacing+spacing/2);
            scribble.scribbleLine(this.xpos-spacing*2,this.ypos-spacing/3+spacing/2, this.xpos-spacing, this.ypos-spacing/2.5+spacing/2);
            scribble.scribbleLine(this.xpos-spacing*2,this.ypos-spacing/1.75+spacing/2, this.xpos-spacing, this.ypos-spacing/1.5+spacing/2);
        }
        // draw a "b"
        if(interval2notes[this.newNote].split('b').length > 1){
            scribble.scribbleLine(this.xpos-spacing*1.5 +spacing/4,this.ypos+spacing/2, this.xpos-spacing*1.5  , this.ypos-spacing);
            scribble.scribbleCurve( 
                                     this.xpos-spacing*1.5 +spacing/4, this.ypos+spacing/2, 
                                     this.xpos-spacing*1.5  , this.ypos-spacing/4,
                                     this.xpos-spacing*1   , this.ypos+spacing*0.5 ,
                                     this.xpos-spacing*1 ,this.ypos-spacing*1.5
                                    );
        }
        if (this.arg!=1){
            //text(interval2notes[newNote], this.xpos , ypos+50);
        }
        
        if (notes2position[interval2notes[this.newNote]] == -4/2 || notes2position[interval2notes[this.newNote]] == -2/2
            || notes2position[interval2notes[this.newNote]] == -6/2  || notes2position[interval2notes[this.newNote]] == -8/2 ){
            scribble.scribbleLine(this.xpos - 15 , this.ypos , this.xpos + 15 , this.ypos)
        }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// pauses
function DrawPause(offset){
    this.offset = offset;
    this.xpos = spacing*9 +(beatCount % (xlimit )) *spacing*5
    this.ypos = offset  + (spacing*4) 
}

DrawPause.prototype.draw = function(){
 
    stroke(0);
    strokeWeight(1.5);
    noFill();
    scribble.scribbleCurve( 
                            this.xpos+spacing*0 +spacing/4, this.offset+spacing*2, 
                            this.xpos+spacing*0  , this.offset+spacing*3,
                            this.xpos+spacing*1   , this.offset+spacing*2.5 ,
                            this.xpos+spacing*1 ,this.offset-spacing*2.5);
    scribble.scribbleEllipse(  this.xpos+spacing*0   , this.offset+spacing*2 , spacing/2, spacing/2);
    // scribble.scribbleLine(this.xpos+spacing/2,this.ypos, this.xpos+spacing/2,this.ypos -spacing*1);

}

