/**
 * Personium
 * Copyright 2018 FUJITSU LIMITED
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

/*
 * The followings should be shared among applications.
 */

$(function () {

  Clicked_News_Footer_Btn();
  Clicked_Slide_Btn();
  Pressing_Stamp()

  /**
   * Clicked_News_Footer_Btn
   * param:none
   */
  function Clicked_News_Footer_Btn() {
    $('.plan-footer-btn').on('click', function () {
      $(this).toggleClass('clicked');
      if ($(this).hasClass('clicked')) {
        let strLabel = $(this).data('labelNg');
        $(this).text(strLabel||'キャンセルする');
      } else {
        let strLabel = $(this).data('label');
        $(this).text(strLabel);
      }

      return false;
    });
  }

  /**
   * Clicked_Slide_Btn
   * param:none
   */
  function Clicked_Slide_Btn() {
    var slideWidth = $('.slider .list').outerWidth();
    var slideNum = $('.slider .list').length;
    var slideSetWidth = slideWidth * slideNum;
    var slideCurrent = 0;
    var date = new Date("2018/5/18");
    var week = ["(日)", "(月)", "(火)", "(水)", "(木)", "(金)", "(土)"];
    $('.slide-set').css('width', slideSetWidth);

    var sliding = function () {
      if (slideCurrent < 0) {
        slideCurrent = 0;
      } else if (slideCurrent > slideNum - 1) {
        slideCurrent = slideNum - 1;
      }
      $('.slide-set').animate({
        left: slideCurrent * -slideWidth
      });
    }

    // Clicked Next Button
    $('#next-btn').click(function () {
      slideCurrent++;
      if (!(slideCurrent > slideNum - 1) ) {
        date.setDate(date.getDate() + 1);
        setDate_SubHeader();
      }

      sliding();
    });

    // Clicked Preview Button
    $('#prev-btn').click(function () {
      slideCurrent--;
      if (!(slideCurrent < 0)) {
        date.setDate(date.getDate() - 1);
        setDate_SubHeader();
      }
      sliding();

    });

    function setDate_SubHeader() {
      var week_num = date.getDay();
      var date_str = (date.getMonth() + 1) + "/" + date.getDate() + week[week_num];
      $('.sub-header > span').text(date_str);
    }

    $('.slider').on('touchstart', onTouchStart);
    $('.slider').on('touchmove', onTouchMove);
    $('.slider').on('touchend', onTouchEnd);
    var direction, position;

    function onTouchStart(event) {

      position = getPosition(event);
      direction = '';
    }

    function onTouchMove(event) {
      if (position - getPosition(event) > 70) {
        direction = 'left';
      } else if (position - getPosition(event) < -70) {
        direction = 'right';
      }
    }

    // Flick Page Move
    function onTouchEnd(event) {
      if (direction == 'right') {
        slideCurrent--;
        sliding();
      } else if (direction == 'left') {
        slideCurrent++;
        sliding();
      }
    }

    function getPosition(event) {
      return event.originalEvent.touches[0].pageX;
    }

  }

  /**
   * Pressing_Stamp
   * param:none
   */
  function Pressing_Stamp() {
    $(".stamp-large").css({
      "top": 10 + "px",
      "right": 10 + "px"
    });

    $('.plan-star-btn').on('click', function () {
      if ($(this).hasClass('clicked')) {
        if ($(".joining-stamp").css("display") == "none" && $(".consider-stamp").css("display") == "none") {
          setTimeout(function () {
            $(".consider-stamp").toggle();
            $(".consider-stamp").addClass("animate");
          }, 50);

          updatePlanning(eventId, "consideration");
        }
      } else {
        if ($(".joining-stamp").css("display") == "none") {
          $(".consider-stamp").toggle();
          deletePlanning(eventId);
        }
      }
    });

    $('.plan-check-btn').on('click', function () {
      if ($(this).hasClass('clicked')) {
        if (!($(".consider-stamp").css("display") == "none")) {
          $(".consider-stamp").toggle();
        }
        setTimeout(function () {
          $(".joining-stamp").toggle();
          $(".joining-stamp").addClass("animate");
        }, 50);
      } else {
        $(".joining-stamp").toggle();
        if ($(".consider-stamp").css("display") == "none") {
          if ($(".plan-star-btn").hasClass('clicked')) {
            setTimeout(function () {
              $(".consider-stamp").toggle();
              $(".consider-stamp").addClass("animate");
            }, 50);
          }
        }
      }
    });
  }
});
