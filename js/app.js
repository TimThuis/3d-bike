/**
 * @author mrdoob / http://mrdoob.com/
 */

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

    function onDocumentKeyDown(event) {
      switch (event.key) {
        case 's':
          camera.position.x = 0;
          camera.position.y = 5;
          camera.position.z = 15;
          camera.rotation.x = 0;
          camera.rotation.y = 0;
          camera.rotation.z = 0;
          // scene.children[0].position.x = -1.2;
          // scene.children[0].position.z = -2;
          break;
        default:
          console.log(event.key);
      }

      dispatch(events.keydown, event);

    }

    function onDocumentKeyUp(event) {

      dispatch(events.keyup, event);

    }

    alert("use s to reset the frame and click on the gear cassette to start the animation");

    function onDocumentMouseDown(event) {
      const frame = scene.children[0].children[1];
      const cassette = scene.children[0].children[3];
      const padel = scene.children[0].children[2];
      const smallGear = cassette.children[1];
      const mediumGear = cassette.children[2];
      const bigGear = cassette.children[4];
      const frontBolts = cassette.children[0];

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(scene.children[0].children[3].children);

      if (intersects.length > 0) {
        cameraMovement.play();
        bikeColor();
      }

      sceneRotation.to(scene.rotation, 8, {
        y: '8'
      })

      cameraMovement.to(camera.position, 2, {
        x: 3.5,
        y: 3,
        z: 5,
      }, 'start')
        .to(camera.rotation, 2, {
          y: 1,
        }, 'start')
        .add(discMovement.play(), 'start+=1')
        .add(discRotation.play(), 'start+=1')

      discMovement.to(smallGear.position, 2, {
        z: 0.5,
      }, 'start')
        .to(mediumGear.position, 2, {
          z: 1,
        }, 'start')
        .to(bigGear.position, 2, {
          z: 1.5,
        }, 'start')
        .to(frontBolts.position, 2, {
          z: 2,
        }, 'start')
        .to(padel.position, 2, {
          z: 3.5
        }, 'start')

      discRotation.to(cassette.rotation, 2, {
        z: 2
      }, "start")

      function bikeColor() {
        frame.children.forEach(function(element) {
          element.material.transparent = true;
          TweenMax.to(element.material, 2, {
            opacity: 0.2
          })
        });
      }

      dispatch(events.mousedown, event);

    }

    function onDocumentMouseUp(event) {

      dispatch(events.mouseup, event);

    }

    function onDocumentMouseMove(event) {

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
