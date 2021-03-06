const url = require('url');
const path = require('path');
const libxmljs = require("libxmljs");
const fs = require('fs');
const xlsx = require('xlsx');
const jsonld = require('jsonld');
const niemWorkbook = xlsx.readFile('./schemas/niem-alternateFormats/niem.xlsx');
const et = require('elementtree');
const pd = require("pretty-data").pd;
const jsonLDSchema = require('./schemas/jsonld/jsonld-schema.json');

/**
 * Represents all of the content styles.
 * @property {object}  contentStyle - List of all the content styles 
 * @property {Array<String>}  contentStyle.CCC - Array of types contained in a complex type with complex content
 * @property {Array<String>}  contentStyle.CSC - Array of types contained in a complex type with simple content
 * @property {Array<String>}  contentStyle.S - Array of types contained in a simple type with simple content 
 */

var contentStyle = {
    "CCC": ["complexType", "complexContent"],
    "CSC": ["complexType", "simpleContent"],
    "S": ["simpleType", "simpleContent"]
};

/**
 * Represents a new niemo object.
 * @constructor
 */

var niemo = function () {
    this.niemRootPath = "./node_modules/niem-releases/niem";
};

/**
 * Cast string value to boolean
 *
 * @param {string} value - Value to cast to boolean
 */

niemo.prototype.parseBoolean = function (value) {
    if (typeof value === "boolean") {
        return value;
    } else {
        return value.toLowerCase() === "true";
    }
};

/**
 * Return a property by name and namespace
 *
 * @param {string} propertyName - The name of the property to Return 
 * @param {string} namespace - The namespace in which to look for the property 
 */

niemo.prototype.getProperty = function (propertyName, namespace) {
    if (!namespace) {
        [namespace, propertyName] = propertyName.split(":");
    }

    var properties = xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Property"]);
    var _property = null;
    for (var p = 0; p < properties.length; p++) {
        if (properties[p].PropertyName === propertyName && properties[p].PropertyNamespacePrefix === namespace) {
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

niemo.prototype.getType = function (typeName, namespace, children) {
    if (!namespace) {
        [namespace, typeName] = typeName.split(":");
    }

    var types = this.getTypes();
    var _type = null;
    for (var _t = 0; _t < types.length; _t++) {
        if ((
            (typeName && types[_t].TypeName === typeName) ||
            (!typeName && namespace)
        ) &&
            namespace === types[_t].TypeNamespacePrefix) {

            _type = types[_t];
            break;
        }
    }

    if (_type && children) {
        _type.children = [];
        var typemap = xlsx.utils.sheet_to_json(niemWorkbook.Sheets["TypeContainsProperty"]).filter(function (a) {
            return a.TypeName === typeName && a.TypeNamespacePrefix === namespace;
        }).forEach(function (c) {
            _type.children.push(c);
        });
    }

    return _type;
};

/**
 * Return all types
 */

niemo.prototype.getTypes = function () {
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Type"]);
}

/**
 * Return all properties
 */

niemo.prototype.getProperties = function () {
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Property"]);
};

/**
 * Return all facets
 */

niemo.prototype.getFacets = function () {
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Facet"]);
};

/**
 * Return all namespaces
 */

niemo.prototype.getNamespaces = function () {
    return xlsx.utils.sheet_to_json(niemWorkbook.Sheets["Namespace"]);
};

/**
 * Return all structures
 */

niemo.prototype.getStructures = function () {
    return this.getTypes(false, "structures");
};

/**
 * Serialize root document
 * 
 * @param {object} doc    - The document
 * @param {string} format - The format of the document
 */
niemo.prototype.serializeDocument = function (doc, data, format) {
    if (format === "json") {

        let _jdoc = {};
        
        _jdoc["@context"] = {};
        
        const nsTranslation = {
            "targetnamespace": "@base",
            "version": "@version"
        };

        for(let attr in data.children){
            if(data.children[attr].PropertyName.indexOf("Person")>-1)
            console.log(data.children[attr])
        };

        for (let ns in doc.attrib) {
            let _ns = (nsTranslation[ns.toLowerCase()] || ns);
            _jdoc["@context"][_ns] = doc.attrib[ns];
        }

        return _jdoc;

    } else if (format === "xml") {

        return (new this.ElementTree(doc)).write({ 'xml_declaration': true })

    }
}


///////////////////////////////

/**
 * Return a type by name and namespace and convert it to NIEM XSD
 * 
 * @param {string} name - The name of the type to Return 
 * @param {string} namespace - The namespace in which to look for the type 
 * @param {string} format - The format in which to return the type document 
 */

niemo.prototype.createTypeDocument = function (typeName, namespace, format) {
    var format = Array.prototype.slice.call(arguments).pop();
    if (!format) {
        throw Error("No Format Specified For: " + arguments);
    }
    var subElement = et.SubElement;
    var localns = {};

    if (!arguments.length < 3) {
        [namespace, typeName] = typeName.split(":");
    };

    var _type = this.getType(typeName, namespace, true);
    if (!_type) {
        return null;
    }

    this.ElementTree = et.ElementTree;
    var element = et.Element;
    var root = element("xs:schema");

    var _cs = contentStyle[_type.ContentStyle];
    var mainElement = subElement(root, "xs:" + _cs[0]);
    mainElement.set("name", _type.TypeName);

    if (this.parseBoolean(_type.IsAdapter)) {
        mainElement.set("appinfo:externalAdapterTypeIndicator", "true");
        localns["appinfo"] = true;
    }

    var annotation = subElement(mainElement, "xs:annotation");
    var documentation = subElement(annotation, "xs:documentation");
    var content = subElement(mainElement, "xs:" + _cs[1]);
    var extension = subElement(content, "xs:extension");
    var simpleAG = false;

    if (!_type.ParentQualifiedType) {
        var _structures = this.getStructures();
        _structures.forEach(function (_s) {
            if (_s.TypeName === _type.TypeName) {
                _type.ParentQualifiedType = _s.QualifiedType;
            }
        });
        simpleAG = true;
        var types = this.getTypes();
        types.forEach(function (_simpleType) {
            if (_simpleType.SimpleTypeName === _type.TypeName) {
                _type.ParentQualifiedType = _simpleType.QualifiedType;
            }
        });
        if (!_type.ParentQualifiedType || _type.ParentQualifiedType === _type.QualifiedType) {
            _type.ParentQualifiedType = "structures:ObjectType"; //Default type to inherit from, I'm guessing
            localns["structures"] = true;
        }
    }

    extension.set("base", _type.ParentQualifiedType);

    var attributes = simpleAG ? subElement(extension, "xs:attributeGroup") : subElement(extension, "xs:sequence");
    if (simpleAG) {
        attributes.set("ref", "structures:SimpleObjectAttributeGroup");
        localns["structures"] = true;
    }

    localns[_type.TypeNamespacePrefix] = true;

    _type.children.forEach(function (_c) {
        localns[_c.TypeNamespacePrefix] = true;
        localns[_c.PropertyNamespacePrefix] = true;
        var _x = subElement(attributes, "xs:element");
        _x.set("ref", _c.QualifiedProperty);
        _x.set("minOccurs", _c.MinOccurs);
        _x.set("maxOccurs", _c.MaxOccurs);
    });

    documentation.text = _type.Definition;

    /*Namespaces!*/
    localns = Object.keys(localns);
    var _namespaces = this.getNamespaces();
    var _rootNamespacePath = _namespaces.filter((n) => {
        return n.NamespacePrefix === _type.TypeNamespacePrefix;
    })[0];
    var _relativePath = (url.parse(_rootNamespacePath.VersionURI)
        .path
        .split("/niem")[1]
        .split("/"))
        .filter((a) => { if (a) return a; })
        .map((n) => { return '../'; })
        .join("");

    _namespaces.forEach((n) => {
        var _xmlRootNamespace = ["xml", "xs"].indexOf(n.NamespacePrefix) > -1;
        if (n.NamespacePrefix === "xml" || n.NamespacePrefix === "xs" || localns.indexOf(n.NamespacePrefix) > -1) {
            if (n.NamespacePrefix === "xs") {
                root.set("Version", n.VersionReleaseNumber);
            }
            if (n.NamespacePrefix === _type.TypeNamespacePrefix) {

                root.set("targetNamespace", n.VersionURI);
            }
            if (n.NamespacePrefix && n.VersionURI) {
                root.set("xmlns:" + n.NamespacePrefix, n.VersionURI);
            }

            var _filepath = path.join(n.NamespacePrefix,
                n.VersionReleaseNumber,
                n.NamespacePrefix + ".xsd");

            if (this.parseBoolean(n.NamespaceIsExternallyGenerated) && !this.parseBoolean(n.IsConformant) && !_xmlRootNamespace) {
                _filepath = path.join(
                    "external",
                    _filepath);
                var _xsdString = fs.readFileSync(path.join(this.niemRootPath, _filepath), { encoding: 'utf8' });
                var _externalXMLSchema = libxmljs.parseXml(_xsdString);

                var _import = subElement(root, "xs:import");

                _import.set("schemaLocation",
                    path.join(_relativePath, _filepath).replace(/\\/g, "/"));

                _import.set("appinfo:externalAdapterTypeIndicator", "true");
                _import.set("namespace", (_externalXMLSchema.root()).attr("targetNamespace").value());
            }
            if (this.parseBoolean(n.NamespaceIsExternallyGenerated) && n.VersionURI && !_xmlRootNamespace) {
                if (fs.existsSync(path.join(this.niemRootPath, _filepath))) {
                    var _import = subElement(root, "xs:import");

                    _import.set("schemaLocation", path
                        .join(
                        _relativePath,
                        _filepath)
                        .replace(/\\/g, "/"));

                    _import.set("namespace", n.VersionURI);
                } else {
                    new Error("File does not exist:" + path.join(this.niemRootPath, _filepath));
                }
            }
        };

    });

    /* TODO schemaLocation */
    /* TODO figure out conformancetargets */

    return this.serializeDocument(root, _type, format);

}

niemo.prototype.createPropertyXSDElement = function (name, namespace) {

    // This is for Properties, to generate the xs:element found in the core xsd
    //  <xs:element name="Person" type="nc:PersonType" nillable="true">
    //      <xs:annotation>
    //         <xs:documentation>A human being.</xs:documentation>
    //         </xs:annotation>
    //      </xs:element>

    if (!namespace) {
        [namespace, name] = name.split(":");
    }

    const property = this.getProperty(name, namespace);
    //console.log(property);
    //console.log(this.getProperty(property.TypeName, property.TypeNamespacePrefix));
    return null;

}

/*TEMPLATES*/

niemo.prototype.createXMLTemplate = function (name, namespace) {
    if (!namespace) {
        [namespace, name] = typeName.split(":");
    }
}

niemo.prototype.createJSONLDTemplate = function () {

}

module.exports = niemo;
