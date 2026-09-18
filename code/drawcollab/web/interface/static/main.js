var data = {};
var resize;

function o(output) {
  console.log(output);
}

function fullScreen() {
  var elem = document.body; // Make the body go full screen.
  requestFullScreen(elem);
  document.getElementById("btn").remove();
}

function requestFullScreen(element) {
  // Supports most browsers and their versions.
  var requestMethod =
    element.requestFullScreen ||
    element.webkitRequestFullScreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullScreen;

  if (requestMethod) {
    // Native full screen.
    requestMethod.call(element);
  } else if (typeof window.ActiveXObject !== "undefined") {
    // Older IE.
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) {
      wscript.SendKeys("{F11}");
    }
  }

  resize();
}

function handleStart(event) {
  window.send({
    X: Math.max(0.0, Math.min(1.0, event.touches[0].clientX / data.x)),
    Y: 1.0 - Math.max(0.0, Math.min(1.0, event.touches[0].clientY / data.y))
  });
}

function handleMove(event) {
  window.send({
    X: Math.max(0.0, Math.min(1.0, event.touches[0].clientX / data.x)),
    Y: 1.0 - Math.max(0.0, Math.min(1.0, event.touches[0].clientY / data.y))
  });
}

/*
function handleEnd(event) {
  o("end touch");
}

function handleCancel(event) {
  o("cancel touch");
}
*/

(() => {
  o("starting app");

  var main = document.getElementById("main");

  main.addEventListener("touchstart", handleStart, false);
  main.addEventListener("touchmove", handleMove, false);
  // main.addEventListener("touchend", handleEnd, false);
  // main.addEventListener("touchcancel", handleCancel, false);
  resize = function() {
    o("resized");
    data.x = main.clientWidth;
    data.y = main.clientHeight;
  };

  resize();

  window.addEventListener("resize", resize);

  var socket = new WebSocket(`ws://${window.location.host}/socket`);

  window.send = function(data) {
    socket.send(JSON.stringify(data));
  };

  socket.onopen = function() {
    o("Status: Connected\n");
  };

  socket.onmessage = function(e) {
    o("Server: " + e.data);
  };

  socket.onclose = function() {
    o("Status: Closed\n");
  };

  socket.onerror = function(e) {
    o("Status: Error: " + e + "\n");
  };
})();
