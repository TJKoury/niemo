const niemo = require('../index.js');
const test = require('tape');
const pd = require("pretty-data").pd;

test('Create Type XSD', function (t) {
    t.plan(1); 
   
    var n = new niemo();

    var _xsd = n.createTypeXSDElement("edxl-cap:AlertAdapterType");
    t.notEqual(_xsd, null);
    if(_xsd){
        console.log(pd.xml(_xsd));
    }
});