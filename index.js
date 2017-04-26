const htmlparser = require('htmlparser2');
const xlsx = require('xlsx');
const jsonld = require('jsonld');
const niemWorkbook = xlsx.readFile('./schemas/niem/niem.xlsx');
var niemo = function(){};


niemo.prototype.getProperty = function(propertyName, prefix){
    var properties = xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Property"]);
    var _property = null;
    for(var p=0;p<properties.length;p++){
        if(properties[p].PropertyName === propertyName && properties[p].PropertyNamespacePrefix === prefix){
            _property = properties[p];
            break;
        }
    };
    return _property;
}
niemo.prototype.getPrefixes = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Namespace"]);
};

niemo.prototype.getTypes = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Type"]);
}

niemo.prototype.getType = function(typeName, prefix){
    
    var types = this.getTypes();
    var validType = false;
    for(var _t=0;_t<types.length;_t++){
        if(types[_t].TypeName === typeName && prefix === types[_t].TypeNamespacePrefix){
            validType = true;
            break;
        }
    }

    if(!validType){
        return null;
    }
    
    var typemap = xlsx.utils.sheet_to_json(niemWorkbook.Sheets["TypeContainsProperty"]).filter(function(a){
        return a.TypeName === typeName && a.TypeNamespacePrefix === prefix;
    });
    return typemap;
}

var t = new niemo();

t.getType("PersonType", "nc").forEach(function(a){
    var _p = t.getProperty(a.PropertyName, a.PropertyNamespacePrefix);
    console.log(_p.PropertyNamespacePrefix+":"+_p.PropertyName, _p.Definition);

});

module.exports = {};