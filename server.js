const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:10096",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// CORSポリシーの設定を更新
app.use(cors({
    origin: "http://localhost:10096",
    methods: ['GET', 'POST'],
    credentials: true
}));

// ルートパスへのGETリクエストに対するハンドラーを追加
app.get('/', (req, res) => {
    res.send('Signal server is running');
});

// WebSocketの接続とイベントハンドリング
io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    socket.on('message', message => {
        console.log('Message received:', message);
        // 受信したメッセージを他のクライアントにブロードキャスト
        socket.broadcast.emit('message', message);
    }); 

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    // エラーハンドリング
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    // 接続エラーの詳細ログを追加（Middlewareを使用）
    io.use((socket, next) => {
        console.log(`Attempting connection: ${socket.id}`);
        next();
    });
});

// サーバーをポート3006で起動
http.listen(3006, () => {
    console.log('Server is listening on port 3006');
});
