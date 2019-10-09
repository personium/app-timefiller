/**
 * Personium
 * Copyright 2019 FUJITSU LIMITED
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const MAX_PLANLIST_SIZE = 10;

function createDateFormat() {
  return (i18next.language == 'ja') ? 'M/DD(ddd)' : 'ddd, MMM DD';
} 

(i18next.language == 'ja')
  ? 'M/DD(ddd)' : 'ddd, MMM DD';

$(function() {
  $("#setting_btn").show();
  sessionStorage.screen = "plan";
  setTargetDay();
  // Workaround: wait for i18n.language initilization
  // displayPlanningList();
  setTimeout(displayPlanningList, 50);
  const todayFormat = createDateFormat();

  // Set up next / previous button when ready
  $('#prev-btn').off().click(function () {
    nowMoment.add(-1,"day");
    sessionStorage.day = nowMoment.format("YYYY-MM-DD");
    $("#title-date").text(nowMoment.format(todayFormat));
    displayPlanningList();
  });
  
  $('#next-btn').off().click(function () {
    nowMoment.add(1,"day");
    sessionStorage.day = nowMoment.format("YYYY-MM-DD");
    $("#title-date").text(nowMoment.format(todayFormat));
    displayPlanningList();
  });
});

function setTargetDay() {
  const searchParams = new URLSearchParams(location.search);
  const day = searchParams.get("day");
  if (day && moment(day).isValid()) {
    sessionStorage.day = day;
  }
}

function displayPlanningList() {
  moment.locale(i18next.language);
  nowMoment = moment(sessionStorage.day);
  const todayFormat = createDateFormat();
  $("#title-date").text(nowMoment.format(todayFormat));
  const paramObj = {
    'startDate': nowMoment.startOf("day").add(8,"hour").toISOString(),
    'endDate': nowMoment.endOf("day").toISOString()
  };
  paramObj.callback = function(odataObj) {
    planList = odataObj.d.results;
    getPlanningAPI()
      .done(setPlanList)
      .fail(function() {
        console.log(e);
      })
      .always(function() {
        setHandlebars();
      });
  }
  getSortedEvents(paramObj);
}

function setPlanList(planningObj) {
  if (_.isUndefined(sessionStorage.planStatus) || _.isNull(sessionStorage.planStatus)) {
    $("title").text(i18next.t("glossary:planListMessage.title"));
    $("#planList").addClass("current");
    $("#considerationList").removeClass("current");
    if (sessionStorage.keywords) {
      const keywords = JSON.parse(sessionStorage.keywords);
      events = createRecommendedList(planList, keywords, MAX_PLANLIST_SIZE)
    } else {
      events = _.sample(planList, MAX_PLANLIST_SIZE);
    }
    events = _.sortBy(events, 'startDate');

    _.each(planningObj.d.results, function(p_event, p_index, p_list) {
      _.every(events, function(event) {
        if (p_event.event_id == event.__id) {
          event.planStatus = p_event.planStatus;
          return false;
        }
        return true;
      })
    });
  } else {
    $("title").text(i18next.t("glossary:FavoriteListMessage.title"));
    $(".header-title .title").text(i18next.t("glossary:FavoriteListMessage.title"));
    $("#considerationList").addClass("current");
    $("#planList").removeClass("current");
    planStatus = sessionStorage.planStatus;
    events = planningObj.d.results;
    _.each(events, function(p_event, p_index, p_list) {
      _.every(planList, function(event) {
        if (planStatus == p_event.planStatus && p_event.event_id == event.__id) {
          $.extend(p_event, event);
          return false;
        }
        return true;
      })
    });
  }

  console.log(events);

}

setHandlebars = function() {
  dataCnt = events.length;
  // If there is no event, display a message to that effect
  if (dataCnt > 0) {
    $("#plan-list").show();
    $("#not-plan-list").hide();
  } else {
    $("#plan-list").hide();
    $("#not-plan-list").show();
  }
  
  Handlebars.registerHelper({
    'eq': function(v1, v2) {
      return v1 == v2;
    },
    'time': function(date) {
      return moment(date).format('H:mm');
    },
    'ff_date': function(date) {
      let dateFF = nowMoment;
      if (date && dateFF.isSame(moment(date), 'day')) {
        return true;
      } else {
        dataCnt--;
        if (dataCnt == 0) {
          // If there is no event on the day, display a message that there is no event
          $("#plan-list").hide();
          $("#not-plan-list").show();
        }
        return false;
      }
    },
    'star': function(count) {
      if (!count) {
        return 0;
      }
      return count;
    },
    'noImage': function() {
      return Common.getAppCellUrl() + "__/html/img/no_image_thumbnail.jpg";
    }
  });
  var source = $("#plans-template").text();
  var template = Handlebars.compile(source);
  var html = template(events);
  $("#plan-list").html(html);
}
