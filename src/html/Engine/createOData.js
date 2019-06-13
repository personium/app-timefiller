/**
 * When you run this engine, you will create the following
 * ・OData
 * ・EntityType
 * ・Property
 */
function(request){
    try {
        personium.validateRequestMethod(["POST"], request);

        // cell info
        var cellUrl = "https://app-timefiller-wakaba.demo.personium.io/";
        var cellAcc = "***"; // Specify account with admin privileges
        var cellPass = "***"; // Specify account with admin privileges
        // create OData name
        var odataName = "OData";
        // create EntityType name
        var entityType = "EventList";
        // create Prop list
        var addProp = [
            {Name:"keywords",Type:"Edm.String",CollectionKind:"List"},
            {Name:"address",Type:"Edm.String"},
            {Name:"recruiter",Type:"Edm.String"},
            {Name:"thumbnailUrl",Type:"Edm.String"},
            {Name:"longitude",Type:"Edm.Double"},
            {Name:"latitude",Type:"Edm.Double"},
            {Name:"summary",Type:"Edm.String"},
            {Name:"title",Type:"Edm.String"},
            {Name:"serviceImage",Type:"Edm.String"},
            {Name:"serviceName",Type:"Edm.String"},
            {Name:"image",Type:"Edm.String"},
            {Name:"endDate",Type:"Edm.DateTime"},
            {Name:"startDate",Type:"Edm.DateTime"},
            {Name:"cellUrl",Type:"Edm.String",Nullable:"false"},
            {Name:"event_id",Type:"Edm.String",Nullable:"false"},
            {Name:"starCount",Type:"Edm.Int32"}
        ];

        // Cell
        var cellInfo = _p.as({
            cellUrl: cellUrl,
            userId: cellAcc,
            password: cellPass 
        }).cell();

        // create odata
        cellInfo.box().mkOData(odataName);
        var odata = cellInfo.box().odata(odataName);

        // create EntityType
        var entity = odata.schema.entityType.create({Name:entityType});

        // create Property
        var EntityPropList = [];
        _.each(addProp, function(d,i,l) {
            d["_EntityType.Name"] = entityType;
            EntityPropList.push(d);
        })
        _.each(EntityPropList, function(d,i,l) {
            odata.schema.property.create(d);
        })

        return personium.createResponse(200, "create OData");
    } catch (e) {
        return personium.createErrorResponse(e);
    }
}

var _ = require("underscore")._;
var personium = require("personium").personium;