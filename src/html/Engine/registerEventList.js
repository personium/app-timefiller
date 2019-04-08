// Login
function(request){
    try {
        personium.validateRequestMethod(["POST"], request);

        var params = personium.parseBodyAsQuery(request);

        // 
        var cell = dc.as(accInfo.APP_CELL_ADMIN_INFO).cell();
        var odata = cell.box().odata('OData');
        var odataEntity = odata.entitySet('EventList');

        // uuid acquisition
        uuidRes = odataEntity.query().filter("event_id eq '" + params.eventId + "' and cellUrl eq '" + params.cellUrl + "'").select('__id').run().d.results;
        var uuid = null;
        if (uuidRes.length != 0) {
            uuid = uuidRes[0].__id;
        }

        // Information setting
        var propList = {};
        propList['event_id'] = params.eventId;
        propList['cellUrl'] = params.cellUrl;
        propList['startDate'] = params.startDate;
        propList['endDate'] = params.endDate;
        propList['summary'] = params.summary;
        propList['image'] = params.image;
        if (uuid) {
            // If uuid can be obtained
            // Update data
            odataEntity.merge(
                uuid,
                propList,
                "*"
            );
        } else {
            // If uuid can not be acquired
            // Create New
            odataEntity.create(propList);
        }
        
        return personium.createResponse(200, "success");
    } catch (e) {
        return personium.createErrorResponse(e);
    }
}

var personium = require("personium").personium;
var accInfo = require("acc_info").accInfo;