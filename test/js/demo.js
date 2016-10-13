// demo
var mySubscriber1 = function (msg, data) {
  console.log('1', msg, data);
};
var mySubscriber2 = function (msg, data) {
  console.log('2', msg, data);
};
var mySubscriber3 = function (msg, data) {
  console.log('3', msg, data);
};
var obser = new zsyObserver();
obser.one('h1', mySubscriber1);
obser.on('h1', mySubscriber2);
obser.emit('h1', {
  msg: 'hello world!'
});
obser.emit('h1', {
  msg: 'hello world!'
});
