var recorder = null;

function startRecording() 
{
    HZRecorder.get(function (rec) {
        recorder = rec;
        recorder.start();
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