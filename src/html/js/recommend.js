function getRecommendList(nowDate, callback) {
  let urlOData = APP_URL + "__/OData/EventList";
  let startMoment = moment(nowDate).startOf("day").add(8,"hour");
  let endMoment = moment(nowDate).endOf("day");
  let query = {
    "$top": 1000,
    "$filter": "endDate ge datetimeoffset'"+startMoment.toISOString()+"' and startDate le datetimeoffset'"+endMoment.toISOString()+"'",
    "$orderby": "startDate asc, endDate desc"
  }
  
  let queryStr = $.param(query);
  let queryUrl = urlOData + "?" + queryStr;
  // Get plan list and list under consideration
  $.when(
    getAPI(queryUrl, Common.getToken()),
    getPlanningAPI()
  ).done(function(planObj, planningObj) {
    let planList = planObj[0].d.results;
    let planningList = planningObj[0].d.results;
    // List of plans being considered / participated on the relevant day
    let todayPlanningList = [];
    // Merge the acquired list
    _.each(planList, function(plan, i, list) {
      plan.type = "event";
      _.every(planningList, function(planning) {
        if (plan.__id == planning.event_id) {
          plan.planStatus = planning.planStatus;
          todayPlanningList.push(plan);
          return false;
        }
        return true;
      })
    })

    // Create reccomend event
    let recommendSchedule = [];
    // home
    recommendSchedule.push({
        "type": "home",
        "planStatus": "confirm",
        "title": "自宅",
        "startDate": startMoment.toISOString(),
        "endDate": moment(startMoment).add(30, "minutes").toISOString()
    });

    // Calendar linkage
    let cSchedule = [];
    getPCalendarSchedule(startMoment.format("YYYY-MM-DD")).done(function(schedule) {
      cSchedule = schedule;
    }).fail(function(e) {
      console.log(e);
    }).always(function() {
      // calendar
      recommendSchedule = setRecommendSchedule(recommendSchedule, cSchedule);

      // Review / Participation
      recommendSchedule = setRecommendSchedule(recommendSchedule, todayPlanningList);
      
      // Other
      recommendSchedule = setRecommendSchedule(recommendSchedule, planList);
      let lastHomeEndMoment = moment(recommendSchedule[recommendSchedule.length - 1].endDate);
      recommendSchedule.push(getMove());
      recommendSchedule.push({
          "type": "home",
          "planStatus": "confirm",
          "title": "自宅",
          "startDate": lastHomeEndMoment.add(30, "minutes").toISOString()
      });
  
      if ((typeof callback !== "undefined") && $.isFunction(callback)) {
        callback(recommendSchedule);
      }
    })
  }).fail(function(e) {
    console.log(e);
  })
}

// Add the corresponding event to the schedule list
function setRecommendSchedule(resultList, list) {
  let result = resultList;
  _.each(list, function(plan, i, p_list) {
    // Check if it is already registered
    let grepList = $.grep(result, function(elem, index){return (elem.__id == plan.__id)});
    if (grepList.length <= 0) {
      // Get Start date and time of Scheduled Registration Event
      let planStartMoment = moment(plan.startDate);
      // Get the end date and time of scheduled registration event (provisionally, add 30 minutes travel time)
      let planEndMoment = moment(plan.endDate).add(30, "minutes");
      let tempPrevCnt = 0;
      let tempPrevRes = null;
      let resCnt = 0;
      let pushCnt = -1;
      let skipFlg = false;
      // Search current schedule list
      _.every(result, function(res) {
        // Ignore events that do not have an end date because they are out of scope events such as move
        if (res.endDate) {
          // Get start date and time of scheduled event
          let resStartMoment = moment(res.startDate);
          if (resStartMoment.isSameOrAfter(planEndMoment)) {
            if (tempPrevRes) {
              let prevResEndMoment = moment(tempPrevRes.endDate).add(30, "minutes");
              if (prevResEndMoment.isSameOrBefore(planStartMoment)) {
                // Add an event if time is available to insert in the schedule list
                pushCnt = resCnt;
              } else {
                // Skip registration if there is not enough time to insert
                skipFlg = true;
              }
            } else {
              // Add to the schedule list if it is after the last event in the current schedule list
              pushCnt = resCnt;
            }
            return false;
          }
  
          tempPrevCnt = resCnt;
          tempPrevRes = res;
        }
        resCnt++;    
        return true;
      })
      if (!skipFlg) {
        if (pushCnt >= 0) {
          // Add an event at the end of the schedule
          result.splice(pushCnt-1, 0, plan);
          result.splice(pushCnt-1, 0, getMove());
        } else if (tempPrevRes && moment(tempPrevRes.endDate).add(30, "minutes").isSameOrBefore(planStartMoment)) {
          // Insert an event
          result.push(getMove());
          result.push(plan);
        }
      }
    }
  })

  return result;
}

// Acquisition of movement event
function getMove() {
  return {
    "type": "transportation",
    "title": "移動",
    "distance": "約300M"
  };
}

// Calendar event acquisition API
function getPCalendarSchedule(targetDay) {
  let temp = {
    p_target: Common.getCellUrl(),
    refToken: Common.getRefressToken(),
    targetDay: targetDay
  }
  return $.ajax({
    type: "POST",
    url: Common.getAppCellUrl() + "__/html/Engine/getPCalendarSchedule",
    data: temp,
    headers: {
      'Accept':'application/json',
      'Authorization':'Bearer ' + Common.getToken()
    }
  })
}