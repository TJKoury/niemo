const niemo = require('../index.js');
const test = require('tape');
const pd = require("pretty-data").pd;

test('Create Type XSD', function (t) {
    t.plan(2); 
   
    var n = new niemo();

    var _xsdt = n.createTypeXSDElement("nc:PersonType");
    t.notEqual(_xsdt, null);
    if(_xsdt){
        console.log(pd.xml(_xsdt));
    }
    var _xsdp = n.createPropertyXSDElement("edxl-cap:AlertAdapter");
    t.equal(_xsdp, null);
    if(_xsdp){
        //console.log(pd.xml(_xsdp));
    }
});