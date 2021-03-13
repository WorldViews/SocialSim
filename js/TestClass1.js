( function(window){
"use strict";

class TestClass1 {
  constructor(opt) {
      console.log("Hello from TestClass1");
      this.val = 36;
      this.color = "green";
      this.size = "tiny";
      window.simpleSim = this;
  }

  cry(arg) {
    var s = "TestClass says boo hoo hoo ";
    if (arg)
      s += arg;
    console.log("cry", s);
    return s;
  }
}

if(typeof exports === 'object' && typeof module !== 'undefined'){
  module.exports = TestClass1;
}
else if(typeof define === 'function' && define.amd){
    define(function(){
      return TestClass1;
    });
}
else{
  window.TestClass1 = TestClass1;
}

})(this);
