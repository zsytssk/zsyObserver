/*
  Game:> 游戏
    competitors:> 比赛双方 array
      personA
      personB
    ball:> 球
    round:> 回合
    goals:> 球门

    proto:> 方法
      ...

  Round:> 回合
    activePerson:  // 激活的人
    layout:
      left: personA
      right: personB
    proto:> 方法
      ...
*/

var Game = cc.Class.extend({
  ball: null,
  step: 0,
  round: null,
  roundNumber: 0,
  maxRoundNumber: 0,
  goals: null,
  competitors: null,
  spaceStatus: '',
  status: '',
  _hookCallback: null,
  ctor: function () {
    var self = this;
    self.goals = [];
    self.competitors = [];

    self.spaceStatus = ''; // 物理引擎的状态

    /*
      游戏状态
      waitBegin|等待开始 paused|暂停 onGoing|开始 ended|结束
    */
    self.status = 'waitBegin';
    /*
      在物理引擎状态改变的时, 会触发很多的操作
      比如:
        hookSpaceUpdateAfter: [] space update之后执行
        hookSpaceStatusChangeAfter: [] space status 改变之后执行
        hookBallMoveAfter: 在球运动之后执行 用来处理球的运动效果
        hookKickBefore: 踢球之前
    */
    self._hookCallback = {};

    self.init();
  },
  init: function () {
    // 初始化game
    var self = this;
    self.initBall();
    self.initcompetitors();
    self.initRound();
    self.initGoal();
    self.hookSpaceReadyAfter(self.begin.bind(self), 2);
    self.hookSpaceStatusChangeAfter(self.toggleStatus.bind(self));
  },
  toggleStatus: function (status) {
    // 根据 space 的status
    var self = this;
    self.spaceStatus = status;
  },
  begin: function () {
    var self = this;
    self.status = 'onGoing';
  },
  initBall: function () {
    var self = this;
    var configBall = cc.extend({
      sprite: null,
      game: self
    }, g_ballConfig);
    self.ball = new Ball(configBall);
  },
  initcompetitors: function () {
    // 初始化比赛双方
    var self = this;
    var configA = cc.extend({
      position: 'left',
      game: self
    }, g_personAConfig);
    self.competitors.push(new Person(configA));

    var configB = cc.extend({
      position: 'right',
      game: self
    }, g_personBConfig);
    self.competitors.push(new Person(configB));
  },
  initRound: function () {
    var self = this;
    var roundConfig = {};
    roundConfig.competitors = {
      left: self.competitors[0],
      right: self.competitors[1]
    };
    roundConfig.activeDirection = 'left';
    roundConfig.game = self;
    self.round = new Round(roundConfig); // 初始化回合
  },
  initGoal: function () {
    var self = this;
    var goalLeftConfig = cc.extend({
      direction: 'left',
      position: {
        x: g_goalConfig.width / 2,
        y: g_groundConfig.height / 2,
      }
    }, g_goalConfig);
    var goalRightConfig = cc.extend({
      direction: 'right',
      position: {
        x: g_groundConfig.width - g_goalConfig.width / 2,
        y: g_groundConfig.height / 2,
      }
    }, g_goalConfig);
    self.goals.push(new Goal(goalLeftConfig)); // 左球门
    self.goals.push(new Goal(goalRightConfig)); // 右球门
  },
  // game 需要什么方法
  getStatus: function () {
    var self = this;
    return self.status;
  },
  setStatus: function (status) {
    var self = this;
    self.status = status;
  },
  getStep: function () {
    var self = this;
    return self.step;
  },
  updateStep: function () {
    var self = this;
    self.step += 1;
  },
  getAllMembers: function () {
    var self = this;
    var members = [];
    for (var i = 0; i < self.competitors.length; i++) {
      var person = self.competitors[i];
      members = members.concat(person.members);
    }
    return members;
  },
  getActivePerson: function () {
    var self = this;
    for (var i = 0; i < self.competitors.length; i++) {
      var person = self.competitors[i];
      if (person.status === 'active') {
        return person;
      }
    }
  },
  getRoundNumber: function () {
    var self = this;
    return self.RoundNumber;
  },
  updateRoundNumber: function () { // 更新回合数
    var self = this;
    self.roundNumber += 1;
    for (var i = 0; i < self.competitors.length; i++) {
      var competitor = self.competitors[i];
      if (competitor.getWinTimes > self.maxRoundNumber / 2) {
        competitor.victory = true;
        self.win();
      }
    }
  },
  getSpaceStatus: function () {
    var self = this;
    return self.spaceStatus;
  },
  win: function () {
    // 游戏输赢的处理
  },
  hookKickBefore: function (callback, index) {
    var self = this;
    self._hookFunc('KickBefore', 'subscribe', callback, index);
  },
  hookSpaceReadyAfter: function (callback, index) {
    var self = this;
    self._hookFunc('SpaceReadyAfter', 'subscribe', callback, index);
  },
  hookSpaceUpdateAfter: function (callback, index) {
    // space update之后触发
    var self = this;
    self._hookFunc('SpaceUpdateAfter', 'subscribe', callback, index);
  },
  hookSpaceStatusChangeAfter: function (callback, index) {
    // space 的status 改变时触发 带一个参数 status: active sleep
    var self = this;
    self._hookFunc('SpaceStatusChangeAfter', 'subscribe', callback, index);
  },
  hookRoundWinAfter: function (callback, index) {
    // space 的status 改变时触发 带一个参数 status: active sleep
    var self = this;
    self._hookFunc('RoundWinAfter', 'subscribe', callback, index);
  },
  _hookFunc: function (scope, type, callback, index) {
    // _hookCallback[SpaceStatusChangeAfter][subscribe][0]
    // index 是设置整个的执行次序的 index 越大执行越靠后
    var self = this;
    if (!self._hookCallback[scope]) {
      self._hookCallback[scope] = {};
    }
    if (!self._hookCallback[scope][type]) {
      self._hookCallback[scope][type] = [];
    }
    var scopeArr = self._hookCallback[scope][type];
    if (!index) {
      // 如果没有index 直接插入最前面
      scopeArr.unshift(callback);
      return;
    }
    callback.index = index;
    if (scopeArr.length === 0) {
      // 如果 是空数组 直接插入最前面
      scopeArr.unshift(callback);
      return;
    }
    for (var len = scopeArr.length, i = len - 1; i >= 0; i--) {
      // 从后往前遍历 如果 callback index 不小于 第i个index
      // 将callback插入到 i+1
      if (!scopeArr[i].index || index >= scopeArr[i].index) {
        scopeArr.splice(i + 1, 0, callback);
        return false;
      }
    }
    // 如果callbackindex 小于其中
    // 将callback插入到 i+1
    scopeArr.unshift(callback);
    return;
  }
});

var Round = cc.Class.extend({
  activeDirection: 'left',
  competitors: null,
  game: null,
  status: '',
  winMark: '',
  ctor: function (config) {
    var self = this;

    self.activeDirection = config.activeDirection; // active person 所属方向
    self.competitors = config.competitors; // 布局
    self.game = config.game; // 布局

    self.init();
  },
  // round 需要什么方法
  init: function () {
    var self = this;
    var game = self.game;
    self.setActive(this.activeDirection);
    game.hookSpaceStatusChangeAfter(self.toggleActive.bind(self));
  },
  setActive: function (name) { // 设置球权
    var self = this;
    for (var key in self.competitors) {
      if (key === name) {
        self.competitors[key].setStatus('active');
        self.activeDirection = key;
      } else {
        self.competitors[key].setStatus('disabled');
      }
    }
  },
  toggleActive: function (status) { // 重设 球权
    // bug
    var self = this;
    if (self.game.getStatus() !== 'onGoing') {
      // 如果游戏不是开始状态
      return;
    }
    if (status === 'active') {
      return false;
    }

    self.game.updateStep(); // 更新步数
    if (!self.getWinMark()) {
      // 没有输赢
      // 更换 当前 person
      for (var key in self.competitors) {
        self.competitors[key].toggleStatus();
        if (self.competitors[key].getStatus() === 'active') {
          self.activeDirection = key;
        }
      }
      return true;
    }
    self.win();
  },

  reset: function (winDirection) {
    // 当一个person进球了 需要重设所有的位置
    // 下次发球的是输的一方
    var self = this;
    for (var key in self.competitors) { // reset all person
      self.competitors[key].reset();
      if (key !== winDirection) {
        self.setActive(key); // 设置赢球的competitor 为下一次发球者
      }
    }
    self.game.ball.reset();
  },
  updateRoundNumber: function () {
    var self = this;
    self.game.updateRoundNumber();
  },
  setWinMark: function (mark) {
    // @ques 是否可以用game.status 直接就可以解决
    // 赢球之后会设置 球 球员 sleep 触发 spaceStatusChange
    // 输赢标记 用来防止 toggleActive 冲掉
    var self = this;
    self.winMark = mark;
  },
  getWinMark: function () {
    var self = this;
    return self.winMark;
  },
  win: function (goal) {
    // 回合输赢的处理
    // 如果达到回合数, 就调用game win
    var self = this;
    var direction = self.getWinMark();
    self.updateRoundNumber(); // 更新局次数
    for (var key in self.competitors) { // reset all person
      if (key !== direction) {
        self.competitors[key].updateWinTimes();
        self.reset(key);
        alert(key + ' win');
      }
    }
    self._hookWinAfter();
    self.setWinMark('');
  },
  _hookWinAfter: function () {
    // space 更新 执行这个函数
    var self = this;
    var hookCallBack = self.game._hookCallback;
    if (!hookCallBack.RoundWinAfter ||
      !hookCallBack.RoundWinAfter.subscribe ||
      !hookCallBack.RoundWinAfter.subscribe.length
    ) {
      return false;
    }
    hookCallBack.RoundWinAfter.subscribe.forEach(function (fnc) {
      fnc();
    });
  },
  getStatus: function () {
    var self = this;
    return self.status;
  },
  setStatus: function (status) {
    var self = this;
    self.status = status;
  }
});


var Goal = cc.Class.extend({
  type: '',
  direction: '',
  height: 0,
  width: 0,
  collisiontype: 0,
  beginPos: null,
  body: null,
  ctor: function (config) {
    var self = this;
    self.init();
    self.type = config.type;
    self.height = config.height;
    self.width = config.width;
    self.direction = config.direction;
    self.collisiontype = config.collisiontype;
    self.beginPos = config.position;
  },
  // 球门需要什么方法
  init: function () {
    var self = this;
  },
  drawSprite: function () {
    var self = this;
  },
  getPos: function () {
    var self = this;
    if (self.body) { // 如果已经有刚体了 返回刚体的位置
      return self.body.getPos();
    } else { // 刚体在创建的时候, 需要定义的位置
      var pos = cp.v(self.beginPos.x, self.beginPos.y);
      return pos;
    }
  },
  setPos: function (pos) {
    // 控制位置
    var self = this;
    if (!self.body) {
      return false;
    }
    self.body.setPos(pos);
  },
  reset: function () {
    // 球门需要reset吗??
  }
});

var Ball = cc.Class.extend({
  type: '',
  radius: 0,
  friction: 0,
  elasticity: 0,
  density: 0,
  mass: 0,
  collisiontype: 0,
  maxSpeed: 0,
  spriteImgs: null,
  beginPos: null,
  game: null,
  body: null,
  ctor: function (config) {
    var self = this;
    self.type = config.type;
    self.radius = config.radius;
    self.friction = config.friction;
    self.elasticity = config.elasticity;
    self.density = config.density;
    self.mass = config.mass;
    self.collisiontype = config.collisiontype;
    self.maxSpeed = config.maxSpeed;
    self.spriteImgs = config.spriteImgs;
    self.beginPos = config.beginPos;
    self.game = config.game;
    self.init();
  },
  init: function () {
    var self = this;
  },
  kick: function () { // 踢球的处理
    var self = this;
    if (!self.body) {
      return false;
    }
  },
  drawSprite: function () {
    var self = this;
  },
  getPos: function () {
    var self = this;
    if (self.body) { // 如果已经有刚体了 返回刚体的位置
      return self.body.getPos();
    } else { // 刚体在创建的时候, 需要定义的位置
      var pos = cp.v(self.beginPos.x, self.beginPos.y);
      return pos;
    }
  },
  setPos: function (pos) {
    // 控制位置
    var self = this;
    if (!self.body) {
      return false;
    }
    self.body.setPos(pos);
  },
  sleepBody: function () {
    var self = this;

    self.body.space.addPostStepCallback(function () {
      self.body.sleep();
    });
  },
  reset: function () {
    // 一局结束 重置
    var self = this;
    var pos = cp.v(self.beginPos.x, self.beginPos.y);
    self.setPos(pos);
    self.sleepBody();
  }
});

var Person = cc.Class.extend({
  id: '',
  team: null,
  position: '',
  game: null,
  members: null,
  winTimes: 0,
  victory: false,
  status: '',
  ctor: function (config) {
    var self = this;
    self.id = config.id;
    self.team = config.team;
    self.position = config.position;
    self.game = config.game;
    self.members = [];
    self.init();
  },
  init: function () {
    var self = this;
    self.initMembers();
  },
  initMembers: function () {
    var self = this;
    for (var i = 0; i < self.team.layout.length; i++) {
      var config = cc.extend({
        person: self,
        spriteImgs: self.team.memberSpriteImgs,
        index: i,
        name: g_memberConfig.type + i,
        game: self.game,
        beginPos: self.team.layout[i],
      }, g_memberConfig);
      self.members.push(new Member(config));
    }
  },
  toggleStatus: function () {
    // 显示当前状态 就是嘴外面的那个圆圈
    var self = this;
    if (self.status === 'active') {
      self.setStatus('disabled');
    } else {
      self.setStatus('active');
    }
    self.toggleMemberStatus();
  },
  toggleMemberStatus: function () {
    // toggle member 样式
    var self = this;
    for (var i = 0; i < self.members.length; i++) {
      var member = self.members[i];
    }
  },
  setStatus: function (status) {
    var self = this;
    self.status = status;
  },
  getStatus: function () {
    var self = this;
    return self.status;
  },
  updateWinTimes: function () {
    var self = this;
    self.winTimes += 1;
  },
  getWinTimes: function () {
    var self = this;
    return self.winTimes += 1;
  },
  reset: function () {
    // 一局结束 重置 所有队员
    var self = this;
    for (var i = 0; i < self.members.length; i++) {
      self.members[i].reset();
    }
  }
});

// 创建游戏选手:> 队员
var Member = cc.Class.extend({
  name: '',
  person: null,
  spriteImgs: null,
  sprite: null,
  index: 0,
  beginPos: null,
  body: null,
  type: '',
  radius: 0,
  friction: 0,
  elasticity: 0,
  density: 0,
  mass: 0,
  collisiontype: 0,
  maxSpeed: 0,
  game: null,
  ctor: function (config) {
    var self = this;
    self.name = config.name;
    self.person = config.person; //
    self.spriteImgs = config.spriteImgs; // 精灵样式 图片
    self.index = config.index; // 索引
    self.beginPos = config.beginPos; // 初始位置
    self.type = config.type;
    self.radius = config.radius;
    self.friction = config.friction;
    self.elasticity = config.elasticity;
    self.density = config.density;
    self.mass = config.mass;
    self.collisiontype = config.collisiontype;
    self.maxSpeed = config.maxSpeed;
    self.game = config.game;
    self.init();
  },
  init: function () {
    var self = this;
  },
  drawSprite: function () {
    var self = this;
  },
  getPos: function () {
    var self = this;
    if (self.body) { // 如果已经有刚体了 返回刚体的位置
      return self.body.getPos();
    } else { // 刚体在创建的时候, 需要定义的位置
      var pos = cp.v(self.beginPos.x, self.beginPos.y);
      return pos;
    }
  },
  setPos: function (pos) {
    // 控制位置
    var self = this;
    if (!self.body) {
      return false;
    }
    self.body.setPos(pos);
  },
  updateSpritePos: function () {
    var self = this;
    if (!self.body) {
      return false;
    }
    var pos = self.body.getPos();
    self.sprite.x = pos.x;
    self.sprite.y = pos.y;
  },
  sleepBody: function () {
    var self = this;

    // self.body.space.addPostStepCallback(function () {
    //   // 直接调用 body.sleep() 会出错
    //   self.body.sleep();
    // });
  },
  detectActive: function () {
    var self = this;
    return self.person.getStatus();
  },
  setCurStatus: function (status) {
    var self = this;
    if (!self.sprite) {
      return false;
    }
    self.sprite.cur.visible = status;
  },
  kick: function (force) {
    var self = this;
    self.body.applyImpulse(force, {
      x: 0,
      y: 0
    });
  },
  reset: function () {
    // 一局结束 重置
    var self = this;
    var pos = cp.v(self.beginPos.x, self.beginPos.y);
    self.setPos(pos);
    self.sleepBody();
  }
});
