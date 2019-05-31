// Login
function(request){
    try {
        //personium.validateRequestMethod(["POST"], request);

        var cell = dc.as({
            cellUrl: accInfo.APP_CELL_URL,
            userId: "me",
            password: "personium"
        }).cell();
        
        var url = accInfo.APP_CELL_URL + "__ctl/Role('syncTarget')/$links/_ExtCell";
        var headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + cell.getToken().access_token
        };
        var odata = cell.box().odata('OData');
        var odataEntity = odata.entitySet('EventList');

        var rleListRes = httpClient.get(url, headers);
        var rleList = JSON.parse(rleListRes.body);
        var updateCnt = 0;
        if (rleList.d) {
            var results = rleList.d.results;
            for (var i = 0; i < results.length; i++) {
                var uri = results[i].uri;
                var matchUri = uri.match(/\('(.+)'\)/);
                var cellUrl = matchUri[1];

                // Get app certified transcell token
                var tToken = getTranscellToken(cellUrl, cell.getToken().refresh_token);
                var aToken = personium.getAppToken(cellUrl);
                var bToken = getBoxAccessToken(cellUrl, tToken.access_token, aToken.access_token);

                // Get Box URL
                var boxUrl = getBoxUrl(cellUrl, bToken.access_token);

                // Get event details from the cell that registered the event
                var infoRes = getEventInfo(boxUrl, bToken.access_token);

                if (infoRes.status == "200") {
                    var infoBody = JSON.parse(infoRes.body);
                    var infoList = infoBody.d.results;
                    for (var j = 0; j < infoList.length; j++) {
                        var info = infoList[j];
                        uuidRes = odataEntity.query().filter("event_id eq '" + info.__id + "' and cellUrl eq '" + cellUrl + "'").select('__id').run().d.results;

                        var propList = {};
                        propList['event_id'] = info.__id;
                        propList['cellUrl'] = cellUrl;
                        propList['startDate'] = info.startDate;
                        propList['endDate'] = info.endDate;
                        propList['title'] = info.title;
                        propList['image'] = info.image;
                        propList['serviceImage'] = info.serviceImage;
                        propList['serviceName'] = info.serviceName;
                        propList['latitude'] = info.latitude;
                        propList['longitude'] = info.longitude;
                        propList['recruiter'] = info.recruiter;
                        propList['address'] = info.address;
                        propList['keywords'] = info.keywords;
                        if (uuidRes.length != 0) {
                            var uuid = uuidRes[0].__id;
                            odataEntity.merge(
                                uuid,
                                propList,
                                "*"
                            );
                        } else {
                            odataEntity.create(propList);
                        }
                        updateCnt++;
                    }
                }
            }
        }

        return personium.createResponse(200, "We have updated "+updateCnt+" item of data.");
    } catch (e) {
        return personium.createErrorResponse(e);
    }
}

// Get Transcell Token
function getTranscellToken(eventCellUrl, refToken) {
    var url = accInfo.APP_CELL_URL + "__token";
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
    var body = "grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer&assertion=" + refToken + "&client_id=" + accInfo.APP_CELL_URL + "&client_secret=" + aaat;
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
function getEventInfo(eventCellBoxUrl, token) {
    var url = eventCellBoxUrl + "OData/Events";
    var filter = "$filter=startDate%20ge%20datetimeoffset'" + moment.tz("Asia/Tokyo").startOf("day").toISOString() + "'";
    var select = "$select=__id,title,startDate,endDate,image,serviceName,serviceImage,latitude,longitude,recruiter,address,keywords";
    var top = "$top=10000";
    var inlinecount = "$inlinecount=allpages";
    var orderBy = "$orderby=__updated%20asc";
    var queryUrl = url + "?" + filter + "&" + select + "&" + top + "&" + inlinecount + "&" + orderBy;
    var headers = {
        "Accept": "application/json",
        "Authorization": "Bearer " + token
    }
    var infoRes = httpClient.get(queryUrl, headers);
    return infoRes;
}

var httpClient = new _p.extension.HttpClient();
var moment = require("moment").moment;
moment = require("moment_timezone_with_data").mtz;
var _ = require("underscore")._;
var personium = require("personium").personium;
var accInfo = require("acc_info").accInfo;