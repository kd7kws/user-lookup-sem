<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<!-- Copyright (c) 2002-2008  Rally Software Development Corp. All rights reserved. -->
<html>
<head>
<title>User Lookup</title>
<meta name="Name" content="Mashup: User Lookup"/>
<meta name="Version" content="2009.4"/>
<meta name="Vendor" content="Rally Software"/>
<link rel="stylesheet" type="text/css" href="/slm/css/rally/core.css" charset="utf-8"/>
<link rel="stylesheet" type="text/css" href="/slm/css/slm.css" charset="utf-8"/>
<link rel="stylesheet" type="text/css" href="/slm/css/sprites.css" charset="utf-8"/>

<script type="text/javascript" src="/slm/js-lib/dojo/1.3.1/dojo/dojo.js"></script>
<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript">
    google.load("visualization", "1", {packages:["table"]});
</script>
<script type="text/javascript" src="/slm/js/help.js"></script>
<script type="text/javascript" src="/slm/js/slm.js"></script>
<script type="text/javascript" src="/slm/mashup/1.13/js/utilities.js"></script>
<script type="text/javascript" src="/slm/mashup/1.13/js/batch-toolkit.js"></script>


<script type="text/javascript" type="text/javascript">
    /*
     Copyright (c) 2002-2009  Rally Software Development Corp. All rights reserved.
     */
    dojo.require('dojo.io.script');
    dojo.addOnLoad(initPage);
    var ACTIVE_STYLE = {style: 'color:blue'};
    var INACTIVE_STYLE = {style: 'color:grey;'};
    var NAME_FIELDS = ['LastName','FirstName','DisplayName','LoginName'];
    var LETTERS = ['All','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    var batchToolkit = null;
    var cachedResults = null;
    var currentLetter = LETTERS[0];
    var lastLetter = null;
    // Called after user clicks 'Save & Close' and 'Save & New' on User editor screen
    // Not officially supported so no guarantee that calling refreshWindow will work in the future
    function refreshWindow(ref, formattedID, name, created, parented, scheduled) {
        runMainQuery();
    }
    function matchFirstLetter(user) {
        for (i = 0; i < NAME_FIELDS.length; i++) {
            var text = user[NAME_FIELDS[i]];
            if (text != null && (text.slice(0, 1) == currentLetter || text.slice(0, 1) == currentLetter.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
    function matchString(user, string) {
        for (i = 0; i < NAME_FIELDS.length; i++) {
            var text = user[NAME_FIELDS[i]];
            if (text != null && text.toLowerCase().indexOf(string.toLowerCase()) >= 0) {
                return true;
            }
        }
        return false;
    }
    function match(user) {
        matched = false;
        if (currentLetter == 'Search') {
            matched = matchString(user, document.getElementById('searchText').value);
        } else {
            matched = matchFirstLetter(user);
        }
        return matched;
    }
    function adminCheck(res) {
        // Disabled property is not available on user object if non-admin
        if (typeof res.users[0].Disabled === "undefined" ||
                typeof res.users[res.users.length - 1].Disabled === "undefined") {
            document.getElementById('info_msg').innerHTML = "You are not authorized to view or edit users. " +
                    "You must be a subscription or workspace administrator.";
            return false;
        } else {
            document.getElementById('letters').style.display = 'block';
            return true;
        }
    }
    function drawTable(res) {
        cachedResults = res;
        var activeUserCnt = 0;
        var count = 0;
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Last');
        data.addColumn('string', 'First');
        data.addColumn('string', 'Display Name');
        data.addColumn('string', 'Username');
        data.addColumn('string', 'Action');
        if (!adminCheck(cachedResults)) {
            return;
        }
        for (var i = 0; i < cachedResults.users.length; i++) {
            if (cachedResults.users[i].Disabled != true) {
                activeUserCnt += 1;
            }
            if (currentLetter == 'All' || match(cachedResults.users[i])) {
                var style;
                if (cachedResults.users[i].Disabled == true) {
                    style = INACTIVE_STYLE;
                } else {
                    style = ACTIVE_STYLE;
                }
                data.addRows(1);
                data.setCell(count, 0, cachedResults.users[i].LastName, null, style);
                data.setCell(count, 1, cachedResults.users[i].FirstName, null, style);
                data.setCell(count, 2, cachedResults.users[i].DisplayName, null, style);
                data.setCell(count, 3, cachedResults.users[i].LoginName, null, style);
                var url = '';
                if (!RALLY.Mashup.Utilities.isMashupRunningInsideRally()) {
                    url = 'https://' + batchToolkit.getServer();
                }
                var text = "<a href='#' class=\"sprite-edit\" onclick=\"popup('" + url + "/slm/user/edit.sp?oid=" + cachedResults.users[i].ObjectID + "', 800, 600, 'littleN');drawTable(cachedResults);return false;\">&nbsp;&nbsp;&nbsp;&nbsp;<\/a>";
                data.setCell(count++, 4, text);
            }
        }
        document.getElementById('user_cnt_div').innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
                "Total Active Users: " + activeUserCnt;
        var table = new google.visualization.Table(document.getElementById('table_div'));
        var css = {tableCell:'tableCell', tableRow:'tableRow', headerRow:'headerRow', headerCell:'headerCell'};
        table.draw(data, {allowHtml:true, alternatingRowStyle:false, sortColumn:0, cssClassNames:css});
    }
    function letterHandler(event) {
        lastLetter.className = "letter";
        document.getElementById('searchText').value = "";
        event.currentTarget.className = "letterBold";
        lastLetter = event.currentTarget;
        currentLetter = event.currentTarget.id;
        drawTable(cachedResults);
    }
    function searchHandler(event) {
        lastLetter.className = "letter";
        currentLetter = 'Search';
        drawTable(cachedResults);
    }
    function enterHandler(event) {
        if (event.keyCode == '13') {
            searchHandler(event);
        }
    }
    function runMainQuery() {
        var queryObject = {
            key: "users",
            type: "users",
            fetch: "LastName,FirstName,DisplayName,LoginName,ObjectID,Disabled",
            order: "LastName"
        };
        batchToolkit.findAll(queryObject, drawTable);
        return false;
    }
    function initPage() {
        RALLY.Mashup.Utilities.showHelpIcon(179);
        batchToolkit = new RALLY.Mashup.BatchToolkit('__WORKSPACE_OID__', '__PROJECT_OID__',
                '__PROJECT_SCOPING_UP__', '__PROJECT_SCOPING_DOWN__');
        // Connect letter divs to the letterHandler method
        for (i = 0; i < LETTERS.length; i++) {
            dojo.connect(document.getElementById(LETTERS[i]), 'onclick', letterHandler);
        }
        dojo.connect(document.getElementById('searchText'), 'onkeyup', enterHandler);
        dojo.connect(document.getElementById('searchButton'), 'onclick', searchHandler);
        lastLetter = document.getElementById('All');
        document.getElementById('searchText').value = "";
        runMainQuery();
    }
</script>

<style type="text/css">
    body {
        background: white;
        padding-left: 15px;
    }
    .lbl {
        text-align: left;
        font-size: 13px;
    }
    a.letterBold {
        font-size: 13px;
        font-weight: bold;
        color: black;
    }
    a.letter {
        font-size: 13px;
        font-weight: normal;
        color: blue;
    }
    td {
        font-size: 11px;
    }
    .tableRow {
        background: white;
        border-bottom: 1px solid #dddddd;
        border-top: 0px;
    }
    .tableCell {
        border-bottom: 1px solid #dddddd;
        border-top: 0px;
        padding-left: 5px;
        padding-right: 30px;
        padding-top: 4px;
        padding-bottom: 4px;
    }
    .headerCell {
        border-left: 1px solid #ffffff;
        text-align: left;
        border-top: 0px;
        padding-left: 5px;
        padding-right: 30px;
    }
    .headerRow {
        background: #eeeeee;
    }
</style>
</head>
<body>
<div style="float:left" id="title" class="titlebar">User Lookup</div>
<div style="float:right" id="help"></div>
<table>
    <tr>
        <td style="text-align: left; width: 99%;"></td>
        <td style="text-align: right; width: 1%;">
            <img id="do" onmouseover="RALLY.Mashup.Utilities.showcbButton();"
                 onmouseout="hidecbMenu('buttons',event);"
                 style="vertical-align: middle;"
                 src="/slm/images/menu_actions.gif"/>

            <div style="position:relative;top:5px" align="left">
                <div id="buttons" class="do-menu" style="left:0px;"
                     onmouseover="document.body.style.cursor='pointer';"
                     onmouseout="document.body.style.cursor='default';hidecbMenu('buttons',event);">
                    <a id="print" onclick="RALLY.Mashup.Utilities.printPage()">Print...</a>
                </div>
            </div>
        </td>
    </tr>
</table>
<div style="clear:both"></div>
<br/>

<div id="info_msg" class="lbl"></div>
<div id="letters" style="display:none">
    <input id="searchText" size="20"/>
    <button id="searchButton" type="button">Search</button>
    <br/>
    <a href='#' id="All" class="letterBold">All</a>&nbsp;&nbsp;
    <a href='#' id="A" class="letter">A</a>&nbsp;&nbsp;
    <a href='#' id="B" class="letter">B</a>&nbsp;&nbsp;
    <a href='#' id="C" class="letter">C</a>&nbsp;&nbsp;
    <a href='#' id="D" class="letter">D</a>&nbsp;&nbsp;
    <a href='#' id="E" class="letter">E</a>&nbsp;&nbsp;
    <a href='#' id="F" class="letter">F</a>&nbsp;&nbsp;
    <a href='#' id="G" class="letter">G</a>&nbsp;&nbsp;
    <a href='#' id="H" class="letter">H</a>&nbsp;&nbsp;
    <a href='#' id="I" class="letter">I</a>&nbsp;&nbsp;
    <a href='#' id="J" class="letter">J</a>&nbsp;&nbsp;
    <a href='#' id="K" class="letter">K</a>&nbsp;&nbsp;
    <a href='#' id="L" class="letter">L</a>&nbsp;&nbsp;
    <a href='#' id="M" class="letter">M</a>&nbsp;&nbsp;
    <a href='#' id="N" class="letter">N</a>&nbsp;&nbsp;
    <a href='#' id="O" class="letter">O</a>&nbsp;&nbsp;
    <a href='#' id="P" class="letter">P</a>&nbsp;&nbsp;
    <a href='#' id="Q" class="letter">Q</a>&nbsp;&nbsp;
    <a href='#' id="R" class="letter">R</a>&nbsp;&nbsp;
    <a href='#' id="S" class="letter">S</a>&nbsp;&nbsp;
    <a href='#' id="T" class="letter">T</a>&nbsp;&nbsp;
    <a href='#' id="U" class="letter">U</a>&nbsp;&nbsp;
    <a href='#' id="V" class="letter">V</a>&nbsp;&nbsp;
    <a href='#' id="W" class="letter">W</a>&nbsp;&nbsp;
    <a href='#' id="X" class="letter">X</a>&nbsp;&nbsp;
    <a href='#' id="Y" class="letter">Y</a>&nbsp;&nbsp;
    <a href='#' id="Z" class="letter">Z</a>
    <span id="user_cnt_div" class="lbl"></span>
</div>
<br/><br/>

<div id="table_div"></div>
</body>
</html>
