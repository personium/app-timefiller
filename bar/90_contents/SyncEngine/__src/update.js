/*
 * Call this engine script regularly to update the organization Cell's event list.
 */
function(request) {
    try {
        var list, result;
        var requestUrl = "";

        /*
         * Test dummy data
         */
        //list = getData(requestUrl);
        var currentDatetime = moment.tz("Asia/Tokyo");
        list = [
            {
                id: "5ab92fbd924341818ac25aac47676d68",
                description: "Personium " + currentDatetime.format(),
                postDate: toPersoniumDatetimeFormatTZ("2019-05-28 09:30:00", "Asia/Tokyo")
            }
        ];
        
        _.each(list, function(element, index, list) {
            var data = convertData(element);
            updateTableEntry(data);
        });
        
        return personium.createResponse(200, "Succeed in updating events.");
    } catch(e) {
        return personium.createErrorResponse(e);
    }
};

var getData = function (requestUrl) {
    var url = requestUrl; // API that get data from other server
    var headers = {'Accept':'application/json'};
    var httpCodeExpected = 200;
    
    return personium.httpGETMethod(url, headers, httpCodeExpected)
};

/*
 * Implement this function to convert retrieved data to the format of Events table.
 */
var convertData = function (rawData) {
    var newData = {};
    newData.__id = rawData.id;
    return _.extend(newData, rawData);
};

var toPersoniumDatetimeFormatTZ = function(str, timezone){
    var newdate = moment.tz(str, timezone);
    return "/Date(" + newdate.valueOf() + ")/";
};

// tableName == 'Events'
var getTable = function (tableName) {
    return _p.as('serviceSubject').cell().box().odata('OData').entitySet(tableName);
    
    /*
    var accInfo = require("acc_info").accInfo;
    
    //OData Service Collection of the App Cell this script is running on
    return _p.as(accInfo.APP_CELL_ADMIN_INFO).cell().box('app').odata('survey').entitySet(tableName);
    */
};

var getEntry = function(data) {
    var table = getTable('Events');
    return table.retrieve(data.id);
};

/*
 * Register a new entry or modified current entry.
 */
var updateTableEntry = function(data) {
    var table = getTable('Events');
    data.__id = data.id;
    var obj;
    try {
        obj = getEntry(data);

        obj = table.merge(obj.__id, data, "*");
        
        // get the final merged reply
        obj = getEntry(data);
    } catch(e) {
        // Create a new entry
        obj = table.create(data);
    }
    return obj;
};
    
/*
 * In order to use helpful functions, you need to "require" the library.
 */
var _ = require("underscore")._;
var personium = require("personium").personium;
var moment = require("moment").moment;
moment = require("moment_timezone_with_data").mtz;
