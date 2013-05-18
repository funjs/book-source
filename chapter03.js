
function makeEmptyObject() {
  return new Object();
}

var globals = {};

function makeBindFun(resolver) {
  return function(k, v) {
    var stack = globals[k] || [];
    globals[k] = resolver(stack, v);
    return globals;
  };
}

var stackBinder = makeBindFun(function(stack, v) {
  stack.push(v);
  return stack;
});

var stackUnbinder = makeBindFun(function(stack) {
  stack.pop();
  return stack;
});

var dynamicLookup = function(k) {
  var slot = globals[k] || [];
  return _.last(slot);
};

function f() { return dynamicLookup('a'); };
function g() { stackBinder('a', 'g'); return f(); };

f();
//=> 1

g();
//=> 'g'

globals;
// {a: [1, "g"], b: [100]}

function strangeIdentity(n) {
  // intentionally strange
  for(var i=0; i<n; i++);
  return i;
}

strangeIdentity(138);
//=> 138

function strangeIdentity(n) {
  var i;
  for(i=0; i<n; i++);
  return i;
}

function strangerIdentity(n) {
  // intentionally stranger still
  for(this['i'] = 0; this['i']<n; this['i']++);
  return this['i'];
}

strangerIdentity(108);
//=> 108

function createScaleFunction(FACTOR) {
  return function(v) {
    return _.map(v, function(n) {
      return (n * FACTOR);
    });
  };
}

var scale10 = createScaleFunction(10);

scale10([1,2,3]);
//=> [10, 20, 30]

function createWeirdScaleFunction(FACTOR) {
  return function(v) {
    this['FACTOR'] = FACTOR;
    var captures = this;

    return _.map(v, _.bind(function(n) {
      return (n * this['FACTOR']);
    }, captures));
  };
}

var scale10 = createWeirdScaleFunction(10);

scale10.call({}, [5,6,7]);
//=> [50, 60, 70];

function makeAdder(CAPTURED) {
  return function(free) {
    return free + CAPTURED;
  };
}

var add10 = makeAdder(10);

add10(32);
//=> 42

function averageDamp(FUN) {
  return function(n) {
    return average([n, FUN(n)]);
  }
}

var averageSq = averageDamp(function(n) { return n * n });
averageSq(10);
//=> 55

function complement(PRED) {
  return function() {
    return !PRED.apply(null, _.toArray(arguments));
  };
}

function isEven(n) { return (n%2) === 0 }

var isOdd = complement(isEven);

isOdd(2);
//=> false

isOdd(413);
//=> true

function plucker(FIELD) {
  return function(obj) {
    return (obj && obj[FIELD]);
  };
}

var best = {title: "Infinite Jest", author: "DFW"};

var getTitle = plucker('title');

getTitle(best);
//=> "Infinite Jest"

var books = [{title: "Chthon"}, {stars: 5}, {title: "Botchan"}];

var third = plucker(2);

third(books);
//=> {title: "Botchan"}
