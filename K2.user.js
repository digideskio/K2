// ==UserScript==
// @name          KanyashreeHelper
// @namespace     https://github.com/abusalam/KanyashreeHelper
// @description   Helper Script For Kanyashree Approval and Sanction Generation
// @include       http://wbkanyashree.gov.in/*
// @grant         none
// @downloadURL   https://github.com/abusalam/KanyashreeHelper/raw/master/K2.user.js
// @updateURL     https://github.com/abusalam/KanyashreeHelper/raw/master/K2.user.js
// @version       1.0
// @icon          http://www.gravatar.com/avatar/43f0ea57b814fbdcb3793ca3e76971cf
// ==/UserScript==

/**
 * How can I use jQuery in Greasemonkey scripts in Google Chrome?
 * All Credits to Original Author for this wonderfull function.
 *
 * @author  Erik Vergobbi Vold & Tyler G. Hicks-Wright
 * @link    http://stackoverflow.com/questions/2246901
 * @param   {reference} callback
 * @returns {undefined}
 */
function jQueryInclude(callback) {
  var jQueryScript = document.createElement("script");
  var jQueryCDN = "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
  jQueryScript.setAttribute("src", jQueryCDN);
  jQueryScript.addEventListener('load', function() {
    var UserScript = document.createElement("script");
    UserScript.textContent = 'window.jQ=jQuery.noConflict(true);'
        + 'var BaseURL = "http://wbkanyashree.gov.in/";'
        + '(' + callback.toString() + ')();';
    document.head.appendChild(UserScript);
  }, false);
  document.head.appendChild(jQueryScript);
}

/**
 * Main Body of Helper Script For Kanyashree Approval and Sanction Generation
 *
 * @returns {undefined}
 */
jQueryInclude(function() {

  jQ("#top").hide();
  jQ("#header").hide();
  jQ("#footerMain").hide();
  jQ("option").html(function() {
    return jQ(this).val() + " - " + jQ(this).html();
  });
  jQ("#content_spc").css("height", "auto");
  var HackUI = '<div style="text-align:center;clear:both;">'
      + '<div style="text-align:right;" id="Msg"></div>'
      + '<textarea id="AllIDs" rows="20" cols="60"></textarea><br/>'
      + '<input type="button" id="CmdGo" value="Do at Own Risk"/>'
      + '<input type="button" id="CmdStatus" value="Show All"/>'
      + '<input type="button" id="CmdClear" value="Delete"/>'
      + '<input type="button" id="CmdClearStorage" value="Delete All"/>'
      + '</div>';

  var ActionList = '<label for="">Go For: </label>'
      + '<select id="OptAction" >'
      + '<option value="BlockList">1. Block List</option>'
      + '<option value="ClgList">2. College List</option>'
      + '<option value="SchList">3. School List</option>'
      + '<option value="SchListP">4. School List(Pending)</option>'
      + '<option value="ClgAppList">5. College Applicants</option>'
      + '<option value="SchAppList">6. School Applicants</option>'
      + '<option value="SchK2AppList">7. School K2 Applicants</option>'
      + '<option value="Sanction">8. Add To Sanction Order</option>'
      + '</select>';

  if (jQ("#intra_body_area").is(":visible")) {
    jQ("#intra_body_area").after(HackUI);
    jQ("#CmdGo").before(ActionList);
  }

  jQ("[id^=Cmd]").css({
    "margin": "10px",
    "padding": "5px"
  });

  jQ("#Msg").css({
    "text-align": "right",
    "display": "inline-block",
    "border": "2px dashed greenyellow",
    "padding": "10px",
    "margin": "10px",
    "float": "left"
  });

  /**
   * Limits No of AjaxCalls at a time
   *
   * @param {type} Fn
   * @param {type} Arg
   * @returns {Boolean}
   */
  var AjaxFunnel = function(Fn, Arg1, Arg2) {
    var NextCallTimeOut = 2500;
    var PendingAjax = parseInt(localStorage.getItem('AjaxPending'));
    var AjaxLimit = parseInt(localStorage.getItem('AjaxLimit'));
    if (AjaxLimit === null) {
      AjaxLimit = 5;
    }
    if (PendingAjax > AjaxLimit) {
      if (typeof Arg1 === "undefined") {
        setTimeout(AjaxFunnel(Fn), NextCallTimeOut);
      } else if (typeof Arg2 === "undefined") {
        setTimeout(AjaxFunnel(Fn, Arg1), NextCallTimeOut);
      } else {
        setTimeout(AjaxFunnel(Fn, Arg1, Arg2), NextCallTimeOut);
      }
      return false;
    } else {
      if (typeof Arg1 === "undefined") {
        AjaxPending("Start");
        return Fn();
      } else if (typeof Arg2 === "undefined") {
        AjaxPending("Start");
        return Fn(Arg1);
      } else {
        AjaxPending("Start");
        return Fn(Arg1, Arg2);
      }
      return true;
    }
  };

  /**
   * Records the No of Ajax Calls
   *
   * @param {type} AjaxState
   * @returns {undefined}
   */
  var AjaxPending = function(AjaxState) {
    var StartAjax = parseInt(localStorage.getItem('AjaxPending'));
    if (AjaxState === "Start") {
      localStorage.setItem('AjaxPending', StartAjax + 1);
    } else {
      localStorage.setItem('AjaxPending', StartAjax - 1);
    }
  };

  /**
   * admin_pages/kp_sanction_order_generation_insert.php?
   * applicant_id=19200301cl0130000001
   * sanction_order=19200700213003
   * type=add
   *
   * @param {string} AppID
   * @returns {void}
   */
  var AddToSanctionAppID = function(AppID) {
    localStorage.setItem('Status', 'AddToSanctionAppID: ' + AppID);
    var SanctionOrderNo = localStorage.getItem('SanctionOrderNo');
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_sanction_order_generation_insert.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'applicant_id': AppID,
        'sanction_order': SanctionOrderNo,
        'type': 'add'
      }
    }).done(function(data) {
      try {
        var SanctionStatus = jQ(data).find("div.sanction_block").next().text();
        localStorage.setItem('AddToSanction:' + AppID, SanctionStatus);
      }
      catch (e) {
        localStorage.setItem('AddToSanction Error:' + AppID, e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem('AddToSanction Fail:' + AppID, FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * Approve Applications for Sanctioning
   *
   * @param {type} AppID
   * @returns {undefined}
   */
  var SanctionAppID = function(AppID) {
    localStorage.setItem('Status', 'SanctionAppID: ' + AppID);
    var KeyPrefix = localStorage.getItem('KeyPrefix');
    jQ.ajax({
      type: 'POST',
      url: BaseURL + 'admin_pages/kp_fwd_post.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'rej_reason': '',
        'phy_veri': 'undefined',
        'fwd_to': '10047',
        'applicant_id': AppID
      }
    }).done(function(data) {
      try {
        localStorage.setItem(KeyPrefix + ':' + AppID, data);
        setTimeout(AjaxFunnel(AddToSanctionAppID, AppID), 1000);
      }
      catch (e) {
        localStorage.setItem(KeyPrefix + ' Error:' + AppID, e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem(KeyPrefix + ' Fail:' + AppID, FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * kp_block_verify_applicant_list.php?
   * schcd=19202103702&
   * status=10042&pending=
   *
   * block_select=192021&schcd=19202103702&status=10042&mode=search&download=Submit
   *
   * @param {type} ClgCode
   * @returns {undefined}
   */
  var GetSchAppList = function(SchCode, Scheme) {
    localStorage.setItem('Status', 'GetSchAppList: ' + SchCode);
    var KeyPrefix = localStorage.getItem('KeyPrefix');
    if (Scheme === "K2") {
      Scheme = "_list_one.php";
    } else {
      Scheme = "_list.php";
    }
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_block_verify_applicant' + Scheme,
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'status': '10042',
        'schcd': SchCode,
        'pending': ''
      }
    }).done(function(data) {
      try {
        var AppNo = '', AppName = '', AppIndex = 0, Finalised = '';
        jQ(data).find("table.tftable tr td:nth-child(2)")
            .each(function(Index, Item) {
              AppNo = jQ(Item).text().trim().substr(0, 20);
              AppName = jQ(Item).next().text();
              Finalised = jQ(Item).next().next().text();
              Finalised = "Is " + Finalised;
              if (Finalised.indexOf("FINALIZED") < 0) {
                AppIndex = parseInt(localStorage.getItem(KeyPrefix + 'Count')) + 1;
                localStorage.setItem(KeyPrefix + AppNo, AppName);
                localStorage.setItem(KeyPrefix + 'Count', AppIndex);
              }
            });
      }
      catch (e) {
        localStorage.setItem(KeyPrefix + ' Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem(KeyPrefix + ' Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * http://wbkanyashree.gov.in/admin_pages/kp_dpmu_verify_block_list.php
   * block_select=192018&tot_pen=192018&schcd=&status=10042&mode=search
   *
   * @param {type} BlockCode
   * @returns {undefined}
   */
  var GetSchListPending = function(BlockCode) {
    localStorage.setItem('Status', 'GetSchListP: ' + BlockCode);
    var KeyPrefix = localStorage.getItem('KeyPrefix');
    jQ.ajax({
      type: 'POST',
      url: BaseURL + 'admin_pages/kp_dpmu_verify_block_list.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'block_select': BlockCode,
        'tot_pen': BlockCode,
        'schcd': '',
        'status': '10042',
        'mode': 'search'
      }
    }).done(function(data) {
      try {
        var SchCode = '', SchName = '', SchIndex = 0;
        jQ(data).find("table.tftable tr td:nth-child(2) a").each(function(Index, Item) {
          SchCode = jQ(Item).attr("href").trim().substr(41, 11);
          SchName = jQ(Item).text();
          if (SchCode.length > 0) {
            SchIndex = parseInt(localStorage.getItem(KeyPrefix + 'Count')) + 1;
            localStorage.setItem(KeyPrefix + SchCode, SchName);
            localStorage.setItem(KeyPrefix + 'Count', SchIndex);
          }
        });
      }
      catch (e) {
        localStorage.setItem(KeyPrefix + ' Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem(KeyPrefix + ' Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   *
   * @param {type} BlockCode
   * @returns {undefined}
   */
  var GetSchList = function(BlockCode) {
    localStorage.setItem('Status', 'GetSchList: ' + BlockCode);
    var KeyPrefix = localStorage.getItem('KeyPrefix');
    jQ.ajax({
      type: 'POST',
      url: BaseURL + 'admin_pages/ajax/find_school_for_block.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'block_code': BlockCode,
        'slc_name': 'schcd',
        'slc_class': ''
      }
    }).done(function(data) {
      try {
        var SchCode = '', SchName = '', SchIndex = 0;
        jQ(data).find("option").each(function(Index, Item) {
          SchCode = jQ(Item).val();
          SchName = jQ(Item).text();
          if (SchCode.length > 0) {
            SchIndex = parseInt(localStorage.getItem(KeyPrefix + 'Count')) + 1;
            localStorage.setItem(KeyPrefix + SchCode, SchName);
            localStorage.setItem(KeyPrefix + 'Count', SchIndex);
          }
        });
      }
      catch (e) {
        localStorage.setItem(KeyPrefix + ' Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem(KeyPrefix + ' Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * kp_verify_applicant_list_clg.php?status=10042&schcd=19200301cl
   *
   * @param {type} BlockCode
   * @returns {undefined}
   */
  var GetClgAppList = function(ClgCode) {
    localStorage.setItem('Status', 'GetClgAppList: ' + ClgCode);
    var KeyPrefix = localStorage.getItem('KeyPrefix');
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_verify_applicant_list_clg.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'status': '10042',
        'schcd': ClgCode
      }
    }).done(function(data) {
      try {
        var AppNo = '', AppName = '', AppCount = 0;
        jQ(data).find("table.tftable tr td:nth-child(2)")
            .each(function(Index, Item) {
              AppNo = jQ(Item).text();
              AppName = jQ(Item).next().text();
              var Finalised = jQ(Item).next().next().text();
              Finalised = "Is " + Finalised;
              if (Finalised.indexOf("FINALIZED") < 0) {
                AppCount = parseInt(localStorage.getItem(KeyPrefix + 'Count')) + 1;
                localStorage.setItem(KeyPrefix + AppNo, AppName);
                localStorage.setItem(KeyPrefix + 'Count', AppCount);
              }
            });
      }
      catch (e) {
        localStorage.setItem(KeyPrefix + ' Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem(KeyPrefix + ' Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * admin_pages/kp_block_verify_list_clg.php?block_code=192003
   *
   * @param {type} BlockCode
   * @returns {undefined}
   */
  var GetClgList = function(BlockCode) {
    localStorage.setItem('Status', 'GetClgList: ' + BlockCode);
    var KeyPrefix = localStorage.getItem('KeyPrefix');
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_block_verify_list_clg.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'block_code': BlockCode
      }
    }).done(function(data) {
      try {
        var ClgCode = '', Status = 0, ClgIndex = 0;
        jQ(data).find("table.tftable tr").each(function(Index, Item) {
          if (Index > 0) {
            ClgCode = jQ(Item).find("a").attr("onclick").substr(13, 10);
            Status = jQ(Item).find("a").attr("onclick").indexOf('10042');
            if ((ClgCode.length > 0) && (Status > 0)) {
              ClgIndex = parseInt(localStorage.getItem(KeyPrefix + 'Count')) + 1;
              ClgName = jQ(Item).find("td:nth-child(2)").text();
              localStorage.setItem(KeyPrefix + ClgCode, ClgName);
              localStorage.setItem(KeyPrefix + 'Count', ClgIndex);
            }
          }
        });
      }
      catch (e) {
        localStorage.setItem(KeyPrefix + ' Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem(KeyPrefix + ' Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * Get a List of All Institutions
   *
   * @returns {undefined}
   */
  var GetBlockList = function() {
    localStorage.setItem('Status', 'Request Blocks');
    var KeyPrefix = localStorage.getItem('KeyPrefix');
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_dpmu_verify_block_list.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      }
    }).done(function(data) {
      try {
        var BlockCode = '', BlkIndex = 0;
        jQ(data).find("#block_select option").each(function(Index, Item) {
          BlockCode = jQ(Item).val();
          BlockName = jQ(Item).text();
          if (BlockCode.length > 0) {
            BlkIndex = parseInt(localStorage.getItem(KeyPrefix + 'Count')) + 1;
            localStorage.setItem(KeyPrefix + BlockCode, BlockName);
            localStorage.setItem(KeyPrefix + 'Count', BlkIndex);
          }
        });
        localStorage.setItem('Status', 'Success');
      }
      catch (e) {
        localStorage.setItem(KeyPrefix + ' Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem(KeyPrefix + ' Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * Load all stored data from localStorage
   * Using the matching pair like Start_Key_End:Value
   * @param {type} Prefix
   * @returns {Array}
   */
  var LoadData = function(Prefix) {
    localStorage.setItem('Status', 'Load: ' + Prefix + '*');
    var Status = [], AllIDs = [];
    jQ.each(localStorage, function(Key, Value) {
      if (Key.search(Prefix) >= 0) {
        var StoredKey = Key.substr(Prefix.length, Key.length - Prefix.length);
        AllIDs.push(StoredKey);
        Status.push(StoredKey + " => " + Value);
      }
    });
    if (jQ("#AllIDs").val().length === 0) {
      jQ("#AllIDs").val(AllIDs.join(","));
    }
    return Status;
  };

  /**
   * Initiates the Selected Action to be performed
   *
   * @param {type} ForStep
   * @returns {undefined}
   */
  var GoForAction = function(ForStep) {

    var AllIDs = jQ("#AllIDs").val().split(",");
    var Gap = 250;

    switch (jQ("#OptAction").val()) {
      case "BlockList":
        if (ForStep === "Prepare") {
          localStorage.setItem('KeyPrefix', 'BlkCode_');
        } else {
          localStorage.setItem(localStorage.getItem('KeyPrefix') + 'Count', 0);
          setTimeout(AjaxFunnel(GetBlockList), Gap);
        }
        break;

      case "ClgList":
        if (ForStep === "Prepare") {
          localStorage.setItem('KeyPrefix', 'ClgCode_');
        } else {
          localStorage.setItem(localStorage.getItem('KeyPrefix') + 'Count', 0);
          jQ.each(AllIDs, function(Index, Value) {
            if (Value.length > 0) {
              setTimeout(AjaxFunnel(GetClgList, Value), Gap * Index);
            }
          });
        }
        break;

      case "SchList":
        if (ForStep === "Prepare") {
          localStorage.setItem('KeyPrefix', 'SchCode_');
        } else {
          localStorage.setItem(localStorage.getItem('KeyPrefix') + 'Count', 0);
          jQ.each(AllIDs, function(Index, Value) {
            if (Value.length > 0) {
              setTimeout(AjaxFunnel(GetSchList, Value), Gap * Index);
            }
          });
        }
        break;

      case "SchListP":
        if (ForStep === "Prepare") {
          localStorage.setItem('KeyPrefix', 'SchCode_');
        } else {
          localStorage.setItem(localStorage.getItem('KeyPrefix') + 'Count', 0);
          jQ.each(AllIDs, function(Index, Value) {
            if (Value.length > 0) {
              setTimeout(AjaxFunnel(GetSchListPending, Value), Gap * Index);
            }
          });
        }
        break;

      case "ClgAppList":
        if (ForStep === "Prepare") {
          localStorage.setItem('KeyPrefix', 'ClgAppNo_');
        } else {
          localStorage.setItem(localStorage.getItem('KeyPrefix') + 'Count', 0);
          jQ.each(AllIDs, function(Index, Value) {
            if (Value.length > 0) {
              setTimeout(AjaxFunnel(GetClgAppList, Value), Gap * Index);
            }
          });
        }
        break;

      case "SchAppList":
        if (ForStep === "Prepare") {
          localStorage.setItem('KeyPrefix', 'SchAppNo_');
        } else {
          localStorage.setItem(localStorage.getItem('KeyPrefix') + 'Count', 0);
          jQ.each(AllIDs, function(Index, Value) {
            if (Value.length > 0) {
              setTimeout(AjaxFunnel(GetSchAppList, Value, 'K1'), Gap * Index);
            }
          });
        }
        break;

      case "SchK2AppList":
        if (ForStep === "Prepare") {
          localStorage.setItem('KeyPrefix', 'SchK2AppNo_');
        } else {
          localStorage.setItem(localStorage.getItem('KeyPrefix') + 'Count', 0);
          jQ.each(AllIDs, function(Index, Value) {
            if (Value.length > 0) {
              setTimeout(AjaxFunnel(GetSchAppList, Value, 'K2'), Gap * Index);
            }
          });
        }
        break;

      case "Sanction":
        if (ForStep === "Prepare") {
          localStorage.setItem('KeyPrefix', 'Sanction');

          localStorage.setItem('SanctionOrderNo', jQ("#AllIDs").val());
          var SanctionOrderNo = localStorage.getItem('SanctionOrderNo');
          if (SanctionOrderNo === null) {
            jQ("#Msg").html('Please provide Sanction Order No.');
            jQ("#AllIDs").val('');
          } else if (SanctionOrderNo.length > 0) {
            jQ("#Msg").html('Sanction Order No.: ' + SanctionOrderNo);
          }
        } else {
          localStorage.setItem(localStorage.getItem('KeyPrefix') + 'Count', 0);
          jQ.each(AllIDs, function(Index, Value) {
            if (Value.length > 0) {
              setTimeout(AjaxFunnel(SanctionAppID, Value), Gap * Index);
            }
          });
        }
        break;
    }
  };

  /**
   * Prepare for Selected Action
   */
  jQ("#OptAction").change(function() {
    GoForAction("Prepare");
  });

  /**
   * Perform the Selected Action
   */
  jQ("#CmdGo").click(function() {
    GoForAction("Perform");
  });

  /**
   * Loads the contents of localStorage into the interface
   */
  jQ("#CmdStatus").click(function() {
    if (jQ("#CmdStatus").val() === "Show All") {
      jQ("#CmdStatus").val("Load All");
      jQ("#AllIDs").hide();
      var vals = LoadData(localStorage.getItem('KeyPrefix'));
      var StatusDiv = document.createElement("div");
      StatusDiv.setAttribute("id", "AppStatus");
      jQ("#AllIDs").parent().append(StatusDiv);

      jQ("#AppStatus")
          .html("<ol><li>" + vals.join("</li><li>") + "</li></ol>")
          .css({"text-align": "left", "clear": "both"});

      jQ("#AppStatus li").css("list-style-type", "decimal-leading-zero");
    } else {
      jQ("#AppStatus").remove();
      jQ("#AllIDs").show();
      jQ("#CmdStatus").val("Show All");
    }
  });

  /**
   * Clear Individual Contents of localStorage
   */
  jQ("#CmdClear").click(function() {
    var Prefix = localStorage.getItem('KeyPrefix');
    jQ.each(localStorage, function(Key) {
      if (Key.search(Prefix) >= 0) {
        localStorage.removeItem(Key);
      }
    });
    localStorage.setItem(Prefix + 'Count', 0);
  });

  /**
   * Clears all the contents of localStorage
   */
  jQ("#CmdClearStorage").click(function() {
    localStorage.clear();
    localStorage.setItem('AjaxPending', 0);
    localStorage.setItem('BlkCode_Count', 0);
    localStorage.setItem('ClgCode_Count', 0);
    localStorage.setItem('SchCode_Count', 0);
    localStorage.setItem('ClgAppNo_Count', 0);
    localStorage.setItem('SchAppNo_Count', 0);
    localStorage.setItem('SchK2AppNo_Count', 0);
    localStorage.setItem('SanctionCount', 0);
    jQ("#OptAction").trigger("change");
  });

  /**
   * Continious Polling for Server Response to avoid Session TimeOut
   *
   * @returns {Boolean}
   */
  var RefreshOnWait = function() {
    var CurrDate = new Date(), TimeOut;
    var LastRespTime = new Date(localStorage.getItem("LastRespTime"));
    var ElapsedTime = CurrDate.getTime() - LastRespTime.getTime();
    TimeOut = localStorage.getItem("RefreshTimeOut");
    if (TimeOut === null) {
      TimeOut = 300000;
    } else {
      TimeOut = 5000 + 60000 * TimeOut; // 5sec is minimum
    }

    if (ElapsedTime > TimeOut) {
      localStorage.setItem("LastRespTime", Date());
      var URL = BaseURL + "admin_pages/kp_homepage.php";
      jQ.get(URL);
    } else {
      jQ("#Msg").html('AjaxPending :<span>'
          + localStorage.getItem('AjaxPending')
          + '</span><br/>Blocks :<span>'
          + localStorage.getItem('BlkCode_Count')
          + '</span><br/>Colleges :<span>'
          + localStorage.getItem('ClgCode_Count')
          + '</span><br/>College Applications :<span>'
          + localStorage.getItem('ClgAppNo_Count')
          + '</span><br/>Schools :<span>'
          + localStorage.getItem('SchCode_Count')
          + '</span><br/>School Applications :<span>'
          + localStorage.getItem('SchAppNo_Count')
          + '</span><br/>School K2 Applications :<span>'
          + localStorage.getItem('SchK2AppNo_Count')
          + '</span><br/>Last API : '
          + localStorage.getItem('Status')
          + '<br/><br/>' + localStorage.getItem('LastRespTime'));

      jQ("#Msg span").css({
        "width": "80px",
        "display": "inline-block"
      });
    }
    setTimeout(RefreshOnWait, 2000);
    return true;
  };

  RefreshOnWait();

  localStorage.setItem("LastRespTime", Date());
});
