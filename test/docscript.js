var fs             = require('fs')
  , clarinet       = require('../clarinet.js')
  , npm_stream     = clarinet.createStream()
  , twitter_stream = clarinet.createStream()
  , assert         = require('assert')
  ;

// return;

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
    // this.top[this.key] = value;
    // this.top[this.key] = value;
    if (!this.top().array) {
      this.top().root[this.key] = value;
      // this.current = value;
    } else {
      //console.log("this is an array!!");
      //console.log(`value ${this.key}=${value}: ${JSON.stringify(this.stack)}`);
      //console.log(`${JSON.stringify(this.top().root)}`);
      this.top().root[this.key].push(value);
    }
    // console.log(`value ${this.key}=${value}: ${JSON.stringify(this.stack)}`);
  }
  onopenobject(key) {
    // this.top[this.key] = {};
    // this.top = {};
    // let obj = {};
    // top()
    let obj = {
      root: {}
    };
    if (this.stack.length == 0) {
      // If we are at the bottom of the stack ...
      this.stack.push(obj);
    } else {
      // Else, we are recursevily opening a new object ...
      // console.log("hello world");
      if (!this.top().array) {
	this.top().root[this.key] = obj.root;
      } else {
	this.top().root[this.key].push(obj.root);
      }
      // this.current[key] = obj.root;
      this.stack.push(obj);
    }

    // this.current = obj.root;
    this.key = key;
    // this.top[this.key] = {};
    // this.top = this.top[this.key];
    // this.top =
    // console.log(`open ${key}: ${JSON.stringify(this.stack)}`);
  }
  onkey(key) {
    // console.log(`key ${key} on ${JSON.stringify(this.stack)}`);
    this.key = key;
    // this.current = top()[key];
  }
  oncloseobject() {
    // console.log(`closeing ${JSON.stringify(this.stack)}`);
    let node = this.stack.pop();
    // this.top()[node.key] = node.root;
    // let tree = ;
    // console.log(`${JSON.stringify(node)}`);
    // for (let prop in node.root) {
    //  this.top().root[prop] = node.root[prop];
    // }
    // console.log(`closed ${JSON.stringify(this.stack)}`);
    // console.log(`closed ${JSON.stringify(this.current)}`);
  }
  onopenarray() {
    this.top().array = true;
    this.top().root[this.key] = [];
    // console.log(`open array ${JSON.stringify(this.stack)}`);
    // this.array = true;
  }
  onclosearray() {
    // console.log(`close array`);
    // this.array = false;
    this.top().array = false;
  }
  onend() {
    // console.log(`end`);
  }
  parse(data) {
    // this.root = {root: {}};
    let root = {root: {}};
    // this.current = root;
    this.stack = [root];
    this.key = "root";
    // this.current = this.root;
    this.parser.write(data).close();
    // let result = this.root;
    // console.log(this.root);
    // console.log(result.root);
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
            "e": "f"
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
	    e: "f"
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
