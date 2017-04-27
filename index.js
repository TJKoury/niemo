const htmlparser = require('htmlparser2');
const xlsx = require('xlsx');
const jsonld = require('jsonld');
const niemWorkbook = xlsx.readFile('./schemas/niem/niem.xlsx');
var niemo = function(){};


niemo.prototype.getProperty = function(propertyName, namespace){
    if(!namespace){
        [namespace, propertyName] = propertyName.split(":");
    }

    var properties = xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Property"]);
    var _property = null;
    for(var p=0;p<properties.length;p++){
        if(properties[p].PropertyName === propertyName && properties[p].PropertyNamespacePrefix === namespace){
            _property = properties[p];
            break;
        }
    };
    return _property;
};

niemo.prototype.getType = function(typeName, namespace){
    if(!namespace){
        [namespace, propertyName] = typeName.split(":");
    }

    var types = this.getTypes();
    var validType = false;
    for(var _t=0;_t<types.length;_t++){
        if(types[_t].TypeName === typeName && namespace === types[_t].TypeNamespacePrefix){
            
            validType = types[_t];
            break;
        }
    }

    if(!validType){
        return null;
    }
    
    var typemap = xlsx.utils.sheet_to_json(niemWorkbook.Sheets["TypeContainsProperty"]).filter(function(a){
        return a.TypeName === typeName && a.TypeNamespacePrefix === namespace;
    });
    return [validType, typemap];
};

niemo.prototype.getTypes = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Type"]);
}

niemo.prototype.getProperties = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Property"]);
};

niemo.prototype.getFacets = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Facet"]);
};

niemo.prototype.getNamespaces = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Namespace"]);
};

niemo.prototype.createXMLSchema = function(){
    
}

var t = new niemo();

var queryProperty = t.getProperty("cyfs:PersonOtherKinAssociation");
console.log(queryProperty.PropertyNamespacePrefix+":"+queryProperty.TypeName);
var queryType = t.getType(queryProperty.TypeName, queryProperty.PropertyNamespacePrefix);
//console.log(queryType);
if(Array.isArray(queryType[1])){
    queryType[1].forEach(function(a){
        var _p = t.getProperty(a.PropertyName, a.PropertyNamespacePrefix);
        console.log(_p.PropertyNamespacePrefix+":"+_p.PropertyName);
        console.log(_p);
        var _pt = t.getType(_p.TypeName, _p.PropertyNamespacePrefix);
        console.log(_pt)
    });
}
module.exports = {};