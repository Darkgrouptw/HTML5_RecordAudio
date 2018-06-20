//window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();

// 要初始化 Audio 的 Function
function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, initRecorder, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}

// 初始化 Recorder
function initRecorder()
{
    console.log("Record");
}

window.addEventListener('load', initAudio );