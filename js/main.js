var recorder = null;

function startRecording() 
{
    HZRecorder.get(function (rec) {
        recorder = rec;
        recorder.start();
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