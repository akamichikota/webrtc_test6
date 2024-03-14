<?php
/**
 * Plugin Name: Simple WebRTC for WordPress
 * Description: A simple WebRTC implementation for WordPress using Socket.io for signaling.
 * Version: 1.0
 * Author: Your Name
 */

function simple_webrtc_enqueue_scripts() {
    // jQueryを読み込む
    wp_enqueue_script('jquery');
    
    // Socket.ioクライアントライブラリの読み込み
    wp_enqueue_script('socket-io', 'https://cdn.socket.io/4.0.0/socket.io.min.js', array('jquery'), '4.0.0', true);

    // WebRTCのスクリプト（カスタム）の読み込み、依存関係にjQueryとSocket.ioを指定
    wp_enqueue_script('simple-webrtc-js', plugins_url('webrtc.js', __FILE__), array('jquery', 'socket-io'), '1.0', true);

    // シグナリングサーバーのURLをJavaScriptに渡す
    $signalingServerURL = 'https://f516-124-150-187-34.ngrok-free.app'; // 実際には管理画面から設定可能にするべき
    wp_localize_script('simple-webrtc-js', 'signaling_server', array(
        'url' => $signalingServerURL
    ));
}
add_action('wp_enqueue_scripts', 'simple_webrtc_enqueue_scripts');

function simple_webrtc_shortcode() {
    $content = <<<HTML
<div id="webrtc">
    <video id="localVideo" autoplay muted></video>
    <video id="remoteVideo" autoplay></video>
    <button id="startButton">Start</button>
    <button id="callButton">Call</button>
    <button id="hangupButton">Hang Up</button>
</div>
HTML;
    return $content;
}
add_shortcode('simple_webrtc', 'simple_webrtc_shortcode');