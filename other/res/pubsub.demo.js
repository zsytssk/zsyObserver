var mySubscriber = function (msg, data) {
  console.log(msg, data);
};

// subscribe
var token = PubSub.subscribe('MY TOPIC', mySubscriber);


// publish
PubSub.publish('MY TOPIC', 'hello world!');
PubSub.publishSync('MY TOPIC', 'hello world!');

// unsubscribe
PubSub.unsubscribe(token);
PubSub.unsubscribe(mySubscriber);

// scope
PubSub.subscribe('a', myFunc1);
PubSub.subscribe('a.b', myFunc2);
PubSub.subscribe('a.b.c', myFunc3);
PubSub.unsubscribe('a.b');

// clear
PubSub.clearAllSubscriptions();
