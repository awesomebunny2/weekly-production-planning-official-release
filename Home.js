﻿/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */
import globalVar from "./globalVar.js";
import { deactivateEvents, createDataSet, conditionalFormatting, createRowInfo } from "./universalFunctions.js";
import { buildTabulatorTables, organizeData } from "./tabulatorTables.js";
import { populateForms } from "./populateForms.js";
import { updateE2RFromTaskpane, E2RHandler } from "./E2Rs.js";
import { clearPSInfo, pressSchedulingInfoTable, pressSchedulerHandler, updateDataFromTable } from "./pressSchedulingInfo.js";
import { breakout, removeBreakoutSheets } from "./breakout.js";


//const { deactivateEvents, createDataSet, conditionalFormatting, createRowInfo } = require("./universalFunctions.js");
//const { buildTabulatorTables, organizeData } = require("./tabulatorTables.js");
//const { populateForms } = require("./populateForms.js");
//const { updateE2RFromTaskpane, E2RHandler } = require("./E2Rs.js");
//const { clearPSInfo, pressSchedulingInfoTable, pressSchedulerHandler, updateDataFromTable } = require("./pressSchedulingInfo.js");
//const { breakout, removeBreakoutSheets } = require("./breakout.js");


// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
/*

 ██████  ███    ██     ██████  ███████  █████  ██████  ██    ██ 
██    ██ ████   ██     ██   ██ ██      ██   ██ ██   ██  ██  ██  
██    ██ ██ ██  ██     ██████  █████   ███████ ██   ██   ████   
██    ██ ██  ██ ██     ██   ██ ██      ██   ██ ██   ██    ██    
 ██████  ██   ████     ██   ██ ███████ ██   ██ ██████     ██    
                                                                
*/

    //#region ----------------------------------------------------------------------------------------------------------------------------------------

        Office.onReady((info) => {

            //========================================================================================================================================
                //#region BINDING THE MAIN TASKPANE BUTTONS ------------------------------------------------------------------------------------------

                    if (info.host === Office.HostType.Excel) {

                        globalVar.scrollErr = document.querySelector("#select-tables");

                        document.getElementById("populate-forms").onclick = populateForms;
                        document.getElementById("breakout").onclick = breakout;
                        document.getElementById("clearall-butt").onclick = clearForms;
                        globalVar.scrollErr.addEventListener("scroll", (event) => {
                            // console.log("Scroll changed.", event)
                            globalVar.scrollHeight = globalVar.scrollErr.scrollTop; //*sets scroll height to the top of the select tables area
                        });
                        // document.getElementById("clear-press-schedule-info").onclick = clearPSInfo;
                    };
                //#endregion -------------------------------------------------------------------------------------------------------------------------
            //========================================================================================================================================

            Excel.run(async (context) => {

                //====================================================================================================================================
                    //#region ASSIGNING SHEET VARIABLES ----------------------------------------------------------------------------------------------

                        const silkE2RSheet = context.workbook.worksheets.getItem("SilkE2R").load("name");
                        const textE2RSheet = context.workbook.worksheets.getItem("TextE2R").load("name");
                        const digE2RSheet = context.workbook.worksheets.getItem("DIGE2R").load("name");
                        const validationSheet = context.workbook.worksheets.getItem("Validation").load("name");
                        const pressSchedulingSheet = context.workbook.worksheets.getItem("Press Scheduling").load("name");
                        const masterSheet = context.workbook.worksheets.getItem("Master").load("name");
                        const allSheets = context.workbook.worksheets.load("items");


                        const silkE2RTable = silkE2RSheet.tables.getItem("SilkE2R");
                        const textE2RTable = textE2RSheet.tables.getItem("TextE2R");
                        const digE2RTable = digE2RSheet.tables.getItem("DIGE2R");
                        const pressSchedulingInfo = validationSheet.tables.getItem("PressSchedulingInfo");
                        const dowSummaryPivotTable = pressSchedulingSheet.pivotTables.getItem("DOWSummaryPivot");
                        const press1PivotTable = pressSchedulingSheet.pivotTables.getItem("Press1Pivot");
                        const press2PivotTable = pressSchedulingSheet.pivotTables.getItem("Press2Pivot");
                        const press3PivotTable = pressSchedulingSheet.pivotTables.getItem("Press3Pivot");
                        const digitalPivotTable = pressSchedulingSheet.pivotTables.getItem("DigitalPivot");
                        const masterTable = masterSheet.tables.getItem("Master");
                        const customFormsTable = validationSheet.tables.getItem("CustomForms").load("name");
                        const pressmenTable = validationSheet.tables.getItem("Pressmen").load("name");
                        const pressesTable = validationSheet.tables.getItem("Presses").load("name");


                        const silkE2RBodyRangeUpdate = silkE2RTable.getDataBodyRange().load("values");
                        const textE2RBodyRangeUpdate = textE2RTable.getDataBodyRange().load("values");
                        const digE2RBodyRangeUpdate = digE2RTable.getDataBodyRange().load("values");
                        const pressSchedulingBodyRange = pressSchedulingInfo.getDataBodyRange().load("values");
                        const masterBodyRange = masterTable.getDataBodyRange().load("values");
                        const customFormsBodyRange = customFormsTable.getDataBodyRange().load("values");
                        const pressmenBodyRange = pressmenTable.getDataBodyRange().load("values");
                        const pressesBodyRange = pressesTable.getDataBodyRange().load("values");


                        const masterTableHeader = masterTable.getHeaderRowRange().load("values");

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                await context.sync();

                //====================================================================================================================================
                    //#region LOADING SHEET VARIABLES ------------------------------------------------------------------------------------------------

                        let silkE2RArr = silkE2RBodyRangeUpdate.values; //moves all values of the SilkE2R table to an array
                        let textE2RArr = textE2RBodyRangeUpdate.values; //moves all values of the TextE2R table to an array
                        let digE2RArr = digE2RBodyRangeUpdate.values; //moves all values of the TextE2R table to an array
                        let pressSchedArr = pressSchedulingBodyRange.values;
                        let pressmenArr = pressmenBodyRange.values;
                        let pressesArr = pressesBodyRange.values;
                        let masterArr = masterBodyRange.values;
                        let masterArrCopy = JSON.parse(JSON.stringify(masterBodyRange.values));

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    // #region UPDATE BREAKOUT BUTTON TEXT --------------------------------------------------------------------------------------------

                        let missingExist = false;

                        for (let i = 0; i < allSheets.items.length; i++) {
                            // console.log(allSheets.items[i].name);
                            if (allSheets.items[i].name == "MISSING") {
                                missingExist = true;
                            };
                        };

                        //* If the MISSING sheet currently exists in the document, we want the breakout button to delete breakouts rather than create
                        //* them. Here we change the text of the button based on if the sheet is present or not. We will handle the function later.
                        if (missingExist) {
                            $("#breakout").text("Delete Breakout Sheets");
                        } else {
                            $("#breakout").text("Breakout");
                        };

                    // #endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region PARCTIALLY LEGACY/PARCITALLY RELEVANT: WRITE PRESSMEN AND PRESSES TABLE INFO TO ARRAYS ---------------------------------

                        globalVar.pressmen = [" "];
                        globalVar.pressmen = [" "];

                        pushBodyRangeValuesToArray(pressmenArr, globalVar.pressmen);
                        pushBodyRangeValuesToArray(pressesArr, globalVar.presses);

                        // for (let pressman of pressmenArr) {
                        //   window[pressman] = + [];
                        // }

                        // let prop1 = {
                        //   beans: "pickled",
                        //   rice: "white"
                        // };

                        // let prop2 = {
                        //   beans: "fart",
                        //   rice: "none"
                        // };

                        // // console.log(Steve);

                        // for (const key of globalVar.pressmen) {
                        //   globalVar.operators[key] = prop1
                        // };

                        // console.log(globalVar.operators);

                        globalVar.pressmen.forEach((man) => {
                            globalVar.operators[man] = [];
                        });

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region REFRESH PIVOT TABLES ON OPEN -------------------------------------------------------------------------------------------

                        let masterHeaderValues = masterTableHeader.values;

                        dowSummaryPivotTable.refreshOnOpen = true;
                        press1PivotTable.refreshOnOpen = true;
                        press2PivotTable.refreshOnOpen = true;
                        press3PivotTable.refreshOnOpen = true;
                        digitalPivotTable.refreshOnOpen = true;

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region BUILD DATA SETS --------------------------------------------------------------------------------------------------------

                        globalVar.silkDataSet = [];
                        globalVar.textDataSet = [];
                        globalVar.digDataSet = [];
                        globalVar.priorityNum = 1;

                        globalVar.silkDataSet = createDataSet(silkE2RArr, "Silk");
                        globalVar.textDataSet = createDataSet(textE2RArr, "Text");
                        globalVar.digDataSet = createDataSet(digE2RArr, "Digital");

                        globalVar.priorityNum = 1;
                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region UPDATE DATA SETS WITH PRESS SCHEDULING DATA ----------------------------------------------------------------------------

                        //* Updates the info in each of the data sets to the info in the Press Scheduling Table in the validation, 
                        //* if there is any info
                        updateDataFromTable(pressSchedArr);

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                await context.sync();

                //====================================================================================================================================
                    //#region BUILD TABULATOR TASKPANE TABLES ----------------------------------------------------------------------------------------

                        globalVar.silkTable = buildTabulatorTables("silk-form", globalVar.silkTable, globalVar.silkDataSet);
                        globalVar.textTable = buildTabulatorTables("text-form", globalVar.textTable, globalVar.textDataSet);
                        globalVar.digTable = buildTabulatorTables("dig-form", globalVar.digTable, globalVar.digDataSet);

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region BUILD/UPDATE HTML TABLE IN TASKPANE ------------------------------------------------------------------------------------

                        //* Organizes the data, sorts it, then dynamically builds HTML tables out of it through a number of different functions
                        organizeData();

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region ADD ON CHANGED EVENT HANDLER TO PRESS SCHEDULING INFO TABLE IN VALIDATION ----------------------------------------------

                        pressSchedulingInfo.onChanged.add(pressSchedulerHandler);

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                await context.sync();

                //? pops the scroll bar in the tabulator tables section of the taskpane back up to the top of the #select-tables element?
                globalVar.scrollErr.scrollTop = globalVar.scrollHeight;

                //====================================================================================================================================
                    //#region ADD ON CHANGED EVENT HANDLERS TO E2R TABLES ----------------------------------------------------------------------------

                        silkE2RTable.onChanged.add(E2RHandler);
                        textE2RTable.onChanged.add(E2RHandler);
                        digE2RTable.onChanged.add(E2RHandler);

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region SWAP PRESS SCHEDULING/WELCOME PAGE IN TASKPANE BASED ON AVALIABILITY OF DATA -------------------------------------------

                        //will be null if there's an error with the building of the tabulator tables, but normally should have at least something here
                        var hasChildDiv = document.getElementById("silk-form").querySelector(".tabulator-header");

                        let hasChildDiv2;

                        let tabTableData = false;

                        if (hasChildDiv !== null) {

                            //gets each of the tabulator tables (silk, text, and digital)
                            let tabulatorTableElements = document.getElementsByClassName("tabulator-table");

                            //checks each table for rows of data
                            for (let eachTableElement of tabulatorTableElements) {

                                hasChildDiv2 = eachTableElement.querySelector(".tabulator-row");

                                //if even one table has a row of data, sets tabTableData to true
                                if (hasChildDiv2 !== null) {
                                    // console.log("The tabulator tables should have data in them!");
                                    tabTableData = true;
                                    break;
                                };
                            };

                            //if none of the tabulator tables have any data, set tabTableData to false (just in case it was still set to true)
                            if (hasChildDiv2 == null) {
                                console.log("DOUBLE NOOO!");
                                tabTableData = false;
                            };

                        //if there's no header in the silk-form for some reason, just set tabTableData to false (sweep the issue under the rug lol)
                        } else {
                            console.log('NO');
                            tabTableData = false;
                        };

                        if (tabTableData == false) {
                            //if there is no data in Tabulator tables, swap taskpane to welcome page after 5 seconds
                            setTimeout(swapToWelcome, 5);
                        } else {
                            //if there is data in Tabulator tables, swap taskpane to press scheduling area after 5 seconds
                            setTimeout(swapToShceduling, 5);
                        };

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region IS MASTER SHEET EMPTY? -------------------------------------------------------------------------------------------------

                        let emptyCell = false;

                        //for each cell in the first row of the master sheet, if even one cell contains data, set emptyCell to false and break loop
                        for (let cell of masterArr[0]) {
                            if (cell == "") {
                                emptyCell = true;
                            } else {
                                emptyCell = false;
                                break;
                            }
                        };

                        //============================================================================================================================
                            //#region LEGACY CODE: BIND EVENTS TO MASTER SHEET & CREATE ROW INFO IN CODE FOR FIRST ROW IN MASTER SHEET ---------------

                                // if (masterArr.length === 1 && emptyCell == true) {
                                //   console.log("Master is empty, so no events were bound to the forms column just yet.")
                                // } else {
                                //   // activateEvents();
                                //   // globalVar.eventResult = masterTable.onChanged.add(handleChange);

                                //   for (let rowIndex in masterArr) {

                                //     let masterRowInfo = new Object();

                                //     for (let headName of masterHeaderValues[0]) {
                                //       createRowInfo(masterHeaderValues, headName, masterArr[rowIndex], masterArrCopy, masterRowInfo, rowIndex);
                                //     };

                                //     console.log(masterRowInfo.Forms.value);

                                //   }
                                // };

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region ADD CHANGE EVENT HANDLERS FOR TASKPANE TABULATOR TABLES ----------------------------------------------------------------

                        //* Keeping these next 3 on change calls within the scope of the onReady so that the tabulator table variables I defined above 
                        //* are available to use

                        //============================================================================================================================
                            //#region ON SILK TABLE CHANGE, UPDATE DATA AND REBUILD HTML TABLES ------------------------------------------------------

                                $("#silk-form").on("change", ".select-box", function () {

                                    deactivateEvents(); //turns off workbook events

                                    const whichRow = $(this).attr("rowId"); //the row id of the changed attribute
                                    const whichColumn = $(this).attr("colId"); //the column id of the chaged attribute
                                    const newData = $(this).find(":selected").text(); //the new data of the changed attribute

                                    const rowForm = $(this).attr("formNum"); //the form number of the changed attribute

                                    const tableData = globalVar.silkTable.getData(); //get all the data in the globalVar.silkTable element

                                    //creates a copy of table data but with the newData replacing the old data in the position of the change
                                    const replaceData = tableData.map((td, index) => {
                                        //matches the index + 1 (for 0 index) to the rowId of the changed table and then replaces the data 
                                        //in the column with the newData
                                        if ((index + 1) + "" === whichRow) {
                                            // console.log("NEW DATA")
                                            td[whichColumn] = newData;
                                        }
                                        return td;
                                    });

                                    globalVar.silkTable.setData(replaceData); //sets data in tabulator table to new data
                                    globalVar.scrollErr.scrollTop = globalVar.scrollHeight; //? resets scroll bar to top?

                                    //updates the globalVar.silkDataSet global variable to the new updated data
                                    globalVar.silkDataSet = replaceData;

                                    //build/updates HTML tables
                                    organizeData();

                                    //updates the press scheduling table in the validation sheet to the new data 
                                    //(using the "Taskpane" variable so it knows how to treat the incoming data based on the source of the change)
                                    pressSchedulingInfoTable("Taskpane");

                                    //updates the Silk E2R at the position of the rowForm with the new data
                                    updateE2RFromTaskpane("Silk", rowForm);


                                    console.log(`
                                        A silk select box was changed in the Taskpane, so values in the Press Scheduling Info table and in the 
                                        SilkE2R were updated.
                                    `);

                                });

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                        //============================================================================================================================
                            //#region ON TEXT TABLE CHANGE, UPDATE DATA AND REBUILD HTML TABLES ------------------------------------------------------

                                $("#text-form").on("change", ".select-box", function () {

                                    deactivateEvents(); //turns off workbook events

                                    const whichRow = $(this).attr("rowId"); //the row id of the changed attribute
                                    const whichColumn = $(this).attr("colId"); //the column id of the chaged attribute
                                    const newData = $(this).find(":selected").text(); //the new data of the changed attribute

                                    const rowForm = $(this).attr("formNum"); //the form number of the changed attribute

                                    const tableData = globalVar.textTable.getData(); //get all the data in the globalVar.textTable element

                                    //creates a copy of table data but with the newData replacing the old data in the position of the change
                                    const replaceData = tableData.map((td, index) => {
                                        //matches the index + 1 (for 0 index) to the rowId of the changed table and then replaces the data 
                                        //in the column with the newData
                                        if ((index + 1) + "" === whichRow) {
                                            // console.log("NEW DATA")
                                            td[whichColumn] = newData;
                                        }
                                        return td;
                                    });

                                    globalVar.textTable.setData(replaceData); //sets data in tabulator table to new data
                                    globalVar.scrollErr.scrollTop = globalVar.scrollHeight; //? resets scroll bar to top?

                                    //updates the globalVar.textDataSet global variable to the new updated data
                                    globalVar.textDataSet = replaceData;

                                    //build/updates HTML tables
                                    organizeData();

                                    //updates the press scheduling table in the validation sheet to the new data 
                                    // (using the "Taskpane" variable so it knows how to treat the incoming data based on the source of the change)
                                    pressSchedulingInfoTable("Taskpane");

                                    //updates the Text E2R at the position of the rowForm with the new data
                                    updateE2RFromTaskpane("Text", rowForm);


                                    console.log(`
                                        A text select box was changed in the Taskpane, so values in the Press Scheduling Info table and in the 
                                        TextE2R were updated.
                                    `);

                                });

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                        //============================================================================================================================
                            //#region ON DIGITAL TABLE CHANGE, UPDATE DATA AND REBUILD HTML TABLES ---------------------------------------------------

                                $("#dig-form").on("change", ".select-box", function () {

                                    deactivateEvents(); //turns off workbook events

                                    const whichRow = $(this).attr("rowId"); //the row id of the changed attribute
                                    const whichColumn = $(this).attr("colId"); //the column id of the chaged attribute
                                    const newData = $(this).find(":selected").text(); //the new data of the changed attribute

                                    const rowForm = $(this).attr("formNum"); //the form number of the changed attribute

                                    const tableData = globalVar.digTable.getData(); //get all the data in the globalVar.digTable element

                                    //creates a copy of table data but with the newData replacing the old data in the position of the change
                                    const replaceData = tableData.map((td, index) => {
                                        //matches the index + 1 (for 0 index) to the rowId of the changed table and then replaces the data 
                                        //in the column with the newData
                                        if ((index + 1) + "" === whichRow) {
                                            // console.log("NEW DATA")
                                            td[whichColumn] = newData;
                                        }
                                        return td;
                                    });

                                    globalVar.digTable.setData(replaceData); //sets data in tabulator table to new data

                                    globalVar.scrollErr.scrollTop = globalVar.scrollHeight; //? resets scroll bar to top?

                                    //updates the globalVar.digDataSet global variable to the new updated data
                                    globalVar.digDataSet = replaceData;

                                    //build/updates HTML tables
                                    organizeData();

                                    //updates the press scheduling table in the validation sheet to the new data 
                                    // (using the "Taskpane" variable so it knows how to treat the incoming data based on the source of the change)
                                    pressSchedulingInfoTable("Taskpane");

                                    //updates the Digital E2R at the position of the rowForm with the new data
                                    updateE2RFromTaskpane("Digital", rowForm);

                                    console.log(
                                        `A digital select box was changed in the Taskpane, so values in the Press Scheduling Info table and in the 
                                        DIGE2R were updated.
                                    `);

                                });

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

                //====================================================================================================================================
                    //#region ADD ON CHANGED EVENT TO MASTER TABLE -----------------------------------------------------------------------------------

                        globalVar.eventResult = masterTable.onChanged.add(handleChange);
                
                    //#endregion ---------------------------------------------------------------------------------------------------------------------
                //====================================================================================================================================

            });

        });

    //#endregion -------------------------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------




// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
/*

██████  ██    ██ ████████ ████████  ██████  ███    ██ ███████        ██        ████████ ██   ██ ██ ███    ██  ██████  ███████ 
██   ██ ██    ██    ██       ██    ██    ██ ████   ██ ██             ██           ██    ██   ██ ██ ████   ██ ██       ██      
██████  ██    ██    ██       ██    ██    ██ ██ ██  ██ ███████     ████████        ██    ███████ ██ ██ ██  ██ ██   ███ ███████ 
██   ██ ██    ██    ██       ██    ██    ██ ██  ██ ██      ██     ██  ██          ██    ██   ██ ██ ██  ██ ██ ██    ██      ██ 
██████   ██████     ██       ██     ██████  ██   ████ ███████     ██████          ██    ██   ██ ██ ██   ████  ██████  ███████ 

*/

    //#region ----------------------------------------------------------------------------------------------------------------------------------------

        //============================================================================================================================================
            // #region LEGACY?: PAGE ARROWS ----------------------------------------------------------------------------------------------------------

                //goes between main pages
                $(".title-arrow").on("click", function () {

                    const thisPage = $("#page-title").text().toLowerCase();

                    // Are we going forward or backward
                    const forwardOrBackward = $(this).attr("value");

                    let pages = ["home", "press scheduling"];

                    const next = nextPage(thisPage, forwardOrBackward, pages);

                    let thisPageWithDash = replaceCharacter(thisPage, " ", "-");
                    let nextWithDash = replaceCharacter(next, " ", "-");


                    $("#page-title").text(next.toUpperCase());

                    $(`.dots[page='${thisPageWithDash}']`).removeClass("dot-selected");
                    $(`.dots[page='${nextWithDash}']`).addClass("dot-selected");

                    if (thisPage == "press scheduling" && next == "home") {

                        $("#select-tables").css("display", "none");
                        $("#week-tables").css("display", "none");
                        $("#footer").css("display", "none");

                        $("#home-page").css("display", "flex");

                        // currentPage = "Home";

                    };

                    if (thisPage == "home" && next == "press scheduling") {

                        $("#home-page").css("display", "none");

                        $("#select-tables").css("display", "block");
                        $("#week-tables").css("display", "flex");
                        $("#footer").css("display", "flex");

                        // currentPage = "Press Scheduling"

                    };

                });

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region DAY OF THE WEEK HTML ARROWS ----------------------------------------------------------------------------------------------------

                //go between weekday tables in the week-tables div
                $(document).on("click", ".dow-arrow", function () {
                    // Get this weekday
                    const thisWeekday = $("#week-title").text().toLowerCase();

                    // Are we going forward or backward
                    const forwardOrBackward = $(this).attr("value");

                    // Hide this week's table
                    // $(`#${thisWeekday}-static`).css("display", "none");
                    $(`#${thisWeekday}-static`).removeClass("show-table");

                    // Days of the week
                    let wd = ["monday", "tuesday", "wednesday", "thursday", "friday"]

                    // Get the next or previous day in the week
                    const nextDay = nextPage(thisWeekday, forwardOrBackward, wd)

                    // Change the header text to match next day
                    $("#week-title").text(nextDay.toUpperCase());

                    // Update the dots
                    $(`.dots[weekday='${thisWeekday}']`).removeClass("dot-selected");
                    $(`.dots[weekday='${nextDay}']`).addClass("dot-selected");

                    // Show the next day's table
                    // $(`#${nextDay}-static`).css("display", "block");
                    $(`#${nextDay}-static`).addClass("show-table");

                });

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region DAY OF THE WEEK HTML NAVIGATION DOTS -------------------------------------------------------------------------------------------

                //when navigation dots are clicked, change the page/table to the proper dot's page/table
                $(document).on("click", ".dots", function () {

                    const element = $(this);
                    let leWeekday = element.attr("weekday"); //returns a weekday value if nav-dots in week-tables were clicked, otherwise undefined
                    let leTitle = element.attr("page"); //returns a page value if nav-dots in title-header were clicked, otherwise undefined

                    let dotSet;

                    //sets dotSet to either "Title" or "Weekday" depending on which set of nav-dots were clicked
                    if (!leWeekday) {
                        if (!leTitle) {
                            console.log("The dot you click doesn't exist...");
                        } else {
                            dotSet = "Title";
                        };
                    } else {
                        dotSet = "Weekday";
                    };


                    //For week-tables nav-dots. Sets the header text to the new table title, sets the dot-selected class to the proper dot, 
                    //and shows the proper table
                    if (dotSet == "Weekday") {

                        //sets table title
                        $("#week-title").text(leWeekday.toUpperCase());

                        //removes the dot-selected class from all week-dots class items and adds it to the proper element
                        $(".week-dots").removeClass("dot-selected");
                        $(element).addClass("dot-selected");

                        //removes show-table class from all current-week class items and sets it to the proper element
                        $(".current-week").removeClass("show-table");
                        $(`#${leWeekday}-static`).addClass("show-table");

                    };

                    //For page-title nav-dots. Sets the header text to the new page title, sets the dot-selected class to the proper dot, 
                    //and shows the proper page elements
                    if (dotSet == "Title") {

                        //gives us a version the page title with spaces instead of dashes
                        let leTitleSpace = replaceCharacter(leTitle, "-", " ");

                        //sets page title
                        $("#page-title").text(leTitleSpace.toUpperCase());

                        //removes the dot-selected from all title-dots class items and adds it to the proper element
                        $(".title-dots").removeClass("dot-selected");
                        $(element).addClass("dot-selected");

                        //if changing to the "press-scheduling" page, hide all home elements and show all press scheduling elements
                        if (leTitle == "press-scheduling") {

                            $("#home-page").css("display", "none");

                            $("#select-tables").css("display", "block");
                            $("#week-tables").css("display", "flex");
                            $("#footer").css("display", "flex");

                            // currentPage = "Press Scheduling";

                            //if changing to the "home" page, hide all press scheduling elements and show all home elements
                        } else if (leTitle == "home") {

                            $("#select-tables").css("display", "none");
                            $("#week-tables").css("display", "none");
                            $("#footer").css("display", "none");

                            $("#home-page").css("display", "flex");

                            // currentPage = "Home";

                        };
                    };
                });

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region DOUBLE-CLICK HANDLE TO RESIZE WEEK-TABLE DIV TO TABLE HEIGHT -------------------------------------------------------------------

                //* Adjusts the height of the week-tables div when the user double-clicks the handle to fit the height of the table, 
                //* handle element, and header element
                $("#handle").on("dblclick", function () {
                    console.log("Double clicked...");

                    let h = 0;
                    let hh = 0;
                    let wth = 0;

                    h = $(".show-table").height();
                    hh = $("#handle").height();
                    wth = $("#week-table-head").height();

                    $("#week-tables").animate({
                        height: `${h + hh + wth + 37}px`
                    }, 250)
                });

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region MAKES WEEK-TABLES DIV RESIZABLE ------------------------------------------------------------------------------------------------

                //makes the week-tables div user resizable
                $("#week-tables").resizable({
                    handles: { "n": "#handle" },
                    stop: function (event, ui) {
                        // ui.element.width("");
                    }
                });

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

    //#endregion -------------------------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------




// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
/*

███████ ██    ██ ███    ██  ██████ ████████ ██  ██████  ███    ██ ███████ 
██      ██    ██ ████   ██ ██         ██    ██ ██    ██ ████   ██ ██      
█████   ██    ██ ██ ██  ██ ██         ██    ██ ██    ██ ██ ██  ██ ███████ 
██      ██    ██ ██  ██ ██ ██         ██    ██ ██    ██ ██  ██ ██      ██ 
██       ██████  ██   ████  ██████    ██    ██  ██████  ██   ████ ███████ 

*/

    //#region ----------------------------------------------------------------------------------------------------------------------------------------

        //============================================================================================================================================
            //#region SWAP TO SCHEDULING PAGE --------------------------------------------------------------------------------------------------------

                /**
                 * Hides the Press Scheduling taskpane elements and shows the Welcome taskpane elements
                 */
                function swapToShceduling() {
                    $("#select-tables").css("display", "block");
                    $("#week-tables").css("display", "flex");
                    $("#header").css("display", "block");

                    $("#welcome-page").css("display", "none");
                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region SWAP TO WELCOME PAGE -----------------------------------------------------------------------------------------------------------

                /**
                 * Hides the Welcome Taskpane Elements and shows the Press Scheduling Taskpane Elements
                 */
                function swapToWelcome() {
                    $("#select-tables").css("display", "none");
                    $("#week-tables").css("display", "none");
                    $("#header").css("display", "none");

                    $("#welcome-page").css("display", "flex");
                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region HANDLE DATA VALIDATION CHANGES ON MASTER ---------------------------------------------------------------------------------------

                /**
                 * An event that handles any data validation changes that may need to happen on the Master sheet anytime something updates on it
                 */
                async function handleChange(event) {

                    await Excel.run(async (context) => {

                        //============================================================================================================================
                            //#region IF EVENT IS WERID, DON'T DO IT! --------------------------------------------------------------------------------

                                if (event.details == undefined) {
                                    console.log("Event is undefined");
                                    return;
                                } else {
                                    console.log("The Event is: ");
                                    console.log(event);
                                };

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                        //============================================================================================================================
                            //#region ASSIGN SHEET VARIABLES -----------------------------------------------------------------------------------------

                                const validation = context.workbook.worksheets.getItem("Validation");
                                const customFormsTable = validation.tables.getItem("CustomForms").load("name");
                                const linesTable = validation.tables.getItem("Lines").load("name");
                                const customFormsBodyRange = customFormsTable.getDataBodyRange().load("values");
                                const linesBodyRange = linesTable.getDataBodyRange().load("values");

                                let address = event.address;
                                let changedWorksheet = context.workbook.worksheets.getItem(event.worksheetId).load("name");
                                let changedRange = changedWorksheet.getRange(address);

                                changedRange.dataValidation.clear(); //clear out that data validation!


                                //turns out that the column index for both the changedWorksheet & the changedTable are identical, 
                                //so I am just sticking with the worksheet one
                                let changedColumn = changedWorksheet.getRange(address).load("columnIndex");
                                let changedRow = changedWorksheet.getRange(address).load("rowIndex");

                                let changedTable = context.workbook.tables.getItem(event.tableId).load("name");
                                let changedTableBodyRange = changedTable.getDataBodyRange().load("values");
                                let changedTableHeader = changedTable.getHeaderRowRange().load("values");
                                let changedTableColumns = changedTable.columns
                                changedTableColumns.load("items/name");
                                let changedTableRows = changedTable.rows;
                                changedTableRows.load("items");

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                        await context.sync();

                        //============================================================================================================================
                            //#region LOAD SHEET VARIABLES -------------------------------------------------------------------------------------------

                                let changedTableArr = changedTableBodyRange.values;
                                let changedHeadersValues = changedTableHeader.values;
                                let tableRowItems = changedTableRows.items;
                                let changedTableRowIndex = changedRow.rowIndex - 1; //to account for zero index (no header since this is sheet level)

                                let changedRowValues = tableRowItems[changedTableRowIndex].values

                                let changedTableArrCopy = JSON.parse(JSON.stringify(changedTableBodyRange.values)); //a non-linked copy of the array

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                        //============================================================================================================================
                            //#region CREATE ROW INFO OBJECT -----------------------------------------------------------------------------------------

                                let changedRowInfo = new Object();

                                //creates an object out of the row's info to use in the code
                                for (var headName of changedHeadersValues[0]) {
                                    createRowInfo(
                                        changedHeadersValues, headName, changedRowValues[0], changedTableArrCopy, changedRowInfo, 
                                        changedRow.rowIndex, changedWorksheet
                                    );
                                };

                                globalVar.formsColumnIndex = changedRowInfo.Forms.columnIndex;
                                // console.log(changedRow.rowIndex + 1); //add one since it is zero-indexed
                                // console.log(changedRowInfo.Forms.value);

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                        //============================================================================================================================
                            //#region UPDATE DATA VALIDATION IN FORMS COLUMN -------------------------------------------------------------------------

                                //if the changed value is in the Forms column, trigger a re-evaluation of the data validation for the changed cell
                                if (changedRowInfo.Forms.columnIndex == changedColumn.columnIndex) {

                                    changedRange.dataValidation.clear(); //clear out current data validation

                                    //if updated value in cell is not a number or blank, give it data validation!
                                    if (!Number(event.details.valueAfter) && event.details.valueAfter !== "") {
                                        // console.log(masterArr[z][masterFormColumnIndex] + "is not a number!");
                                        let dv = {
                                            list: {
                                                inCellDropdown: true,
                                                source: customFormsBodyRange
                                            }
                                        };

                                        changedRange.dataValidation.rule = dv;

                                        //update the conditional formatting of this cell based on the new value
                                        conditionalFormatting(changedWorksheet, changedRange, changedRowInfo.Forms.value, null);

                                        await context.sync(); //make it a reality within excel

                                    };

                                    //if updated value in cell is a Number or blank, clear out the data validation
                                    if (Number(event.details.valueAfter) || event.details.valueAfter == "") {

                                        changedRange.dataValidation.clear();

                                        //update the conditional formatting of this cell based on the new value
                                        conditionalFormatting(changedWorksheet, changedRange, changedRowInfo.Forms.value, null);

                                        console.log("I am a number now (or I am nothing)!");

                                    };

                                };

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                        //============================================================================================================================
                            //#region UPDATE THE DATA VALIDATION IN THE TYPE COLUMN ------------------------------------------------------------------

                                //if the changed value is in the Type column, update the data validation in said cell
                                if (changedRowInfo.Type.columnIndex == changedColumn.columnIndex) {

                                    changedRange.dataValidation.clear();

                                    let dv = {
                                        list: {
                                            inCellDropdown: true,
                                            source: linesBodyRange
                                        }
                                    };

                                    changedRange.dataValidation.rule = dv;

                                    await context.sync();

                                };

                            //#endregion -------------------------------------------------------------------------------------------------------------
                        //============================================================================================================================

                    }).catch(errorHandlerFunction);
                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region CLEAR FORMS CONFIRMATION WINDOW ------------------------------------------------------------------------------------------------

                /**
                 * Shows the clear forms confirmation window and either runs fucntions to reset all info or closes the window, based on users choice
                 */
                async function clearForms() {

                    deactivateEvents();

                    await Excel.run(async (context) => {

                        const allSheets = context.workbook.worksheets.load("items/name");
                        const validation = context.workbook.worksheets.getItem("Validation");
                        const linesTable = validation.tables.getItem("Lines");
                        const linesBodyRange = linesTable.getDataBodyRange().load("values");

                        await context.sync();

                        let linesArr = linesBodyRange.values;

                        $("#reset-background").css("display", "flex");

                        $("#reset-forms").on("click", () => {
                            resetForms(); //clears E2R generated data 
                            clearPSInfo(); //clears all data from Press Scheduling Table (also reloads, which then clears out taskpane)
                            removeBreakoutSheets(linesArr, allSheets); //clears out all generated breakout sheets
                        });

                        $("#no").on("click", () => {
                            $("#reset-background").css("display", "none");
                        });

                    });

                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region RESET FORMS (RUNS RESET FUNCTION AND CLEARS CERTAIN TASKPANE ELEMENTS) ---------------------------------------------------------

                /**
                 * Turns off events, runs reset function, and turns off reset warning window
                 */
                async function resetForms() {

                    await Excel.run(async (context) => {

                        deactivateEvents();

                        reset();
                        console.log("All forms were reset");
                        $("#reset-background").css("display", "none");
                        $("#populate-forms").css("display", "flex");
                        $("#clear-forms").css("display", "none");
                        $("#breakout").css("display", "none");

                    });

                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region RESET FUNCTION -----------------------------------------------------------------------------------------------------------------

                /**
                 * Clears out all E2R generated data, then reloads the add-in
                 */
                async function reset() {

                    try {

                        await Excel.run(async (context) => {

                            //========================================================================================================================
                                //#region DEFINE FUNCTION VARIABLES ----------------------------------------------------------------------------------

                                    //load in worksheets
                                    const silkE2RSheet = context.workbook.worksheets.getItem("SilkE2R").load("name");
                                    const textE2RSheet = context.workbook.worksheets.getItem("TextE2R").load("name");
                                    const digE2RSheet = context.workbook.worksheets.getItem("DIGE2R").load("name");
                                    const masterSheet = context.workbook.worksheets.getItem("Master").load("name");


                                    //load in tables
                                    const silkE2RTable = silkE2RSheet.tables.getItem("SilkE2R");
                                    const textE2RTable = textE2RSheet.tables.getItem("TextE2R");
                                    const digE2RTable = digE2RSheet.tables.getItem("DIGE2R");
                                    const masterTable = masterSheet.tables.getItem("Master");


                                    //loads the data body range of the tables above
                                    const silkE2RBodyRange = silkE2RTable.getDataBodyRange().load("values");
                                    const textE2RBodyRange = textE2RTable.getDataBodyRange().load("values");
                                    const digE2RBodyRange = digE2RTable.getDataBodyRange().load("values");
                                    const masterBodyRange = masterTable.getDataBodyRange().load("values");


                                    //loads the row items for specific tables
                                    const silkE2RTableRows = silkE2RTable.rows.load("items");
                                    const textE2RTableRows = textE2RTable.rows.load("items");
                                    const digE2RTableRows = digE2RTable.rows.load("items");
                                    const masterTableRows = masterTable.rows.load("items");

                                //#endregion ---------------------------------------------------------------------------------------------------------
                            //========================================================================================================================

                            await context.sync();

                            //========================================================================================================================
                                //#region LOAD FUNCTION VARIABLES ------------------------------------------------------------------------------------

                                    let silkE2RArr = silkE2RBodyRange.values; //moves all values of the SilkE2R table to an array
                                    let textE2RArr = textE2RBodyRange.values; //moves all values of the TextE2R table to an array
                                    let digE2RArr = digE2RBodyRange.values; //moves all values of the DIGE2R table to an array
                                    let masterArr = masterBodyRange.values;

                                //#endregion ---------------------------------------------------------------------------------------------------------
                            //========================================================================================================================

                            //========================================================================================================================
                                //#region CLEAR SILK E2R ---------------------------------------------------------------------------------------------

                                    let silkE2RClear = clearE2R(silkE2RArr, silkE2RTableRows, silkE2RSheet);

                                    silkE2RBodyRange.values = silkE2RClear;

                                //#endregion ---------------------------------------------------------------------------------------------------------
                            //========================================================================================================================

                            //========================================================================================================================
                                //#region CLEAR TEXT E2R ---------------------------------------------------------------------------------------------

                                    let textE2RClear = clearE2R(textE2RArr, textE2RTableRows, textE2RSheet);

                                    textE2RBodyRange.values = textE2RClear;

                                //#endregion ---------------------------------------------------------------------------------------------------------
                            //========================================================================================================================

                            //========================================================================================================================
                                //#region CLEAR DIGITAL E2R ------------------------------------------------------------------------------------------

                                    let digE2RClear = clearE2R(digE2RArr, digE2RTableRows, digE2RSheet);

                                    digE2RBodyRange.values = digE2RClear;

                                //#endregion ---------------------------------------------------------------------------------------------------------
                            //========================================================================================================================

                            //========================================================================================================================
                                //#region CLEAR MASTER -----------------------------------------------------------------------------------------------

                                    let masterClear = clearE2R(masterArr, masterTableRows, masterSheet);

                                    masterBodyRange.values = masterClear;

                                //#endregion ---------------------------------------------------------------------------------------------------------
                            //========================================================================================================================

                        });

                        location.reload();

                    } catch (err) {
                        console.error(err);
                        // showMessage(error, "show");
                    };

                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region CLEAR POPULATED INFO -----------------------------------------------------------------------------------------------------------

                /**
                 * Clears the info from the first 2 columns in the Master Table and from the 2nd, 3rd, 4th, 5th, 6th, & 7th columns in the E2R Tables
                 * @param {Array} tableArray The array of the table to clear values from
                 * @param {Object} tableRows An object of all the rows in the tab;e
                 * @param {String} worksheet The worksheet
                 * @returns Array
                 */
                function clearE2R(tableArray, tableRows, worksheet) {

                    let i = 0;

                    if (worksheet.name == "Master") {

                        for (var row of tableArray) {

                            //just in case we need to clear any formatting, but for now we want to leave all formatting as is
                            let tableRowRange = tableRows.getItemAt(i).getRange();

                            //just the address of the forms column to be used to remove conditional formatting on clear
                            let formsAddress = worksheet.getCell(i, globalVar.formsColumnIndex);

                            row[0] = ""; //the first item in the row, so in other words the value in column 1
                            row[1] = ""; //the second item in the row, so in other words the value in column 2

                            formsAddress.format.fill.clear();
                            formsAddress.format.font.color = "black";
                            formsAddress.format.font.bold = false;

                            i = i + 1;

                        };

                    } else {

                        for (var row of tableArray) {

                            //if there is only one row in the table and the first value (the value in Metrix Info) is blank, do nothing since that
                            //means that there is probably nothing in this table
                            if (tableArray.length < 2 && row[0] == "") {
                                return;
                            };

                            let tableRowRange = tableRows.getItemAt(i).getRange();


                            row[1] = ""; //the second item in the row, so in other words the value in column 2
                            row[2] = ""; //the third item in the row, so in other words the value in column 3
                            row[3] = ""; //the forth item in the row, so in other words the value in column 4
                            row[4] = ""; //the fifth item in the row, so in other words the value in column 5
                            row[5] = ""; //the sixth item in the row, so in other words the value in column 6
                            row[6] = ""; //the seventh item in the row, so in other words the value in column 7


                            tableRowRange.format.font.bold = false;
                            tableRowRange.format.fill.clear();

                            i = i + 1;

                        };

                    };

                    return tableArray;

                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region PUSH BODY RANGE VALUES TO SINGLE ARRAY -----------------------------------------------------------------------------------------

                /**
                * Pushes the values from an array of arrays (typically the values from a body range) to a single array
                * @param {Array} bodyRangeValues An array of arrays containing the table values from the body range
                * @param {Array} arrayToPushTo A single array you wish to push the body range values to
                */
                function pushBodyRangeValuesToArray(bodyRangeValues, arrayToPushTo) {

                    for (let row of bodyRangeValues) {
                        arrayToPushTo.push(row[0]);
                    };

                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region REPLACE CHARACTER(S) -----------------------------------------------------------------------------------------------------------

                /**
                 * Replaces a character or set of characters in a string with another user defined character or set of characters and 
                 * returns the altered string
                 * @param {String} string The string that you wish to replace a certain character in
                 * @param {String} replaceThis The character or set of characters that you wish to replace
                 * @param {String} withThis The character or set of characters that you wish to substitute
                 * @returns String
                 */
                function replaceCharacter(string, replaceThis, withThis) {
                    if (string.includes(replaceThis)) {
                        string = string.replace(replaceThis, withThis);
                    };
                    return string;
                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region NEXT PAGE FUNCTION FOR NAVIGATION ARROW CLICKS ---------------------------------------------------------------------------------

                /**
                 * Returns the next or previous page or day in the week
                 * @param {String} currentPage The currently shown page or day of the week table
                 * @param {String} prevOrNext Do we move "forward" or "back" in the pages or days of the week table
                 * @param {Array} arrOfPages Array of all the page nbames or days of the week
                 */
                function nextPage(currentPage, prevOrNext, arrOfPages) {

                    // Get the index of the current weekday
                    const thisIndex = arrOfPages.indexOf(currentPage);

                    // If it's forward or backward...
                    switch (prevOrNext) {

                        case "forward": // Show the next weekday
                            if (thisIndex + 1 === arrOfPages.length) { // Current is Friday
                                return arrOfPages[0] // return Monday
                            } else {
                                return arrOfPages[thisIndex + 1]
                            }
                            break;

                        case "back":  // Show the previous weekday

                            if (thisIndex == 0) { // Current is Monday
                                return arrOfPages[arrOfPages.length - 1] // return Friday
                            } else {
                                return arrOfPages[thisIndex - 1]
                            }

                            // Show the previous weekday
                            break;
                    };

                    throw new Error("Could not figure out the next or previous page");

                };

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

    //#endregion -------------------------------------------------------------------------------------------------------------------------------------
       
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------




// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
/*

██      ███████  ██████   █████   ██████ ██    ██     ███████ ██    ██ ███    ██  ██████ ████████ ██  ██████  ███    ██ ███████ 
██      ██      ██       ██   ██ ██       ██  ██      ██      ██    ██ ████   ██ ██         ██    ██ ██    ██ ████   ██ ██      
██      █████   ██   ███ ███████ ██        ████       █████   ██    ██ ██ ██  ██ ██         ██    ██ ██    ██ ██ ██  ██ ███████ 
██      ██      ██    ██ ██   ██ ██         ██        ██      ██    ██ ██  ██ ██ ██         ██    ██ ██    ██ ██  ██ ██      ██ 
███████ ███████  ██████  ██   ██  ██████    ██        ██       ██████  ██   ████  ██████    ██    ██  ██████  ██   ████ ███████ 

*/

    //#region ----------------------------------------------------------------------------------------------------------------------------------------

        //============================================================================================================================================
            //#region (LEGACY) PRODUCT LIST GLOBAL VARIABLE ------------------------------------------------------------------------------------------

                // let productList = [
                //   {name: "100# Gloss Postcard", abbr: "PC", breakout: null},
                //   {name: "2 sided box topper", abbr: "2SBT", breakout: null},
                //   {name: "2 Sided Flyer", abbr: "2SBT", breakout: null},
                //   {name: "80LBFLYER", abbr: "80LBFL", breakout: null},
                //   {name: "80LBFLYER", abbr: "80#FL", breakout: null},
                //   {name: "Artwork Only", abbr: "CUSTOMTEXT", breakout: null},
                //   {name: "Bella Canvas 3001C", abbr: "Bella Canvas 3001C", breakout: null},
                //   {name: "Bella Canvas 3001CVC", abbr: "Bella Canvas 3001CVC", breakout: null},
                //   {name: "Bella Canvas 3501", abbr: "Bella Canvas 3501", breakout: null},
                //   {name: "Bella Canvas 3501CVC", abbr: "Bella Canvas 3501CVC", breakout: null},
                //   {name: "BirthdayPC", abbr: "BirthdayPC", breakout: null},
                //   {name: "BirthdayPC", abbr: "BIRTH", breakout: null},
                //   {name: "Box Topper April", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper August", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper December", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper February", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper January", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper July", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper June", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper March", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper May", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper November", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper October", abbr: "MoBT", breakout: null},
                //   {name: "Box Topper September", abbr: "MoBT", breakout: null},
                //   {name: "Brochure 10.5x17", abbr: "MENU", breakout: null},
                //   {name: "Brochure Small", abbr: "80LBFL", breakout: null},
                //   {name: "Brochure Small", abbr: "80#FL", breakout: null},
                //   {name: "Brochure Small", abbr: "BrochSm", breakout: null},
                //   {name: "BrochureXL", abbr: "XL", breakout: null},
                //   {name: "BTFP2side", abbr: "BTFP2", breakout: null},
                //   {name: "BTFP2side", abbr: "BTFP2side", breakout: null},
                //   {name: "BusinessCard", abbr: "CUSTOM110NEENAH", breakout: null},
                //   {name: "CALL TRACKING", abbr: "CALLTRACKING", breakout: null},
                //   {name: "ColossalPC", abbr: "COLPC", breakout: null},
                //   {name: "COUPON BOOK", abbr: "COUP", breakout: null},
                //   {name: "Custom 20# Bond", abbr: "CUSTOM20", breakout: null},
                //   {name: "Custom Insert", abbr: "CUSTOMTEXT", breakout: null},
                //   {name: "Custom100", abbr: "CUSTOM100", breakout: null},
                //   {name: "CUSTOM80", abbr: "CUSTOMTEXT", breakout: null},
                //   {name: "CustomEnv", abbr: "CUSTOMENV", breakout: null},
                //   {name: "CustomEnv", abbr: "ENV", breakout: null},
                //   {name: "CustomSilk", abbr: "CUSTOMSILK", breakout: null},
                //   {name: "DataProcessing", abbr: "NULL", breakout: null},
                //   {name: "DataProcessing", abbr: "DPS", breakout: null},
                //   {name: "DDBanner4x8", abbr: "DDBANNER", breakout: null},
                //   {name: "DDBizCardsCircle", abbr: "DDBIZ", breakout: null},
                //   {name: "DDBrochBiFold", abbr: "DDBROCH", breakout: null},
                //   {name: "DDCrewNeck", abbr: "DDCrewNeck", breakout: null},
                //   {name: "DDFullZipHoodie", abbr: "DDFullZipHoodie", breakout: null},
                //   {name: "DDHoodie", abbr: "DDHoodie", breakout: null},
                //   {name: "DDLongSleeve", abbr: "DDLongSleeve", breakout: null},
                //   {name: "DDPoloShirt", abbr: "DDPoloShirt", breakout: null},
                //   {name: "DDPostcard6x4", abbr: "DDPC", breakout: null},
                //   {name: "DDShortSleeve", abbr: "DDShortSleeve", breakout: null},
                //   {name: "District DT6100", abbr: "District DT6100", breakout: null},
                //   {name: "District DT6104", abbr: "District DT6104", breakout: null},
                //   {name: "District DT8102", abbr: "District DT8102", breakout: null},
                //   {name: "DOOR HANGER 100LB", abbr: "100#DH", breakout: null},
                //   {name: "DOOR HANGER 100LB", abbr: "100LBDH", breakout: null},
                //   {name: "DOOR HANGER 100LB", abbr: "DH", breakout: null},
                //   {name: "DOOR HANGER 80LB", abbr: "80#DH", breakout: null},
                //   {name: "DOOR HANGER 80LB", abbr: "80LBDH", breakout: null},
                //   {name: "DOOR HANGER 80LB", abbr: "NULL", breakout: null},
                //   {name: "DOOR HANGER 80LB", abbr: "DH", breakout: null},
                //   {name: "EDDM 7x7 PC", abbr: "CUSTOM100", breakout: null},
                //   {name: "EDDM 7x7 PC", abbr: "EDDMPC", breakout: null},
                //   {name: "EDDM Folded Magnet", abbr: "FMAG", breakout: null},
                //   {name: "EDDM Folded Magnet", abbr: "FMAGEDDM", breakout: null},
                //   {name: "EDDM Mag", abbr: "MAG", breakout: null},
                //   {name: "EDDM MENU", abbr: "MENU", breakout: null},
                //   {name: "EDDM POSTCARD", abbr: "PC", breakout: null},
                //   {name: "EDDM Scratch Off", abbr: "SO", breakout: null},
                //   {name: "EDDM XL MENU", abbr: "XL", breakout: null},
                //   {name: "EDDM80#FLYER", abbr: "80#FL", breakout: null},
                //   {name: "EDDM80#FLYER", abbr: "80LBFL", breakout: null},
                //   {name: "EDDM80#FLYER", abbr: "EDDM80FLY", breakout: null},
                //   {name: "EDDMBroch", abbr: "MENU", breakout: null},
                //   {name: "EDDMBrochXL", abbr: "XL", breakout: null},
                //   {name: "EDDMColossal", abbr: "COLPC", breakout: null},
                //   {name: "EDDMJumboPC", abbr: "JUMBO", breakout: null},
                //   {name: "EDDMJumboSO", abbr: "JUMBO", breakout: null},
                //   {name: "EDDMPeelAGift", abbr: "PPC", breakout: null},
                //   {name: "EDDMPizzaPeelCard", abbr: "PPC", breakout: null},
                //   {name: "Env #10 8.5x11 S1", abbr: "LET", breakout: null},
                //   {name: "Env #10 8.5x11 S1", abbr: "LET_1S", breakout: null},
                //   {name: "Env #10 8.5x11 S2", abbr: "LET", breakout: null},
                //   {name: "Env #10 8.5x11 S2", abbr: "LET_2S", breakout: null},
                //   {name: "Env #10 8.5x11 V1", abbr: "LET", breakout: null},
                //   {name: "Env #10 8.5x11 V1", abbr: "LET_1S", breakout: null},
                //   {name: "Env #10 8.5x11 V2", abbr: "LET", breakout: null},
                //   {name: "Env #10 8.5x11 V2", abbr: "LET_2S", breakout: null},
                //   {name: "Env #10 8.5x14 S1", abbr: "LEG", breakout: null},
                //   {name: "Env #10 8.5x14 S1", abbr: "LEG_1S", breakout: null},
                //   {name: "Env #10 8.5x14 S2", abbr: "LEG", breakout: null},
                //   {name: "Env #10 8.5x14 S2", abbr: "LEG_2S", breakout: null},
                //   {name: "Env #10 8.5x14 V1", abbr: "LEG", breakout: null},
                //   {name: "Env #10 8.5x14 V1", abbr: "LEG_1S", breakout: null},
                //   {name: "Env #10 8.5x14 V2", abbr: "LEG", breakout: null},
                //   {name: "Env #10 8.5x14 V2", abbr: "LEG_2S", breakout: null},
                //   {name: "Expedite", abbr: "Expedite", breakout: null},
                //   {name: "FakeT", abbr: "FakeT", breakout: null},
                //   {name: "Flyer 8.5X11", abbr: "8_5x11FL", breakout: null},
                //   {name: "Folded Magnet", abbr: "FMAG", breakout: null},
                //   {name: "Gildan 2000B", abbr: "Gildan 2000B", breakout: null},
                //   {name: "Gildan 6400L", abbr: "Gildan 6400L", breakout: null},
                //   {name: "Gildan 8800", abbr: "Gildan 8800", breakout: null},
                //   {name: "Gildan G5000", abbr: "Gildan G5000", breakout: null},
                //   {name: "Gildan G540", abbr: "Gildan G540", breakout: null},
                //   {name: "Gildan G640", abbr: "Gildan G640", breakout: null},
                //   {name: "Guide", abbr: "Guide", breakout: null},
                //   {name: "Hanes F260", abbr: "Hanes F260", breakout: null},
                //   {name: "Hanes T-Shirt", abbr: "Hanes T-Shirt", breakout: null},
                //   {name: "Jumbo Scratch", abbr: "JUMBOSO", breakout: null},
                //   {name: "JUMBOPC", abbr: "JUMBO", breakout: null},
                //   {name: "Long Postcard", abbr: "LPO", breakout: null},
                //   {name: "MAGNET", abbr: "MAG", breakout: null},
                //   {name: "Mail List Costs", abbr: "Mail List Costs", breakout: null},
                //   {name: "MENU", abbr: "MENU", breakout: null},
                //   {name: "Menu- Flat", abbr: "MENU", breakout: null},
                //   {name: "Menu Small", abbr: "80LBFL", breakout: null},
                //   {name: "Menu Small", abbr: "80#FL", breakout: null},
                //   {name: "Menu Small", abbr: "MenuSm", breakout: null},
                //   {name: "MENU XXL", abbr: "XXL", breakout: null},
                //   {name: "MenuXL", abbr: "XL", breakout: null},
                //   {name: "MenuXL-Flat", abbr: "XL", breakout: null},
                //   {name: "MGP-LONG POSTCARD", abbr: "LPO", breakout: null},
                //   {name: "MGP-MAGNET", abbr: "MAG", breakout: null},
                //   {name: "MGP-PLASTIC MED 20m", abbr: "MPL", breakout: null},
                //   {name: "MGP-POSTCARD", abbr: "PC", breakout: null},
                //   {name: "MGP-SCRATCHOFF", abbr: "SO", breakout: null},
                //   {name: "MockPostcard", abbr: "MockPostcard", breakout: null},
                //   {name: "MockPostcard", abbr: "NULL", breakout: null},
                //   {name: "MPBTAC", abbr: "MPBTAC", breakout: null},
                //   {name: "MPBTNO", abbr: "MPBTNO", breakout: null},
                //   {name: "MPC", abbr: "MPC", breakout: null},
                //   {name: "MPCC", abbr: "MPCC", breakout: null},
                //   {name: "MPCMS", abbr: "MPCMS", breakout: null},
                //   {name: "MPCVDLAM", abbr: "CVDLAM", breakout: null},
                //   {name: "MPEXTWC2436AC", abbr: "MPWC2436AC", breakout: null},
                //   {name: "MPEXTWC2436NO", abbr: "MPWC2436NO", breakout: null},
                //   {name: "MPEXTWC3040AC", abbr: "MPWC3040AC", breakout: null},
                //   {name: "MPEXTWC3040NO", abbr: "MPWC3040NO", breakout: null},
                //   {name: "MPINTWC2436AC", abbr: "MPINTWC2436AC", breakout: null},
                //   {name: "MPINTWC2436NO", abbr: "MPINTWC2436NO", breakout: null},
                //   {name: "MPINTWC3040AC", abbr: "MPINTWC3040AC", breakout: null},
                //   {name: "MPINTWC3040NO", abbr: "MPINTWC3040NO", breakout: null},
                //   {name: "MPIS", abbr: "MPIS", breakout: null},
                //   {name: "MPND", abbr: "MPND", breakout: null},
                //   {name: "MPNutGuide", abbr: "MPNutGuide", breakout: null},
                //   {name: "MPP", abbr: "MPP", breakout: null},
                //   {name: "MPPICMENU", abbr: "PICMENU", breakout: null},
                //   {name: "MPPlastic PC Med - S", abbr: "MPPlastic PC Med - S", breakout: null},
                //   {name: "MPPlastic PC Med - S", abbr: "NULL", breakout: null},
                //   {name: "MPPO2254", abbr: "MPPO2254", breakout: null},
                //   {name: "MPPO2436", abbr: "MPPO2436", breakout: null},
                //   {name: "MPPO3040", abbr: "MPPO3040", breakout: null},
                //   {name: "MPPODS2436", abbr: "MPPODS2436", breakout: null},
                //   {name: "MPPS", abbr: "MPPS", breakout: null},
                //   {name: "MPSCFS", abbr: "MPSCFS", breakout: null},
                //   {name: "NEW MOVERS PLASTIC", abbr: "NEW MOVERS PLASTIC", breakout: null},
                //   {name: "NEW MOVERS PLASTIC", abbr: "SPL_NM", breakout: null},
                //   {name: "NEW MOVERS POSTCARD", abbr: "NEW MOVERS POSTCARD", breakout: null},
                //   {name: "NEW MOVERS POSTCARD", abbr: "NM", breakout: null},
                //   {name: "Next Level 3600", abbr: "Next Level 3600", breakout: null},
                //   {name: "Next Level N6210", abbr: "Next Level N6210", breakout: null},
                //   {name: "NON PROFIT MAILER", abbr: "NPM", breakout: null},
                //   {name: "NonProfit100#", abbr: "CUSTOM100", breakout: null},
                //   {name: "NonProfit80#", abbr: "CUSTOMTEXT", breakout: null},
                //   {name: "ONLINE ORDERING", abbr: "ONLINE ORDERING", breakout: null},
                //   {name: "ONLINE ORDERING", abbr: "NULL", breakout: null},
                //   {name: "Payment Plan", abbr: "Payment Plan", breakout: null},
                //   {name: "Peel A Gift", abbr: "PPC", breakout: null},
                //   {name: "PizzaPeelCard", abbr: "PPC", breakout: null},
                //   {name: "Plastic PC Lg - S", abbr: "LPL", breakout: null},
                //   {name: "Plastic PC Lg - V", abbr: "LPL", breakout: null},
                //   {name: "Plastic PC Med - S", abbr: "MPL", breakout: null},
                //   {name: "Plastic PC Med - V", abbr: "MPL", breakout: null},
                //   {name: "Plastic PC Sm - S", abbr: "SPL", breakout: null},
                //   {name: "Plastic PC Sm - V", abbr: "SPL", breakout: null},
                //   {name: "Port Authority K8000", abbr: "Port Authority K8000", breakout: null},
                //   {name: "Port Company PC850H", abbr: "Port Company PC850H", breakout: null},
                //   {name: "POSTCARD", abbr: "PC", breakout: null},
                //   {name: "Postcard Magnet", abbr: "MAG", breakout: null},
                //   {name: "PosterHangBar", abbr: "PosterHangBar", breakout: null},
                //   {name: "REPRINT100#", abbr: "REPRINT100", breakout: null},
                //   {name: "REPRINT80#", abbr: "REPRINT80", breakout: null},
                //   {name: "SCRATCHOFF", abbr: "SO", breakout: null},
                //   {name: "Unique Codes", abbr: "Unique Codes", breakout: null},
                //   {name: "WC2030", abbr: "WC2030", breakout: null},
                //   {name: "WC2430", abbr: "WC2430", breakout: null},
                //   {name: "WC2436", abbr: "WC2436", breakout: null},
                //   {name: "WC3040", abbr: "WC3040", breakout: null},
                //   {name: "WCCust", abbr: "WCCUSTOM", breakout: null},
                //   {name: "WCPoster2Side2430", abbr: "2xWC2430", breakout: null},
                //   {name: "WCPoster2Side2436", abbr: "2xWC2436", breakout: null},
                //   {name: "x.100#custom", abbr: "CUSTOM100", breakout: null},
                //   {name: "x.80#custom", abbr: "CUSTOM80", breakout: null},
                //   {name: "x.Flyer.10.5x17", abbr: "MENU", breakout: null},
                //   {name: "x.Flyer.8.5x10.5", abbr: "80#FL", breakout: null},
                //   {name: "x.JUMBOPC", abbr: "JUMBO", breakout: null},
                //   {name: "x.Magnet", abbr: "MAG", breakout: null},
                //   {name: "x.Menu.10.5x17", abbr: "MENU", breakout: null},
                //   {name: "x.Menu.8.5x10.5", abbr: "MenuSm", breakout: null},
                //   {name: "x.Postcard.5.5x10.5", abbr: "PC", breakout: null},
                //   {name: "x.Postcard.5.5x8.5", abbr: "CUSTOM100", breakout: null},
                //   {name: "x.Postcard.8.5x10.5", abbr: "JUMBO", breakout: null},
                //   {name: "x.Reprint100#", abbr: "x.Reprint100", breakout: null},
                //   {name: "x.Reprint100#", abbr: "NULL", breakout: null},
                //   {name: "x.Reprint80#", abbr: "x.Reprint80", breakout: null},
                //   {name: "x.Reprint80#", abbr: "NULL", breakout: null},
                //   {name: "x.ScratchOff", abbr: "SO"}
                // ];

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region (LEGACY) FINDS ALL ABBREVIATIONS FOR THE GIVEN PRODUCT IN THE PRODUCT LIST -----------------------------------------------------

                // function productAbbr (product) {

                //   const result = productList.filter((item) => {
                //       if (item.name === product) {
                //         return item;
                //       }
                //   });

                //   // console.log(result);

                //   if (result.length > 0) {
                //       // Handle multiple results
                //       return result
                //   } else {
                //       // Handle no results
                //       const err = new Error("No products found.")
                //       return err
                //   }

                // }

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        //============================================================================================================================================
            //#region CAMEL-CASE A STRING FROM TABLE DATA AND TRY TO CREATE DYNAMIC VARIABLES (CAMEL-CASE WORKS, DYNAMIC VARIABLES DO NOT) -----------

                // for (var lineItem of globalVar.linesData) {

                //   let lineItemSplit = lineItem.split(" ");

                //   let firstWord = lineItemSplit[0].toLowerCase();

                //   if (firstWord.includes("-")) {
                //     firstWord = firstWord.replace("-", "");
                //   };

                //   lineItemSplit.shift();

                //   let tempString = firstWord;

                //   for (var word of lineItemSplit) {

                //     if (word.includes("-")) {
                //       word = word.replace("-", "");
                //     };

                //     let cheese = word.charAt(0).toUpperCase() + word.substr(1).toLowerCase(); //+ lineItemSplit[word].slice(1);

                //     tempString = tempString + cheese;

                //     // console.log(tempString);

                //   }

                //   lineArray.push(tempString);

                //   console.log(lineArray);

                //   // if (masterType == lineItem) {
                //   //   array.push(masterRow)
                //   // }
                // };


                // arr1 = [[postcardLine4Podium], [scratchoffLine]]

                // for (var m = 0; m < lineArray.length; m++) {
                //   eval('let ' + lineArray[m] + '= ' + m + ';');
                // };

                // console.log(postcardLine4Podium);

            //#endregion -----------------------------------------------------------------------------------------------------------------------------
        //============================================================================================================================================

        /*globalVar.scrollErr.scrollTop = globalVar.scrollHeight;*/

    //#endregion -------------------------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------
