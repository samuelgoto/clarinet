var fs             = require('fs')
  , clarinet       = require('../clarinet.js')
  , npm_stream     = clarinet.createStream()
  , twitter_stream = clarinet.createStream()
  , assert         = require('assert')
  ;

class Parser {
  constructor() {
    this.parser = clarinet.parser();
    this.parser.onerror = this.onerror.bind(this);
    this.parser.onvalue = this.onvalue.bind(this);
    this.parser.onopenobject = this.onopenobject.bind(this);
    this.parser.onkey = this.onkey.bind(this);
    this.parser.oncloseobject = this.oncloseobject.bind(this);
    this.parser.onopenarray = this.onopenarray.bind(this);
    this.parser.onclosearray = this.onclosearray.bind(this);
    this.parser.onend = this.onend.bind(this);
    this.key = undefined;
  }
  top() {
    return this.stack[this.stack.length - 1];
  }
  onerror(e) {
    console.log(`error ${e}`);
  };
  onvalue(value) {
    if (!this.top().array) {
      this.top().root[this.key] = value;
    } else {
      this.top().root[this.key].push(value);
    }
  }
  onopenobject(key) {
    let obj = {
      root: {}
    };
    if (this.stack.length == 0) {
      // If we are at the bottom of the stack ...
      this.stack.push(obj);
    } else {
      // Else, we are recursevily opening a new object ...
      if (!this.top().array) {
	this.top().root[this.key] = obj.root;
      } else {
	this.top().root[this.key].push(obj.root);
      }
      this.stack.push(obj);
    }

    this.key = key;
    // console.log(`open ${key}: ${JSON.stringify(this.stack)}`);
  }
  onkey(key) {
    // console.log(`key ${key} on ${JSON.stringify(this.stack)}`);
    this.key = key;
  }
  oncloseobject() {
    // console.log(`closeing ${JSON.stringify(this.stack)}`);
    let node = this.stack.pop();
    // console.log(`closed ${JSON.stringify(this.stack)}`);
    // console.log(`closed ${JSON.stringify(this.current)}`);
  }
  onopenarray() {
    this.top().array = true;
    this.top().root[this.key] = [];
  }
  onclosearray() {
    this.top().array = false;
  }
  onend() {
  }
  parse(data) {
    let root = {root: {}};
    this.stack = [root];
    this.key = "root";
    this.parser.write(data).close();
    let result = this.stack.pop().root.root;
    // console.log(JSON.stringify(result));
    return result;
  }
}

describe.only('docscript', function() {
  describe('basic', function() {
    it('simplest', function() {
      let result = new Parser().parse(`{"foo": "bar"}`);
      assert.deepEqual(result, {
	"foo": "bar"
      });
    });

    it('2 levels', function() {
      let result = new Parser().parse(`{"foo": { "hello": "bar" } }`);
      assert.deepEqual(result, {
	"foo": {
	  "hello": "bar"
	}
      });
    });

    it('arrays', function() {
      let result = new Parser().parse(`{"a": [1, 2]}`);
      assert.deepEqual(result, {
	"a": [1, 2]
      });
    });

    it('arrays of objects', function() {
      let result = new Parser().parse(`{"a": [{"b": 2}] }`);
      assert.deepEqual(result, {
	"a": [{"b": 2}]
      });
    });

    it('popping', function() {
      let result = new Parser().parse(`{
        "a": {
          "b": "c"
        },
        "d": 1
      }`);
      assert.deepEqual(result, {
	a: {
	  b: "c"
	},
	d: 1
      });
    });

    it('complicated', function() {
      let result = new Parser().parse(`{
        "foo": "bar",
        "hello": "world",
        "children": {
          "a": "b",
          "c": 1,
          "d": {
            "e": "f",
            "foo": [1, 2, 3, {"bar": 1, "hey": [1, 2, 3]}]
          },
          "g": "h",
          "i": {
            "j": "k"
          }
        }
      }`);
      assert.deepEqual(result, {
        foo: "bar",
	hello: "world",
	children: {
	  a: "b",
	  c: 1,
	  d: {
	    e: "f",
	    foo: [1, 2, 3, {bar: 1, hey: [1, 2, 3]}]
	  },
	  g: "h",
	  i: {
	    j: "k"
	  }
	}
      });
    });
  });
});
