# niemo
Conversion utilities for the [National Information Exchange Model (NIEM)](https://www.niem.gov/)

## Overview

NIEMO is a tool to aid in creating NIEM - compliant ontologies for operational systems.  

This tool will support converting NIEM schemas to:
- [JSON Schema](http://json-schema.org)
- [JSON-LD templates](json-ld.org)
- Database schemas for database setup and migration

## Docs [(From NIEM Overview)](http://niem.github.io/iepd-starter-kit/)

The NIEM data model consists of “types” (of things) that have “properties” and that
participate in “relationships” with other “types” (of things).

A type is a description of a set of things that share the same properties, relationships, and
semantics. For example in NIEM, “PersonType” and “VehicleType” represent persons and
vehicles—kinds of things.

A property is a named characteristic of a type. For example, “PersonBirthDate” is a 
property of “PersonType.” Furthermore, the property is of a specific type itself. For example,
”PersonBirthDate” is itself of type “DateType.”

A relationship may be modeled as either a type or a property. For example in NIEM, a
relationship between persons and vehicles is represented by the type
“PersonVehicleAssociationType.”

An object is an instance of a type and is an abstraction of a specific physical thing or a
conceptual thing. Also, in an object, the properties have values. For example, John Smith, a
specific person, would be an object of type “PersonType” with the property “PersonBirthDate.”
Also, for John Smith, the property “PersonBirthDate” may have a value of “1970-01-01.”

An object may have a unique ID within an XML instance, but it is not required to have a
globally unique identifier.