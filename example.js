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
  const targetId = 'integration-block';
  const targetEl = document.getElementById(targetId);
  const afterTargetEl = targetEl.nextElementSibling;

  const frameImages = document.getElementById('frame-images');
  const frameTexts = document.getElementById('frame-texts');

  const stickyContainer = document.createElement('div');
  stickyContainer.style.width = '100%';
  const stickyItem = document.createElement('div');
  stickyItem.style = 'position: -webkit-sticky; position: sticky; width: 100%; top: 0';

  const initElements = function() {
    const parentEl = targetEl.parentElement;
    const refEl = afterTargetEl.nextElementSibling;
    stickyItem.appendChild(targetEl);
    stickyItem.appendChild(afterTargetEl);
    stickyContainer.appendChild(stickyItem);
    parentEl.insertBefore(stickyContainer, refEl);
  }

  const NUM_FRAMES = 3;
  const FRAMES_CLASSLIST = [];
  for (let i = 0; i < NUM_FRAMES; i++) {
    FRAMES_CLASSLIST.push(`show-frame-${i+1}`);
  }
  
  let topBound;
  let bottomBound;
  let targetElHeight;
  let scrollableHeight;
  let targetScrollHeight;
  let windowHeight;
  let frameHeight = 1;

  const determineBounds = function() {
    windowHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    targetElHeight = targetEl.clientHeight;
    targetScrollHeight = targetElHeight * NUM_FRAMES;
    scrollableHeight = targetScrollHeight - stickyItem.clientHeight + targetElHeight;
    topBound = stickyItem.offsetTop;
    bottomBound = topBound + scrollableHeight - windowHeight;
    frameHeight = Math.floor(targetElHeight / NUM_FRAMES);

    window.requestAnimationFrame(() => {
      stickyContainer.style.height = `${targetScrollHeight}px`;
    });
  }

  const NOT_YET_SCROLLING = 0;
  const SCROLLING = 1;
  const BEYOND_SCROLLING = 2;

  let currentState, prevState;
  const calculateStateChanges = function(y) {
    let changed = null;

    prevState = currentState;
    
    if (y < topBound) {
      currentState = NOT_YET_SCROLLING;
    } else if (y < bottomBound) {
      currentState = SCROLLING;
    } else {
      currentState = BEYOND_SCROLLING;
    }

    if (currentState !== prevState) {
      changed = {
        state: currentState
        , direction: prevState === undefined ? 0 : currentState - prevState
        , y
      };
    }

    return changed;
  }

  const applyChanges = function(changes) {
    if (changes.state === NOT_YET_SCROLLING) {
      stickyItem.setAttribute('data-scene-state', NOT_YET_SCROLLING);
    }
    if (changes.state === SCROLLING) {
      stickyItem.setAttribute('data-scene-state', SCROLLING);
      // if (changes.direction > 0) {
      //   stickyItem.style.top = '0';
      // }
      // if (changes.direction < 0) {
      //   stickyItem.style.top = `${windowHeight - targetElHeight}px`;
      // }
    }
    if (changes.state === BEYOND_SCROLLING) {
      stickyItem.setAttribute('data-scene-state', BEYOND_SCROLLING);
    }
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
      determineBounds();
    });
  });

  document.addEventListener('scroll', () => {
    const y = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    const changes = calculateStateChanges(y);

    if (changes) {
      applyChanges(changes);
    }

    if (currentState === SCROLLING) {
      window.requestAnimationFrame(() => {
        const shouldLoadFrame = Math.min(Math.floor((y - topBound) / frameHeight) + 1, NUM_FRAMES);
        loadFrame(shouldLoadFrame);
      });
    }
  });

  initElements();
  determineBounds();
}());

(function() {
  const controller = new ScrollMagic.Controller();

  new ScrollMagic.Scene({
    duration: 1280
    , offset: 20
  })
    .setPin('#integration-container')
    .addTo(controller);
}())
