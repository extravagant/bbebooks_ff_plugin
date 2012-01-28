var bbebooks_by_isbn = (function() {

/*
 * Yes, I am aware of the preferences API,
 * No, I do not have the energy to use it for now.
 */
  let _debug = true;

  let BASE_URL =
    'http://bbebooks.co.cc'
    // 'http://127.0.0.1:8000'
    +'/search.php?format=EPUB&keyword=';

  let _nativeJSON = Components
    .classes["@mozilla.org/dom/json;1"]
    .createInstance(Components.interfaces.nsIJSON);

  let _prompter = Components
    .classes["@mozilla.org/embedcomp/prompt-service;1"]
    .getService(Components.interfaces.nsIPromptService);

  let _consoleService = Components
    .classes["@mozilla.org/consoleservice;1"]
    .getService(Components.interfaces.nsIConsoleService);


  var myself = {

init: function() {
window.addEventListener("load", bbebooks_by_isbn.onLoad, false);
},

onLoad: function() {
  let contextMenu = document.getElementById("contentAreaContextMenu");
  if (contextMenu) {
      contextMenu.addEventListener("popupshowing",
          bbebooks_by_isbn.showOrHidePopup, false);
  }
},

showOrHidePopup: function (evt) {
  let menuItem = document.getElementById( "bbebooks_by_isbn_menuitem" );
  menuItem.hidden = !(gContextMenu.isTextSelected);
},

showSelection: function() {
  let selection = document.commandDispatcher.focusedWindow.getSelection();
  if (_debug) {
    _consoleService.logStringMessage(
        'showSelection#selection="'+selection+'"');
  }
  let ajax = new XMLHttpRequest();
  let _url = BASE_URL + window.escape(selection);
  ajax.open("POST", _url );
  _consoleService.logStringMessage('URL='+_url);
  ajax.setRequestHeader('Content-Type',
        'application/x-www-form-urlencoded; charset="UTF-8"');
  ajax.setRequestHeader('Content-Length','0');
  ajax.onreadystatechange = function() {
      if (4 != ajax.readyState) return;
      if (200 != ajax.status) {
        _prompter.alert(window, 'warning',
            'bbeBooks Service returned '+ajax.status+' instead of 200 OK');
        return;
      }
      let jsontxt = ajax.responseText;
      if (_debug) {
        _consoleService.logStringMessage('DEBUG:JSON='+jsontxt);
      }
      let obj;
      try {
        obj = _nativeJSON.decode( jsontxt );
      } catch (ex) {
        _consoleService.logStringMessage('JSON='+jsontxt);
        _prompter.alert(window, 'error',
            'Unable to decode JSON: '+ex.message);
        return;
      }
      bbebooks_by_isbn.showBookInfo( obj );
    }
    // launch
    ajax.send();
},

showBookInfo: function (bookObj) {
  try {
    bbebooks_by_isbn.addBookInfoToPage( bookObj );
  } catch (ex) {
    _prompter.alert(window, 'error',
      'Unable to manipulate page DOM: '+ex.message);
    return;
  }
},

addBookInfoToPage: function (bookObj) {
/*
 * it turns out, this only means a single result came back;
 * the go/no-go is below, with RequestIsValid
  if (! bookObj.Completed) {
    _prompter.alert(window, 'error',
      'JSON request did not complete');
    return;
  }
*/
  let pageWin = gBrowser.contentWindow;
  let pageDoc = gBrowser.contentDocument;
  let pageBody = pageDoc.getElementsByTagName('body')[0];
  let myDiv = pageDoc.createElement('div');
  let my_id = 'bbebooks_by_isbn_'+bookObj.RequestID;
  myDiv.setAttribute('id', my_id );
  myDiv.style.top = (pageWin.pageYOffset + 25) + 'px';
  myDiv.style.left = '25px';
  myDiv.style.position = 'absolute';
  myDiv.style.zIndex = '999999';
  myDiv.style.backgroundColor = '#c0c0c0';

  if ((bookObj.Error != '')
  || ('True' != bookObj.RequestIsValid)) {
    let pre_ = pageDoc.createElement('pre');
    pre_.appendChild( pageDoc.createTextNode( bookObj.Error ));
    pageBody.appendChild( myDiv );
    return;
  }
  let resultCount = parseInt( bookObj.ResultCount );
  for (var i=0; i < resultCount; i++) {
    let bookItem = bookObj.Items[i];

    let tab_ = pageDoc.createElement('table');
    let cap_ = pageDoc.createElement('caption');
    cap_.appendChild( pageDoc.createTextNode( 'Book Info - ' ) );
    let a_ = pageDoc.createElement('a');
    a_.setAttribute('href','#');
    a_.appendChild( pageDoc.createTextNode( '[X]' ) );
    a_.addEventListener('click',
        function(evt) {
          myDiv.parentNode.removeChild( myDiv );
          return true;
        }, false);
    cap_.appendChild( a_ );
    tab_.appendChild( cap_ );

    for (var k in bookItem) {
      let tr_ = pageDoc.createElement('tr');
      let td_k = pageDoc.createElement('td');
      let td_v = pageDoc.createElement('td');
      td_k.appendChild( pageDoc.createTextNode( k ) );
      td_v.appendChild( pageDoc.createTextNode( ''+bookItem[k] ) );
      tr_.appendChild( td_k );
      tr_.appendChild( td_v );
      tab_.appendChild( tr_ );
    }
    myDiv.appendChild( tab_ );
  }
  pageBody.appendChild( myDiv );
},

  };
  return myself;
})();

// Action!
bbebooks_by_isbn.init();
