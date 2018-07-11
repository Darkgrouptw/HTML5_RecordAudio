(function (window) {
    // 相容性的問題
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    var HZRecorder = function (stream) {
        var context = new (window.webkitAudioContext || window.AudioContext)();
        var audioInput = context.createMediaStreamSource(stream);
        var createScript = context.createScriptProcessor || context.createJavaScriptNode;
        var recorder = createScript.apply(context, [4096, 2, 2]);

        var audioData = {
            size: 0                                     // 錄音文件長度
            , bufferL: []                               // 左聲道
            , bufferR: []                               // 右聲道
            , sampleRate: context.sampleRate            // 取樣頻率
            , testContext: context
            , toArray: function(data){                  // Object 轉成 Array
                return Object.keys(data).map(function(_) { return data[_]; });
            }
            , input: function (data) {
                // 這邊真的超雷 = =
                // 結果記憶體是一樣的
                // 所以才會一直只錄到最後面的聲音
                // 雷 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                var DeepCopyL = Object.assign({}, data[0]);
                var DeepCopyArrayL = this.toArray(DeepCopyL);                
                var DeepCopyR = Object.assign({}, data[1]);
                var DeepCopyArrayR = this.toArray(DeepCopyR);
                
                this.bufferL.push(new Float32Array(DeepCopyArrayL));
                this.bufferR.push(new Float32Array(DeepCopyArrayR));
                this.size += DeepCopyArrayL.length;
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

        this.testOutput = function(audio)
        {   
            /*audio.bufferL = "
            ";*/
            var a;
            var b;
            $.getJSON("https://140.118.127.108/WebAudioRecorder/New/js/test1.json", function(json) {
                a = Object.keys(json).map(function(_) { return json[_]; });
                //console.log(json); // this will show the info it in firebug console
            });
            $.getJSON("https://140.118.127.108/WebAudioRecorder/New/js/test2.json", function(json) {
                b = Object.keys(json).map(function(_) { return json[_]; });
                //console.log(json); // this will show the info it in firebug console
            });
            
            setTimeout(function(){
                //a = Object.keys(json).map(function(_) { return json[_]; });
                for(var i =0; i < a.length; i++)
                {
                    a[i] = Object.keys(a[i]).map(function(_) { return a[i][_]; });
                    a[i] = new Float32Array(a[i]);
                }
                for(var i =0; i < b.length; i++)
                {
                    b[i] = Object.keys(b[i]).map(function(_) { return b[i][_]; });
                    b[i] = new Float32Array(b[i]);
                }
                    
                audioData.bufferL = a;
                audioData.bufferR = b;
                    
                audioData.size = 86016;
                audioData.sampleRate = 48000;
                audio.src = window.URL.createObjectURL(audioData.encodeWAV());
            },1000);
            
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
            //console.log(e.inputBuffer.getChannelData(0));
            //console.log(e.inputBuffer.getChannelData(1));
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
    //獲取答錄機
    HZRecorder.get = function (callback) {
        if (callback) {
            if (navigator.getUserMedia) {
                navigator.getUserMedia(
                    { 
                        audio: true
                    } //只啟用音訊
                    , function (stream) {
                        //var rec = new HZRecorder(stream, config);
                        var rec = new HZRecorder(stream);
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
