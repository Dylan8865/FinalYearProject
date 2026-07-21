mergeInto(LibraryManager.library, {
  QuboPostMessage: function (messagePointer) {
    if (window.parent === window) {
      return;
    }

    var message = UTF8ToString(messagePointer);
    window.parent.postMessage(JSON.parse(message), '*');
  }
});
