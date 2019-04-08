// Login
function(request){
    try {
        personium.validateRequestMethod(["POST"], request);

        var params = personium.parseBodyAsQuery(request);
        // verify parameter information
        personium.setAllowedKeys(['id']);
        personium.setRequiredKeys(['id']);
        personium.validateKeys(params);

        var appCell = getAppCell();
        var odata = appCell.box().odata("OData");

        var results = {};

        // Get event list
        var eventList = odata.entitySet("EventList").retrieve(params.id);

        // Cell URL that registered the event
        var url = eventList.cellUrl;
        // Event ID
        var id = eventList.event_id;

        // Get app certified transcell token
        var tToken = getTranscellToken(url, appCell.getToken().refresh_token);
        var aToken = personium.getAppToken(url);
        var bToken = getBoxAccessToken(url, tToken.access_token, aToken.access_token);

        // Get Box URL
        var boxUrl = getBoxUrl(url, bToken.access_token);

        // Get event details from the cell that registered the event
        var infoRes = getEventInfo(boxUrl, id, bToken.access_token);
        
        // If you can get the details of the event, return the details
        if (infoRes.status == "200") {
            var info = JSON.parse(infoRes.body);
            results = info.d.results;
        }

        return personium.createResponse(200, results);
    } catch (e) {
        return personium.createErrorResponse(e);
    }
}

// Get Transcell Token
function getTranscellToken(eventCellUrl, refToken) {
    var url = APP_CELL_URL + "__token";
    var headers = {
        'Accept':'application/json'
    }
    var contentType = "application/x-www-form-urlencoded";
    var body = "grant_type=refresh_token&refresh_token=" + refToken + "&p_target=" + eventCellUrl;
    var transcellTokenRes = httpClient.post(url, headers, contentType, body);
    return JSON.parse(transcellTokenRes.body);
}

// Get app certified transcell token
function getBoxAccessToken(eventCellUrl, refToken, aaat) {
    var url = eventCellUrl + "__token";
    var headers = {
        'Accept':'application/json'
    }
    var contentType = "application/x-www-form-urlencoded";
    var body = "grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer&assertion=" + refToken + "&client_id=" + APP_CELL_URL + "&client_secret=" + aaat;
    var boxAccessTokenRes = httpClient.post(url, headers, contentType, body);
    return JSON.parse(boxAccessTokenRes.body);
}

// Get BoxURL
function getBoxUrl(eventCellUrl, token) {
    var url = eventCellUrl + "__box";
    var headers = {
        "Accept": "application/json",
        "Authorization": "Bearer " + token
    }
    var boxRes = httpClient.get(url, headers);
    if (boxRes.status == "403" || boxRes.status == "404") {
        var err = [
            "io.personium.client.DaoException: " + boxRes.status,
            JSON.stringify({
                "code": boxRes.status,
                "message": {
                    "lang": "en",
                    "value": "Necessary privilege is lacking."
                }
            })
        ].join("");
        throw new _p.PersoniumException(err);
    }
    return JSON.parse(boxRes.body).Url;
}

// Get event details
function getEventInfo(eventCellBoxUrl, id, token) {
    var url = eventCellBoxUrl + "OData/Events('" + id + "')";
    var headers = {
        "Accept": "application/json",
        "Authorization": "Bearer " + token
    }
    var infoRes = httpClient.get(url, headers);
    return infoRes;
}

function getAppCell() {
    var ret;
    var appCell = _p.as({
        cellUrl: APP_CELL_URL,
        userId: APP_USER_ID,
        password: APP_USER_PASS 
    }).cell();
    return appCell;
}

var APP_CELL_URL = "https://app-timefiller-wakaba.demo.personium.io/";
var APP_USER_ID = "***";
var APP_USER_PASS = "***";
var httpClient = new _p.extension.HttpClient();

var personium = require("personium").personium;
var moment = require("moment").moment;
var _ = require("underscore")._;