(function (window) {
    // 相容性的問題
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    var HZRecorder = function (stream, config) {
        config = config || {};
        //config.sampleBits = config.sampleBits || 8;             //採樣數位 8, 16
        //config.sampleRate = config.sampleRate || (44100 / 6);   //取樣速率(1/6 44100)

        var context = new (window.webkitAudioContext || window.AudioContext)();
        var audioInput = context.createMediaStreamSource(stream);
        var createScript = context.createScriptProcessor || context.createJavaScriptNode;
        var recorder = createScript.apply(context, [4096, 2, 2]);

        var audioData = {
            size: 0                                     // 錄音文件長度
            , bufferL: []                               // 左聲道
            , bufferR: []                               // 右聲道
            , sampleRate: context.sampleRate            // 取樣頻率
            , input: function (data) {
                this.bufferL.push(data[0]);
                this.bufferR.push(data[1]);
                this.size += data[0].length;
            }
            , mergeBuffers: function(recBuffers, recLength){            // 把 Buffer 何在一起
                var result = new Float32Array(recLength);
                var offset = 0;
                for (var i = 0; i < recBuffers.length; i++){
                    result.set(recBuffers[i], offset);
                    offset += recBuffers[i].length;
                }
                return result;
            }
            , interleave: function(inputL, inputR){                     // 左右聲道合在一起
                var length = inputL.length + inputR.length;
                var result = new Float32Array(length);

                var index = 0;
                var inputIndex = 0;

                while (index < length){
                    result[index++] = inputL[inputIndex];
                    result[index++] = inputR[inputIndex];
                    inputIndex++;
                }
                return result;
            }
            , floatTo16BitPCM: function(output, offset, input){         // Helper Function
                for (var i = 0; i < input.length; i++, offset+=2){
                    var s = Math.max(-1, Math.min(1, input[i]));
                    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
            }
            , writeString: function(data, offset, string){             // Helper Function
                for (var i = 0; i < string.length; i++)
                    data.setUint8(offset + i, string.charCodeAt(i));
            }
            , encodeWAV: function () {
                var bufferL = this.mergeBuffers(this.bufferL, this.size);
                var bufferR = this.mergeBuffers(this.bufferR, this.size);
                var samples = this.interleave(bufferL, bufferR);
                
                var buffer = new ArrayBuffer(44 + samples.length * 2);
                var data = new DataView(buffer);

                /* RIFF identifier */
                this.writeString(data, 0, 'RIFF');
                /* file length */
                data.setUint32(4, 32 + samples.length * 2, true);
                /* RIFF type */
                this.writeString(data, 8, 'WAVE');
                /* format chunk identifier */
                this.writeString(data, 12, 'fmt ');
                /* format chunk length */
                data.setUint32(16, 16, true);
                /* sample format (raw) */
                data.setUint16(20, 1, true);
                /* channel count */
                data.setUint16(22, 2, true);
                /* sample rate */
                data.setUint32(24, this.sampleRate, true);
                /* byte rate (sample rate * block align) */
                data.setUint32(28, this.sampleRate * 4, true);
                /* block align (channel count * bytes per sample) */
                data.setUint16(32, 4, true);
                /* bits per sample */
                data.setUint16(34, 16, true);
                /* data chunk identifier */
                this.writeString(data, 36, 'data');
                /* data chunk length */
                data.setUint32(40, samples.length * 2, true);

                this.floatTo16BitPCM(data, 44, samples);

                return new Blob([data], { type: 'audio/wav' });
            }
            , clear: function() {
                this.size = 0;
                this.bufferL = [];
                this.bufferR = [];
            }
        };

        //開始錄音
        this.start = function () {
            audioData.clear();
            audioInput.connect(recorder);
            recorder.connect(context.destination);
        }

        //停止
        this.stop = function () {
            recorder.disconnect();
        }

        //獲取音訊檔
        this.getBlob = function () {
            this.stop();
            return audioData.encodeWAV();
        }

        //重播
        this.play = function (audio) {
            audio.src = window.URL.createObjectURL(this.getBlob());
        }

        //上傳
        this.upload = function (url, callback) {
            var fd = new FormData();
            fd.append("audioData", this.getBlob());
            var xhr = new XMLHttpRequest();
            if (callback) {
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
            }
            xhr.open("POST", url);
            xhr.send(fd);
        }

        //音訊採集
        recorder.onaudioprocess = function (e) {
            audioData.input([
                e.inputBuffer.getChannelData(0),
                e.inputBuffer.getChannelData(1)
            ]);
        }

    };
    //拋出異常
    HZRecorder.throwError = function (message) {
        alert(message);
        throw new function () { this.toString = function () { return message; } }
    }
    //是否支持錄音
    HZRecorder.canRecording = (navigator.getUserMedia != null);
    //獲取答錄機
    HZRecorder.get = function (callback, config) {
        if (callback) {
            if (navigator.getUserMedia) {
                navigator.getUserMedia(
                    { 
                        audio: true
                    } //只啟用音訊
                    , function (stream) {
                        var rec = new HZRecorder(stream, config);
                        callback(rec);
                    }
                    , function (error) {
                        switch (error.code || error.name) {
                            case 'PERMISSION_DENIED':
                            case 'PermissionDeniedError':
                                HZRecorder.throwError('使用者拒絕提供資訊。');
                                break;
                            case 'NOT_SUPPORTED_ERROR':
                            case 'NotSupportedError':
                                HZRecorder.throwError('流覽器不支援硬體設備。');
                                break;
                            case 'MANDATORY_UNSATISFIED_ERROR':
                            case 'MandatoryUnsatisfiedError':
                                HZRecorder.throwError('無法發現指定的硬體設備。');
                                break;
                            default:
                                HZRecorder.throwError('無法打開麥克風。異常資訊:' + (error.code || error.name));
                                break;
                        }
                    });
            } else {
                HZRecorder.throwErr('當前流覽器不支援錄音功能。'); return;
            }
        }
    }

    window.HZRecorder = HZRecorder;

})(window);
