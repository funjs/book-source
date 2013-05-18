
function createPerson() {
  var firstName = "";
  var lastName = "";
  var age = 0;

  return {
    setFirstName: function(fn) {
      firstName = fn;
      return this;
    },
    setLastName: function(ln) {
      lastName = ln;
      return this;
    },
    setAge: function(a) {
      age = a;
      return this;
    },
    toString: function() {
      return [firstName, lastName, age].join(' ');
    }
  };
}

createPerson()
  .setFirstName("Mike")
  .setLastName("Fogus")
  .setAge(108)
  .toString();

//=> "Mike Fogus 108"

var TITLE_KEY = 'titel';

// ... a whole bunch of code later

_.chain(library)
 .pluck(TITLE_KEY)
 .sort()
 .value();

//=> [undefined, undefined, undefined]

function LazyChain(obj) {
  this._calls  = [];
  this._target = obj;
}

LazyChain.prototype.invoke = function(methodName /*, args */) {
  var args = _.rest(arguments);

  this._calls.push(function(target) {
    var meth = target[methodName];

    return meth.apply(target, args);
  });

  return this;
};

LazyChain.prototype.force = function() {
  return _.reduce(this._calls, function(target, thunk) {
    return thunk(target);
  }, this._target);
};

LazyChain.prototype.tap = function(fun) {
  this._calls.push(function(target) {
    fun(target);
    return target;
  });

  return this;
}

function LazyChainChainChain(obj) {
  var isLC = (obj instanceof LazyChain);

  this._calls  = isLC ? cat(obj._calls, []) : [];
  this._target = isLC ? obj._target : obj;
}

LazyChainChainChain.prototype = LazyChain.prototype;

var longing = $.Deferred();

function go() {
  var d = $.Deferred();

  $.when("")
   .then(function() {
     setTimeout(function() {
       console.log("sub-task 1");
     }, 5000)
   })
   .then(function() {
     setTimeout(function() {
       console.log("sub-task 2");
     }, 10000)
   })
   .then(function() {
     setTimeout(function() {
       d.resolve("done done done done");
     }, 15000)
   })

  return d.promise();
}

function pipeline(seed /*, args */) {
  return _.reduce(_.rest(arguments),
                  function(l,r) { return r(l); },
                  seed);
};

function fifth(a) {
  return pipeline(a
    , _.rest
    , _.rest
    , _.rest
    , _.rest
    , _.first);
}

function negativeFifth(a) {
  return pipeline(a
    , fifth
    , function(n) { return -n });
}

negativeFifth([1,2,3,4,5,6,7,8,9]);
//=> -5

function firstEditions(table) {
  return pipeline(table
    , function(t) { return as(t, {ed: 'edition'}) }
    , function(t) { return project(t, ['title', 'edition', 'isbn']) }
    , function(t) { return restrict(t, function(book) {
        return book.edition === 1;
      });
    });
}

var RQL = {
  select: curry2(project),
  as: curry2(as),
  where: curry2(restrict)
};

function allFirstEditions(table) {
  return pipeline(table
    , RQL.as({ed: 'edition'})
    , RQL.select(['title', 'edition', 'isbn'])
    , RQL.where(function(book) {
      return book.edition === 1;
    }));
}

function actions(acts, done) {
  return function (seed) {
    var init = { values: [], state: seed };

    var intermediate = _.reduce(acts, function (stateObj, action) {
      var result = action(stateObj.state);
      var values = cat(stateObj.values, [result.answer]);

      return { values: values, state: result.state };
    }, init);

    var keep = _.filter(intermediate.values, existy);

    return done(keep, intermediate.state);
  };
};

function mSqr() {
  return function(state) {
    var ans = sqr(state);
    return {answer: ans, state: ans};
  }
}

var doubleSquareAction = actions(
  [mSqr(),
   mSqr()],
  function(values) {
    return values;
});

doubleSquareAction(10);
//=> [100, 10000]

function mNote() {
  return function(state) {
    note(state);
    return {answer: undefined, state: state};
  }
}

function mNeg() {
  return function(state) {
    return {answer: -state, state: -state};
  }
}

var negativeSqrAction = actions([mSqr(), mNote(), mNeg()],
  function(_, state) {
    return state;
  });

function lift(answerFun, stateFun) {
  return function(/* args */) {
    var args = _.toArray(arguments);

    return function(state) {
      var ans = answerFun.apply(null, construct(state, args));
      var s = stateFun ? stateFun(state) : ans;

      return {answer: ans, state: s};
    };
  };
};

var mSqr2  = lift(sqr);
var mNote2 = lift(note, _.identity);
var mNeg2  = lift(function(n) { return -n });

var negativeSqrAction2 = actions([mSqr2(), mNote2(), mNeg2()],
  function(_, state) {
    return state;
  });

var push = lift(function(stack, e) { return construct(e, stack) });

var pop = lift(_.first, _.rest);

var stackAction = actions([
  push(1),
  push(2),
  pop()
  ],
  function(values, state) {
    return values;
  });
