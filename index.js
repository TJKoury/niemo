const xlsx = require('xlsx');
const jsonld = require('jsonld');
const niemWorkbook = xlsx.readFile('./schemas/niem/niem.xlsx');
const et = require('elementtree');

/**
 * Represents a new niemo object.
 * @constructor
 * @param {string} ontology - The name of the ontology module to use
 */

var niemo = function(ontology){
    this.ontology = ontology;
};

/**
 * Retrieve a property by name and namespace
 *
 * @param {string} propertyName - The name of the property to retrieve 
 * @param {string} namespace - The namespace in which to look for the property 
 */

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

/**
 * Retrieve a type by name and namespace
 *
 * @param {string} typeName - The name of the type to retrieve 
 * @param {string} namespace - The namespace in which to look for the type 
 * @param {boolean} children - Return the children of the type as well
 */

niemo.prototype.getType = function(typeName, namespace, children){
    if(!namespace){
        [namespace, typeName] = typeName.split(":");
    }

    var types = this.getTypes();
    var _type = null;
    for(var _t=0;_t<types.length;_t++){
        if(types[_t].TypeName === typeName && namespace === types[_t].TypeNamespacePrefix){
            
            _type = types[_t];
            break;
        }
    }

    if(_type && children){
        var typemap = xlsx.utils.sheet_to_json(niemWorkbook.Sheets["TypeContainsProperty"]).filter(function(a){
            return a.TypeName === typeName && a.TypeNamespacePrefix === namespace;
        }).forEach(function(c){
            _type[c.TypeName] = c;
        });
    }

    return _type;
};

/**
 * Retrieve all types
 */

niemo.prototype.getTypes = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Type"]);
}

/**
 * Retrieve all properties
 */

niemo.prototype.getProperties = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Property"]);
};

/**
 * Retrieve all facets
 */

niemo.prototype.getFacets = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Facet"]);
};

/**
 * Retrieve all namespaces
 */

niemo.prototype.getNamespaces = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Namespace"]);
};


///////////////////////////////

/**
 * Retrieve a type by name and namespace and convert it to NIEM XML
 *
 * <xs:complexType name="PersonType">
 *   <xs:annotation>
 *     <xs:documentation>A data type for a human being.</xs:documentation>
 *   </xs:annotation>
 *   <xs:complexContent>
 *     <xs:extension base="structures:ObjectType">
 *       <xs:sequence>
 *         <xs:element ref="nc:PersonAccentText" minOccurs="0" maxOccurs="unbounded"/>
 *         ....
 *       </xs:sequence>
 *     </xs:extension>
 *   </xs:complexContent>
 * </xs:complexType>
 * 
 * @param {string} name - The name of the type to retrieve 
 * @param {string} namespace - The namespace in which to look for the type 
 */

niemo.prototype.createTypeXSDElement = function(typeName, namespace){

    var ElementTree = et.ElementTree;
    var element = et.Element;
    var subElement = et.SubElement; 
    
    if(!namespace){
        [namespace, name] = name.split(":");
    };



    var _type = this.getType(typeName, namespace, true);
    var contentStyle = {
        "CCC":""
    };
    console.log(_type);

    var root = element("xs:schema");

    return (new ElementTree(root)).write({'xml_declaration': false});

}

niemo.prototype.createPropertyXSDElement = function(name, namespace){

    // This is for Properties, to generate the xs:element found in the core xsd
    //  <xs:element name="Person" type="nc:PersonType" nillable="true">
    //      <xs:annotation>
    //         <xs:documentation>A human being.</xs:documentation>
    //         </xs:annotation>
    //      </xs:element>
    
    if(!namespace){
        [namespace, name] = typeName.split(":");
    }

}

/*TEMPLATES*/

niemo.prototype.createXMLTemplate = function(name, namespace){
    if(!namespace){
        [namespace, name] = typeName.split(":");
    }
}

niemo.prototype.createJSONLDTemplate = function(){
    
}

var t = new niemo();

/*
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
};
*/

console.log(t.createTypeXSDElement("AircraftType", "nc"));


module.exports = {};