jQuery(document).ready(function($) {
    let localVideo = document.getElementById('localVideo');
    let remoteVideo = document.getElementById('remoteVideo');
    let startButton = document.getElementById('startButton');
    let callButton = document.getElementById('callButton');
    let hangupButton = document.getElementById('hangupButton');
    let pc;
    let localStream;
    // シグナリングサーバーのURLを動的に取得
    let socket = io(signaling_server.url);

    function logError(error) {
        console.error('WebRTC Error:', error);
    }

    socket.on('connect', () => console.log('Connected to signaling server', socket.id));
    socket.on('connect_error', (error) => console.error('Connection to signaling server failed:', error));
    socket.on('disconnect', (reason) => console.log('Disconnected from signaling server:', reason));
    socket.on('message', message => {
        console.log('Client received message:', message);
        handleSignalingMessage(message);
    });

    startButton.onclick = start;
    callButton.onclick = call;
    hangupButton.onclick = hangup;

    function start() {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(gotStream)
            .catch(logError);
    }

    function call() {
        createPeerConnection();
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
              socket.emit('message', { 
                  type: 'offer', 
                  sdp: pc.localDescription.sdp,
                  dest: "all"
              });
          })
          .catch(logError);
    }

    function createPeerConnection() {
        const configuration = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
        pc = new RTCPeerConnection(configuration);
        pc.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('message', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    dest: "all"
                });
            } else {
                console.log('End of candidates.');
            }
        };
        pc.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
        };
        pc.oniceconnectionstatechange = () => console.log('ICE connection State Change:', pc.iceConnectionState);
    }

    function handleSignalingMessage(message) {
        switch (message.type) {
            case 'offer':
                if (!pc) createPeerConnection();
                pc.setRemoteDescription(new RTCSessionDescription(message))
                  .then(() => pc.createAnswer())
                  .then(answer => pc.setLocalDescription(answer))
                  .then(() => {
                      socket.emit('message', { 
                          type: 'answer', 
                          sdp: pc.localDescription.sdp, 
                          dest: "all"
                      });
                  })
                  .catch(logError);
                break;
            case 'answer':
                pc.setRemoteDescription(new RTCSessionDescription(message)).catch(logError);
                break;
            case 'candidate':
                pc.addIceCandidate(new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                })).catch(logError);
                break;
        }
    }

    function gotStream(stream) {
        localVideo.srcObject = stream;
        localStream = stream;
        callButton.disabled = false;
    }

    function hangup() {
        if (pc) {
            pc.close();
            pc = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        console.log('Call ended.');
    }
});
