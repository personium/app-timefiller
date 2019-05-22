// Get my data
// TODO Implement returning my real data
function(request){
    try {
        personium.validateRequestMethod(["POST"], request);

        var results = {
            'keywords': ['キッズ', 'スポーツ']
        };

        return personium.createResponse(200, results);
    } catch (e) {
        return personium.createErrorResponse(e);
    }
}

var APP_CELL_URL = "https://app-timefiller-wakaba.demo.personium.io/";
var APP_USER_ID = "***";
var APP_USER_PASS = "***";
var httpClient = new _p.extension.HttpClient();

var personium = require("personium").personium;
var moment = require("moment").moment;
var _ = require("underscore")._;
