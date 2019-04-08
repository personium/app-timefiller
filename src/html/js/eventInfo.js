$(function () {
    let selectedEventId = location.search.match(/eventId=(.*?)(&|$)/);
    if (_.isUndefined(selectedEventId) || _.isNull(selectedEventId)) {
    	// create
    	let nowMoment = moment();
    	$("#dtstart_date").val(nowMoment.format("YYYY-MM-DD"));
    	$("#dtstart_time").val(nowMoment.format("HH:mm"));
    	$("#dtend_date").val(nowMoment.add(1, 'hours').format("YYYY-MM-DD"));
    	$("#dtend_time").val(nowMoment.format("HH:mm"));

    	$("#edit_btn").on("click", addEvent);
    	$("#b-delete-vevent-ok").hide();
    } else {
    	id = selectedEventId[1];
    	// edit
    	$("#edit_btn").text("編集");
    	$("#edit_btn").on("click", chgSave);
    	let queryUrl = Common.getBoxUrl() + 'OData/Events(\'' + id + '\')';
		getAPI(queryUrl, Common.getToken()).done(function(odataObj) {
			console.log(odataObj);
			setEvent(odataObj.d.results);
			disableControl(true);
  		}).fail(function(e) {
    		console.log(e);
  		})
    }

    $("#cellUrl").val(Common.getCellUrl());
})

function disableControl(disabled) {
	$(".form-control,.event-date").attr("disabled", disabled);
}

function chgSave() {
	$("#edit_btn").text("保存");
	disableControl(false);
	$("#edit_btn").on("click", editEvent);
	$("#b-delete-vevent-ok").hide();
}

function setEvent(data) {
	$("#event-title").val(data.title);
	$("#event-image").val(data.image);
	$("#description").val(data.detail);
	let startMoment = moment(data.startDate);
	$("#dtstart_date").val(startMoment.format("YYYY-MM-DD"));
	$("#dtstart_time").val(startMoment.format("HH:mm"));
	let endMoment = moment(data.endDate);
	$("#dtend_date").val(endMoment.format("YYYY-MM-DD"));
	$("#dtend_time").val(endMoment.format("HH:mm"));
	$("#address").val(data.address);
}

function addEvent() {
	console.log("Add Event");
	if (!inputCheck()) {
		return false;
	}

	let eventInfo = getEventInfo();
	updateEvent(eventInfo);
}

function editEvent() {
	console.log("Update Event");
	if (!inputCheck()) {
		return false;
	}

	let eventInfo = getEventInfo();
	updateEvent(eventInfo, id);
}

function deleteEvent() {
	console.log("Delete Event");
	// Confirmation of deletion
	Common.showConfirmDialog("glossary:eventMessage.confirmDelete", function() {
		$("#modal-common #b-common-cancel").hide();
		deleteVEventAPI(id).done(function() {
			let msgId = "glossary:eventMessage.delete";
			Common.openCommonDialog(msgId, "glossary:eventMessage.back", function() {
				location.href = "index_org.html";
			});
		}).fail(function(e) {
			console.log(e);
		});
	});
}

function inputCheck() {
	// Start date check
	let startDate = $("#dtstart_date").val();
	if (!startDate || startDate == "") {
		$("#errorStartDate").text("開始日を指定して下さい。");
		return false;
	}
	let startTime = $("#dtstart_time").val();
	if (!startTime || startTime == "") {
		$("#dtstart_time").val("00:00");
		return false;
	}
	// End date check
	let endDate = $("#dtend_date").val();
	if (!endDate || endDate == "") {
		$("#errorEndDate").text("終了日を指定して下さい。");
		return false;
	}
	let endTime = $("#dtend_time").val();
	if (!endTime || endTime == "") {
		$("#dtend_time").val("00:00");
		return false;
	}
	// Check if the start and end dates are correct
	let startMoment = moment(startDate + " " + startTime);
	let endMoment = moment(endDate + " " + endTime);
	if (!endMoment.isAfter(startMoment)) {
		$("#errorEndDate").text("終了日は開始日以降の時間を指定して下さい。");
		return false;
	}

	return true;
}

function getEventInfo() {
	let start = $("#dtstart_date").val() + " " + $("#dtstart_time").val();
	let end = $("#dtend_date").val() + " " + $("#dtend_time").val();
	let result = {
		id: "personium",
		title: $("#event-title").val(),
		image: $("#event-image").val(),
		detail: $("#description").val(),
		startDate: "/Date(" + moment(start).valueOf() + ")/",
		endDate: "/Date(" + moment(end).valueOf() + ")/",
		address: $("#address").val(),
		mapImage: "https://app-timefiller-wakaba.demo.personium.io/__/html/diy/img/map/34.66746-135.81908.png"
	};

	return result;
}

function updateEvent(eventInfo, id) {
	// Event registration
	updateEventAPI(eventInfo, id).done(function(data, text, response) {
		let callback = function() {
			let msgId = "glossary:eventMessage.regist";
			if (id) {
				msgId = "glossary:eventMessage.update";
			}
			// Registration success modal
			Common.openCommonDialog(msgId, "glossary:eventMessage.back", function() {
				location.href = "index_org.html";
			});
		}
		if (response.status == 204) {
			updateEventList(id, eventInfo).done(function() {
				callback();
			}).fail(function(e) {
				console.log(e);
			});
		} else {
			callback();
		}
		
	}).fail(function(e) {
		console.log(e);
	});
}

function updateEventAPI(tempEvent, id) {
	let method = "POST";
	let __id = "";
	if (id) {
		method = "PUT";
		__id = "('"+id+"')";
	}

	return $.ajax({
		type: method,
		url: Common.getBoxUrl() + "OData/Events" + __id,
		data: JSON.stringify(tempEvent),
		headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
        }
	})
}

function deleteVEventAPI(id) {
    return $.ajax({
        type: "DELETE",
        url: Common.getBoxUrl() + "OData/Events('" + id + "')",
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
        }
    });
};



/**********************
   Engine
 **********************/
 function updateEventList(id, eventInfo) {
 	let temp = {
 		eventId: id,
 		cellUrl: Common.getCellUrl(),
 		startDate: eventInfo.startDate,
 		endDate: eventInfo.endDate,
 		summary: eventInfo.title,
 		image: eventInfo.image
 	}
 	return $.ajax({
 		type: "POST",
 		url: Common.getAppCellUrl() + "__/html/Engine/registerEventList",
 		data: temp,
 		headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
        }
 	})
 }