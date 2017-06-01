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
 * Return a property by name and namespace
 *
 * @param {string} propertyName - The name of the property to Return 
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
 * Return a type by name and namespace
 *
 * @param {string} typeName - The name of the type to Return 
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
 * Return all types
 */

niemo.prototype.getTypes = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Type"]);
}

/**
 * Return all properties
 */

niemo.prototype.getProperties = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Property"]);
};

/**
 * Return all facets
 */

niemo.prototype.getFacets = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Facet"]);
};

/**
 * Return all namespaces
 */

niemo.prototype.getNamespaces = function(){
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Namespace"]);
};

/**
 * Return all structures
 */

niemo.prototype.getStructures = function(){
    return this.getTypes(false, "structures");
};

///////////////////////////////

/**
 * Return a type by name and namespace and convert it to NIEM XML
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
 * @param {string} name - The name of the type to Return 
 * @param {string} namespace - The namespace in which to look for the type 
 */

niemo.prototype.createTypeXSDElement = function(typeName, namespace){

    var ElementTree = et.ElementTree;
    var element = et.Element;
    var subElement = et.SubElement; 
    var localns = {};

    if(!namespace){
        [namespace, typeName] = typeName.split(":");
    };

    var _type = this.getType(typeName, namespace, true);
    if(!_type){
        return null;
    }
    var contentStyle = {
        "CCC":["complexType", "complexContent"],
        "CSC":["complexType", "simpleContent"],
        "S":["simpleType", "simpleContent"]
    };

    var root = element("xs:schema");

    var _cs = contentStyle[_type.ContentStyle];
    var mainElement = subElement(root, "xs:"+_cs[0]);
    mainElement.set("name", _type.TypeName);
    
    if(_type.IsAdapter.toLowerCase() === 'true'){
        mainElement.set("appinfo:externalAdapterTypeIndicator", "true");
        localns["appinfo"] = true;
    }
    
    var annotation = subElement(mainElement, "xs:annotation");
    var documentation = subElement(annotation, "xs:documentation");
    var content = subElement(mainElement, "xs:"+_cs[1]);
    var extension = subElement(content, "xs:extension");
    var simpleAG = false;
    
    if(!_type.ParentQualifiedType){
        var _structures = this.getStructures();
        _structures.forEach(function(_s){
            if(_s.TypeName === _type.TypeName){
                _type.ParentQualifiedType = _s.QualifiedType;
            }
        });
        simpleAG = true;
        var types = this.getTypes();
        types.forEach(function(_simpleType){
            if(_simpleType.SimpleTypeName === _type.TypeName){
                _type.ParentQualifiedType = _simpleType.QualifiedType;
            }
        });
        if(!_type.ParentQualifiedType){
            _type.ParentQualifiedType = "structures:ObjectType"; //Default type to inherit from, I'm guessing
            localns["structures"] = true;
        }
    }

    extension.set("base", _type.ParentQualifiedType);
    
    var attributes = simpleAG? subElement(extension, "xs:attributeGroup") : subElement(extension, "xs:sequence");
    if(simpleAG){
        attributes.set("ref", "structures:SimpleObjectAttributeGroup");
    }
    
    localns[_type.TypeNamespacePrefix] = true;
    _type.children.forEach(function(_c){
        localns[_c.TypeNamespacePrefix] = true;
        var _x = subElement(attributes, "xs:element");
        _x.set("ref", _c.QualifiedProperty);
        _x.set("minOccurs", _c.MinOccurs);
        _x.set("maxOccurs", _c.MaxOccurs);
    })
    documentation.text = _type.Definition;
    
    /*Namespaces!*/
    localns = Object.keys(localns);
    var _namespaces = this.getNamespaces();
    _namespaces.forEach((n)=>{
        
        if(n.NamespacePrefix === "xml" || n.NamespacePrefix === "xs" || localns.indexOf(n.NamespacePrefix)>-1){
                if(n.NamespacePrefix === "xs"){
                    root.set("Version", n.VersionReleaseNumber);
                }
                if(n.NamespacePrefix === _type.TypeNamespacePrefix){
                  
                    root.set("TargetNamespace", n.VersionURI);   
                }
                if(n.NamespacePrefix && n.VersionURI){
                    //console.log("xmlns:"+n.NamespacePrefix, n.VersionURI);
                    root.set("xmlns:"+n.NamespacePrefix, n.VersionURI);
                }
           
        }
    });

    /* TODO schemaLocation */
    /* TODO figure out conformancetargets */

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
        [namespace, name] = name.split(":");
    }

    const property = this.getProperty(name, namespace);
    console.log(property);
    console.log(this.getType(property.TypeName, property.TypeNamespacePrefix));

}

/*TEMPLATES*/

niemo.prototype.createXMLTemplate = function(name, namespace){
    if(!namespace){
        [namespace, name] = typeName.split(":");
    }
}

niemo.prototype.createJSONLDTemplate = function(){
    
}

module.exports = niemo;