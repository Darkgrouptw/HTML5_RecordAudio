var recorder = null;            // 錄音變數
var FullPageAPI = null;            // 頁面控制

/*
錄音專用
*/
function startRecording() 
{
    HZRecorder.get(function (rec) {
        recorder = rec;
        recorder.start();
        
        // 文字
        $("#before_recorder_div").hide();
        $("#recording_div").show();
        
    });
}
function stopRecording()
{
    recorder.stop();
    
    // 測試播放用
    recorder.play($("#testPlay")[0]);
    
    // 傳 Request             
    var fd = new FormData();
    var f = new File([recorder.getBlob()], "Test.wav");
    
    fd.append("DeviceId", 0);
    fd.append("Content", "Test");
    fd.append("VoiceFile", f);
    
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("load", function (e) {
                console.log(e);
            }, false);
    xhr.open("POST", "
             ", true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(fd);  
    
    // 跳到另外一個頁面
    RecordingFinish();
}


/*
這邊是 Custom Button 的按鈕
*/ 
function Introduction_Button_Press()
{
    if(FullPageAPI != null)
        FullPageAPI.moveSlideRight();
}
function RecordingFinish()
{
    if(FullPageAPI != null)
        FullPageAPI.moveSlideRight();
}



/*
JQuery
*/
$(function(){
    FullPageAPI = new fullpage('#fullpage', {
        sectionsColor: ['#FFFFFF'],
        licenseKey: "OPEN-SOURCE-GPLV3-LICENSE",
        controlArrows: false
        //anchors: ["Introduction"]
    });
});