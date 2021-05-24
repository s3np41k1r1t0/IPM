// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 26;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm  = false;  // used to control what to show in draw()
let phrases          = [];     // contains all 501 phrases that can be asked of the user
let current_trial    = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt          = 0       // the current attempt out of 2 (to account for practice)
let target_phrase    = "";     // the current target phrase
let currently_typed  = "";     // what the user has typed so far
let entered          = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let CPS              = 0;      // add the characters per second (CPS) here (once for every attempt)

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered  = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors           = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB

// 2D Keyboard UI
let leftArrow, rightArrow;     // holds the left and right UI images for our basic 2D keyboard   
let ARROW_SIZE;                // UI button size
let current_letter = 'a';      // current char being displayed on our basic 2D keyboard (starts with 'a')
// TODO: change me
let state = 0;
let letter_sets = [['a', 'b', 'c', 'd', 'e', 'f', 'g'], ['h', 'i', 'j', 'k', 'l', 'm', 'n'], ['o', 'p', 'q', 'r', 's', 't', 'u'], ['v', 'w', 'x', 'y', 'z', '_', '`']];
let current_set = ["<"].concat(letter_sets[0]);
let nipple_size;
let predict = "";
let current_word = "";

// Runs once before the setup() and loads our data (images, phrases)
function preload()
{    
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");
    
  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");
  
  // Loads UI elements for our basic keyboard
  leftArrow = loadImage("data/left.png");
  rightArrow = loadImage("data/right.png");
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)
  
  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];
  
  // DO NOT SHIP THIS TO PRODUCTION PLEASE
  drawUserIDScreen();       // draws the user input screen (student number and display size)
  // windowResized();
}

function draw()
{ 
  if(draw_finger_arm)
  {
    background(255);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'
    
    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial
    
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    textAlign(CENTER); 
    textFont("Arial", 20);
    text(predict);
    fill(0);


    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0, 255, 0);
    noFill();
    line(width/2, height/2 - 2.0*PPCM, width/2, height/2 - 1.0*PPCM);
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);

    draw2Dkeyboard();       // draws our basic 2D keyboard UI

    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }
}

// Draws 2D keyboard UI (current letter and left and right arrows)
function draw2Dkeyboard()
{
  if(state === 0) {
    textFont("Arial", Math.round(PPCM/2));
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text("A B C D\nE F G   ", width/2 - 1.9*PPCM, height/2 - 0.9*PPCM, 1.9*PPCM, 1.4*PPCM); 
    text("H I J K\n   L M N", width/2 + 0.1*PPCM, height/2 - 0.9*PPCM, 1.9*PPCM, 1.4*PPCM); 
    text("O P Q   \nR S T U", width/2 - 1.9*PPCM, height/2 + 0.6*PPCM, 1.9*PPCM, 1.4*PPCM); 
    text("   V W X\nY Z _ `", width/2 + 0.1*PPCM, height/2 + 0.6*PPCM, 1.9*PPCM, 1.4*PPCM); 
    
    stroke(0, 255, 0);
    // Draws separators
    noFill();
    line(width/2, height/2 - 1.0*PPCM, width/2, height/2 + 2.0*PPCM);
    line(width/2 - 2.0*PPCM, height/2 + 0.5*PPCM, width/2 + 2.0*PPCM, height/2 + 0.5*PPCM);
    
    fill(0,255,0);
    circle(width/2,height/2 + 0.5*PPCM,nipple_size);
  }
  
  else if (state === 2) {
    textFont("Arial", Math.round(PPCM/2));
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    //let current_words = predict_words.filter((v) => v.startsWith(currently_typed)).slice(0,4);
    //text(current_words[0], width/2 - 1.9*PPCM, height/2 - 0.9*PPCM, 1.9*PPCM, 1.4*PPCM); 
    //text(current_words[1], width/2 + 0.1*PPCM, height/2 - 0.9*PPCM, 1.9*PPCM, 1.4*PPCM); 
    //text(current_words[2], width/2 - 1.9*PPCM, height/2 + 0.6*PPCM, 1.9*PPCM, 1.4*PPCM); 
    //text(current_words[3], width/2 + 0.1*PPCM, height/2 + 0.6*PPCM, 1.9*PPCM, 1.4*PPCM); 
    
    stroke(0, 255, 0);
    // Draws separators
    noFill();
    line(width/2, height/2 - 1.0*PPCM, width/2, height/2 + 2.0*PPCM);
    line(width/2 - 2.0*PPCM, height/2 + 0.5*PPCM, width/2 + 2.0*PPCM, height/2 + 0.5*PPCM);
  }
  
  else {
    stroke(0, 255, 0);
    // Draws separators
    noFill();
    line(width/2, height/2 - 1.0*PPCM, width/2, height/2 + 2.0*PPCM);
    line(width/2 - 1.0*PPCM, height/2 - 1.0*PPCM, width/2 - 1.0*PPCM, height/2 + 2.0*PPCM);
    line(width/2 + 1.0*PPCM, height/2 - 1.0*PPCM, width/2 + 1.0*PPCM, height/2 + 2.0*PPCM);
    line(width/2 - 2.0*PPCM, height/2 + 0.5*PPCM, width/2 + 2.0*PPCM, height/2 + 0.5*PPCM);

    textFont("Arial", Math.round(PPCM/2));
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    
    current_set.forEach((c,i) => {
      text(c.toUpperCase(), width/2 + ((i%4)-2)*PPCM + 0.1*PPCM , height/2 + ((Math.floor(i/4)*1.5)-1)*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM);
    });  
  }
  
  noStroke();
}

async function fetch_predict() {
  fetch(`/predict?current=${current_word}`).then((r) => {
    console.log(r.json());
  });
  return "randomword";
}

// Evoked when the mouse button was pressed
async function mousePressed()
{
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  {                   
    // Check if mouse click happened within the touch input area
    if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))  
    {      
      // Check for individual keys menu
      if(state === 1) {
        if(mouseClickWithin(width/2 + -2*PPCM + 0.1*PPCM, height/2 + -1.0*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM)){
          state = 0;
          return;
        } else if(mouseClickWithin(width/2 + -1*PPCM + 0.1*PPCM, height/2 + -1.0*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM)){
          current_letter = current_set[1];
        } else if(mouseClickWithin(width/2 + 0*PPCM + 0.1*PPCM, height/2 + -1.0*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM)){
          current_letter = current_set[2];
        } else if(mouseClickWithin(width/2 + 1*PPCM + 0.1*PPCM, height/2 + -1.0*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM)){ 
          current_letter = current_set[3];
        } else if(mouseClickWithin(width/2 + -2*PPCM + 0.1*PPCM, height/2 + 0.5*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM)){
          current_letter = current_set[4];
        } else if(mouseClickWithin(width/2 + -1*PPCM + 0.1*PPCM, height/2 + 0.5*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM)){ 
          current_letter = current_set[5];
        } else if(mouseClickWithin(width/2 + 0*PPCM + 0.1*PPCM, height/2 + 0.5*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM)){
          current_letter = current_set[6];
        } else if(mouseClickWithin(width/2 + 1*PPCM + 0.1*PPCM, height/2 + 0.5*PPCM + 0.1*PPCM, 0.9*PPCM, 1.4*PPCM)){
          current_letter = current_set[7];
        } else {
          return;
        } 
        
        // TODO remove me ???
        //state = 0;
        
        if (current_letter == '_') {
          currently_typed += " ";   
        }

        // if space is removed it doesnt fall back to the previous word        
        else if (current_letter == '`' && currently_typed.length > 0) {               // if `, treat that as delete
          currently_typed = currently_typed.substring(0, currently_typed.length - 1);
          if(current_word.length > 0) 
            current_word = current_word.substring(0, current_word.length - 1);
        }

        else if (current_letter != '`') {
          currently_typed += current_letter; 
          current_word += current_letter;
        }
        
        predict = await fetch_predict();
      }
      // TODO should nipple select word automatically?
      else if(state === 2) {
        if(dist(width/2,height/2 + 0.5*PPCM,mouseX,mouseY) < nipple_size) {
          state = 2;
          return;
        }
        else if(mouseClickWithin(width/2 - 1.9*PPCM, height/2 - 0.9*PPCM, 1.9*PPCM, 1.4*PPCM)){
          current_set = ["<"].concat(letter_sets[0]);
        } 
        else if(mouseClickWithin(width/2 + 0.1*PPCM, height/2 - 0.9*PPCM, 1.9*PPCM, 1.4*PPCM)){
          current_set = ["<"].concat(letter_sets[1]);
        } 
        else if(mouseClickWithin(width/2 - 1.9*PPCM, height/2 + 0.6*PPCM, 1.9*PPCM, 1.4*PPCM)){
          current_set = ["<"].concat(letter_sets[2]);
        } 
        else if(mouseClickWithin(width/2 + 0.1*PPCM, height/2 + 0.6*PPCM, 1.9*PPCM, 1.4*PPCM)){
          current_set = ["<"].concat(letter_sets[3]);
        } 
        state = 0;
      }
      // Check 4 sets menu
      else {
        if(dist(width/2,height/2 + 0.5*PPCM,mouseX,mouseY) < nipple_size) {
          //state = 2;
          currently_typed += predict.substring(current_word.length) + " ";
          current_word = "";
          return;
        } else if(mouseClickWithin(width/2 - 1.9*PPCM, height/2 - 0.9*PPCM, 1.9*PPCM, 1.4*PPCM)){
          current_set = ["<"].concat(letter_sets[0]);
        } 
        else if(mouseClickWithin(width/2 + 0.1*PPCM, height/2 - 0.9*PPCM, 1.9*PPCM, 1.4*PPCM)){
          current_set = ["<"].concat(letter_sets[1]);
        } 
        else if(mouseClickWithin(width/2 - 1.9*PPCM, height/2 + 0.6*PPCM, 1.9*PPCM, 1.4*PPCM)){
          current_set = ["<"].concat(letter_sets[2]);
        } 
        else if(mouseClickWithin(width/2 + 0.1*PPCM, height/2 + 0.6*PPCM, 1.9*PPCM, 1.4*PPCM)){
          current_set = ["<"].concat(letter_sets[3]);
        } 
        state = 1;
      }
    }
    
    // Check if mouse click happened within 'ACCEPT' 
    // (i.e., submits a phrase and completes a trial)
    else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 5.1*PPCM, 4.0*PPCM, 2.0*PPCM))
    {
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();

      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2)                                           
      {
        // Prepares for new trial
        currently_typed = "";
        target_phrase = phrases[current_trial];  
      }
      else
      {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();
        
        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2)
        {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width/2 - second_attempt_button.size().width/2, height/2 + 200);
        }
      }
    }
  }
}

// Resets variables for second attempt
function startSecondAttempt()
{
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial        = 0;
  target_phrase        = phrases[current_trial];
  
  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected     = 0;
  letters_entered      = 0;
  errors               = 0;
  currently_typed      = "";
  CPS                  = 0;
  
  current_letter       = 'a';
  
  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm      = true;
  attempt_start_time   = millis();  
}

// Print and save results at the end of 2 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm              = (letters_entered / 5.0) / attempt_duration;      
  let freebie_errors   = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty          = max(0, (errors - freebie_errors) / attempt_duration); 
  let wpm_w_penalty    = max((wpm - penalty),0);                                   // minus because higher WPM is better: NET WPM
  let timestamp        = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));    // clears screen
  cursor();                    // shows the cursor again
  
  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255,255,255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen 
  
  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2); 
  
  // For each trial/phrase
  let h = 20;
  for(i = 0; i < 2; i++, h += 40 ) 
  {
    text("Target phrase " + (i+1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i+1) + ": " + entered[i], width / 2, height / 2 + h+20);
  }
  
  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h+20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h+40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h+60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h+80);

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:         GROUP_NUMBER,
        assessed_by:          student_ID,
        attempt_completed_by: timestamp,
        attempt:              attempt,
        attempt_duration:     attempt_duration,
        raw_wpm:              wpm,      
        freebie_errors:       freebie_errors,
        penalty:              penalty,
        wpm_w_penalty:        wpm_w_penalty,
        cps:                  CPS
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized()
{
  draw_finger_arm = true;
  if(document.getElementsByTagName("button").length === 0 && attempt < 2){
    resizeCanvas(windowWidth, windowHeight);
    let display    = new Display({ diagonal: display_size }, window.screen);
     
    // DO NO CHANGE THESE!
    PPI           = display.ppi;                        // calculates pixels per inch
    PPCM          = PPI / 2.54;                         // calculates pixels per cm
    FINGER_SIZE   = (int)(11   * PPCM);
    FINGER_OFFSET = (int)(0.8  * PPCM)
    ARM_LENGTH    = (int)(19   * PPCM);
    ARM_HEIGHT    = (int)(11.2 * PPCM);
    
    ARROW_SIZE    = (int)(2.2 * PPCM);
    
    // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
    draw_finger_arm = true;
    attempt_start_time = millis();
    nipple_size = 1.0*PPCM;
  }
}
