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

$(function() {
  $("#setting_btn").show();
  sessionStorage.screen = "plan";
  let searchParams = new URLSearchParams(location.search);
  if (searchParams.get("day")) {
    if (moment(searchParams.get("day")).isValid()) {
      sessionStorage.day = searchParams.get("day");
    }
  }
  nowMoment = moment(sessionStorage.day);
  $("#title-date").text(nowMoment.format('M/DD(ddd)'));
  var paramObj = {};
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
});

function setPlanList(planningObj) {
  if (_.isUndefined(sessionStorage.planStatus) || _.isNull(sessionStorage.planStatus)) {
    $("title").text("プラン一覧");
    $("#planList").addClass("current");
    $("#considerationList").removeClass("current");
    events = planList;
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
    $("title").text("検討中一覧");
    $(".header-title .title").text("検討中一覧");
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
  $("#plan-list").show();
  $("#not-plan-list").hide();
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
    }
  });
  var source = $("#plans-template").text();
  var template = Handlebars.compile(source);
  var html = template(events);
  $("#plan-list").html(html);
}

$('#prev-btn').off().click(function () {
  nowMoment.add(-1,"day");
  sessionStorage.day = nowMoment.format("YYYY-MM-DD");
  $("#title-date").text(nowMoment.format('M/DD(ddd)'));
  setHandlebars();
});

$('#next-btn').off().click(function () {
  nowMoment.add(1,"day");
  sessionStorage.day = nowMoment.format("YYYY-MM-DD");
  $("#title-date").text(nowMoment.format('M/DD(ddd)'));
  setHandlebars();
});
