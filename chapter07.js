
var rand = partial1(_.random, 1);

function randString(len) {
  var ascii = repeatedly(len,  partial1(rand, 26));

  return _.map(ascii, function(n) {
    return n.toString(36);
  }).join('');
}

PI = 3.14;

function areaOfACircle(radius) {
  return PI * sqr(radius);
}

areaOfACircle(3);
//=> 28.26

function generateRandomCharacter() {
  return rand(26).toString(36);
}

function generateString(charGen, len) {
  return repeatedly(len, charGen).join('');
}

var composedRandomString = partial1(generateString, generateRandomCharacter);

composedRandomString(10);
//=> "j18obij1jc"

var a = [1, [10, 20, 30], 3];

var secondTwice = _.compose(second, second);

second(a) === secondTwice(a);
//=> false

function skipTake(n, coll) {
  var ret = [];
  var sz = _.size(coll);

  for(var index = 0; index < sz; index += n) {
    ret.push(coll[index]);
  }

  return ret;
}

function summ(ary) {
  var result = 0;
  var sz = ary.length;

  for (var i = 0; i < sz; i++)
    result += ary[i];

  return result;
}

summ(_.range(1,11));
//=> 55

function summRec(ary, seed) {
  if (_.isEmpty(ary))
    return seed;
  else
    return summRec(_.rest(ary), _.first(ary) + seed);
}

summRec([], 0);
//=> 0

summRec(_.range(1,11), 0);
//=> 55

function deepFreeze(obj) {
  if (!Object.isFrozen(obj))
    Object.freeze(obj);

  for (var key in obj) {
    if (!obj.hasOwnProperty(key) || !_.isObject(obj[key]))
      continue;

    deepFreeze(obj[key]);
  }
}

var freq = curry2(_.countBy)(_.identity);

function merge(/*args*/) {
  return _.extend.apply(null, construct({}, arguments));
}

function Point(x, y) {
  this._x = x;
  this._y = y;
}

Point.prototype = {
  withX: function(val) {
    return new Point(val, this._y);
  },
  withY: function(val) {
    return new Point(this._x, val);
  }
};

function Queue(elems) {
  this._q = elems;
}

Queue.prototype = {
  enqueue: function(thing) {
    return new Queue(cat(this._q, [thing]));
  }
};

var SaferQueue = function(elems) {
  this._q = _.clone(elems);
}

SaferQueue.prototype = {
  enqueue: function(thing) {
    return new SaferQueue(cat(this._q, [thing]));
  }
};

function queue() {
  return new SaferQueue(_.toArray(arguments));
}

var q = queue(1,2,3);

var enqueue = invoker('enqueue', SaferQueue.prototype.enqueue);

enqueue(q, 42);
//=> {_q: [1, 2, 3, 42]}

function Container(init) {
  this._value = init;
};

Container.prototype = {
  update: function(fun /*, args */) {
    var args = _.rest(arguments);
    var oldValue = this._value;

    this._value = fun.apply(this, construct(oldValue, args));

    return this._value;
  }
};

var aNumber = new Container(42);

aNumber.update(function(n) { return n + 1 });
//=> 43

aNumber;
//=> {_value: 43}
