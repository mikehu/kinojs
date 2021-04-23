(function() {
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                 || window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  if (!window.requestAnimationFrame){
      var tid = null, cbs = [], nb = 0, ts = 0;
      function animate() {
          var i, clist = cbs, len = cbs.length;
          tid = null;
          ts = Date.now();
          cbs = [];
          nb += clist.length;
          for (i = 0; i < len; i++){
              if(clist[i])
                  clist[i](ts);
          }
      }
      window.requestAnimationFrame = function(cb) {
          if (tid == null)
            tid = window.setTimeout(animate, Math.max(0, 20 + ts - Date.now()));
          return cbs.push(cb) + nb;
      };
      window.cancelAnimationFrame = function(id) {
          delete cbs[id - nb - 1];
      };
  }
}());

(function() {
  const scenes = [];

  let windowHeight;
  const resetDimensions = function() {
    windowHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  }

  const STICKY_STYLE = 'position: -webkit-sticky; position: sticky; width: 100%; top: 0';
  const BEFORE_SCROLL_RANGE = 0;
  const SCROLLING = 1;
  const AFTER_SCROLL_RANGE = 2;

  const Scene = function(options = {}) {
    this._id = `scene-${scenes.length + 1}`;
    this._targetEl = document.getElementById(options.target);
    this._afterTargetEl = this._targetEl.nextElementSibling;
    this._stickyContainer = document.createElement('div');
    this._stickyContainer.id = this._id;
    this._stickyContainer.style.width = '100%';
    this._stickyFrame = document.createElement('div');
    this._stickyFrame.style = STICKY_STYLE;
    this._stickyFrame.setAttribute('data-scene-ref', this._id);
    this._dimensions = {};
    this._bounds = [];
    this._durationPx = options.duration;
    this._currState = null;
    this._prevState = null;
    this._listeners = [];
    this.create()
  }
  Scene.prototype.create = function() {
    const parentEl = this._targetEl.parentElement;
    const refEl = this._afterTargetEl.nextElementSibling;
    this._stickyFrame.appendChild(this._targetEl);
    this._stickyFrame.appendChild(this._afterTargetEl);
    this._stickyContainer.appendChild(this._stickyFrame);
    parentEl.insertBefore(this._stickyContainer, refEl);
    this.callibrate();
    return this;
  }
  Scene.prototype.callibrate = function() {
    const frameHeight = this._stickyFrame.clientHeight;
    this._dimensions.targetElHeight = this._targetEl.clientHeight;
    this._dimensions.targetScrollHeight = this._durationPx || frameHeight;
    this._dimensions.scrollableHeight = this._dimensions.targetScrollHeight - frameHeight + this._dimensions.targetElHeight;
    
    const topBound = this._stickyFrame.offsetTop;
    const bottomBound = topBound + this._dimensions.scrollableHeight - windowHeight;
    this._bounds = [topBound, bottomBound]

    window.requestAnimationFrame(() => {
      this._stickyContainer.style.height = `${this._dimensions.targetScrollHeight}px`;
    });
    return this;
  }
  Scene.prototype.update = function(scrollPos) {
    const changes = this._calculateChanges(scrollPos);

    if (changes) {
      this._applyChanges(changes);
    }

    if (this._currentState === SCROLLING) {
      this._broadcast((scrollPos - this._bounds[0]) / (this._bounds[1] - this._bounds[0]));
    }
    return this;
  }
  Scene.prototype.tick = function(handlerFn) {
    this._listeners.push(handlerFn);
    return this;
  }
  Scene.prototype._calculateChanges = function(scrollPos) {
    let changes = null;

    this._prevState = this._currentState;
    
    if (scrollPos < this._bounds[0]) {
      this._currentState = BEFORE_SCROLL_RANGE;
    } else if (scrollPos < this._bounds[1]) {
      this._currentState = SCROLLING;
    } else {
      this._currentState = AFTER_SCROLL_RANGE;
    }

    if (this._currentState !== this._prevState) {
      changes = {
        state: this._currentState
        , direction: this._prevState === undefined ? 0 : this._currentState - this._prevState
      };
    }

    return changes;
  }
  Scene.prototype._applyChanges = function(changes) {
    this._stickyFrame.setAttribute('data-scene-state', changes.state);
    if (changes.state === BEFORE_SCROLL_RANGE && changes.direction < 0) {
      this._broadcast(0);
    }
    if (changes.state === AFTER_SCROLL_RANGE && changes.direction > 0) {
      this._broadcast(1);
    }
  }
  Scene.prototype._broadcast = function(progress) {
    this._listeners.forEach((fn) => {
      fn.call(this, progress);
    });
  }
  Scene.prototype.destroy = function() {
    if (!this._stickyContainer.parentElement) {
      return;
    }
  }

  const frameImages = document.getElementById('frame-images');
  const frameTexts = document.getElementById('frame-texts');

  const NUM_FRAMES = 3;
  const FRAMES_CLASSLIST = [];
  for (let i = 0; i < NUM_FRAMES; i++) {
    FRAMES_CLASSLIST.push(`show-frame-${i+1}`);
  }

  let currentFrame = 0;
  const loadFrame = function(frame) {
    if (frame === currentFrame) {
      return;
    }
    currentFrame = frame;
    frameImages.classList.remove(...FRAMES_CLASSLIST);
    frameTexts.classList.remove(...FRAMES_CLASSLIST);
    frameImages.classList.add(`show-frame-${currentFrame}`);
    frameTexts.classList.add(`show-frame-${currentFrame}`);
  }

  document.addEventListener('resize', () => {
    window.requestAnimationFrame(() => {
      resetDimensions();
      scenes.forEach((scene) => {
        scene.callibrate();
      });
    });
  });

  document.addEventListener('scroll', () => {
    const y = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    scenes.forEach((scene) => {
      scene.update(y);
    });
  });

  resetDimensions();
  scenes.push(new Scene({
    target: 'integration-block'
    , duration: 4000
  }).tick((progress) => {
    if (progress < 1) {
      window.requestAnimationFrame(() => {
        const shouldLoadFrame = Math.floor(progress * NUM_FRAMES) + 1;
        loadFrame(shouldLoadFrame);
      });
    }
  }));
}());
