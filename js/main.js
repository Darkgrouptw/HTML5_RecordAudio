var recorder = null;            // 錄音變數
var FullPageAPI = null;            // 頁面控制

/*
錄音專用
*/
function startRecording() 
{
    HZRecorder.get(function (rec) {
        /*recorder = rec;
        recorder.start();*/
        
        // 文字
        $("#before_recorder_div").hide();
        $("#recording_div").show();
        
    });
}
function stopRecording()
{
    /*recorder.stop();
    
    // 測試播放用
    recorder.play($("#testPlay")[0]);*/
    
    // 轉 Base64
    /*var reader = new FileReader();
    reader.readAsDataURL(recorder.getBlob()); 
    reader.onloadend = function() {
        base64data = reader.result;                
        
        var fd = new FormData();
        fd.append("DeviceId", 0);
        fd.append("Content", "Test");
        fd.append("VoiceFile", "AAA");
        var xhr = new XMLHttpRequest();
        /*if (callback) {
            xhr.upload.addEventListener("progress", function (e) {
                callback('uploading', e);
            }, false);
            xhr.addEventListener("load", function (e) {
                callback('ok', e);
            }, false);
            xhr.addEventListener("error", function (e) {
                callback('error', e);
            }, false);
            xhr.addEventListener("abort", function (e) {
                callback('cancel', e);
            }, false);
        }*/
        /*xhr.addEventListener("load", function (e) {
                console.log(e);
            }, false);
        xhr.open("POST", "https://message.waynehuang.ml/api/uploadMusic", true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        //xhr.setRequestHeader('Access-Control-Allow-Origin','*');
        xhr.send(fd);   
    }*/
    
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
        sectionsColor: ['#4BBFC3'],
        licenseKey: "OPEN-SOURCE-GPLV3-LICENSE",
        controlArrows: false
        //anchors: ["Introduction"]
    });
});