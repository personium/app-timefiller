// Login
function(request){
    try {
        personium.validateRequestMethod(["POST"], request);

        var params = personium.parseBodyAsQuery(request);
        // verify parameter information
        personium.setAllowedKeys(['p_target', 'refToken', 'targetDay']);
        personium.setRequiredKeys(['p_target', 'refToken', 'targetDay']);
        personium.validateKeys(params);

        // Get app cell token
        var appToken = _p.as(accInfo.COOP_APP_CELL_ADMIN_INFO).cell(params.p_target).getToken();
        var aaat = appToken.access_token;

        // Definition of return variable
        var calendarSchedule = {
            "allday": [],
            "oneday": []
        };

        // Acquisition of token for Calendar Box access
        var url = params.p_target + "__token";
        var headers = {'Accept': 'application/json'};
        var contentType = "application/x-www-form-urlencoded";
        var body = "grant_type=refresh_token&refresh_token=" + params.refToken + "&client_id=" + accInfo.COOP_APP_CELL_URL + "&client_secret=" + aaat;
        var httpClient = new _p.extension.HttpClient();
        var pcalRes = httpClient.post(url, headers, contentType, body);
        var pcalToken = JSON.parse(pcalRes.body);

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