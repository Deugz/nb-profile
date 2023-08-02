# Pomodoro

## Timer

:::{note}
:class: margin


Could be nice to record the time spend working under pomodoro
- Log the value and save it somewhere every time (PHP ?)

Penser a inclure nos propres sons (solo guitare ou solo de bass par exemple)

Extracted from [Codepen](https://codepen.io/lincore/pen/yJeRBW)

:::



<audio id="audio-break" src="https://a.clyp.it/obco0n3a.mp3"></audio>
<audio id="audio-work" src="https://a.clyp.it/5tyslehe.mp3"></audio>

<div class="pomodo-row">

<div id="pomodoro-left" class="column">

<form id="settings" action="javascript:void(0)">
         <div class="group">
             <label class="group-label" for="work-time">Work:</label>
             <span class="number">
                <button type="button" class="btn-rocker left" id="work-time-minus1">-</button>
                <input class="input-number"  inputmode="numeric" step="1" id="work-time" value="25" min="1" max="60">
                <button type="button" class="btn-rocker right" id="work-time-plus1">+</button>
             </span>
             <span class="unit">minutes</span>
         </div>
         <div class="group">
            <hr class="gradient">
            <label class="group-label" for="break-time">Break:</label>
            <span class="number">
               <button type="button" class="btn-rocker left" id="break-time-minus1">-</button>
               <input class="input-number"  inputmode="numeric" step="1" id="break-time" value="5" min="1" max="60">
               <button type="button" class="btn-rocker right" id="break-time-plus1">+</button>
            </span>
            <span class="unit">minutes</span>
         </div>
         <div class="group">
            <hr class="gradient">
            <label class="group-label" for="pomodori">Pomodori:</label>
            <br>
            <span class="number">
               <button type="button" class="btn-rocker left" id="pomodori-minus1">-</button>
               <input class="input-number"  inputmode="numeric" step="1" id="pomodori" value="4" min="5" max="60">
               <button type="button" class="btn-rocker right" id="pomodori-plus1">+</button>
            </span>
            <span class="unit">×</span>
         </div>         
         <div class="group">
            <hr class="gradient">
            <label class="group-label" for="color-scheme-slider">Colors:<span class="sr-only">[c]</span></label>
            <span class="option">Red/Green</span>
            <input type="range" class="binary-slider" id="color-scheme-slider" min="0" max="1" step = "1" value="0" accesskey="c">
            <span class="option">Orange/Blue</span>
         </div>
         <hr class="gradient">
         <div class="group">
            <label class="group-label">Notify me:</label>
            <span class="group-col">
               <input type="checkbox" id="check-sound" checked>
               <label for="check-sound">via sound</label>
               <div id="system-notification-pref">
                  <input type="checkbox" id="check-notify">
                  <label for="check-notify">via system notification
                     <abbr title="A message shown on screen, even when this page is not visible">?</abbr>
                  </label>
               </div>
            </span>
         </div>
         <div class="group" id="volume-group">
            <hr class="gradient">
            <label class="group-label" for="volume-slider">Volume:</label>
            <input type="range" min="0" step="5" max="100" id="volume-slider" value="50">
            <span id="volume-value">50%</span>
            <button type="button" id="btn-volume-test">Test</button>
        </div>
</form>

</div>

<div id="pomodoro-right" class="column">

<div id="pomodoro">
<svg viewBox="0 0 100 100" xmlns="https://www.w3.org/2000/svg">
<path id="next" class="break red-green" d="M 50 4 A 46 46 0 1 1 49.99919714854413 4.0000000070062" />
<path id="current" class="work red-green" d="M 50 4 A 46 46 0 1 1 49.99919714854413 4.0000000070062" />
</svg>
    
<div id="inner">
<span id="timer">

<div>
<span id="timer-status">Stopped</span>
</div>
    
<div id="timer-display"></div>
    
<div id="timer-controls">
<button class="btn-icon red-green" id="btn-start">
<span id="btn-start-sr" class="sr-only" accesskey="p">Start [p]</span>
</button>
<button class="btn-icon invisible red-green" id="btn-stop">
<span id="btn-stop-sr" class="sr-only" accesskey="s">Stop [s]</span>
</button>
</div>
</span>
</div>
    
<p class="emphase">Lets GO!<br> 💪 </p>
    
</div>

</div>
    




## More