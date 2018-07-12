var recorder = null;

/*
錄音專用
*/
function startRecording() 
{
    HZRecorder.get(function (rec) {
        recorder = rec;
        recorder.start();
        
        // 測試用
        //recorder.testOutput($("#testPlay")[0]);
    });
}
function stopRecording()
{
    recorder.stop();
}
function playRecording() 
{
    recorder.play($("#testPlay")[0]);
}


/*
這邊是 Custom Button 的按鈕
*/ 

/*
JQuery
*/
var FullPage = null;
$(function(){
    FullPage = new fullpage('#fullpage', {
        sectionsColor: ['#4BBFC3'],
        licenseKey: "OPEN-SOURCE-GPLV3-LICENSE",
        controlArrows: false
        //anchors: ["Introduction"]
    });
});