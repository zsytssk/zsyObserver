/*
  api像jquery 一样的简单明了
*/
(function (root) {
  function hasKeys(obj) {
    var key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        return true;
      }
    }
    return false;
  }

  function injectEle(arr, ele) {
    var index = ele.index;
    /*
      从后往前遍历 如果 func index 不小于 第i个index
      将func插入到 i+1
    */
    for (var len = arr.length, i = len - 1; i >= 0; i--) {
      if (!arr[i].index || index >= arr[i].index) {
        arr.splice(i + 1, 0, ele);
        return true;
      }
    }
    /*
      如果 是空数组 || 比第一个元素index还小
      直接插入最前面
    */
    arr.unshift(ele);
  }

  function zsyObserver() {
    var self = this;
    self.kookFuncs = {};
    self.treeLevelSign = '::';
    self.init();
  }
  zsyObserver.prototype = {
    init: function () {
      var self = this;
    },
    emit: function (cmd, data) {
      var self = this;
      var kookFuncs = self.kookFuncs;
      if (!self.hasBinded(cmd)) {
        return false;
      }
      kookFuncs[cmd].forEach(function (func) {
        func(cmd, data);
      });
      self.treePass(self.emit, cmd, data);
    },
    on: function (cmd, func, index) {
      var self = this;
      var kookFuncs = self.kookFuncs;
      if (typeof func !== 'function') {
        return false;
      }
      if (!kookFuncs.hasOwnProperty(cmd)) {
        kookFuncs[cmd] = [];
      }
      if (!index) {
        index = 0;
      }
      func.index = index;
      injectEle(kookFuncs[cmd], func);
    },
    off: function (cmd, func) {
      var self = this;
      var kookFuncs = self.kookFuncs;
      if (!self.hasBinded(cmd)) {
        return false;
      }
      var hook_index = kookFuncs[cmd].indexOf(func);
      if (hook_index != -1) {
        kookFuncs[cmd].splice(hook_index, 1);
      }
      self.treePass(self.off, cmd, func);
    },
    clear: function (cmd) {
      var self = this;
      var kookFuncs = self.kookFuncs;
      if (!self.hasBinded(cmd)) {
        return false;
      }
      delete kookFuncs[cmd];
    },
    clearAll: function () {
      var self = this;
      self.kookFuncs = {};
    },
    treePass: function (obser_func, cmd, callback_func) {
      /*
        传递命令
        eg: h1 --> h1::h2, 如果没有 h1::h2 寻找找 h1::h2::h3
        一级一级传递
      */
      var self = this;
      var kookFuncs = self.kookFuncs;
      var treeLevelSign = self.treeLevelSign;
      var closetChildList = [];
      for (var key in kookFuncs) {
        var index = traceTree(key, cmd);
        if (index !== 0) {
          injectEle(closetChildList, {
            cmd: key,
            index: index
          });
        }
      }
      if (closetChildList.length === 0) {
        return false;
      }

      closetChildList.forEach(function (item) {
        obser_func.bind(self)(item.cmd, callback_func);
      });

      function traceTree(childCmd, parentCmd) {
        // 判断childCmd在命令树种最靠近parentCmd, 没有中间层
        if (childCmd.indexOf(parentCmd + treeLevelSign) === -1) {
          return 0;
        }
        // 如果在kookFuncs中有 parentCmd 的子类 且是 childCmd 的父类
        for (var key in kookFuncs) {
          if (key.indexOf(parentCmd + treeLevelSign) !== -1 && childCmd.indexOf(key + treeLevelSign) !== -1) {
            return 0;
          }
        }
        // index 让 h1::h2 h1::h3::h4之前传递
        return indexOfGene(childCmd, parentCmd);
      }

      function indexOfGene(childCmd, parentCmd) {
        var index = 0;
        var treeLevelSign = self.treeLevelSign;
        index = childCmd.split(treeLevelSign).length - parentCmd.split(treeLevelSign).length;
        return index;
      }
    },
    hasBinded: function (cmd) {
      var self = this;
      var kookFuncs = self.kookFuncs;
      var treeLevelSign = self.treeLevelSign;

      var found = Boolean(kookFuncs.hasOwnProperty(cmd) && hasKeys(kookFuncs[cmd])),
        position = cmd.lastIndexOf(treeLevelSign);

      while (!found && position !== -1) {
        cmd = cmd.substr(0, position);
        position = cmd.lastIndexOf(treeLevelSign);
        found = Boolean(kookFuncs.hasOwnProperty(cmd) && hasKeys(kookFuncs[cmd]));
      }

      return found;
    }
  };
  root.zsyObserver = zsyObserver;
}((typeof window === 'object' && window) || this));
