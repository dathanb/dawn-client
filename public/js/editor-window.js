var normalizeLineEndings = function (str) {
  return str.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
};

var isReadOnly = function (cmd) {
  return (cmd == "none" || !cmd);
};

function doUpload(socket, uploadCommand, uploadData) {
  var uploadSegments = normalizeLineEndings(uploadData.trim()).split("\r\n");
  socket.emit('input', uploadCommand, function (state) {
    setTimeout(function () {
      uploadDataSegments(socket, uploadSegments);
    }, 100);
  });
}

// Given a websocket and an array of upload data, recursively upload each data line as a separate emission
function uploadDataSegments(socket, uploadData) {
  if (uploadData.length > 0) {
    socket.emit('input', uploadData[0], function (state) {
      uploadDataSegments(socket, uploadData.slice(1));
    });
  } else {
    socket.emit('input', '.'); // emit the terminator, and don't worry about doing anything after
  }
}

$(document).ready(function () {

  var data = window.editorData;
  if (data == null) {
    data = {'editorName': 'Scratch', 'uploadCommand': 'none', 'buffer': ''};
  }

  var uploadCommand = data.uploadCommand;
  var editorName = data.editorName;
  var buffer = data.buffer.trim();
  var initialValue = buffer;

  var cta = $('button.upload');
  var abort = $('button.abort');
  var basicEditor = $('div.editor textarea');

  if (verbEditor != null) {
    verbEditor.setValue(buffer);
    initialValue = verbEditor.getValue();
  } else if (basicEditor != null && basicEditor.length > 0) {
    basicEditor.text(buffer);
    initialValue = basicEditor.val();
  }

  // initial setup
  document.title = (isReadOnly(uploadCommand) ? 'Viewing ' : 'Editing ') + editorName;
  cta.html(uploadCommand);

  // upload button
  if (cta && cta.length >= 1) {
    cta.click(function () {
      if (isReadOnly(uploadCommand)) {
        return;
      }

      //alert(editor.val());
      //var socket = window.uploadSocket;
      var socket = window.parentWindow.getSocket();
      var uploadData = '';
      if (verbEditor != null) {
        uploadData = verbEditor.getValue();
      } else {
        uploadData = basicEditor.val();
      }

      doUpload(socket, uploadCommand, uploadData);
    });
  }

  // abort or close button
  if (abort && abort.length >= 1) {
    abort.on('click', function () {
      var val = (verbEditor != null ? verbEditor.getValue() : basicEditor.val());
      if (val == initialValue || window.confirm('Abort editing and lose your changes?')) {
        window.close();
      }
    });
  }
});
