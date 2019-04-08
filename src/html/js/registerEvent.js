// 1ページの表示件数
PAGE_DISP_NUM = 10;

nowPage = 1;

readRoleName = "EventRead";

function getEventList(paramObj) {
	let urlOData = Common.getBoxUrl() + 'OData/Events';
	//let urlOData = "https://app-timefiller-wakaba.demo.personium.io/__/" + 'OData/Events';
	let query = {
		"$top": 1000,
		"$orderby": "startDate asc, endDate desc"
	}
	let queryStr = $.param(query);
	let queryUrl = urlOData + "?" + queryStr;
	getAPI(queryUrl, Common.getToken()).done(function(odataObj) {
		if ((typeof paramObj.callback !== "undefined") && $.isFunction(paramObj.callback)) {
      		paramObj.callback(odataObj);
  		}
  	}).fail(function(e) {
    	console.log(e);
  	})
}

function publishEvent() {
	let createFlg = 2; // 0:Not required 1:Role assignment 2:Create external cell
	Common.getExtCellRoleList(APP_URL).done(function(data) {
		console.log(data);
		let res = data.d.results;
		createFlg = 1;
		if (res.length > 0) {
			_.each(res, function(d,i,l) {
				var matchName = d.uri.match(/\(Name='(.+)',/);
	            var roleName = matchName[1];
	            if (roleName == readRoleName) {
	            	createFlg = 0;
	            }
			})
		}
	}).always(function() {
		switch(createFlg) {
			case 1:
				// Role grant
				Common.restAddExtCellLinkRoleAPI(APP_URL, Common.getBoxName(), readRoleName).fail(function(e) {
					console.log(e);
				});
				break;
			case 2:
				// Role creation after creating an external cell
				let jsonData = {
					"Url": APP_URL
				}
				// Create external cell
				Common.restCreateExtCellAPI(Common.getCellUrl(), Common.getToken(), jsonData).done(function() {
					// Role grant
					Common.restAddExtCellLinkRoleAPI(APP_URL, Common.getBoxName(), readRoleName).fail(function(e) {
						console.log(e);
					});
				}).fail(function(e) {
					console.log(e);
				});
				
				break;
		}
	})
}