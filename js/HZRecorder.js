(function (window) {
    // 相容性的問題
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    var HZRecorder = function (stream, config) {
        config = config || {};
        config.sampleBits = config.sampleBits || 8;      //採樣數位 8, 16
        config.sampleRate = config.sampleRate || (44100 / 6);   //取樣速率(1/6 44100)

        var context = new (window.webkitAudioContext || window.AudioContext)();
        var audioInput = context.createMediaStreamSource(stream);
        var createScript = context.createScriptProcessor || context.createJavaScriptNode;
        var recorder = createScript.apply(context, [4096, 1, 1]);

        var audioData = {
            size: 0                                     //錄音文件長度
            , buffer: []                                //錄音緩存
            , inputSampleRate: context.sampleRate       //輸入取樣頻率
            , inputSampleBits: 16                       //輸入採樣數位 8, 16
            , outputSampleRate: config.sampleRate       //輸出取樣頻率
            , oututSampleBits: config.sampleBits        //輸出採樣數位 8, 16
            , input: function (data) {
                this.buffer.push(new Float32Array(data));
                this.size += data.length;
            }
            , compress: function () { //合併壓縮
                //合併
                var data = new Float32Array(this.size);
                var offset = 0;
                for (var i = 0; i < this.buffer.length; i++) {
                    data.set(this.buffer[i], offset);
                    offset += this.buffer[i].length;
                }
                //壓縮
                var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
                var length = data.length / compression;
                var result = new Float32Array(length);
                var index = 0, j = 0;
                while (index < length) {
                    result[index] = data[j];
                    j += compression;
                    index++;
                }
                return result;
            }
            , encodeWAV: function () {
                var sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
                var sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
                var bytes = this.compress();
                var dataLength = bytes.length * (sampleBits / 8);
                var buffer = new ArrayBuffer(44 + dataLength);
                var data = new DataView(buffer);

                var channelCount = 1;                       //單聲道
                var offset = 0;

                var writeString = function (str) {
                    for (var i = 0; i < str.length; i++) {
                        data.setUint8(offset + i, str.charCodeAt(i));
                    }
                }
                
                // 寫檔部分
                writeString('RIFF'); offset += 4;
                data.setUint32(offset, 36 + dataLength, true); offset += 4;
                writeString('WAVE'); offset += 4;
                writeString('fmt '); offset += 4;
                data.setUint32(offset, 16, true); offset += 4;
                data.setUint16(offset, 1, true); offset += 2;
                data.setUint16(offset, channelCount, true); offset += 2;
                data.setUint32(offset, sampleRate, true); offset += 4;
                data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true); offset += 4;
                data.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2;
                data.setUint16(offset, sampleBits, true); offset += 2;
                writeString('data'); offset += 4;
                data.setUint32(offset, dataLength, true); offset += 4;
                if (sampleBits === 8) {
                    for (var i = 0; i < bytes.length; i++, offset++) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        var val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        val = parseInt(255 / (65535 / (val + 32768)));
                        data.setInt8(offset, val, true);
                    }
                } else {
                    for (var i = 0; i < bytes.length; i++, offset += 2) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }

                return new Blob([data], { type: 'audio/wav' });
            }
        };

        //開始錄音
        this.start = function () {
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
            audioData.input(e.inputBuffer.getChannelData(0));
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
                        "audio": 
                        {
                            "mandatory": {
                                "googEchoCancellation": "false",
                                "googAutoGainControl": "false",
                                "googNoiseSuppression": "false",
                                "googHighpassFilter": "false"
                            },
                        "optional": []
                        }
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
