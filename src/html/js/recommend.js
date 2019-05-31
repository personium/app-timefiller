function getRecommendList(nowDate, callback) {
  let urlOData = Common.getAppCellUrl() + "__/OData/EventList";
  let startMoment = moment(nowDate).startOf("day").add(8,"hour");
  let endMoment = moment(nowDate).endOf("day");
  let query = {
    "$top": 1000,
    "$filter": "startDate gt datetimeoffset'"+startMoment.toISOString()+"' and startDate le datetimeoffset'"+endMoment.toISOString()+"'",
    "$orderby": "startDate asc, endDate desc"
  }
  
  let queryStr = $.param(query);
  let queryUrl = urlOData + "?" + queryStr;
  // Get plan list and list under consideration
  $.when(
    getAPI(queryUrl, Common.getToken()),
    getPlanningAPI(),
    getMyDataAPI('interests.json')
  ).done(function(planObj, planningObj, myInterests) {
    // TODO Handle Error Response
    let planList = planObj[0].d.results;
    let planningList = planningObj[0].d.results;
    const myKeywords = myInterests[0].keywords;
    if (!_.isUndefined(myKeywords)) {
      sessionStorage.keywords = JSON.stringify(myKeywords);
    }
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

    // Calendar linkage
    let cSchedule = {
      "allday": [],
      "oneday": []
    };
    getPCalendarSchedule(startMoment.format("YYYY-MM-DD")).done(function(schedule) {
      cSchedule = schedule;
    }).fail(function(e) {
      console.log(e);
    }).always(function() {
      // calendar:allday
      if (cSchedule.allday.length > 0) {
        $("#recommended-schedule").addClass("mask-event");
        recommendSchedule.push({
          "type": "allday",
          "title": cSchedule.allday,
        })
      }

      // home
      recommendSchedule.push({
          "type": "home",
          "planStatus": "confirm",
          "title": "自宅",
          "startDate": startMoment.toISOString(),
          "endDate": moment(startMoment).add(30, "minutes").toISOString()
      });

      // calendar:oneday
      recommendSchedule = setRecommendSchedule(recommendSchedule, cSchedule.oneday);

      // Review / Participation
      recommendSchedule = setRecommendSchedule(recommendSchedule, todayPlanningList);
      
      // Plan list related to my keywords
      const filteredPlanList = filterByKeywords(planList, myKeywords);
      recommendSchedule = setRecommendSchedule(recommendSchedule, filteredPlanList);

      // Other
      recommendSchedule = setRecommendSchedule(recommendSchedule, planList);
      
      let lastHomeEndMoment = moment(recommendSchedule[recommendSchedule.length - 1].endDate);
      var homePlan = {
          "type": "home",
          "planStatus": "confirm",
          "title": "自宅",
          "startDate": lastHomeEndMoment.add(30, "minutes").toISOString()
      }
      if (checkLonLat(recommendSchedule, homePlan, recommendSchedule.length - 1)) {
        recommendSchedule.push(getMove());
      }
      recommendSchedule.push(homePlan);
  
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
      // Get the end date and time of scheduled registration event
      let planEndMoment = moment(plan.endDate);
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
          let tempPlanEndMoment = moment(planEndMoment);
          if (res.longitude && res.latitude) {
            // Calculate travel time if latitude / longitude is registered to the next event of the event to be inserted
            let lon = plan.longitude;
            let lat = plan.latitude;
            if (!lon || !lat) {
              // If there is no latitude / longitude in the event to be inserted, use the previous latitude / longitude
              for (var i = tempPrevCnt; i >= 0; i--) {
                if (result[i].longitude && result[i].latitude) {
                  lon = result[i].longitude;
                  lat = result[i].latitude;
                  break;
                }
              }
            }
            // Get travel time (minutes)
            let addMinutes = getTravelTime(res.longitude, res.latitude, lon, lat);
            tempPlanEndMoment = moment(planEndMoment).add(addMinutes, "minutes");
          }
          if (resStartMoment.isSameOrAfter(tempPlanEndMoment)) {
            if (tempPrevRes) {
              let prevResEndMoment = moment(tempPrevRes.endDate);
              if (plan.longitude && plan.latitude) {
                // Calculate the travel time if latitude / longitude is registered for the event to be inserted
                let prevLonLatIndex = tempPrevCnt;
                // Get last latitude and longitude
                for (var i = tempPrevCnt; i >= 0; i--) {
                  if (result[i].longitude && result[i].latitude) {
                    prevLonLatIndex = i;
                    break;
                  }
                }
                let addMinutes = getTravelTime(result[prevLonLatIndex].longitude, result[prevLonLatIndex].latitude, plan.longitude, plan.latitude);
                prevResEndMoment = moment(tempPrevRes.endDate).add(addMinutes, "minutes");
              }
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
          if (result[pushCnt - 1] && result[pushCnt - 1].type == "transportation") {
            pushCnt--;
          }
          result.splice(pushCnt, 0, plan);
          if (checkLonLat(result, plan, pushCnt)) {
            result.splice(pushCnt, 0, getMove());
          }
        } else if (tempPrevRes && moment(tempPrevRes.endDate).add(30, "minutes").isSameOrBefore(planStartMoment)) {
          result.push(plan);
          // Insert an event
          if (checkLonLat(result, plan, result.length - 1)) {
            result.splice(result.length - 1, 0, getMove());
          }
          
        }
      }
    }
  })

  return result;
}

/**
 * Find moving time from start point to end point(minutes)
 * (Unmounted: fixed for 30 minutes)
 */
function getTravelTime(stLon, stLat, edLon, edLat) {
  return 30;
}

/**
 * Check the latitude and longitude of the event to determine the need for travel time
 */
function checkLonLat(resultList, plan, index) {
  if (!resultList[index-1]) {
    return false;
  }

  if (plan.type != "home") { //　Interim: type = "home" needs to be moved
    if (!plan.longitude || !plan.latitude) {
      return false;
    }
  }

  return true;
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