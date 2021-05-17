

let currentHeartRate = -1;
let hrChanged = true;
let setterHighlightTimeout;
let state = false;        // true - execute, false - wait .. HRM sensor
let firstDisplay = false;
let lastDisplay;

// customize zone
device_serial_no = 1;

hr_changed = true;  // default true
top_changed = true;  // default true

x = 0;
y = 180;
z = 1.0;

offset_cnt = 0;

value_arr = [];
i_value_arr = 0;  // array index
value_avr = y;   // not null is true
value_avr_ex = y;
avr_offset = 25;

value_hr_arr = [];
i_value_hr_arr = 0;  // array index
hr_avr = 100;

hr_cnt_1 = 0;    // heart rate chaek point 1
hr_cnt_2 = 0;    // heart rate chaek point 2

hr_cnt_flag_1 = true;    // heart rate chaek point 1 flag
hr_cnt_flag_2 = false;    // heart rate chaek point 2 flag

hr_flag = true;

value = 0;
hr_value = 0;

test_cnt = 0;

/////////////////////////////////////////////////
function onHrm(hrm){
  //console.log("func onHrm  ");
  if(currentHeartRate !== hrm.bpm){    // HeartRate value
    currentHeartRate = hrm.bpm;
    hrChanged = true;
    //bluetooth data transfer
    //NRF.setAdvertising({0x06 : String(currentHeartRate)}, {name: "HarufitDevice_"+device_serial_no});
    console.log(String("onHrm : "+currentHeartRate)); // console log
  }
}

function switchOffApp(){
  console.log("func switchOffApp");
  Bangle.setHRMPower(0);
  Bangle.showLauncher();
}

function startstopSwitch(){
  if (!state){
    Bangle.setHRMPower(1);
    state = true;
    currentHeartRate = 0;
  } else {
    Bangle.setHRMPower(0);
    state = false;
    currentHeartRate = -1;
  }
  drawTrainingHeartRate();
}

function setup_display(){ // outside of graph
  // all clear
  g.clear();

  // top part 1
  Bangle.loadWidgets();
  Bangle.drawWidgets();

  // display text "HARUFIT" top title
  g.setColor(255, 255, 255);
  g.setFontVector(30);
  g.setFontAlign(-1, -1, 0);
  g.drawString("  Harufit", 5, 0);

  // top part 2
  // display Box HeartRate
  g.setColor(0xff, 0xff, 0xff);
  g.fillRect(0, 30, 240, 79);

  // display text bpm
  g.setColor(0, 0, 0);
  g.setFontVector(40);
  g.setFontAlign(-1, 0, 0);
  g.drawString(" bpm", 108, 55);

  hr_value_display();

  if(top_changed) top_changed = false;
}

function demo_data_test(){ // graph to analogRead(D29);
  Bangle.setLCDPower(true);
  if(top_changed) setup_display();

  if(x == 240 || x == 0){ // graph refresh
    x = 0;
    g.setColor(0,0,0);
    g.fillRect(0,80,240,240);

    if (offset_cnt <= 4){
      avr_offset -= 15;
      z*=1.5;
    }
    offset_cnt = 0;
    //g.clear();
    //setup_display();
    console.log(String("display refresh cnt is "+test_cnt++)); // console log
  }
  // calculate value part
  g.setColor(255,255,255);
  sensorvalue = analogRead(D29);
  //console.log(String(sensorvalue)); // console log
  value = (sensorvalue * 4000 * z) + 160;
  value = 240 - value + 80 + 20;    // reverse y axis and shift y axis 20 pixel

  // drawing graph part y 80 ~ 239
  if(value > 239){ value = 239;}
  else if(value < 80){ value = 81; z*=0.8;}

  //console.log(String("value = \t"+ value)); // console log

  value_arr[i_value_arr] = value;
  i_value_arr++;

  hr_sensor_value_calc();
  hr_value_calc();

  g.setColor(0xff, 0xff, 0);
  g.drawLine(x, value_avr_ex, x+1, value_avr);
  value_avr_ex = value_avr;
  //console.log(String("x = "+x+", y = ", value)); // console log
  g.setColor(0xff, 0xff, 0xff);
  g.drawLine(x, y, x+1, value);
  //g.drawLine(x, 239, x+1, 239);
  x++;
  y = value;

  if(hr_changed){
    //console.log("HeartRate Changed !!!!\t" + value_arr.length); // console log
    hr_value_display();
  }
}
function hr_value_display(){
  // refresh part of HeartRatd value part
  g.setColor(0xff, 0xff, 0xff);
  g.fillRect(0, 30, 108, 79);

  // display text HeartRate Value text
  g.setColor(0, 0, 0);
  g.setFontVector(40);
  g.setFontAlign(1, 0, 0);
  //g.drawString(String(parseInt(hr_value)), 108, 55);
  //console.log(String(hr_value)); // console log

  g.drawString(String(parseInt(hr_avr)), 108, 55);
  console.log(String(hr_avr)); // console log
  NRF.setAdvertising({0x06 : String(hr_avr)},
                     {name: "HarufitDevice_"+device_serial_no});

  hr_changed = false;
}

function hr_sensor_value_calc(){
  cnt = 20;
  // sensor value average calculate
  if(i_value_arr >= cnt || !!value_avr){    //  cnt 20 -> 1 second
    i_value_arr %= cnt;
    var sum = 0;
    for(var i=0; i<cnt; i++){
      sum += value_arr[i];
    }
    value_avr = (sum / cnt) - avr_offset;

    //console.log(String("average = \t"+ value_avr)); // console log
    //console.log(value_arr); // console log
  }
}

function hr_value_calc(){
  if (value <= value_avr && hr_flag){    // heart rate upper point from average value
    if(hr_cnt_flag_1){    // heart rate check point 1
      hr_cnt_1 = x;
      hr_cnt_flag_1 = false;
      hr_cnt_flag_2 = true;
      g.setColor(0xff, 0, 0);
      //g.fillRect(220, 30, 240, 79);
      g.fillCircle(220, 55, 10);
    } else if (hr_cnt_flag_2){   // heart rate check point 1
      hr_cnt_2 = x;
      hr_cnt_flag_1 = true;
      hr_cnt_flag_2 = false;
      g.setColor(0xff, 0, 0);
      //g.fillRect(220, 30, 240, 79);
      g.fillCircle(220, 55, 10);

      // calculate heart Rate
      if(hr_cnt_1 > hr_cnt_2){
        hr_cnt_2 += 240;
      }
      hr_value = 60 / ((hr_cnt_2 - hr_cnt_1)/20);

      if(hr_value > 110){avr_offset+=3; z*=0.9;}
      else if(hr_value < 45){avr_offset-=3; z*=1.1;}

      // value
      hr_cnt = 10;
      value_hr_arr[i_value_hr_arr] = hr_value;
      i_value_hr_arr++;
      if(i_value_hr_arr >= hr_cnt || !!hr_avr){    //  cnt 20 -> 1 second
        i_value_hr_arr %= hr_cnt;
        var sum = 0;
        var sum_cnt = 0;
        for(var i=0; i<hr_cnt; i++){
          if((hr_avr + (hr_avr * 0.3)) >= value_hr_arr[i]
             && (hr_avr - (hr_avr * 0.3)) <= value_hr_arr[i]){
            sum += value_hr_arr[i];
            sum_cnt++;
          }
        }
        if(sum_cnt == 0){
          hr_avr = 88;
        } else {
          hr_avr = parseInt(sum / (sum_cnt));
        }
        //console.log(String(value_hr_arr)); // console log
        //console.log(String(hr_avr +"\t"+sum_cnt + "\t"+z)); // console log
      }

      hr_changed = true;
    }
    hr_flag = false;
  } else if(value > value_avr) {     // heart rate downer point from average value
      g.setColor(0xff, 0xff, 0xff);
      //g.fillRect(220, 30, 240, 79);
      g.fillCircle(220, 55, 10);
      hr_flag = true;
      offset_cnt++;
  }

}

//  Source Starting Point
console.log("Welcom to HARUFIT Service with L&H Labs ~!!");

Bangle.setHRMPower(0);
NRF.setTxPower(4); // bluetooth
Bangle.on('HRM', onHrm);

setWatch(switchOffApp, BTN2, {edge:"falling", debounce:50, repeat:true});
setWatch(startstopSwitch, BTN1, {edge:"rising", debounce:50, repeat:true});

Bangle.setHRMPower(1);
setInterval(demo_data_test, 50);
//setInterval(demo_data_test, 100);
