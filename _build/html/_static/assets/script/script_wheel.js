function letsSpin() {
  
    var x = 1024; //min value
    var y = 9999; //max value

    var deg = Math.floor(Math.random() * (x - y)) + y;

    document.getElementById('wheel').style.transform = "rotate("+deg+"deg)";
  
}