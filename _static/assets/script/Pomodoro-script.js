window.onload = app;

// 98% ui related stuff in here, get out while you can!
function app() {
   "use strict";
   
   var currentArc = document.getElementById('current'),
       nextArc = document.getElementById('next'),
       
       audioBreak = document.getElementById('audio-break'),
       audioWork = document.getElementById('audio-work'),
       
       timerStatus = document.getElementById('timer-status'),
       timerDisplay = document.getElementById('timer-display'),
       
       btnPlay = document.getElementById('btn-start'),
       btnStop = document.getElementById('btn-stop'),
       btnPlaySr = document.getElementById('btn-start-sr'),
       
       // preferences:
       
       colorSchemeSlider = document.getElementById('color-scheme-slider'),
       
       workTimeInput = document.getElementById('work-time'),
       workTimePlus1 = document.getElementById('work-time-plus1'),
       workTimeMinus1 = document.getElementById('work-time-minus1'),
       
       breakTimeInput = document.getElementById('break-time'),
       breakTimePlus1 = document.getElementById('break-time-plus1'),
       breakTimeMinus1 = document.getElementById('break-time-minus1'),
       
       pomodoriInput = document.getElementById('pomodori'),
       pomodoriPlus1 = document.getElementById('pomodori-plus1'),
       pomodoriMinus1 = document.getElementById('pomodori-minus1'),
       
       checkSound = document.getElementById('check-sound'),
       checkNotify = document.getElementById('check-notify'),
       sysNotifyPrefs = document.getElementById('system-notification-pref'),
       volumeGroup = document.getElementById('volume-group'),
       volumeSlider = document.getElementById('volume-slider'),
       volumeValue = document.getElementById('volume-value'),
       chromeSoundNote = document.getElementById('chrome-sound-note'),
       btnVolumeTest = document.getElementById('btn-volume-test');
   

   //-- color scheme setup --
   var currentScheme = 0;
   var colorSchemes = ['red-green', 'orange-blue'];
   
   function changeColorScheme(oldScheme, newScheme) {
      // get all elements with the oldScheme class:
      var elems = Array.from(document.querySelectorAll('.' + oldScheme));
      elems.forEach(function(elem) {
         // replace oldScheme with newScheme
         removeClass(elem, oldScheme, newScheme);
      });
   }
   
   btnVolumeTest.onclick = function() {
      audioWork.load(); // be kind, rewind
      audioWork.play();
   }

   
   //-- +/- rocker button setup --
   function onRockerClick(step, input, min, max) {
      var val = Number.parseInt(input.value) || min; 
      input.value = Math.min(max, Math.max(val+step, min));
      var event;
      // trigger a 'change' event which other code reacts to:
      if ('InputEvent' in window) { // new school
         event = new InputEvent('change', {
            'view': window,
            'bubbles': true,
            'cancelable': true
         });
      } else { // old school
         event = document.createEvent("HTMLEvents");
         event.initEvent("change", true, true);
      };
      if (!event) return;
      input.dispatchEvent(event);
   }
   
   workTimePlus1.onclick = onRockerClick.bind(null, +1, workTimeInput, 1, 60);
   workTimeMinus1.onclick = onRockerClick.bind(null, -1, workTimeInput, 1, 60);
   breakTimePlus1.onclick = onRockerClick.bind(null, +1, breakTimeInput, 1, 60);
   breakTimeMinus1.onclick = onRockerClick.bind(null, -1, breakTimeInput, 1, 60);
   pomodoriPlus1.onclick = onRockerClick.bind(null, +1, pomodoriInput, 1, 20);
   pomodoriMinus1.onclick = onRockerClick.bind(null, -1, pomodoriInput, 1, 20);
   
   // after holding the mouse button down on the element for 500ms,
   // dispatch click-events in a 200ms interval until the mouse button is released
   rockerBtn(workTimePlus1);
   rockerBtn(workTimeMinus1);
   rockerBtn(breakTimePlus1);
   rockerBtn(breakTimeMinus1);
   rockerBtn(pomodoriPlus1);
   rockerBtn(pomodoriMinus1);
   
   
   //-- timer controls/behaviour setup --
   btnPlay.onclick = btnPlayClick;
   btnStop.onclick = btnStopClick;
   
   // whether currentArc should have 360-degrees instead of degrees.
   // during work, the arc is inverted = it gets smaller over time, 
   // during break the arc is not inverted = it gets bigger again
   var invertArc = true;  

   // handles desktop notifications (I like the name :):
   var naughty = naughtify('lincore.pomodoro');
   if (!naughty.support) addClass(checkNotify, 'invisible');
 
   // if the user has not made any preferences yet, use these: 
   var defaultPrefs = {
      worktime: 25,
      breaktime: 5,
      pomodori: 4,
      colorScheme: 0,
      playSound: true,
      systemNotification: false,
      volume: Math.floor(audioBreak.volume * 100)
   };
   
   // this thing contains all timer logic (defined further down):
   var pomodoro = new Pomodoro(
      defaultPrefs.worktime,
      defaultPrefs.breaktime,
      defaultPrefs.pomodori);
   
   // options for my options tool
   var localPrefs_options = {
      debug: false,
      exclusive: true, // preferences not declared in prefs are invalid
      storageKey: 'lincore.pomodoro.prefs', 
      autoLoad: true, // automatically load on startup
      autoSave: true, // auto save when changes are applied 
      autoApply: false, // apply changes as soon as they occur

      // callback when changes have been applied:
      /*onApply: function(localPrefs) {
         console.log('prefs:\n ' + JSON.stringify(localPrefs.prefs));
      },*/
      prefs: {
            colorScheme: {
               value: colorSchemeSlider, // element or selector repesenting a preference
               change: function(val, change) { // side effects of preference change
                  changeColorScheme(colorSchemes[currentScheme], colorSchemes[val]);
                  currentScheme = val;
               }
            },
            worktime: {
               value: workTimeInput,
               change: function(work, change) {
                  work = Number.parseInt(work);
                  if (!work) {
                     change.accept = false;
                  } else {
                     pomodoro.changeTime(work*1000*60);
                     setDisplay(pomodoro.timeLeft);
                  }
               }
            },
            breaktime: {
               value: breakTimeInput,
               change: function(breaktime, change) {
                  breaktime = Number.parseInt(breaktime);
                  if (!breaktime) {
                     change.accept = false;
                  } else {
                     pomodoro.changeTime(0, breaktime*1000*60);
                  }
               }
            },
            pomodori: {
               value: pomodoriInput,
               change: function(pomodori, change) {
                  pomodori = Number.parseInt(pomodori);
                  if (!pomodori) {
                     change.accept = false;
                  } else {
                     pomodoro.pomodori = pomodori;
                  }
               }
            },
            playSound: {
               value: checkSound,
               change: function(checked, change) {
                  //toggleClass(volumeGroup, 'hidden', !checked);
                  //var note = window.Notification && checked &&
                  //           !change.localPrefs.prefs.systemNotification;
                  //toggleClass(chromeSoundNote, 'hidden', note);
               }
            },
            systemNotification: {
               value: checkNotify,
               change: function(checked, change) {
                  if (!checked) return;
                  // websites must have permission to show notifications:
                  naughty.askForPermission(function(permission) {
                     console.log('permission?', permission);
                     if (permission !== 'granted')
                        change.localPrefs.set('systemNotification', false);
                  });
               }
            },
            volume: {
               value: volumeSlider,
               change: function(vol, change) {
                  volumeValue.innerHTML = vol + '%';
                  audioWork.volume = vol/100;
                  audioBreak.volume = vol/100;
               }
            }
         }
      };
   var localPrefs = new LocalPrefs(localPrefs_options, defaultPrefs);
   
   // for debugging/messing around:
   window.pomodoro = pomodoro;
   window.localPrefs = localPrefs;
   window.naughty = naughty;

   //-- pomodoro callback functions --
   
   // called about every second
   pomodoro.onTick = function() {
      setDisplay(pomodoro.timeLeft);
      var degrees = Math.round(pomodoro.progress * 360);
      drawPieArc(currentArc, degrees, invertArc);
      drawPieArc(nextArc, degrees, !invertArc);
   };
   pomodoro.onTick();
   
   // called whenever a work or break period ended:
   pomodoro.onPhaseChange = function() {
      timerStatus.innerHTML = asOrdinal(pomodoro.currentPomodoro) + ', ' +
         pomodoro.currentPhase;
      invertArc = pomodoro.currentPhase === 'work';
      // play sound, show notification:
      if (pomodoro.state === 'running') {
         if (pomodoro.currentPhase === 'break') {
            if (localPrefs.prefs.playSound) {
               audioBreak.load();
               audioBreak.play();
            }
            if (localPrefs.prefs.systemNotification) {
               naughty.message("Time for a break.");
            }
         } else {
            if (localPrefs.prefs.playSound) {
               audioWork.load();
               audioWork.play();
            }
            if (localPrefs.prefs.systemNotification) {
               var remain = pomodoro.pomodori - pomodoro.currentPomodoro + 1;
               naughty.message("Let's get back to work", 'Only ' + remain + ' pomodori left.');
            }
         }
      }
      // update the display:
      pomodoro.onTick();
   };
   
   pomodoro.onFinish = function() {
      btnStopClick();
      timerStatus.innerHTML = "You're done!";
      if (localPrefs.prefs.systemNotification) naughty.message("You're done, good job!");
      if (localPrefs.prefs.playSound) {
         audioBreak.load();
         audioBreak.play();
      }
   }
   
   // now that everything is neadly set up, localPrefs
   // applys all changes by updating elements and calling
   // change functions:
   localPrefs.apply();
   // now I no longer need to manually apply changes:
   localPrefs.options.autoApply = true;

   // depending on the timer's current state, start, pause or resume:
   function btnPlayClick() {
      switch (pomodoro.state) {
         case 'stopped':
            // start the timer
            btnPlay.id = 'btn-pause';
            btnPlaySr.innerHTML = 'Pause [p]';
            removeClass(btnStop, 'invisible');
            pomodoro.onPhaseChange();
            pomodoro.start();
            break;
         case 'running':
            // pause the timer
            btnPlay.id = 'btn-play';
            btnPlaySr.innerHTML = 'Resume [p]';
            pomodoro.pause();
            break;
         case 'paused': 
            // resume the timer
            btnPlay.id = 'btn-pause';
            btnPlaySr.innerHTML = 'Pause [p]';
            pomodoro.resume();
            break;
         default:
            throw new Error('Invalid timer state: ' + pomodoro.state);
      }
   }

   function btnStopClick() {
      pomodoro.stop();
      pomodoro.onPhaseChange();
      timerStatus.innerHTML = 'Stopped';
      addClass(btnStop, 'invisible');
      btnPlay.id = 'btn-start';
   }

   function setDisplay(timeLeft) {
      // round to whole seconds
      timeLeft = Math.round(timeLeft / 1000);
      
      var minutes = Math.floor(timeLeft / 60);
      var seconds = Math.floor(timeLeft % 60);
      
      var minutesStr = padLeft(minutes + '', 2, '0');
      var secondsStr = padLeft(seconds + '', 2, '0');
      var display = minutesStr + ':' + secondsStr;
      
      // wrap each digit in a separate fixed-width span:
      var html = display.split('').map(function(char) {
         return char === ':' ? ':' : '<span class="display-segment">' + char + '</span>';
      }).join('');
      timerDisplay.innerHTML = html;
   }

}

// encapsulates all timer logic
function Pomodoro(worktime, breaktime, pomodori, interval) {
   // from here on I use only milliseconds:
   this.worktime = (worktime || 25) * 1000 * 60;
   this.breaktime = (breaktime || 5) * 1000 * 60;
   this.pomodori = pomodori || 4;
   this.interval = interval || 1000;
   this.reset();
   
   // assign callback function(pomodoro)s to these members:
   this.onTick = null;
   this.onFinish = null;
   this.onPhaseChange = null;
   
   // timer callback, runs every sec:
   this._tick = (function() {
      var now = Date.now();
      var delta = now - this.lastTick;
      this.lastTick = now;
      this.timeLeft -= delta;
      var timePassed = Math.min(this.goal - this.timeLeft, this.goal);
      this.progress = timePassed / this.goal;
      
      if (this.onTick) this.onTick(this);
      if (this.timeLeft <= 0) {
         this._onTimerEnd();
         return;
      }
      // I don't use an interval, so I need to start the timer again:
      this._startTimer();
   }).bind(this);
}

Pomodoro.prototype.changeTime = function(worktime, breaktime) {
   if (worktime) this.worktime = worktime;
   if (breaktime) this.breaktime = breaktime;
   if (this.state === 'stopped') this.reset();
};

Pomodoro.prototype.reset = function() {
   this.state = 'stopped';
   this.currentPhase = 'work';
   this.currentPomodoro = 1;
   this.timeLeft = this.worktime;
   this.goal = this.worktime;
   this.progress = 0;
   this._timerId = undefined;
};

Pomodoro.prototype.start = function() {
   this.reset();
   this.state = 'running';
   this._startTimer();
};

Pomodoro.prototype.stop = function() {
   this._stopTimer();
   this.state = 'stopped';
   this.reset();
   if (this.onTick) this.onTick(this);
};

Pomodoro.prototype.pause = function() {
   this.state = 'paused';
   this._stopTimer();
};

Pomodoro.prototype.resume = function() {
   this.state = 'running';
   this._startTimer();
};

Pomodoro.prototype._startTimer = function() {
   // try to compensate for slight deviations:
   var timeout = this.timeLeft % this.interval || this.interval;
   this._timerId = setTimeout(this._tick, timeout);
   this.lastTick = Date.now();
};

Pomodoro.prototype._stopTimer = function() {
   clearTimeout(this._timerId);
};

// actually, this is called when the current phase ends, 
// not the timer, which "ends" every second.
Pomodoro.prototype._onTimerEnd = function() {
   if (this.currentPomodoro === this.pomodori && this.currentPhase === 'work') {
      // done!
      this.stop();
      if (this.onFinish) this.onFinish(this);
      return;
   }   
   
   // do some book keeping:
   this.currentPhase = this.currentPhase === 'work'? 'break' : 'work'; 
   if (this.currentPhase === 'break') {
      this.goal = this.breaktime;
   } else {
      this.currentPomodoro++;
      this.goal = this.worktime;
   }
   this.timeLeft += this.goal;
   this.progress = 0;
   if (this.onPhaseChange) this.onPhaseChange(this);
   this._startTimer();
};


/** 
 * while depressed, trigger a button's click event every <repeatInterval> ms,
 * after an initial interval of <initialInterval>
 * works not very well on mobile, at least not on my Android tablet.
 */
function rockerBtn(button, initialInterval, repeatInterval) {
   initialInterval = initialInterval || 500;
   repeatInterval = repeatInterval || 200;
   var timer;
   var mousedown = false;
   button.addEventListener('mousedown', press);
   //button.addEventListener('mouseup', release);

   function press() {
      if (mousedown) return;
      // the mouse could be everywhere when the button is released, so I use
      // window to catch the release no matter what:
      window.addEventListener('mouseup', release);
      mousedown = true;
      // wait <initialInterval> ms:
      timer = setInterval(function() {
         clearInterval(timer);
         // set the <repeatInterval> interval:
         timer = setInterval(function() {
            // TODO: MouseEvent may not be supported on all browsers
            var event = new MouseEvent('click', {
               'view': window,
               'bubbles': true,
               'cancelable': true
            });
            button.dispatchEvent(event);
         }, repeatInterval);
      }, initialInterval);
   }

   function release() {
      window.removeEventListener('mouseup', release);
      clearInterval(timer);
      mousedown = false;
   }
}


/**
 * convert an angle in degrees to a point on the circle's circumference
 * defined by centerx, centery, radius. 0 degrees are equal to centerx+radius, centery.
 */
function degreesToPoint(degrees, centerx, centery, radius) {
   var radians = degrees / 180 * Math.PI;
   return {
      x: centerx + Math.cos(radians) * radius,
      y: centery + Math.sin(radians) * radius
   };
}

// draw an SVG arc. It's weird.
function drawPieArc(path, degrees, inverted) {
   // I am assuming degrees divisible by 360 are full circles.
   // Arcs ending at their origin are of zero length, so I use a
   // value very close to 360 to represent a full circle.
   if (degrees === 0 && !inverted || degrees >= 360 && inverted) {
      path.setAttribute('d', '');
   }
   if (degrees > 360) {
      degrees %= 360;
      if (degrees === 0) degrees = 359.999;
   } else if (degrees === 360) degrees = 359.999;
   // svg's viewBox has a size of  100x100. I choose a smaller 
   // radius to compensate for the line thickness
   var radius = 46;
   var centerx = 50,
       centery = 50;

   // Four different arcs can be drawn between two fixed points:
   // - a short arc (less than 180 degrees) and a long arc
   //   If largeArg is 1, the long arc will be drawn.
   var largeArc = degrees > 180 ? 1 : 0;
   // - an arc that sweeps to the left and one that sweeps to the right
   //   If sweep is 1, the arc goes to the right, otherwise to the left. 
   var sweep = 1;

   if (inverted) {
      largeArc = degrees > 180 ? 0 : 1;
      sweep = 0;
      if (degrees === 0) degrees = 0.001;
   }

   // 0 degrees point to the right, but I want them to point up:
   degrees = (degrees - 90) % 360;
   var point = degreesToPoint(degrees, centerx, centery, radius);
   var x = point.x;
   var y = point.y;

   //                Move to  X               Y 
   var moveToStart = 'M ' + centerx + ' ' + (centery - radius);

   //             Arc radiusX   radiusY rotationXAxis largeArc?   sweep?    toX   toY
   var drawArc = 'A ' + radius+ ' ' +radius + ' 0 ' + largeArc + ' ' + sweep + ' ' + x + ' ' + y;
   
   // PS: rotationXAxis would skew/rotate the arc, but only if the radii were different.

   var d = moveToStart + ' ' + drawArc;
   path.setAttribute('d', d);
}

// return English ordinal string representing 
// the given number, i.e. 1st, 2nd, 3rd etc.
function asOrdinal(number) {
   if (number < 0) number *= -1;
   if (number > 3 && number <= 20) return number + 'th';
   var str = '' + number;
   switch (str[str.length - 1]) {
      case '1':
         return str + 'st';
      case '2':
         return str + 'nd';
      case '3':
         return str + 'rd';
      default:
         return str + 'th';
   }
}

// Synchronize locally stored user preferences between 
// local storage, ui and code.
// This is a longer one.
function LocalPrefs(options, defaultPrefs) {
   "use strict";
   if (!options || typeof(options) !== 'object')
      throw new Error('Invalid argument: options.');
   this._applying = false;
   this.defaultPrefs = defaultPrefs || {};
   this.options = options || {};
   this.prefs = {};
   this.changes = defaultPrefs;
   this._init();
   if (this.options.autoLoad) {
      if (!this.load()) this.apply();
   } else if (this.options.autoApply) {
      this.apply();
   }
   if (this.options.debug) console.log(this);
}

LocalPrefs.prototype._init = function() {
   function getElementValue(element) {
      var tag = element.tagName.toLowerCase();
      if (tag === 'input') {
         var type = (element.getAttribute('type') || '').toLowerCase();
         if (type === 'checkbox' || type === 'radio' && typeof(value) === 'boolean') {
            return element.checked;
         } else {
            return element.value;
         }
      } else if (tag === 'select' || tag === 'textarea') {
         return element.value;
      } else {
         return element.innerHTML;
      }
   }

   if (this.options.debug) console.log('localPrefs._init');
   var keys = Object.keys(this.options.prefs);
   keys.forEach((function(key) {
      if (!this.options.prefs.hasOwnProperty(key)) return;
      var pref = this.options.prefs[key];
      if (!pref || typeof(pref) !== 'object')
         throw new Error('localPrefs: options.prefs.' + key + ' must be an object.');
      if (!pref.value) return;
      pref._value_elem = typeof(pref.value) === 'string' ?
         document.querySelector(pref.value) : pref.value;
      if (!pref.change) return;
      pref._onchange = (function() {
         if (this._applying) return;
         this.set(key, getElementValue(pref._value_elem));
      }).bind(this);
      pref._value_elem.addEventListener('change', pref._onchange);
   }).bind(this));
};

LocalPrefs.prototype.set = function(key, value) {
   if (this.options.debug) console.log('localPrefs.set');
   if (this.prefs[key] === value) {
      delete this.changes[key];
      return;
   }
   this.changes[key] = value;
   if (this.options.autoApply) this.apply();
};

LocalPrefs.prototype.get = function(key, defaultValue) {
   if (this.options.debug) console.log('localPrefs.get');
   return (this.prefs.hasOwnProperty(key)) ? this.prefs[key] : defaultValue;
};

LocalPrefs.prototype.purgeStorage = function() {
   if (this.options.debug) console.log('localPrefs.purgeStorage');
   localStorage.removeItem(this.storageKey);
}

LocalPrefs.prototype.cleanUp = function() {
   if (this.options.debug) console.log('localPrefs.cleanUp');
   var keys = Object.keys(this.options.prefs);
   keys.forEach((function(key) {
      if (!this.options.prefs.hasOwnProperty(key)) return;
      var pref = this.options.prefs;
      if (pref._onchange) pref._value_elem.removeEventListener(pref._onchange);
   }).bind(this));
   this.prefs = null;
   this.options = null;
   this.defaultPrefs = null;
};

LocalPrefs.prototype.apply = function(changes, noAutoSave) {
   var each = (function(key) {
      if (this.prefs.hasOwnProperty(key) && changes[key] === this.prefs[key]) return;
      var val = changes[key];
      if (!this.options.prefs.hasOwnProperty(key)) {
         if (this.options.exclusive)
            throw new Error('localPrefs.apply: Undefined preference key: ' + key);
         return val;
      }
      var pref = this.options.prefs[key];
      if (pref.change) {
         var ctx = {
            val: val,
            accept: true,
            localPrefs: this
         };
         pref.change(val, ctx);
         if (!ctx.accept) return;
         val = ctx.val;
      }
      this.prefs[key] = val;
      if (pref._value_elem) updateElement(pref._value_elem, val);
   }).bind(this);
   if (this.options.debug) console.log('localPrefs.apply');
   changes = changes || this.changes;
   var keys = Object.keys(changes);
   keys.forEach((function(key) {
      var val = each(key);
      if (val === undefined) return;
      this.prefs[key] = val;
   }).bind(this));
   if (this.options.onApply) this.options.onApply(this);
   if (!noAutoSave && this.options.autoSave) this.save();

   function updateElement(element, value) {
      var tag = element.tagName.toLowerCase();
      if (tag === 'input') {
         var type = (element.getAttribute('type') || '').toLowerCase();
         if (type === 'checkbox' || type === 'radio' && typeof(value) === 'boolean') {
            element.checked = value;
         } else {
            element.value = value;
         }
      } else if (tag === 'select' || tag === 'textarea') {
         element.value = value;
      } else {
         element.innerHTML = value;
      }
   }
};

LocalPrefs.prototype.save = function(storageKey) {
   if (this.options.debug) console.log('localPrefs.save');
   storageKey = storageKey || this.options.storageKey;
   if (!storageKey) throw new Error('localPrefs.save: Missing storage key.');
   if (!localStorage) {
      if (this.options.debug) console.log('localPrefs.save: localStorage API not supported.');
      return false;
   }
   localStorage.setItem(storageKey, JSON.stringify(this.prefs));
   if (this.options.onSave) this.options.onSave(this);
};

LocalPrefs.prototype.load = function(storageKey) {
   if (this.options.debug) console.log('localPrefs.load');
   storageKey = storageKey || this.options.storageKey;
   if (!storageKey) throw new Error('localPrefs.load: Missing storage key.');
   if (!localStorage) {
      if (this.options.debug) console.log('localPrefs.load: localStorage API not supported.');
      return false;
   }
   var json = localStorage.getItem(this.options.storageKey);
   if (!json) return false;
   var loaded;
   try {
      loaded = JSON.parse(json);
   } catch (e) {
      if (e.constructor !== SyntaxError) throw e;
      if (this.options.debug) console.log('localPrefs.load: malformed json: ', json, e.message);
      return false;
   }
   var keys = Object.keys(loaded);
   if (keys === 0) return false;
   keys.forEach((function(key) {
      if (!loaded.hasOwnProperty(key)) return;
      this.changes[key] = loaded[key];
   }).bind(this));
   this.apply(undefined, true);
   if (this.options.onLoad) this.options.onLoad(this);
   return true;
};



// handle desktop notifications (naughtifications?)
function naughtify(tag) {
   var naughty = {};
   
   naughty.support = "Notification" in window; 
   naughty.hasPermission = function() {
      if (!naughty.support) return false;
      return Notification.permission === 'granted';
   };
   naughty.isPermissionDenied = function() {
      if (!naughty.support) return true;
      return Notification.permission === 'denied';
   };
   naughty.askForPermission = function(callback) {
      if (!naughty.support || Notification.permission === 'denied') {
         if (callback) callback('denied');
      } else if (Notification.permission === 'granted') {
         if (callback) callback('granted');
      } else {
         Notification.requestPermission(callback);
      }
   };
   naughty.message = function(title, text) {
      if (!naughty.support || !naughty.hasPermission()) return false;
      return new Notification(title, {
         tag: tag,
         renotify: true,
         body: text
      });
   };
   return naughty;
}


// more utils:
function padLeft(str, tolength, char) {
   char = char || ' ';
   if (str.length >= tolength) return str;
   return new Array(tolength - str.length + 1).join(char) + str;
}

function hasClass(elem, clazz) {
   return (Array.from(elem.classList).indexOf(clazz) > -1);
}

function getClassName(elem) {
   var name = elem.className;
   if (name.constructor === SVGAnimatedString) {
      name = name.baseVal;
   }
   return name;
}

function removeClass(elem, clazz, replaceWith) {
   replaceWith = replaceWith || '';
   if (hasClass(elem, clazz)) {
      var classname = getClassName(elem).replace(clazz, replaceWith);
      elem.setAttribute('class', classname);
      return true;
   }
   return false;
}

function toggleClass(elem, clazz, value) {
   value = value || !hasClass(elem, clazz);
   if (value) {
      addClass(elem, clazz);
   } else {
      removeClass(elem, clazz);
   }
}

function addClass(elem, clazz) {
   if (!hasClass(elem, clazz)) {
      var classname = getClassName(elem);
      if (elem.className !== '') classname += ' ';
      classname += clazz;
      elem.setAttribute('class', classname);
      return true;
   }
   return false;
}

function getRootWindow() {
   var root = window;
   while (root.parent !== root) {
      root = root.parent; 
   }
   return root;
}