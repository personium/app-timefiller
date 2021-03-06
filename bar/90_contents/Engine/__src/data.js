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
                
                result = _updateAttr(params);
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
    
/*
 * In order to use helpful functions, you need to "require" the library.
 */
var _ = require("underscore")._;
var personium = require("personium").personium;
