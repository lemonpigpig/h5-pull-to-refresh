// Swipe组件
var Swipe = (function() {

  //偏移步长
  var step = 20;

  var touch = {};
  var down = 'touchstart';
  var move = 'touchmove';
  var up = 'touchend';
  if (!('ontouchstart' in window)) {
    down = 'mousedown';
    move = 'mousemove';
    up = 'mouseup';
  }

  function getSwipeParams(x1, x2, y1, y2, sensibility) {
    var _x = Math.abs(x1 - x2);
    var _y = Math.abs(y1 - y2);
    var dir = _x >= _y ? (x1 - x2 > 0 ? 'left' : 'right') : (y1 - y2 > 0 ? 'up' : 'down');
    var dist = _x >= _y ? _x : _y;

    if (sensibility) {
      if (dir == 'left' || dir == 'right') {
        if ((_y / _x) > sensibility) {
          dir = '';
        }
        dist = _x * sensibility;
      } else if (dir == 'up' || dir == 'down') {
        if ((_x / _y) > sensibility) {
          dir = '';
        }
        dist = _y * sensibility;
      }
    }
    return {
      direction: dir,
      distance: dist,
    };
  }

  /**
   * 手指滑动函数, 这个函数在Android表现不行，``需要重构``
   * @method $.swipe
   * @param {object} el DOM对象
   * @param {string} dir 方向, left, right, up, down
   * @param {function} fn 回调函数
   * @param {function|boolean} preventDefault 是否不阻止事件冒泡
   * @param {number} sensibility 设置灵敏度，值为0-1
   * @param {number} stepSet 设置步长
   * @example
   * $.swipe(el, 'left', function() {}); // 这样注册后会阻止页面向上向下滚动
   * $.swipe(el, 'left', function() {}, true); // 这样不阻止了，但是andriod事件也不能监听了
   */
  function swipe(el, dir, fn, preventDefault, sensibility, stepSet) {
    if (!el) {
      return;
    }
    var _dir = '',
      _dist = 0,
      _step = stepSet || step;

    /*
     这里原来的逻辑是绑定几次swipe便会执行几次，这里做一次优化
     */
    el['swipe_' + dir] = fn;
    if (el.bindedEvent) {
      return;
    }
    el.bindedEvent = true;

    el.addEventListener(down, (function(e) {
      var pos = (e.touches && e.touches[0]) || e;
      touch.x1 = pos.pageX;
      touch.y1 = pos.pageY;

    }).bind(this));
    el.addEventListener(move, (function(e) {
      var pos = (e.touches && e.touches[0]) || e;
      touch.x2 = pos.pageX;
      touch.y2 = pos.pageY;

      if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > _step) ||
        (touch.y2 && Math.abs(touch.y1 - touch.y2) > _step)) {
        var params = getSwipeParams(touch.x1, touch.x2, touch.y1, touch.y2, sensibility);
        _dir = params.direction;
        _dist = params.distance;
      }
      var preventDefultFlag = typeof preventDefault == 'function' ? preventDefault(_dir, _dist) : preventDefault;
      console.log('preventDefultFlag', preventDefultFlag);
      if (preventDefultFlag) {
        // 阻止鼠标移动时view跟随鼠标滚动的默认行为
        e.preventDefault();
      }
    }).bind(this));
    el.addEventListener(up, (function(e) {
      var pos = (e.changedTouches && e.changedTouches[0]) || e;
      touch.x2 = pos.pageX;
      touch.y2 = pos.pageY;

      if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > _step) ||
        (touch.y2 && Math.abs(touch.y1 - touch.y2) > _step)) {
        var params = getSwipeParams(touch.x1, touch.x2, touch.y1, touch.y2, sensibility);
        _dir = params.direction;
        _dist = params.distance;

        if (typeof el['swipe_' + _dir] == 'function') {
          el['swipe_' + _dir](_dir, _dist);
        }
      } else {
        if (typeof el['swipe_tap'] == 'function') {
          el['swipe_tap']();
        }
      }
      touch = {};
    }).bind(this));
  }

  /**
   * 注销手指滑动函数
   * @method $.destroy
   * @param {object} el DOM对象
   * @example
   * $.destroy(el);
   */
  function destroy(el) {
    if (!el) {
      return;
    }

    ['down', 'move', 'up'].forEach(function(event) {
      el.removeEventListener(event);
    }.bind(this));

    if (el.bindedEvent) {
      delete el.bindedEvent;
    }

    ['left', 'right', 'up', 'down'].forEach(function(event) {
      if (el['flip_' + event]) {
        delete el['flip_' + event];
      }
    }.bind(this));
  }

  return {
    swipe,
    destroy
  };
})();

// 获取页面滚动信息
var getPageScrollPos = function() {
  var left = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft),
    top = Math.max(document.documentElement.scrollTop, document.body.scrollTop),
    height = Math.min(document.documentElement.clientHeight, document.body.clientHeight),
    width = Math.min(document.documentElement.clientWidth, document.body.clientWidth),
    pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  return {
    top: top,
    left: left,
    height: height,
    width: width,
    pageWidth: pageWidth,
    pageHeight: pageHeight
  };
};

// 上下拉组件
var PageList = (function() {

  return function(el) {
    this.el = document.getElementById(el);

    this.isLoading = false;
    this.refreshLoading = null;

    /**
     * 增加页面滚动事件
     */
    this.addScrollListener = function() {
      this.isLoading = false;

      var self = this;
      /**
       * 当滚动条位于顶部时, 下拉操作时出发
       * @method cPageList#onTopPull
       */
      if (this.onTopPull) {
        Swipe.swipe(this.el, 'down', function(dir, dist) {
          console.log(dir, dist);
          var pos = getPageScrollPos();
          if (pos.top <= 0 && !self.isLoading) {
            self.isLoading = true;
            if (self.onTopPull) {
              self.showTopLoading();
              self.onTopPull();
            }
          }
        }, function(dir, dist) {
          var pos = getPageScrollPos();
          return dir == 'down' && pos.top <= 0;
        }, 0, 5);
      }

      if (this.onBottomPull) {
        Swipe.swipe(this.el, 'up', function(dir, dist) {
          var pos = getPageScrollPos();
          var h = pos.pageHeight - (pos.top + pos.height);
          if ((h == 0 || h <= 10) && !self.isLoading) {
            self.isLoading = true;
            if (self.onBottomPull) {
              self.showBottomLoading();
              self.onBottomPull();
            }
          }
        }, function(dir, dist) {
          var pos = getPageScrollPos();
          var h = pos.pageHeight - (pos.top + pos.height);
          return dir == 'up' && h <= 0;
        }, 0, 5);
      }

    };
    /**
     * 移除页面滚动事件
     */
    this.removeScrollListener = function() {
      if (this.refreshLoading) {
        this.refreshLoading.remove();
        this.refreshLoading = null;
      }
      Swipe.destroy(this.el);
    };

    /**
     * 通知本次下拉操作完成,在不使用默认的showLoading是,需调用endPull
     */
    this.endPull = function() {
      this.isLoading = false;
      this.hideRefreshLoading();
    };
    /**
     * 在当前list顶部显示loading
     * @param {dom} [listRoot] list的根节点,如果不指定,默认会选当前页面的第一个select 元素
     */
    this.showTopLoading = function() {
      $(this.el).before(this.getLoading());
      this.refreshLoading.show();
    };
    /**
     * 在当前list底部显示loading
     */
    this.showBottomLoading = function() {
      //保证每次bottomload在最下面
      $(this.el).append(this.getLoading());
      this.refreshLoading.show();
    };
    /**
     * 隐藏loading图标
     */
    this.hideRefreshLoading = function() {
      if (this.refreshLoading) {
        this.refreshLoading.hide();
      }
      this.isLoading = false;
    };
    /**
     * 活动默认的loading图标
     * @returns {null|*}
     */
    this.getLoading = function() {
      if (!this.refreshLoading) {
        this.refreshLoading = $(
          '<div class="pullloading">' +
          '  <div class="loading">' +
          '    <span class="loading-p1"></span>' +
          '    <span class="loading-p2"></span>' +
          '    <span class="loading-p3"></span>' +
          '  </div>' +
          '</div>');
      }
      return this.refreshLoading;
    };

  };

}());