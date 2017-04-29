const xlsx = require('xlsx');
const jsonld = require('jsonld');
const niemWorkbook = xlsx.readFile('./schemas/niem/niem.xlsx');
const et = require('elementtree');
const pd = require("pretty-data").pd;
/**
 * Represents a new niemo object.
 * @constructor
 * @param {string} ontology - The name of the ontology module to use
 */

var niemo = function(ontology){
    this.ontology = ontology;
};

/**
 * Returns a property by name and namespace
 *
 * @param {string} propertyName - The name of the property to Returns 
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
 * Returns a type by name and namespace
 *
 * @param {string} typeName - The name of the type to Returns 
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
        if((
            (typeName && types[_t].TypeName === typeName ) ||
            (!typeName && namespace)
           ) &&
            namespace === types[_t].TypeNamespacePrefix){
            
            _type = types[_t];
            break;
        }
    }

    if(_type && children){
        _type.children = [];
        var typemap = xlsx.utils.sheet_to_json(niemWorkbook.Sheets["TypeContainsProperty"]).filter(function(a){
            return a.TypeName === typeName && a.TypeNamespacePrefix === namespace;
        }).forEach(function(c){
            _type.children.push(c);
        });
    }

    return _type;
};

/**
 * Returns all types
 */

niemo.prototype.getTypes = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Type"]);
}

/**
 * Returns all properties
 */

niemo.prototype.getProperties = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Property"]);
};

/**
 * Returns all facets
 */

niemo.prototype.getFacets = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Facet"]);
};

/**
 * Returns all namespaces
 */

niemo.prototype.getNamespaces = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Namespace"]);
};

/**
 * Returns all structures
 */

niemo.prototype.getStructures = function(){
    return xlsx.utils.getTypes(false, "structures");
};

///////////////////////////////

/**
 * Returns a type by name and namespace and convert it to NIEM XML
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
 * @param {string} name - The name of the type to Returns 
 * @param {string} namespace - The namespace in which to look for the type 
 */

niemo.prototype.createTypeXSDElement = function(typeName, namespace){

    var ElementTree = et.ElementTree;
    var element = et.Element;
    var subElement = et.SubElement; 
    
    if(!namespace){
        [namespace, name] = name.split(":");
    };

    var _namespaces = this.getNamespaces();
    _namespaces.forEach((n)=>{
        if(n.NamespacePrefix === "xml" || n.NamespacePrefix === "xs"){
            //console.log(n);
        }
    })

    var _type = this.getType(typeName, namespace, true);

    var contentStyle = {
        "CCC":["complexType", "complexContent"],
        "CSC":["complexType", "simpleContent"],
        "S":["simpleType", "simpleContent"]
    };
    console.log(_type);
    var root = element("xs:schema");
    /*TODO Get all namespaces root.set('xmlns', 'http://www.w3.org/2005/Atom');*/
    var _cs = contentStyle[_type.ContentStyle];
    var mainElement = subElement(root, "xs:"+_cs[0]);
    mainElement.set("name", _type.TypeNamespacePrefix+":"+_type.TypeName);
    var annotation = subElement(mainElement, "xs:annotation");
    var documentation = subElement(annotation, "xs:documentation");
    var content = subElement(mainElement, "xs:"+_cs[1]);
    var extension = subElement(content, "xs:extension");
    var simpleAG = false;
    if(!_type.ParentQualifiedType){
        simpleAG = true;
        var types = this.getTypes();
        types.forEach(function(_simpleType){
            if(_simpleType.SimpleTypeName === _type.TypeName){
                _type.ParentQualifiedType = _simpleType.QualifiedType;
                _type.children.push()
            }
        })
    }
    extension.set("base", _type.ParentQualifiedType);
    
    var attributes = simpleAG? subElement(extension, "xs:attributeGroup") : subElement(extension, "xs:sequence");
    if(simpleAG){
        attributes.set("ref", "structures:SimpleObjectAttributeGroup");
    }

    _type.children.forEach(function(_c){
        var _x = subElement(contentSequence, "xs:element");
        _x.set("ref", _c.QualifiedProperty);
        _x.set("minOccurs", _c.MinOccurs);
        _x.set("maxOccurs", _c.MaxOccurs);
    })
    documentation.text = _type.Definition;
    


    return (new ElementTree(root)).write({'xml_declaration': true});

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

console.log(pd.xml(t.createTypeXSDElement("AngularMinuteType", "nc")));


module.exports = {};