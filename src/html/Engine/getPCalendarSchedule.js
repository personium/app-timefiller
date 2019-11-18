// Login
function(request){
    try {
        personium.validateRequestMethod(["POST"], request);

        var params = personium.parseBodyAsQuery(request);
        // verify parameter information
        personium.setAllowedKeys(['p_target', 'refToken', 'targetDay']);
        personium.setRequiredKeys(['p_target', 'refToken', 'targetDay']);
        personium.validateKeys(params);

        // Definition of return variable
        var calendarSchedule = {
            "allday": [],
            "oneday": []
        };
        
        // Make sure that this endpoint is executed by the rightful user by cross-checking the Box URL retrieved by token with p_target
        verifyUserUrl(request, params.p_target);
        
        // Acquisition of token for Calendar Box access
        var pcalToken = getCalAccessToken(params);

        var url;
        var headers;
        var httpClient = new _p.extension.HttpClient();
        // get BoxName
        url = params.p_target + "__box";
        headers = {
            "Accept": "application/json",
            "Authorization": "Bearer " + pcalToken.access_token
        };
        var pcalBoxRes = httpClient.get(url, headers);
        if (pcalBoxRes.status == "403" || pcalBoxRes.status == "404") {
            // Personium Calendar is not installed
            return personium.createResponse(200, calendarSchedule);
        } else {
            checkStatusCode(pcalBoxRes, 'Get calendar box url failed.');
        }
        var pcalBox = JSON.parse(pcalBoxRes.body);
        var pcalBoxUrl = pcalBox.Url;

        // get Calendar Event
        var dayMoment = moment.tz(params.targetDay, TZ);
        var sDate = dayMoment.startOf("day").toISOString();
        var eDate = dayMoment.endOf("day").toISOString();
        url = pcalBoxUrl + "OData/vevent?";
        url += encodeURI("$top=1000&$filter=dtend ge datetimeoffset'"+sDate+"' and dtstart le datetimeoffset'"+eDate+"'&$orderby=dtstart asc");
        var pcalDataRes = httpClient.get(url, headers);
        if (pcalDataRes.status == "403" || pcalDataRes.status == "404") {
            // Personium Calendar is not installed
            return personium.createResponse(200, calendarSchedule);
        } else {
            checkStatusCode(pcalDataRes, 'Get calendar event odata failed.');
        }
        var pcalDataBody = JSON.parse(pcalDataRes.body);
        var pcalData = pcalDataBody.d.results;

        // get calendarCell image
        var pcalProfImage = "";
        url = accInfo.COOP_APP_CELL_URL + "__/profile.json";
        headers = {
            "Accept": "application/json",
        };
        var pcalProfRes = httpClient.get(url, headers);
        if (pcalProfRes.status != "403" && pcalProfRes.status != "404") {
            var pcalProf = JSON.parse(pcalProfRes.body);
            if (pcalProf.Image) {
                pcalProfImage = pcalProf.Image;
            }
        } else {
            checkStatusCode(pcalProfRes, 'Get calendar app cell profile.json failed.');
        }

        // Format to time filling(Duplicate events are combined into one event)
        var cTitle = []; // title
        var cSDate = ""; // event start date
        var cEDate = ""; // event end date
        var no = 1;
        _.each(pcalData, function(data, index, list) {
            if (data.allDay) {
                calendarSchedule.allday.push(data.summary);
            } else {
                if (cSDate == "") {
                    // First event
                    cTitle.push({"title":data.summary});
                    cSDate  = data.dtstart;
                    cEDate = data.dtend;
                } else {
                    var tempPrevDate = moment.tz(cEDate, TZ);
                    var tempSDate = moment.tz(data.dtstart, TZ);
                    if (tempPrevDate.isSameOrAfter(tempSDate)) {
                        // Added title because event is duplicated
                        cTitle.push({"title":data.summary});
                        var tempEDate = moment.tz(data.dtend, TZ);
                        if (tempPrevDate.isBefore(tempEDate)) {
                            cEDate = data.dtend;
                        }
                    } else {
                        var schedule = {
                            "__id": "calendar_event" + no,
                            "type": "calendar",
                            "summary": cTitle,
                            "startDate": cSDate,
                            "endDate": cEDate,
                            "image": pcalProfImage
                        };
                        calendarSchedule.oneday.push(schedule);
                        no++;
    
                        cTitle = [];
                        cTitle.push({"title":data.summary});
                        cSDate  = data.dtstart;
                        cEDate = data.dtend;
                    }
                }     
            }       
        })
        if (cSDate != "") {
            var schedule = {
                "__id": "calendar_event" + no,
                "type": "calendar",
                "summary": cTitle,
                "startDate": cSDate,
                "endDate": cEDate,
                "image": pcalProfImage
            };
            calendarSchedule.oneday.push(schedule);
        }

        return personium.createResponse(200, calendarSchedule);

    } catch (e) {
        return personium.createErrorResponse(e);
    }
}
function verifyUserUrl(request, url) {
    var httpClient = new _p.extension.HttpClient();
    var token = request["headers"]["authorization"];
    var headers = {
        "Accept": "application/json",
        "Authorization": token // "Bearer" included
    };
    
    // get BoxName 
    var res = httpClient.get(url + "__box", headers);
    var status = parseInt(res.status);
    if (status >= 400) {
        var err = [
            "io.personium.client.DaoException: " + status + ",",
            res.body
        ].join("");
        throw new _p.PersoniumException(err);
    }
    var box = JSON.parse(res.body);
    var boxUrl = box.Url;
    if (!boxUrl.startsWith(url)) {
        var err = [
            "io.personium.client.DaoException: 400,",
            JSON.stringify({
                "code": "PR400-AN-0002",
                "message": {
                    "lang": "en",
                    "value": "Invalid p_target"
                }
            })
        ].join("");
        throw new _p.PersoniumException(err);
    }
}
function getCalAccessToken(params) {
    var userCellUrl = params.p_target;
    var url;
    var headers = {'Accept': 'application/json'};
    var contentType = "application/x-www-form-urlencoded";
    var httpClient = new _p.extension.HttpClient();
    
    // Get App token for app-timefiller (app-personium-calendar)
    var appTokenTimefiller = _p.as(accInfo.COOP_APP_CELL_ADMIN_INFO).cell(accInfo.APP_CELL_URL).getToken();
    
    // Get token for cross-app access for app-timefiller
    url = accInfo.APP_CELL_URL + "__token"; // app-timefiller
    var body = "grant_type=password&client_id=" + accInfo.COOP_APP_CELL_URL + "&client_secret=" + appTokenTimefiller.access_token + "&username=" + accInfo.APP_CELL_ADMIN_INFO.userId + "&password=" + accInfo.APP_CELL_ADMIN_INFO.password;
    var res = httpClient.post(url, headers, contentType, body);
    checkStatusCode(res, "Failed to get cross-app access token for app-timefiller!");
    var crossAppToken = JSON.parse(res.body);
    
    // Get App token for userCellUrl (app-personium-calendar)
    var appTokenUser = _p.as(accInfo.COOP_APP_CELL_ADMIN_INFO).cell(userCellUrl).getToken();
    
    // Get Transcell token
    url = accInfo.APP_CELL_URL + "__token"; // app-timefiller
    body = "grant_type=refresh_token&client_id=" + accInfo.COOP_APP_CELL_URL + "&client_secret=" + appTokenTimefiller.access_token + "&p_target=" + userCellUrl + "&refresh_token=" + crossAppToken.refresh_token;
    res = httpClient.post(url, headers, contentType, body);
    checkStatusCode(res, "Failed to get Transcell token for app-timefiller!");
    var transcellToken = JSON.parse(res.body);
    
    // Get protected box access token (user's calendar box)
    url = userCellUrl + "__token";
    body = "grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer&client_id=" + accInfo.COOP_APP_CELL_URL + "&client_secret=" + appTokenUser.access_token + "&assertion=" + transcellToken.access_token;
    res = httpClient.post(url, headers, contentType, body);
    checkStatusCode(res, "Failed to get protected box access token (user's calendar box)!");
    return JSON.parse(res.body);
}
function checkStatusCode(res, message) {
    var status = parseInt(res.status);
    if (status >= 400) {
        var err = new Error(message + 'body=(' + res.body + ')');
        err.code = status;
        throw err;
    }
}

/*
 * In order to use helpful functions, you need to "require" the library.
 */
var _ = require("underscore")._;
var personium = require("personium").personium;
var moment = require("moment").moment;
moment = require("moment_timezone_with_data").mtz;
var accInfo = require("acc_info").accInfo;

/*
 * Variables
 */
var API_INFO = accInfo.API_INFO;
var TZ = API_INFO.tz;
