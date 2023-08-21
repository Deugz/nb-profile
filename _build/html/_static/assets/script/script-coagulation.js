var canvas = document.getElementById("canvas-coag");
var context = canvas.getContext("2d");
var width = canvas.width;
var height = canvas.height;

let temperature, gravity, mouseForce;
let particleMouseRejectionForce;

// Design
var circleFill = "rgba(255,200,0,1)";

var Particle = function (sx, sy) {
    this.sx = sx;
    this.sy = sy;
    this.vx = 0.0;
    this.vy = 0.0;
};

// create particles
var n = 255;
var particles = [];
for (var i = 0; i < n; ++i) {
    var sx = Math.random() * canvas.width;
    var sy = Math.random() * canvas.height;
    particles[i] = new Particle(sx, sy);
}

var drawLine = function (x0, y0, x1, y1, alpha) {
    context.lineWidth = "hairline";
    context.strokeStyle = "rgba(255,255,128," + alpha + ")";
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.closePath();
    context.stroke();
};

var drawCircle = function (x, y, r) {
    context.fillStyle = circleFill;
    context.beginPath();
    context.arc(x, y, r, 0.0, Math.PI * 2.0);
    context.closePath();
    context.fill();
};

var mouseX = 0.0;
var mouseY = 0.0;

// Physics Properties
const particleInfluenceRadius = 26.0;
const particleAttractionRadius = 18.0;
const particleAttractionForce = 1.0 / 10.0;
const particleRejectionForce = 10 * particleAttractionForce;
const particleVelocityDecay = 0.995;

const particleMouseInfluenceRadius = 48.0;

const attracCoeff = (particleAttractionRadius - particleInfluenceRadius) * (particleAttractionRadius - particleInfluenceRadius) / 4;

var solveAndDraw = function () {
    var strength;
    var i = particles.length;
    let coeffD;
    while (--i > -1) {
        var particle = particles[i];
        particle.vy += gravity / 100;
        particle.vx += (Math.random()- 0.5) * temperature;
        particle.vy += (Math.random()- 0.5) * temperature;
        var j = i;
        while (--j > -1) {
            let neighbour = particles[j];
            let dx = particle.sx - neighbour.sx;
            let dy = particle.sy - neighbour.sy;
            let dd = Math.hypot(dx, dy);
            if (dd > particleInfluenceRadius) {
                //-- out of radius
            } else {
               if (dd > particleAttractionRadius) {
                //-- attraction
                 coeffD = (particleInfluenceRadius - dd) * (dd - particleAttractionRadius) / attracCoeff * particleAttractionForce;
               } else {
                 coeffD = -(particleAttractionRadius - dd) / particleAttractionRadius * particleRejectionForce;
               }
               if (dd>0) {   
                 particle.vx -= dx/dd  * coeffD;
                 particle.vy -= dy/dd  * coeffD;
                 neighbour.vx += dx/dd * coeffD;
                 neighbour.vy += dy/dd  * coeffD;
                 strength = 1.0 - (dd - particleAttractionRadius) / (particleInfluenceRadius - particleAttractionRadius);
                 drawLine(
                   particle.sx,
                   particle.sy,
                   neighbour.sx,
                   neighbour.sy,
                   strength);

               }
            }
        } // while --j
    } // while --i
};

var moveAndDraw = function () {
    for (var i = 0; i < n; ++i) {
        var particle = particles[i];
        var sx = particle.sx;
        var sy = particle.sy;
        // mouse attraction
        var dx = mouseX - sx;
        var dy = mouseY - sy;
        var dd = Math.sqrt(dx * dx + dy * dy);
        if (mouseX) {
          if (dd < particleMouseInfluenceRadius) {
            particle.vx -= dx * particleMouseRejectionForce;
            particle.vy -= dy * particleMouseRejectionForce;
          }
        }
        // damp velocity
        particle.vx *= particleVelocityDecay;
        particle.vy *= particleVelocityDecay;
        // apply velocity
        sx += particle.vx;
        sy += particle.vy;
        // bounds
        if (sx < 0) {
            sx = 0;
            particle.vx = -particle.vx;
        } else if (sx>= width-1) {
            sx = width-1;
            particle.vx = -particle.vx;
        }
        if (sy < 0) {
            sy = 0;
            particle.vy = -particle.vy;
        } else if (sy >= height -1) {
            sy = height -1;
            particle.vy = -particle.vy;
        }
        // draw
        drawCircle(sx, sy, 2.0);
        // write back
        particle.sx = sx;
        particle.sy = sy;
    }
};

var enterFrame = function () {
    context.clearRect(0, 0, width, height);
    solveAndDraw();
    moveAndDraw();
    window.requestAnimationFrame(enterFrame);
};

var mouseMove = function (e) {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
};

var mouseLeave = function (e) {
    mouseX = false;
};

function getTemperature() {
  let ctrl = document.getElementById('temperature');
  let x = parseFloat(ctrl.value);
  if (isNaN (x)) { x = temperature }
  if (x < 0) x = 0;
  if (x > 1) x = 1;
  ctrl.value = temperature = x;
}
function getGravity() {
  let ctrl = document.getElementById('gravity');
  let x = parseFloat(ctrl.value);
  if (isNaN (x)) { x = gravity }
  if (x < 0) x = 0;
  if (x > 1) x = 1;
  ctrl.value = gravity = x;
}
function getMouseForce() {
  let ctrl = document.getElementById('mouseForce');
  let x = parseFloat(ctrl.value);
  if (isNaN (x)) { x = mouseForce }
  if (x < 0) x = 0;
  if (x > 1) x = 1;
  ctrl.value = mouseForce = x;
  particleMouseRejectionForce = x / 96;
}

/* initialize default values */
gravity = 0.1;
temperature = 0;
mouseForce = 0;

window.requestAnimationFrame(enterFrame);
canvas.addEventListener("mousemove", mouseMove);
canvas.addEventListener("mouseleave", mouseLeave);
document.getElementById('gravity').addEventListener('change',getGravity);
document.getElementById('temperature').addEventListener('change',getTemperature);
document.getElementById('mouseForce').addEventListener('change',getMouseForce);

/* read back values from HTML */
getGravity();
getTemperature();
getMouseForce();