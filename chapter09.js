
function lazyChain(obj) {
  var calls = [];

  return {
    invoke: function(methodName /* args */) {
      var args = _.rest(arguments);

      calls.push(function(target) {
        var meth = target[methodName];

        return meth.apply(target, args);
      });

      return this;
    },
    force:  function() {
      return _.reduce(calls, function(ret, thunk) {
        return thunk(ret);
      }, obj);
    }
  };
}

function deferredSort(ary) {
  return lazyChain(ary).invoke('sort');
}

var deferredSorts = _.map([[2,1,3], [7,7,1], [0,9,5]], deferredSort);

//=> [<thunk>, <thunk>, <thunk>]

function force(thunk) {
  return thunk.force();
}

var validateTriples  = validator(
  "Each array should have three elements",
  function (arrays) {
    return _.every(arrays, function(a) {
      return a.length === 3;
    });
  });

var validateTripleStore = partial1(condition1(validateTriples), _.identity);

function postProcess(arrays) {
  return _.map(arrays, second);
}

function processTriples(data) {
  return pipeline(data
           , JSON.parse
           , validateTripleStore
           , deferredSort
           , force
           , postProcess
           , invoker('sort', Array.prototype.sort)
           , str);
}

var reportDataPackets = _.compose(
  function(s) { $('#result').text(s) },
  processTriples);

function polyToString(obj) {
  if (obj instanceof String)
    return obj;
  else if (obj instanceof Array)
    return stringifyArray(obj);

  return obj.toString();
}

function stringifyArray(ary) {
  return ["[", _.map(ary, polyToString).join(","), "]"].join('');
}

var polyToString = dispatch(
  function(s) { return _.isString(s) ? s : undefined },
  function(s) { return _.isArray(s) ? stringifyArray(s) : undefined },
  function(s) { return _.isObject(s) ? JSON.stringify(s) : undefined },
  function(s) { return s.toString() });

Container.prototype.toString = function() {
  return ["@<", polyToString(this._value), ">"].join('');
}

function ContainerClass() {}
function ObservedContainerClass() {}
function HoleClass() {}
function CASClass() {}
function TableBaseClass() {}

ObservedContainerClass.prototype = new ContainerClass();
HoleClass.prototype = new ObservedContainerClass();
CASClass.prototype = new HoleClass();
TableBaseClass.prototype = new HoleClass();

var ContainerClass = Class.extend({
  init: function(val) {
    this._value = val;
  },
});

var c = new ContainerClass(42);

c;
//=> {_value: 42 ...}

c instanceof Class;
//=> true

var ObservedContainerClass = ContainerClass.extend({
  observe: function(f) { note("set observer") },
  notify: function() { note("notifying observers") }
});

var HoleClass = ObservedContainerClass.extend({
  init: function(val) { this.setValue(val) },
  setValue: function(val) {
    this._value = val;
    this.notify();
    return val;
  }
});

var CASClass = HoleClass.extend({
  swap: function(oldVal, newVal) {
    if (!_.isEqual(oldVal, this._value)) fail("No match");

    return this.setValue(newVal);
  }
});

function Container(val) {
  this._value = val;
  this.init(val);
}

Container.prototype.init = _.identity;

var HoleMixin = {
  setValue: function(newValue) {
    var oldVal  = this._value;

    this.validate(newValue);
    this._value = newValue;
    this.notify(oldVal, newValue);
    return this._value;
  }
};

var Hole = function(val) {
  Container.call(this, val);
}

var ObserverMixin = (function() {
  var _watchers = [];

  return {
    watch: function(fun) {
      _watchers.push(fun);
      return _.size(_watchers);
    },
    notify: function(oldVal, newVal) {
      _.each(_watchers, function(watcher) {
        watcher.call(this, oldVal, newVal);
      });

      return _.size(_watchers);
    }
  };
}());

var ValidateMixin = {
  addValidator: function(fun) {
    this._validator = fun;
  },
  init: function(val) {
    this.validate(val);
  },
  validate: function(val) {
    if (existy(this._validator) &&
        !this._validator(val))
      fail("Attempted to set invalid value " + polyToString(val));
  }
};

_.extend(Hole.prototype
         , HoleMixin
         , ValidateMixin
         , ObserverMixin);

var SwapMixin = {
  swap: function(fun /* , args... */) {
    var args = _.rest(arguments)
    var newValue = fun.apply(this, construct(this._value, args));

    return this.setValue(newValue);
  }
};

var SnapshotMixin = {
  snapshot: function() {
    return deepClone(this._value);
  }
};

_.extend(Hole.prototype
         , HoleMixin
         , ValidateMixin
         , ObserverMixin
         , SwapMixin
         , SnapshotMixin);

var CAS = function(val) {
  Hole.call(this, val);
}

var CASMixin = {
  swap: function(oldVal, f) {
    if (this._value === oldVal) {
      this.setValue(f(this._value));
      return this._value;
    }
    else {
      return undefined;
    }
  }
};

_.extend(CAS.prototype
         , HoleMixin
         , ValidateMixin
         , ObserverMixin
         , SwapMixin
         , CASMixin
         , SnapshotMixin);

function contain(value) {
  return new Container(value);
}

function hole(val /*, validator */) {
  var h = new Hole();
  var v = _.toArray(arguments)[1];

  if (v) h.addValidator(v);

  h.setValue(val);

  return h;
}

var swap = invoker('swap', Hole.prototype.swap);

function cas(val /*, args */) {
  var h = hole.apply(this, arguments);
  var c = new CAS(val);
  c._validator = h._validator;

  return c;
}

var compareAndSwap = invoker('swap', CAS.prototype.swap);

function snapshot(o) { return o.snapshot() }
function addWatcher(o, fun) { o.watch(fun) }
