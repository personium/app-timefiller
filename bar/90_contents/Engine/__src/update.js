function(request) {
    try {
        var _updateAttr = function(params){
            var path = "MyData/" + params.filename;
            var jsonObj = params.contents;
            var profile = {
                status: "failed"
            };
            if (!_.isEmpty(jsonObj)) {
                _p.localbox().put({
                    path: path,
                    data: JSON.stringify(jsonObj),
                    contentType: "application/json",
                    charset: "utf-8",
                    etag: "*"
                });

                var jsonStr = getFile({filename: params.filename});
                profile.contents = JSON.parse(jsonStr);
                profile.status = "succeed";
            };

            return profile;
        };

        // Only support GET & POST for now
        personium.validateRequestMethod(["GET", "POST"], request);
        
        var response, result;

        switch(request.method) {
            case "GET":
                // Validate query in URL
                var query = personium.parseQuery(request);
                personium.setAllowedKeys(["filename"]);
                personium.setRequiredKeys(["filename"]);
                personium.validateKeys(query);
                
                // Profile JSON
                var jsonStr = getFile(query);
                var profile = JSON.parse(jsonStr);
                response = profile;
                result = response;
                break;
            case "POST":
                // Validate parameters
                var params = personium.parseBodyAsJSON(request);
                
                result = getData(params);
                result = convertData(result);
                registerEntry(result);
                break;
        }
        
        return personium.createResponse(200, result);
    } catch(e) {
        return personium.createErrorResponse(e);
    }
};

var getFile = function (query) {   
    //OData Service Collection of the App Cell this script is running on
    return _p.localbox().getString('MyData/'+ query.filename);
};

// tableName == 'Events'
var getTable = function (tableName) {
    return _p.localbox().odata('OData').entitySet(tableName);
    
    /*
    var accInfo = require("acc_info").accInfo;
    
    //OData Service Collection of the App Cell this script is running on
    return _p.as(accInfo.APP_CELL_ADMIN_INFO).cell().box('app').odata('survey').entitySet(tableName);
    */
};

var getEntry = function(params) {
    var table = getTable('Events');
    return table.retrieve(params.pid);
};

var registerEntry = function(params) {
    var table = getTable('Events');
    params.__id = params.pid;
    var obj;
    try {
        obj = getReply(params);
        var oldRawData = JSON.parse(obj.rawData);
        var newRawData = JSON.parse(params.rawData);
        var point = calculatePoints(oldRawData, newRawData);
        
        // Update rawData with merged information
        params.rawData = JSON.stringify(_.extend(oldRawData, newRawData));
        obj = table.merge(obj.__id, params, "*");
        
        // get the final merged reply
        obj = getReply(params);
        obj.point = point;
    } catch(e) {
        obj = table.create(params);
        obj.point = calculatePoints({}, JSON.parse(params.rawData))
    }
    return obj;
};

var getData = function () {
    var httpClient = new _p.extension.HttpClient();
    var httpCode, response;

    // Get Data
    try {
        var url = params.url;
        var headers = {'Accept':'application/json'};
        response = httpClient.get(url, headers);
    } catch (e) {
        // System exception
        return createResponse(500, e);
    }
    httpCode = parseInt(response.status);
    // Get API usually returns HTTP code 200
    if (httpCode !== 200) {
        // Personium exception
        return createResponse(httpCode, response.body);
    }
    var profileJson = JSON.parse(response.body);
};

/*
 * Implement this function to convert retrieved data to the format of Events table.
 */
var convertData = function (rawData) {
    
};
    
/*
 * In order to use helpful functions, you need to "require" the library.
 */
var _ = require("underscore")._;
var personium = require("personium").personium;
