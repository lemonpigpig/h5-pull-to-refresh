(function() {

  var pageList = new PageList('app-root');
  var $items = $('.items');

  pageList.onTopPull = function() {
    console.warn('top refresh');
    setTimeout(function() {
      this.endPull();
      $items.html('');
      for (var i = 0; i < 10; i++) {
        $items.append('<li>THIS IS PULL UP DOWN DEMO ' + i + '!</li>');
      }
    }.bind(this), 3000);
  };

  pageList.onBottomPull = function() {
    console.warn('bottom refresh');
    setTimeout(function() {
      this.endPull();
      for (var i = 0; i < 10; i++) {
        $items.append('<li>THIS IS PULL UP DOWN DEMO ' + i + '!</li>');
      }
    }.bind(this), 3000);
  };

  pageList.addScrollListener();

}());