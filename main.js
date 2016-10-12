var http = require('http');
var WebSocketServer = require('websocket').server;
var fs = require('fs');
var path = require('path');
var gpio = require('rpi-gpio');

http.createServer(function (request, response) {
    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(80);

var server = http.createServer(function(request, response) {});

gpio.setup(7,  gpio.DIR_OUT);
gpio.setup(11, gpio.DIR_OUT);
gpio.setup(13, gpio.DIR_OUT);
gpio.setup(15, gpio.DIR_OUT);
gpio.setup(29, gpio.DIR_OUT);
gpio.setup(31, gpio.DIR_OUT);
gpio.setup(33, gpio.DIR_OUT);
gpio.setup(35, gpio.DIR_OUT);

var count = 0;
var clients = {};

server.listen(1010, function() {
    console.log((new Date()) + ' Server is listening on port 1010');
});

wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function(r){
    var connection = r.accept('echo-protocol', r.origin);
	var id = count++;
	clients[id] = connection;

	gpio.read(7,  function(err,value) { connection.sendUTF( "7"+value); });
	gpio.read(11, function(err,value) { connection.sendUTF("11"+value); });
	gpio.read(13, function(err,value) { connection.sendUTF("13"+value); });
	gpio.read(15, function(err,value) { connection.sendUTF("15"+value); });
	gpio.read(29, function(err,value) { connection.sendUTF("29"+value); });
	gpio.read(31, function(err,value) { connection.sendUTF("31"+value); });
	gpio.read(33, function(err,value) { connection.sendUTF("33"+value); });
	gpio.read(35, function(err,value) { connection.sendUTF("35"+value); });
	
	console.log((new Date()) + ' Connection accepted [' + id + ']');

	connection.on('message', function(message) {
		var msgString = message.utf8Data;
		toggle(msgString);
	});
	
	connection.on('close', function(reasonCode, description) {
		delete clients[id];
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	});	
});

gpio.on('change', function(channel, value) {
});

function toggle(pin){
	gpio.read(pin, function(err,value) { 
		gpio.write(pin, !value, function(err) {
			if (err) throw err;
			for(var i in clients){
				clients[i].sendUTF(pin+!value);
			}
		});
	});
}

