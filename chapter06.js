
function myLength(ary) {
  if (_.isEmpty(ary))
    return 0;
  else
    return 1 + myLength(_.rest(ary));
}

function cycle(times, ary) {
  if (times <= 0)
    return [];
  else
    return cat(ary, cycle(times - 1, ary));
}

var zipped1 = [['a', 1]];

function constructPair(pair, rests) {
  return [construct(_.first(pair), _.first(rests)),
          construct(second(pair),  second(rests))];
}

constructPair(['a', 1],
  constructPair(['b', 2],
    constructPair(['c', 3], [[],[]])));

//=> [['a','b','c'],[1,2,3]]

function unzip(pairs) {
  if (_.isEmpty(pairs)) return [[],[]];

  return constructPair(_.first(pairs), unzip(_.rest(pairs)));
}

var influences = [
  ['Lisp', 'Smalltalk'],
  ['Lisp', 'Scheme'],
  ['Smalltalk', 'Self'],
  ['Scheme', 'JavaScript'],
  ['Scheme', 'Lua'],
  ['Self', 'Lua'],
  ['Self', 'JavaScript']];

function nexts(graph, node) {
  if (_.isEmpty(graph)) return [];

  var pair = _.first(graph);
  var from = _.first(pair);
  var to   = second(pair);
  var more = _.rest(graph);

  if (_.isEqual(node, from))
    return construct(to, nexts(more, node));
  else
    return nexts(more, node);
}

function depthSearch(graph, nodes, seen) {
  if (_.isEmpty(nodes)) return rev(seen);

  var node = _.first(nodes);
  var more = _.rest(nodes);

  if (_.contains(seen, node))
    return depthSearch(graph, more, seen);
  else
    return depthSearch(graph,
                       cat(nexts(graph, node), more),
                       construct(node, seen));
}

function tcLength(ary, n) {
  var l = n ? n : 0;

  if (_.isEmpty(ary))
    return l;
  else
    return tcLength(_.rest(ary), l + 1);
}

tcLength(_.range(10));
//=> 10

function andify(/* preds */) {
  var preds = _.toArray(arguments);

  return function(/* args */) {
    var args = _.toArray(arguments);

    var everything = function(ps, truth) {
      if (_.isEmpty(ps))
        return truth;
      else
        return _.every(args, _.first(ps))
               && everything(_.rest(ps), truth);
    };

    return everything(preds, true);
  };
}

function orify(/* preds */) {
  var preds = _.toArray(arguments);

  return function(/* args */) {
    var args = _.toArray(arguments);

    var something = function(ps, truth) {
      if (_.isEmpty(ps))
        return truth;
      else
        return _.some(args, _.first(ps))
               || something(_.rest(ps), truth);
    };

    return something(preds, false);
  };
}

function evenSteven(n) {
  if (n === 0)
    return true;
  else
    return oddJohn(Math.abs(n) - 1);
}

function oddJohn(n) {
  if (n === 0)
    return false;
  else
    return evenSteven(Math.abs(n) - 1);
}

function flat(ary) {
  if (_.isArray(ary))
    return cat.apply(cat, _.map(ary, flat));
  else
    return [ary];
}

function deepClone(obj) {
  if (!existy(obj) || !_.isObject(obj))
    return obj;

  var temp = new obj.constructor();
  for (var key in obj)
    if (obj.hasOwnProperty(key))
      temp[key] = deepClone(obj[key]);

  return temp;
}

function visit(mapFun, resultFun, ary) {
  if (_.isArray(ary))
    return resultFun(_.map(ary, mapFun));
  else
    return resultFun(ary);
}

function postDepth(fun, ary) {
  return visit(partial1(postDepth, fun), fun, ary);
}

function preDepth(fun, ary) {
  return visit(partial1(preDepth, fun), fun, fun(ary));
}

function influencedWithStrategy(strategy, lang, graph) {
  var results = [];

  strategy(function(x) {
    if (_.isArray(x) && _.first(x) === lang)
      results.push(second(x));

    return x;
  }, graph);

  return results;
}

function evenOline(n) {
  if (n === 0)
    return true;
  else
    return partial1(oddOline, Math.abs(n) - 1);
}

function oddOline(n) {
  if (n === 0)
    return false;
  else
    return partial1(evenOline, Math.abs(n) - 1);
}

function trampoline(fun /*, args */) {
  var result = fun.apply(fun, _.rest(arguments));

  while (_.isFunction(result)) {
    result = result();
  }

  return result;
}

function isEvenSafe(n) {
  if (n === 0)
    return true;
  else
    return trampoline(partial1(oddOline, Math.abs(n) - 1));
}

function isOddSafe(n) {
  if (n === 0)
    return false;
  else
    return trampoline(partial1(evenOline, Math.abs(n) - 1));
}

function generator(seed, current, step) {
  return {
    head: current(seed),
    tail: function() {
      console.log("forced");
      return generator(step(seed), current, step);
    }
  };
}

function genHead(gen) { return gen.head }
function genTail(gen) { return gen.tail() }

var ints = generator(0, _.identity, function(n) { return n+1 });

function genTake(n, gen) {
  var doTake = function(x, g, ret) {
    if (x === 0)
      return ret;
    else
      return partial(doTake, x-1, genTail(g), cat(ret, genHead(g)));
  };

  return trampoline(doTake, n, gen, []);
}

function asyncGetAny(interval, urls, onsuccess, onfailure) {
  var n = urls.length;

  var looper = function(i) {
    setTimeout(function() {
      if (i >= n) {
        onfailure("failed");
        return;
      }

      $.get(urls[i], onsuccess)
        .always(function() { console.log("try: " + urls[i]) })
        .fail(function() {
          looper(i + 1);
        });
    }, interval);
  }

  looper(0);
  return "go";
}

var groupFrom = curry2(_.groupBy)(_.first);
var groupTo   = curry2(_.groupBy)(second);

function influenced(graph, node) {
  return _.map(groupFrom(graph)[node], second);
}
