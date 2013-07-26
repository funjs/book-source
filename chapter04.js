var people = [{name: "Fred", age: 65}, {name: "Lucy", age: 36}];

_.max(people, function(p) { return p.age });

//=> {name: "Fred", age: 65}

function finder(valueFun, bestFun, coll) {
  return _.reduce(coll, function(best, current) {
    var bestValue = valueFun(best);
    var currentValue = valueFun(current);

    return (bestValue === bestFun(bestValue, currentValue)) ? best : current;
  });
}

function best(fun, coll) {
  return _.reduce(coll, function(x, y) {
    return fun(x, y) ? x : y;
  });
}

best(function(x,y) { return x > y }, [1,2,3,4,5]);
//=> 5

function repeat(times, VALUE) {
  return _.map(_.range(times), function() { return VALUE; });
}

repeat(4, "Major");
//=> ["Major", "Major", "Major", "Major"]

function repeatedly(times, fun) {
  return _.map(_.range(times), fun);
}

repeatedly(3, function() {
  return Math.floor((Math.random()*10)+1);
});
//=> [1, 3, 8]

function iterateUntil(fun, check, init) {
  var ret = [];
  var result = fun(init);

  while (check(result)) {
    ret.push(result);
    result = fun(result);
  }

  return ret;
};

function always(VALUE) {
  return function() {
    return VALUE;
  };
};

function invoker (NAME, METHOD) {
  return function(target /* args ... */) {
    if (!existy(target)) fail("Must provide a target");

    var targetMethod = target[NAME];
    var args = _.rest(arguments);

    return doWhen((existy(targetMethod) && METHOD === targetMethod), function() {
      return targetMethod.apply(target, args);
    });
  };
};

var rev = invoker('reverse', Array.prototype.reverse);

_.map([[1,2,3]], rev);
//=> [[3,2,1]]

function uniqueString(len) {
  return Math.random().toString(36).substr(2, len);
};

uniqueString(10);
//=> "3rm6ww5w0x"

function uniqueString(prefix) {
  return [prefix, new Date().getTime()].join('');
};

uniqueString("argento");
//=> "argento1356107740868"

function makeUniqueStringFunction(start) {
  var COUNTER = start;

  return function(prefix) {
    return [prefix, COUNTER++].join('');
  }
};

var uniqueString = makeUniqueStringFunction(0);

uniqueString("dari");
//=> "dari0"

uniqueString("dari");
//=> "dari1"

var generator = {
  count: 0,
  uniqueString: function(prefix) {
    return [prefix, this.count++].join('');
  }
};

generator.uniqueString("bohr");
//=> bohr0

generator.uniqueString("bohr");
//=> bohr1

var omgenerator = (function(init) {
  var COUNTER = init;

  return {
    uniqueString: function(prefix) {
      return [prefix, COUNTER++].join('');
    }
  };
})(0);

omgenerator.uniqueString("lichking-");
//=> "lichking-0"

var nums = [1,2,3,null,5];

_.reduce(nums, function(total, n) { return total * n });
//=> 0

function fnull(fun /*, defaults */) {
  var defaults = _.rest(arguments);

  return function(/* args */) {
    var args = _.map(arguments, function(e, i) {
      return existy(e) ? e : defaults[i];
    });

    return fun.apply(null, args);
  };
};

var safeMult = fnull(function(total, n) { return total * n }, 1, 1);

_.reduce(nums, safeMult);
//=> 30

function defaults(d) {
  return function(o, k) {
    var val = fnull(_.identity, d[k]);
    return o && val(o[k]);
  };
}

function doSomething(config) {
  var lookup = defaults({critical: 108});

  return lookup(config, 'critical');
}

doSomething({critical: 9});
//=> 9

doSomething({});
//=> 108

function checker(/* validators */) {
  var validators = _.toArray(arguments);

  return function(obj) {
    return _.reduce(validators, function(errs, check) {
      if (check(obj))
        return errs;
      else
        return _.chain(errs).push(check.message).value();
    }, []);
  };
}

function validator(message, fun) {
  var f = function(/* args */) {
    return fun.apply(fun, arguments);
  };

  f['message'] = message;
  return f;
}

function aMap(obj) {
  return _.isObject(obj);
}

var checkCommand = checker(validator("must be a map", aMap));

function hasKeys() {
  var KEYS = _.toArray(arguments);

  var fun = function(obj) {
    return _.every(KEYS, function(k) {
      return _.has(obj, k);
    });
  };

  fun.message = cat(["Must have values for keys:"], KEYS).join(" ");
  return fun;
}

var checkCommand = checker(validator("must be a map", aMap), hasKeys('msg', 'type'));
