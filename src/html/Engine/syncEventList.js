/*
 * When using this engine, please use the account with the following authority for accInfo.APP_CELL_ADMIN_INFO.
 * ・Read / write to "__/MyData"
 * ・Read / write to "__/OData"
 * ・auth-read
 * ・social-read
 */
function(request){
    try {
        var startDateTime = new Date();

        var cell = dc.as(accInfo.APP_CELL_ADMIN_INFO).cell();

        var syncState = getFile('sync.json', cell);
        setDefaultState(syncState);
        
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

            syncLoop:
            for (var sync = 0; sync < 1; sync++) {
                for (var i = 0; i < results.length; i++) {
                    var uri = results[i].uri;
                    var matchUri = uri.match(/\('(.+)'\)/);
                    var cellUrl = matchUri[1];
    
                    var matchIndex = syncState.findIndex(function(item) {
                        return item.cell == cellUrl;
                    })
                    if (matchIndex >= 0) {
                        var match = syncState[matchIndex];
                        if (match.status == "finished") {
                            continue;
                        }
                    } else {
                        syncState.push({cell: cellUrl});
                        matchIndex = syncState.length - 1;
                    }
    
                    // Get app certified transcell token
                    var tToken = getTranscellToken(cellUrl, cell.getToken().refresh_token);
                    var aToken = personium.getAppToken(cellUrl);
                    var bToken = getBoxAccessToken(cellUrl, tToken.access_token, aToken.access_token);
    
                    // Get Box URL
                    var boxUrl = getBoxUrl(cellUrl, bToken.access_token);
    
                    // Get event details from the cell that registered the event
                    var infoRes = getEventInfo(boxUrl, bToken.access_token, syncState[matchIndex].updated);
    
                    if (infoRes.status == "200") {
                        var infoBody = JSON.parse(infoRes.body);
                        var infoList = infoBody.d.results;
                        var updated;
                        for (var j = 0; j < infoList.length; j++) {
                            if ((new Date().getTime() - startDateTime.getTime()) > 30000) {
                                // sync update 処理
                                syncState[matchIndex].updated = updated;
                                break syncLoop;
                            }
                            var info = infoList[j];
                            updated = info.__updated;
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

                        // sync finish 処理
                        syncState[matchIndex].updated = updated;
                        syncState[matchIndex].status = "finished";
                    }
                }

                // syncState　finish リセット
                syncState = resetFinished(syncState);
            }

            // syncState 更新
            updateFile('sync.json', syncState, cell);
        }

        return personium.createResponse(200, "We have updated "+updateCnt+" item of data.");
    } catch (e) {
        return personium.createErrorResponse(e);
    }
}

function getFile(filename, cell) {
  //OData Service Collection of the App Cell this script is running on
  var box = cell.box(); // _p.as('serviceSubject').cell().box()
  var string = box.getString('MyData/'+ filename);
  return JSON.parse(string);
};

function setDefaultState(syncState) {
    if (syncState.length == 0) {
        syncState = [];
    }
};

function updateFile(filename, contents, cell) {
  var path = "MyData/" + filename;
  var jsonObj = contents;
  var box = cell.box(); // _p.as('serviceSubject').cell().box()
  if (!_.isEmpty(jsonObj)) {
      box.put({
          path: path,
          data: JSON.stringify(jsonObj),
          contentType: "application/json",
          charset: "utf-8",
          etag: "*"
      });
  };
};

function resetFinished(contents) {
    for(var i = 0; i < contents.length;i++) {
        contents[i].status = "";
    }

    return contents;
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
function getEventInfo(eventCellBoxUrl, token, targetUpdate) {
    var url = eventCellBoxUrl + "OData/Events";
    var filter = "";
    if (targetUpdate) {
        filter = "$filter=__updated ge datetimeoffset'" + moment.tz(targetUpdate, "Asia/Tokyo").toISOString() + "'";
    }
    var select = "$select=__id,title,startDate,endDate,image,serviceName,serviceImage,latitude,longitude,recruiter,address,keywords";
    var top = "$top=10000";
    var inlinecount = "$inlinecount=allpages";
    var orderBy = "$orderby=__updated asc";
    var queryUrl = url + "?" + encodeURI(filter + "&" + select + "&" + top + "&" + inlinecount + "&" + orderBy);
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