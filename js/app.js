/**
 * @author mrdoob / http://mrdoob.com/
 */

// >>>><<<<
// setting global empty variables
let frame;
let cassette;
let pedal;
let smallGear;
let mediumGear;
let bigGear;
let frontBolts;
let whoosh;
let content;
whoosh = document.querySelector('audio');
content = document.querySelector('.content');
loadingAnimation = document.querySelector('#loading');
let animationPlayed = false;
let keyDown = false;
let baseRotation = 0;
let mouseXStart = 0;
let sceneIsRendered = false;

//setting animation timelines
let cameraMovement = new TimelineMax({
  paused: true,
});
let discMovement = new TimelineMax({
  paused: true
});
let discRotation = new TimelineMax({
  paused: true
});
let sceneRotation = new TimelineMax({
  paused: true
});
let contentShow = new TimelineMax({
  paused: true
});
let hideLoadingScreen = new TimelineMax({
  paused: true
});

// >>>><<<<


var APP = {

  Player: function() {

    var loader = new THREE.ObjectLoader();
    var camera,
      scene,
      renderer;

    var controls,
      effect,
      cameraVR,
      isVR;

    var events = {};
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    this.dom = document.createElement('div');

    this.width = 500;
    this.height = 500;

    this.load = function(json) {

      isVR = json.project.vr;

      renderer = new THREE.WebGLRenderer({
        antialias: true
      });
      renderer.setClearColor(0x000000);
      renderer.setPixelRatio(window.devicePixelRatio);

      if (json.project.gammaInput)
        renderer.gammaInput = true;
      if (json.project.gammaOutput)
        renderer.gammaOutput = true;

      if (json.project.shadows) {

        renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      }

      this.dom.appendChild(renderer.domElement);

      this.setScene(loader.parse(json.scene));
      this.setCamera(loader.parse(json.camera));

      events = {
        init: [],
        start: [],
        stop: [],
        keydown: [],
        keyup: [],
        mousedown: [],
        mouseup: [],
        mousemove: [],
        touchstart: [],
        touchend: [],
        touchmove: [],
        update: []
      };

      var scriptWrapParams = 'player,renderer,scene,camera';
      var scriptWrapResultObj = {};

      for (var eventKey in events) {

        scriptWrapParams += ',' + eventKey;
        scriptWrapResultObj[eventKey] = eventKey;

      }

      var scriptWrapResult = JSON.stringify(scriptWrapResultObj).replace(/\"/g, '');

      for (var uuid in json.scripts) {

        var object = scene.getObjectByProperty('uuid', uuid, true);

        if (object === undefined) {

          console.warn('APP.Player: Script without object.', uuid);
          continue;

        }

        var scripts = json.scripts[uuid];

        for (var i = 0; i < scripts.length; i++) {

          var script = scripts[i];

          var functions = (new Function(scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';').bind(object))(this, renderer, scene, camera);

          for (var name in functions) {

            if (functions[name] === undefined) continue;

            if (events[name] === undefined) {

              console.warn('APP.Player: Event type not supported (', name, ')');
              continue;

            }

            events[name].push(functions[name].bind(object));

          }

        }

      }

      dispatch(events.init, arguments);

      // >>>><<<<
      //setting elements
      const sceneElements = scene.children[0].children;

      sceneElements.forEach(function(element) {
        switch (element.name) {
          case 'frame':
            frame = element;
            break;
          case 'pedal':
            pedal = element;
            break;
          case 'gears':
            cassette = element;
            setCassette();
            break;
          default:
        }
      })

      function setCassette() {
        cassette.children.forEach(function(element) {
          switch (element.name) {
            case 'small-gear':
              smallGear = element;
              break;
            case 'medium-gear':
              mediumGear = element;
              break;
            case 'big-gear':
              bigGear = element;
              break;
            case 'bolts':
              frontBolts = element;
              break;
            default:
          }
        })
      }

      // setting timing of the timelines
      cameraMovement.to(camera.position, 2, {
        x: 3,
        y: 3,
        z: 4,
      }, 'start')
        .to(camera.rotation, 2, {
          y: 1.2,
        }, 'start')
        .add(contentShow.play(), 'start')
        .add(function() {
          bikeTransparant();
        }, 'start')
        .add(discMovement.play(), 'start+=1')

      discMovement.to(smallGear.position, 2, {
        z: 0.5,
      }, 'start')
        .to(smallGear.rotation, 2, {
          z: 1,
        }, 'start')
        .to(mediumGear.position, 2, {
          z: 1,
        }, 'start')
        .to(mediumGear.rotation, 2, {
          z: 2,
        }, 'start')
        .to(bigGear.position, 2, {
          z: 1.5,
        }, 'start')
        .to(bigGear.rotation, 2, {
          z: 3,
        }, 'start')
        .to(frontBolts.position, 2, {
          z: 2,
        }, 'start')
        .to(pedal.position, 2, {
          z: 3.5
        }, 'start')

      contentShow.to('.content', 1, {
        transform: 'translateX(0%)'
      }, 'start')
        .from('.header', 1, {
          height: 0,
          transform: 'translateY(-500px)'
        }, 'start')
        .from('h1', 0.5, {
          height: 0
        }, 'start+=1')
        .from('hr', 0.5, {
          width: 0
        }, "start+=1.5")
        .staggerFrom('p', 0.25, {
          opacity: 0,
          transform: 'translateX(-100px)'
        }, 0.2, 'start+=2')
        .from('.video-container', 0.25, {
          opacity: 0,
          transform: 'translateX(-100px)'
        }, 'start+=2.8')
        .to('button', 0.5, {
          transform: 'scale(1)'
        }, 'start+=3')


      function bikeTransparant() {
        if (animationPlayed) {
          changeTransparent(0.2);
        } else {
          changeTransparent(1);
        }
      }

      function changeTransparent(t) {
        frame.children.forEach(function(element) {
          element.material.transparent = true;
          TweenMax.to(element.material, 2, {
            opacity: t
          })
        });
      }
      // >>>><<<<

    };

    this.setCamera = function(value) {

      camera = value;
      camera.aspect = this.width / this.height;
      camera.updateProjectionMatrix();

      if (isVR === true) {

        cameraVR = new THREE.PerspectiveCamera();
        cameraVR.projectionMatrix = camera.projectionMatrix;
        camera.add(cameraVR);

        controls = new THREE.VRControls(cameraVR);
        effect = new THREE.VREffect(renderer);

        if (WEBVR.isAvailable() === true) {

          this.dom.appendChild(WEBVR.getButton(effect));

        }

        if (WEBVR.isLatestAvailable() === false) {

          this.dom.appendChild(WEBVR.getMessage());

        }

      }
      // >>>><<<<
      //setting camera position basis
      camera.position.x = 0;
      camera.position.y = 5;
      camera.position.z = 15;
      camera.rotation.x = 0;
      camera.rotation.y = 0;
      camera.rotation.z = 0;
    // >>>><<<<
    };

    this.setScene = function(value) {

      scene = value;

    };

    this.setSize = function(width, height) {

      this.width = width;
      this.height = height;

      if (camera) {

        camera.aspect = this.width / this.height;
        camera.updateProjectionMatrix();

      }

      if (renderer) {

        renderer.setSize(width, height);

      }

    };

    function dispatch(array, event) {

      for (var i = 0, l = array.length; i < l; i++) {

        array[i](event);

      }

    }

    var prevTime,
      request;

    function animate(time) {

      request = requestAnimationFrame(animate);

      try {

        dispatch(events.update, {
          time: time,
          delta: time - prevTime
        });

      } catch (e) {

        console.error((e.message || e), (e.stack || ""));

      }

      if (isVR === true) {

        camera.updateMatrixWorld();

        controls.update();
        effect.render(scene, cameraVR);

      } else {

        renderer.render(scene, camera);

        // loading animation checker
        if (!sceneIsRendered) {
          sceneIsRendered = !sceneIsRendered
          hideLoadingScreen.play();
        }
        hideLoadingScreen.to('#loading', 1, {
          opacity: 0,
          display: 'none'
        })
      // >>>><<<<
      }

      prevTime = time;
    }

    this.play = function() {

      document.addEventListener('keydown', onDocumentKeyDown);
      document.addEventListener('keyup', onDocumentKeyUp);
      document.addEventListener('mousedown', onDocumentMouseDown);
      document.addEventListener('mouseup', onDocumentMouseUp);
      document.addEventListener('mousemove', onDocumentMouseMove);
      document.addEventListener('touchstart', onDocumentTouchStart);
      document.addEventListener('touchend', onDocumentTouchEnd);
      document.addEventListener('touchmove', onDocumentTouchMove);

      dispatch(events.start, arguments);

      request = requestAnimationFrame(animate);
      prevTime = performance.now();

    };

    this.stop = function() {

      document.removeEventListener('keydown', onDocumentKeyDown);
      document.removeEventListener('keyup', onDocumentKeyUp);
      document.removeEventListener('mousedown', onDocumentMouseDown);
      document.removeEventListener('mouseup', onDocumentMouseUp);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      document.removeEventListener('touchstart', onDocumentTouchStart);
      document.removeEventListener('touchend', onDocumentTouchEnd);
      document.removeEventListener('touchmove', onDocumentTouchMove);

      dispatch(events.stop, arguments);

      cancelAnimationFrame(request);

    };

    this.dispose = function() {

      while (this.dom.children.length) {

        this.dom.removeChild(this.dom.firstChild);

      }

      renderer.dispose();

      camera = undefined;
      scene = undefined;
      renderer = undefined;

    };




    function onDocumentKeyDown(event) {

      dispatch(events.keydown, event);

    }

    function onDocumentKeyUp(event) {

      dispatch(events.keyup, event);

    }


    function onDocumentMouseDown(event) {
      keyDown = true;
      mouseXStart = event.pageX;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(scene.children[0].children[3].children);

      if (intersects.length > 0) {
        if (!animationPlayed) {
          TweenMax.to(scene.rotation, 1, {
            y: 0
          })
          cameraMovement.play();
          whoosh.play();
          animationPlayed = !animationPlayed
        } else {
          cameraMovement.reverse();
          animationPlayed = !animationPlayed
        }
      }

      dispatch(events.mousedown, event);

    }

    function onDocumentMouseUp(event) {
      baseRotation = scene.rotation.y
      keyDown = false;
      dispatch(events.mouseup, event);

    }

    function onDocumentMouseMove(event) {

      const middleOfScreen = window.innerWidth / 2;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(scene.children[0].children[3].children);

      intersects.length > 0 ? hover(1, 1, 1) : hover(0.64, 0.64, 0.64);

      function hover(r, g, b) {
        cassette.children.forEach(function(element) {
          element.material.color.r = r;
          element.material.color.g = g;
          element.material.color.b = b;
        });
      }

      if (keyDown && !animationPlayed) {
        let rotation = (event.pageX - mouseXStart) / window.innerWidth
        scene.rotation.y = baseRotation + rotation;
      }

      dispatch(events.mousemove, event);

    }

    function onDocumentTouchStart(event) {

      dispatch(events.touchstart, event);

    }

    function onDocumentTouchEnd(event) {

      dispatch(events.touchend, event);

    }

    function onDocumentTouchMove(event) {

      dispatch(events.touchmove, event);

    }

  }

};
// console.log(THREE);
//
// const timer = setInterval(function() {
//   if (THREE) return;
//   clearInterval(timer);
//   console.log("succes");
// }, 100);
