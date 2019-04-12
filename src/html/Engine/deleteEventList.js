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

        var resMsg = "delete success";
        if (uuid) {
            var httpClient = new _p.extension.HttpClient();
            var delUrl = accInfo.APP_CELL_URL + "__/OData/EventList" + "('" + uuid + "')";
            var headers = {
                "Accept": "application/json",
                "Authorization": "Bearer " + cell.getToken().access_token
            }
            var res = httpClient.delete(delUrl, headers);
        } else {
            resMsg = "Target does not exist";
        }
        
        return personium.createResponse(200, resMsg);
    } catch (e) {
        return personium.createErrorResponse(e);
    }
}

var personium = require("personium").personium;
var accInfo = require("acc_info").accInfo;