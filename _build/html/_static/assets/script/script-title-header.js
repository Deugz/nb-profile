"use strict";

window.addEventListener("load",function() {

/**** parameters you should try to modify */

  const rayHex = 40; // circumradius of hexagon - general scale of drawing
  const withLines = true; // display lines
  const withSurface = true;
  const seeOuterZone = true; // stop drawing a bit inside / outside screen limits
  const uncentered = false;  // loop search starts at the center of the screen or not
  const concentric = true;   // much nicer with true

// the next two lines display the scaffolding
  const withHexagons = false;
  const withDots = false; // show dots or not ?

/* table tbNbPoints is used to choose the number of points on each side of an hexagon
range 0..3
A random number will be used from that table
Repeating a number in the table will increase the probability that this number is actually used
The value '0' may be used, but it may lead to some parts of the drawing being 'forgotten'
by the algorithm
*/

//  const tbNbPoints = [0,1,1,1,1,1,2];
//  const tbNbPoints = [0,1,1,1,2,2,2,3,3,3];
  const tbNbPoints = [1,2,2,2,3];
/**** modifications beyond this line at your own risk */

  let canv, ctx;   // canvas and context
  let maxx, maxy;  // canvas sizes (in pixels)
  let orgx, orgy;  // position of the center of the 1st ([0][0]) hexagon;

  let nbx, nby;    // number of hexagons horiz. / vert.
  let grid;     // array of hexagons
  let tbLoops, cptLoops; // loops array, loops counter
  let hierar;      // hierarchical structure for loops

  let perpendicular = []; // for easy calculation of perpendiculars to hexagon edges

  let vertices;    // positions of vertices of one Hexagon, relative to center

// shortcuts for Math.…
  const mrandom = Math.random;
  const mfloor = Math.floor;
  const mround = Math.round;
  const mceil = Math.ceil;
  const mabs = Math.abs;
  const mmin = Math.min;
  const mmax = Math.max;

  const mPI = Math.PI;
  const mPIS2 = Math.PI / 2;
  const m2PI = Math.PI * 2;
  const msin = Math.sin;
  const mcos = Math.cos;
  const matan2 = Math.atan2;

  const mhypot = Math.hypot;
  const msqrt = Math.sqrt;
  
  const rac3   = msqrt(3);
  const rac3s2 = rac3 / 2;
  const mPIS3 = Math.PI / 3;

//-----------------------------------------------------------------------------
// miscellaneous functions
//-----------------------------------------------------------------------------

  function alea (min, max) {
// random number [min..max[ . If no max is provided, [0..min[

    if (typeof max == 'undefined') return min * mrandom();
    return min + (max - min) * mrandom();
  }

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function intAlea (min, max) {
// random integer number [min..max[ . If no max is provided, [0..min[

    if (typeof max == 'undefined') {
      max = min; min = 0;
    }
    return mfloor(min + (max - min) * mrandom());
  } // intAlea

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/* returns intermediate point between p0 and p1,
  alpha = 0 whill preturn p0, alpha = 1 will return p1
  values of alpha outside [0,1] may be used to compute points outside the p0-p1 segment
*/
  function intermediate (p0, p1, alpha) {

    return [(1 - alpha) * p0[0] + alpha * p1[0],
            (1 - alpha) * p0[1] + alpha * p1[1]];
  } // function intermediate

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function distance (p0, p1) {

/* distance between points */

    return mhypot (p0[0] - p1[0], p0[1] - p1[1]);

  } // function distance

//------------------------------------------------------------------------
// class Hexagon

function Hexagon (kx, ky) {

  this.kx = kx;
  this.ky = ky;

} // function Hexagon
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Hexagon.prototype.size = function() {
/* computes screen sizes / positions
*/
// centre
  this.xc = orgx + this.kx * 1.5 * rayHex;
  this.yc = orgy + this.ky * rayHex * rac3;
  if (this.kx & 1) this.yc -= rayHex * rac3s2; //colonnes impaires, centre un peu plus haut

  this.vertices = [[],[],[],[],[],[]] ;

// x coordinates of this hexagon vertices
  this.vertices[3][0] = this.xc + vertices[3][0];
  this.vertices[2][0] = this.vertices[4][0] = this.xc + vertices[2][0];
  this.vertices[1][0] = this.vertices[5][0] = this.xc + vertices[1][0];;
  this.vertices[0][0] = this.xc + vertices[0][0];;
// y coordinates of this hexagon vertices
  this.vertices[4][1] = this.vertices[5][1] = this.yc + vertices[4][1];
  this.vertices[0][1] = this.vertices[3][1] = this.yc + vertices[0][1];
  this.vertices[1][1] = this.vertices[2][1] = this.yc + vertices[1][1];

/* positions of intermediate points on sides */
/* depends on the number of points on this side */
  this.points = [];
  this.nbPPSide.forEach((nbPoints, kcote) => {
    let p0 = this.vertices[kcote];
    let p1 = this.vertices[(kcote + 1 ) % 6];
    switch (nbPoints) {
      case 0 : break; // no point at all, nothing to compute
      case 1 :
        this.points.push(intermediate (p0, p1, 1 / 2));
        break;
      case 2 :
        this.points.push(intermediate (p0, p1, 3 / 8)); // better results than 1/3 and 2/3
        this.points.push(intermediate (p0, p1, 5 / 8));
        break;
      case 3 :
        this.points.push(intermediate (p0, p1, 9 / 32)); // better results than 1/4, 2/4 and 3/4
        this.points.push(intermediate (p0, p1, 1 / 2));
        this.points.push(intermediate (p0, p1, 23 / 32));
        break;
    } // switch
  }); // hexa.nbPPSide.forEach

} // Hexagon.prototype.size

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Hexagon.prototype.connect = function(kin, kout) {
  /* manages the 'connectables' property wich tells which points may be connected together
    without cutting a previously created connection
/* normally, kin et kout should have different parities */

    let kcon = 0; // index of subset of 'connectables' which contains kin et kout
    let k0, k1;
    while (true) {
      if (kcon >= this.connectables.length) {
        throw ( 'connecter un point non trouvé dans connectables');
      }
      k0 = this.connectables[kcon].indexOf(kin);
      if (k0 >= 0) {
        k1 = this.connectables[kcon].indexOf(kout);
        if (k1 == -1) {
          throw (`demande pour connecter non connectables ${kin} et ${kout}`);
        } // if kout not found
        if (k1 < k0) [k0, k1] = [k1, k0];
        // put apart points associated with kin and kout
        let narr = this.connectables[kcon].splice(k0, k1+1-k0);
        // remove kin and kout from 'connectables' since they now are used
        narr.shift(); narr.pop();
        if (narr.length > 0) this.connectables.push(narr); // the rest becomes a new 'connectable' subset
        if (this.connectables[kcon].length == 0) this.connectables.splice (kcon, 1); // remove subset if empty
        return; // that's all folks
      } // if kin was found
      // not found here, go further
      ++kcon;
    } // while...

  } // Hexagon.prototype.connect

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  Hexagon.prototype.drawCrossing = function(kin, first) {

/* draws a line between two points of two (may be only one) sides of an hexagon
Lines a perpendicular to the side so they appear continuous when crossing a side
from one hexagon to its neighbour
The line is a Bezier curve, carefully (?) tweaked to be smooth and not touch each other
A bit tricky.
*/

/* The 'first' parameter is just used to draw the very first
line in each loop.
it needs a 'ctx.moveTo' to define the starting position. Following parts of the
loop just need a 'ctx.BezierCurveTo'
*/
    const ztd = 1; // coefficient for straight lines
    const zdt = 0.8; // coefficient for U-turn

    let p0, p1, p2, p3; // control points of the Bézier curve
    let dx, dy, dd;
    let kCommVert;        // index of common vertex
    let din, dout;

// the curve is drawn as if entering the hexagon through point kin and leaving it through point kout
    let kout = this.tbCrossings[kin];
    let bin = this.sideOfPoint[kin];
    let bout = this.sideOfPoint[kout];
    let tp = perpendicular; // table of perpendiculars

    p0 = this.points[kin];
    p3 = this.points[kout];

/* this.angleCrossing gives (in 1/6 of turn) the direction change of the curve between entry and exit
*/
    switch (this.angleCrossing[kin] ) {

      case 0 : // straitforward
              dd = ztd * rayHex; // probably not the smartest way
              p1 = [p0[0] + tp[bin][0] * dd ,
                    p0[1] + tp[bin][1] * dd];
              p2 = [p3[0] + tp[bout][0] * dd ,
                    p3[1] + tp[bout][1] * dd];

               break;
      case 2:
      case -2:
/* 120 degrees : curve around a vertex
   compute distance from kin(p0) and kout(p3) to that vertex and use these distances
   to compute position of intermediate Bezizer control points p1 and p2
*/
              if (this.angleCrossing[kin] > 0) {
                kCommVert = bin;
              } else {
                kCommVert = bout;
              }

              din = distance (this.vertices[kCommVert], p0);
              dout = distance (this.vertices[kCommVert], p3);

              dd = 0.6;

              p1 = [p0[0] + tp[bin][0] * dd * dout ,
                    p0[1] + tp[bin][1] * dd * dout];
              p2 = [p3[0] + tp[bout][0] * dd * din ,
                    p3[1] + tp[bout][1] * dd * din];

               break;
      case 1:
      case -1 : // 60 degrees
              dd =  0.6 * rayHex; // probably not the smartest way
              p1 = [p0[0] + tp[bin][0] * dd ,
                    p0[1] + tp[bin][1] * dd];
              p2 = [p3[0] + tp[bout][0] * dd ,
                    p3[1] + tp[bout][1] * dd];

               break;

      case 3:
      case -3 :   // U-turn
              dx = p3[0] - p0[0];
              dy = p3[1] - p0[1];
              dd = zdt * mhypot(dx,dy);

              p1 = [p0[0] + tp[bin][0] * dd ,
                    p0[1] + tp[bin][1] * dd];
              p2 = [p3[0] + tp[bin][0] * dd ,
                    p3[1] + tp[bin][1] * dd];
              break;
      default:
              throw ('unforeseen angle');
    } // selon

    if (first) ctx.moveTo(p0[0], p0[1]);

    ctx.bezierCurveTo( p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);

  } // Hexagon.prototype.drawCrossing

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Hexagon.prototype.drawHexagon = function() {

    ctx.beginPath();
    ctx.moveTo (this.vertices[0][0], this.vertices[0][1]);
    ctx.lineTo (this.vertices[1][0], this.vertices[1][1]);
    ctx.lineTo (this.vertices[2][0], this.vertices[2][1]);
    ctx.lineTo (this.vertices[3][0], this.vertices[3][1]);
    ctx.lineTo (this.vertices[4][0], this.vertices[4][1]);
    ctx.lineTo (this.vertices[5][0], this.vertices[5][1]);
    ctx.lineTo (this.vertices[0][0], this.vertices[0][1]);
    ctx.strokeStyle = '#8FF';
    ctx.lineWidth = 0.5;
    ctx.stroke();
} // Hexagon.prototype.drawHexagon

// end of class Hexagon
//------------------------------------------------------------------------

//------------------------------------------------------------------------

function drawEverything() {
// draws all the loops, surfaces and lines if requested

  ctx.clearRect(0, 0, maxx, maxy);
  ctx.lineCap = 'round';

  // draws all loops, from the outermost to the innermost
  if (withSurface) {
    (function dessinerHier(hierarchie, hue) {
      let color = `hsl(${hue},100%,50%)`;
      if (hierarchie[0]== -1) {
        ctx.fillStyle = color;
        ctx.fillRect (0, 0, maxx, maxy);
      } else drawLoop (tbLoops[hierarchie[0]], color);
      for (let k=1; k < hierarchie.length; ++k) dessinerHier(hierarchie[k], (hue + (alea(60,300))) % 360);
    })(hierar, alea(0,360));
  } // if (withSurface)

  if (withLines) {
    ctx.lineWidth = 2;
    tbLoops.forEach(loop => {
      let color = withSurface ? '#000' :`hsl(${alea(360)},100%,50%)`;
      drawLoop(loop, color, true)
    });
  } // if (withLines)


  if (withDots) {     /* to draw dots */
    ctx.fillStyle = '#8FF';
    grid.forEach (line => {
      line.forEach (hexa => {
        hexa.points.forEach (point => {
          ctx.beginPath();
          ctx.arc(point[0], point[1], 3, 0, m2PI);
          ctx.fill();
        });
      });
    });
  } // if withDots

  if (withHexagons) {
    for (let ky = 0; ky < nby ; ++ky) {
      for (let kx = 0; kx < nbx ; ++kx) {
        grid[ky][kx].drawHexagon();
      } // for kx
    } // for ky
  } //  if (withHexagons)
} // function drawEverything

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function sizeEverything() {

  for (let ky = 0; ky < nby ; ++ky) {
    for (let kx = 0; kx < nbx ; ++kx) {
      grid[ky][kx].size();
    } // for kx
  } // for ky

} // function sizeEverything

//-----------------------------------------------------------------------------

function createGrid() {
// create the grid of Hexagons

  grid = [];
  let c0, c1, c2, c3;

  for (let ky = 0; ky < nby; ++ky) {
    let hexa;
    grid[ky] = []
    for (let kx = 0; kx < nbx; ++kx) {
      hexa = new Hexagon(kx, ky);
      grid[ky][kx] = hexa;

  /* give numbers to the sides, taking into account of already defined sides
  */

      let cotes = new Set([0, 1, 2, 3, 4, 5]);
      let total = 0;
      hexa.nbPPSide = []; // number of points per side -> number of lines that will cross this side of an hexagon
  // no points on external sides
      if (ky == 0) {
        hexa.nbPPSide[4] = 0;
        cotes.delete(4);
        if ((kx & 1) != 0) { // odd columns
          hexa.nbPPSide[3] = 0;
          cotes.delete(3);
          hexa.nbPPSide[5] = 0;
          cotes.delete(5);
        }
      } // top side
      if (kx == nbx - 1) { // right side
        hexa.nbPPSide[5] = 0; // may have been already done, no matters
        cotes.delete(5);
        hexa.nbPPSide[0] = 0;
        cotes.delete(0);
      }
      if (ky == nby - 1) { // bottom side
        hexa.nbPPSide[1] = 0;
        cotes.delete(1);
        if ((kx & 1) == 0) {
          hexa.nbPPSide[0] = 0;
          cotes.delete(0);
          hexa.nbPPSide[2] = 0;
          cotes.delete(2);
        }
      }

      if (kx == 0) { // left side
        hexa.nbPPSide[2] = 0; // may have been already done, no matters
        cotes.delete(2);
        hexa.nbPPSide[3] = 0;
        cotes.delete(3);
      }
// end of putting zeroes on external sides

// now, deal with constraints coming from previously defined neighbours
      if (ky > 0) { // see upper neighbour (side 4)
        hexa.nbPPSide[4] = grid[ky - 1][kx].nbPPSide[1];
        total += hexa.nbPPSide[4];
        cotes.delete(4);
      }
      if (kx > 0) { // neighbour on side 3
        let kyvois = ky - (kx & 1);
        if (kyvois >= 0 ) {
          let neighbour = grid[kyvois][kx - 1]; // yes, yes, think deep
          hexa.nbPPSide[3] = neighbour.nbPPSide[0];
          total += hexa.nbPPSide[3];
          cotes.delete(3);
        }
      }
      if ((kx < nbx - 1) && (kx & 1)) { // neighbour on side 5
        let kyvois = ky - 1;
        if (kyvois >= 0 ) {
          let neighbour = grid[kyvois][kx + 1];
          hexa.nbPPSide[5] = neighbour.nbPPSide[2];
          total += hexa.nbPPSide[5];
          cotes.delete(5);
        }
      }

      if ((kx > 0) && (kx & 1)) { // neighbour on side 2
        let neighbour = grid[ky][kx - 1];
        hexa.nbPPSide[2] = neighbour.nbPPSide[5];
        total += hexa.nbPPSide[2];
        cotes.delete(2);
      }

// end of constraints coming from neighbours

      let stotal = 0;
      if (cotes.size == 0) { // already completly constrainted ?
// possible only for the lower rightmost hexagon
        if (ky == nby - 1 && kx == nbx - 1 ) continue;
        throw ('cotes.size == 0');
      } else {
        do {
          stotal = 0;
          cotes.forEach(side => { // for each unconstrainted side
  /* pick up a random number of points for this side */
            hexa.nbPPSide[side] = tbNbPoints[intAlea(tbNbPoints.length)];
            stotal += hexa.nbPPSide[side];
          }); // cotes.forEach
        } while (total + stotal < 2 || ((total + stotal) & 1 ));
      } // if NOT already completly constrainted

    } // for kx
  } // for ky

/* second pass to evaluate which points are on each side (pointsOfSide) and
on which side is each point (sideOfPoint)
*/
  grid.forEach(line =>{
    line.forEach(hexa =>{

      hexa.nbPoints = hexa.nbPPSide.reduce ((cumul, valeur) => cumul + valeur, 0);

  /* compute, for each point of the current Hexagon, wich side it belongs to */
      hexa.sideOfPoint = [];
      let kPoint = 0;
      for (let kCote = 0; kCote < 6; ++kCote) {
        for (let k = 0; k < hexa.nbPPSide[kCote]; ++k) hexa.sideOfPoint.push(kCote);
      } // for kcote

  /* compute, for each side of the current Hexagon, which points belong to it */
      hexa.pointsOfSide = [[],[],[],[],[],[]];
      for (let k = 0; k < hexa.nbPoints; ++k) hexa.pointsOfSide[hexa.sideOfPoint[k]].push(k);

/* create the set of points that can be connected together in one hexagon
     - initially all of them */
      hexa.connectables = [[]];
      for (let kin = 0; kin < hexa.nbPoints; ++kin) hexa.connectables[0][kin] = kin;

    }); // line.forEach
  }); // grid.forEach

} // createGrid
//------------------------------------------------------------------------

function analyseLoops() {

  let hexa;

  tbLoops = [];
  cptLoops = 0;

/* noted we've been nowhere till now */
  grid.forEach (line => {
    line.forEach (hexa => {
      hexa.passe = [];
      hexa.entry = []; // to remind if point in entry or exit while going through the loop
      hexa.tbCrossings = [];
      hexa.angleCrossing = [];
    }); // line.forEach
  }); // grid.forEach

// choosing starting point and creating 1st loop
  if (uncentered) {
    hexa = grid[intAlea(nby)][intAlea(nbx)];  // anywhere
  } else {
    hexa = grid[mfloor(nby / 2)][mfloor(nbx / 2)]; // centered
  }
  analyseOneLoop(hexa, mfloor(hexa.nbPoints / 2));

/* then we start from the points neighbours of the entry and exit points of
every part of previously created loops

remark : cptLoops increases during this 'for' loop, but kLoop will allways catch it up
*/
  for (let kLoop = 0 ; kLoop < cptLoops ; ++kLoop) {
    let loop = tbLoops[kLoop];
    loop.crossings.forEach(crossing => {
      let hexa = crossing.hexagon;
      analyseOneLoop(hexa, (crossing.kin - 1 + hexa.nbPoints) % hexa.nbPoints); // -1 neighbour of entry point
      analyseOneLoop(hexa, (crossing.kin + 1 ) % hexa.nbPoints); //  +1 neighbour of entry point
      analyseOneLoop(hexa, (crossing.kout - 1 + hexa.nbPoints) % hexa.nbPoints); //  -1 neighbour of exit point
      analyseOneLoop(hexa, (crossing.kout + 1 ) % hexa.nbPoints); //  +1 neighbour of exit point
    }) // loop.crossings.forEach
  } // for kLoop
//  console.log (tbLoops);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function analyseOneLoop (hexa, kin) {

  let loop, crossing, kx, ky, kout, exitSide;
  let kconn, idxconn;

  if (typeof hexa.passe[kin] != 'undefined') return; // already passed there
  loop = {crossings: [], angle : 0};
  while (typeof hexa.passe[kin] == 'undefined') { // while not already passed there, meaning while loop not closed
    // look for first connectable point close to kin
    // look for set of connectables containing kin
    for (kconn = 0 ; kconn < hexa.connectables.length ; ++ kconn ) {
      if ((idxconn = hexa.connectables[kconn].indexOf(kin)) != -1) break; // found it
    } // for
  if (concentric) { // generate more or less concentric loops
    idxconn = (idxconn + 1) % hexa.connectables[kconn].length;
// sometimes (randomly) go further - for the sake of non-uniformity
    if (intAlea(5) == 0)
      idxconn = (idxconn + 2) % hexa.connectables[kconn].length;
  } else { // not concentric loops
 /* pick up a random point in same connectable set - with different parity */
    idxconn = intAlea(hexa.connectables[kconn].length / 2) * 2 + ((idxconn & 1) ^ 1);
  }
    kout = hexa.connectables[kconn][idxconn];

    hexa.tbCrossings[kin] = kout;
    hexa.tbCrossings[kout] = kin;
    hexa.connect(kin, kout); // to update 'connectables'
    {
      let angle;      // evaluate the angle of this crossing ( 1/6 of turn)
      switch ((hexa.sideOfPoint[kout] - hexa.sideOfPoint[kin] + 6) %6 ) {

        case 0 :  angle = (kout > kin) ? -3 : +3;
                  break;
        case  1 : angle = -2;
                  break;
        case  2 : angle = -1;
                  break;
        case  3 : angle = 0;
                  break;
        case  4 : angle = 1;
                  break;
        case  5 : angle = 2;
                  break;
      } // switch for angle
      hexa.angleCrossing[kin] = angle;
      hexa.angleCrossing[kout] = -angle;
      loop.angle += angle;
    }
    loop.crossings.push ({hexagon: hexa, kin: kin, kout: kout});
    hexa.passe[kin] = hexa.passe[kout] = cptLoops;
    hexa.entry[kin] = true; // to find easily the direction of crossing
    hexa.entry[kout] = false;

// moving to the neighbour Hexagon

    exitSide = hexa.sideOfPoint[kout];
    kx = hexa.kx;
    ky = hexa.ky;

    switch (exitSide) {
      case 0 :
          ky += 1 - (kx & 1);
          kx += 1;
          break;
      case 1 :
          ky += 1;
          break;
      case 2 :
          ky += 1 - (kx & 1);
          kx -= 1;
          break;
      case 3 :
          ky -= (kx & 1);
          kx -= 1;
          break;
      case 4 :
          ky -= 1;
          break;
      case 5 :
          ky -= (kx & 1);
          kx += 1;
          break;
    } // switch (exitSide)

    let idxs = hexa.pointsOfSide[exitSide].indexOf(kout); // index of point in the side it is going out from
    idxs = hexa.nbPPSide[exitSide] - 1 - idxs; // index of entry in the side of the neighbour Hexagon
    hexa = grid[ky][kx]; // neighbour Hexagon
    kin = hexa.pointsOfSide[(exitSide + 3) % 6][idxs]; // entry point in neighbour
  } // while not back to the starting point

  tbLoops[cptLoops++] = loop; // add one loop
} // analyseOneLoop

} // analyseLoops

//------------------------------------------------------------------------

function prioritizeLoops() {

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function apeerb (a, b) {
  // "hierar" already containing a, adds b as a peer of a
    a.parent.push(b.found); // b is added as child af a's parent
  } // apeerb

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function asurroundsb (a,b) {
    // "hierar" already containing a, adds b as a's child
    a.found.push(b.found); // b is added 'inside' a
  } // asurroundsb

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function bsurroundsa (a,b) {
    /* "hierar" already containing a, adds b as direct parent of a and a's peers
    */

    let par = a.parent;
    while ( a.parent.length > 1) {
      b.found.push (a.parent[1]); // adds a or a peer to b
      a.parent.splice(1, 1);      // withdraw a or peer from its parent
    } // while
    par.push(b.found);          // b is added to former parent of a

  } // bsurroundsa

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// tries to find particular loop given by kb in (sub-)hierarchy given by inclus
    function find (included,kb) {
      let result;
      let parent = included;
      for (let k = 1 ; k < included.length; ++k) {
        if (included[k][0] == kb) return {parent: parent, found: included[k]};
        if (result = find(included[k],kb)) return result;
      }
      return false;
    } // find

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/* The loops are designated by their index in tbLoops
the representation of one loop in the hierarchy is an array whose fist element
is the index of this loop, and the others elements are the representation
of -if any- the loops immediatly included in the firs one.

By example, 0 designates a loop [0] the hierachical representation of this loop
if it surrounds no other loop

other example : if loop 0 contains loops 2 and 3, and loop 3 contains loop 4, this will
be represented by hierar = [0,[2,[4]],[3]]
The top level of this hierarchy is the outside world, represented by indes -1
*/
/*
  We shall create a table of loops to be examined, initialized with a single loop.
  We will go through this loop and, at every exit point of an hexagon, determinate
  the hierarchical relation between the current loop and the loop which passes by
  the two neighbour points : a surrounds b, b surrounds a or a and b at the same level.
  The indexes of the encountered loops will be added to the list of loops to be
  examined, if they are not already in this list.
  Two loops passing by neighbours points can only be immediate parent, child of
  sibling of each other. Their relation can be deduced from the order of the two
  neighbour points, and the fact that each loop turns clockwise or counter-clockwise

*/

// début de function prioritizeLoops() {

  let kb;      // index in toBeExamined
  let loopa;   // loop qu'on est en train de parcourir
  let loopb;   // loop neighbour of loopa
  let kLoopa, kLoopb; // indexes of loopa and loopb
  let kentry;    // index of point by which the loop enters the hexagon
  let kentryn;   // index of point neighbour of kentry
  let descHierA, descHierB; // hierarchical descriptions of loopa and loopb
  let anglea, angleb;

  let toBeExamined = [0];    // table of loops to be examined, let us begin with just 0

  hierar = [-1, [0]];     // let us create a hierarchy where loop 0 is the only loop included une the universe (-1)

  for (kb = 0; kb < toBeExamined.length; ++kb) {
  /* toBeExamined will be extended inside the 'for' loop, but
  kb will allways catch up with toBeExamined.length */

/* look for current loop and is parent in 'hierar' */
    kLoopa = toBeExamined[kb];
    loopa = tbLoops[kLoopa];
    anglea = loopa.angle; // we enter by this point -> initialize angle

    loopa.crossings.forEach(crossing => { // for every hexagon we will cross
      for (let sens = 0; sens < 2; ++sens) {
        kentry = [crossing.kin, crossing.hexagon.tbCrossings[crossing.kin]][sens]; // the entry point
        anglea = loopa.angle * (crossing.hexagon.entry [kentry] ? 1 : -1);

        let nbPts = crossing.hexagon.nbPoints;
  // let us check the '+1' neighbour of current point
        kentryn = (kentry + 1) % nbPts;
        kLoopb = crossing.hexagon.passe[kentryn];
        loopb = tbLoops[kLoopb];
        if (toBeExamined.indexOf(kLoopb) == -1) { // if neighbour loop not studied yet
          descHierA = find (hierar, kLoopa);
          toBeExamined.push(kLoopb);              // add it to toBeExamined
          descHierB = {found: [kLoopb]};
 // we prepare its hierarchical representation
          angleb = loopb.angle * ( crossing.hexagon.entry[kentryn] ? 1 : -1);
          switch (angleb) {
            case -6 : if (anglea == - 6) {
                        asurroundsb(descHierA, descHierB);
                      } else {
                        apeerb(descHierA, descHierB);
                      }
                      break;
            case +6 : if (anglea == - 6) {
                        console.error('bug : loopb.angle > 0 et loopa.angle < 0');
                      } else {
                        bsurroundsa(descHierA, descHierB);
                      }
                      break;
            default : console.error ('unexpected angle');
          } // switch angle of loopb
        } // if loop not known yet

 // let us check the '-1' neighbour of current point
        kentryn = (kentry + nbPts - 1) % nbPts;
        kLoopb = crossing.hexagon.passe[kentryn];
        loopb = tbLoops[kLoopb];
        if (toBeExamined.indexOf(kLoopb) == -1) { // if neighbour loop not studied yet
          descHierA = find (hierar, kLoopa);
          toBeExamined.push(kLoopb);              // add it to toBeExamined
          descHierB = {found: [kLoopb]};      // we prepare its hierarchical representation
          angleb = loopb.angle * ( crossing.hexagon.entry[kentryn] ? 1 : -1);
          switch (angleb) {
            case -6 : if (anglea == -6) {
                        bsurroundsa(descHierA, descHierB);
                      } else {
                        console.error('bug : loopb.angle > 0 et loopa.angle < 0');
                      }
                      break;
            case +6 : if (anglea == -6) {
                        apeerb(descHierA, descHierB);
                      } else {
                        asurroundsb(descHierA, descHierB);
                      }
                      break;
            default : console.error ('unexpected angle');
          } // switch angle of loopb
        } // if loop not known yet
      } // for sens
    }); // loopa.forEach

  } // for kb

} // prioritizeLoops

//------------------------------------------------------------------------

function drawLoop (loop, color, stroke) {

  let hexa;
  let first = true;
  ctx.beginPath();
  loop.crossings.forEach (crossing => {
    hexa = crossing.hexagon;
    hexa.drawCrossing(crossing.kin, first);
    first = false;
  }); // loop.crossings.forEach

  if (stroke) {
    ctx.strokeStyle = color;
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }
} //  drawLoop

//-----------------------------------------------------------------------------

function startOver() {

// canvas dimensions

  maxx = window.innerWidth; 
  maxy = window.innerHeight;

  canv.style.left = ((window.innerWidth ) - maxx) / 2 + 'px';
  canv.style.top = ((window.innerHeight ) - maxy) / 2 + 'px';

  canv.width = maxx;
  canv.height = maxy;
  
// number of columns / rows
// computed to have (0,0) in top leftmost corner
// and for all hexagons to be fully contained in canvas

  nbx = mfloor(((maxx / rayHex) - 0.5) / 1.5);
  nby = mfloor(maxy / rayHex / rac3 - 0.5); //

  if (! seeOuterZone) {
    nbx += 2;
    nby += 2;
  } //

  if (nbx < 1 || nby < 1) return; // nothing to do

  orgx = (maxx - rayHex * (1.5 * nbx + 0.5)) / 2  + rayHex; // obvious, no ?
  orgy = (maxy - (rayHex * rac3 * (nby + 0.5))) / 2 + rayHex * rac3; // yet more obvious

/* position of hexagon vertices, relative to its center */
  vertices = [[],[],[],[],[],[]] ;
// x coordinates, from left to right
  vertices[3][0] = - rayHex;
  vertices[2][0] = vertices[4][0] = - rayHex / 2;
  vertices[1][0] = vertices[5][0] = + rayHex / 2;
  vertices[0][0] = rayHex;
// y coordinates, from top to bottom
  vertices[4][1] = vertices[5][1] = - rayHex * rac3s2;
  vertices[0][1] = vertices[3][1] = 0;
  vertices[1][1] = vertices[2][1] = rayHex * rac3s2;

  createGrid();
  analyseLoops();
  prioritizeLoops();
  sizeEverything();
  drawEverything();
} // startOver

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function clickCanvas() {
  startOver();
}
//------------------------------------------------------------------------
//------------------------------------------------------------------------
// beginning of execution

  {
    canv = document.createElement('canvas');
    canv.style.position="absolute";
    canv.addEventListener('click',clickCanvas);
    document.body.appendChild(canv);
    ctx=canv.getContext('2d');
  } // canvas creation

  perpendicular = [];
// perpendicular entering the hexagon
  perpendicular[0] = [-msqrt(3)/2, -1/2]; // perpendicular to side 0
  perpendicular[1] = [ 0         , -1  ]; // perpendicular to side 1
  perpendicular[2] = [ msqrt(3)/2, -1/2]; // perpendicular to side 2
  perpendicular[3] = [ msqrt(3)/2,  1/2]; // perpendicular to side 3
  perpendicular[4] = [ 0         ,  1  ]; // perpendicular to side 4
  perpendicular[5] = [-msqrt(3)/2,  1/2]; // perpendicular to side 5

  startOver();
  
  window.addEventListener('resize',startOver);
}); // window load listener