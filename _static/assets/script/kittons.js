 /* Bonsai */

var animData = {
        container: document.getElementById('container_bonsai'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://labs.nearpod.com/bodymovin/demo/bonsai/data.json'
    };
    var anim = bodymovin.loadAnimation(animData);

 /* Science */

var svgContainer = document.getElementById('science_bb');
var animItem = bodymovin.loadAnimation({
  wrapper: svgContainer,
  animType: 'svg',
  loop: true,
  path: 'https://labs.nearpod.com/bodymovin/demo/al_boardman/machine/data.json'
});

 /* pancake */

var count = 0;
    var container = document.getElementById('pancake');
    var animData = {
        container: container,
        renderer: 'svg',
        loop: true,
        prerender: false,
        autoplay: false,
        autoloadSegments: false,
        path: 'https://labs.nearpod.com/bodymovin/demo/pancakes/data.json'
    };

    var anim;
    var isThrowing = false;


    anim = bodymovin.loadAnimation(animData);
    anim.addEventListener('DOMLoaded',startAnimation);
    container.onclick = throwPancake;

    function throwComplete(){
        isThrowing = false;
        anim.removeEventListener('loopComplete',throwComplete);
    }

    function throwPancake(){
        if(isThrowing){
            return;
        }
        isThrowing = true;
        anim.playSegments([[27,142],[14,26]],true);
        var baconRand = Math.random()*1420;
        var butterXpos;
      if(baconRand < 1420/2){
        butterXpos = 500 + 900 + Math.random()*900;
      } else {
        butterXpos = 500 + Math.random()*900;
      }
        var baconPos = [-100+baconRand,480+Math.random()*370,0];
        var butterPos = [butterXpos,470+Math.random()*430,0];
        anim.layers[0].ks.p.k[0].e = baconPos;
        anim.layers[2].ks.p.k[0].e = baconPos;
        anim.layers[1].ks.p.k[0].e = butterPos;
        anim.layers[3].ks.p.k[0].e = butterPos;
        anim.addEventListener('loopComplete',throwComplete);
    }

    function startAnimation(){
        anim.playSegments([[0,26],[14,26]],true);
    }