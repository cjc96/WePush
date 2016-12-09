let clipboard = require('electron').clipboard;
let debug;
let crypto = require('crypto');
let WePush = require('./js/WePushNetwork.js');
let co = require('co');
let fs = require('fs');

WePush.connect('45.32.32.235', 12345).then(stream => {
	stream.sendjson({
		'message': 'status'
	});
	stream.readjson().then(data => {
		console.log(data);
		if (data.success) {
			if (data.registered) {
				for (let i = 0; i < data.devices.length; i++) {
					let e = data.devices[i]
					AddDevice(e.description, e.devicekey);
				}
			}
		}
		else {
			alert('Failed');
		}
		stream.end();
	});
});

function getHash(buf)
{
	let hash = crypto.createHash('sha256');
	hash.update(buf);
	let digest = hash.digest('hex');
	return digest;
}

co(function *() {
	let stream = yield WePush.connect('45.32.32.235', 12345);
	stream.sendjson({message: 'listen'});
	console.log(yield stream.readjson());
	while (true) {
		let data = yield stream.readjson();
		console.log(data);
		if (data.message === 'push') {
			let locID = idList[data.fromdevice];
			let msg = data.content, time = new Date();
			$(`#messageWrapperNo${locID} .deviceMessage`).append(`<li class='messageIn'><p class='messageTime'>${time}</p><p class='messageContent'>${msg}</p></li>`);
			stream.sendjson({success: true});
		}
		else if (data.message === 'restart_file') {
			stream.sendjson({success: true});
		}
		else if (data.message === 'heartbeat') {
			stream.sendjson({success: true});
		}
		else if (data.message === 'push_file') {
			console.log('get a push_file');
			stream.sendjson({success: true});
			let filename = data.filename;
			let filelength = data.length
			sendWeMessage({
				message: 'get_file',
				fromdevice: data.fromdevice,
				digest: data.digest,
				get_range: [0, data.length]
			}, (data, stream) => {
				console.log(data);
				let dir = __dirname + '/download/' + filename;
				let t = stream.readfile(dir, 0, filelength).then(() => {
					let checkHash = getHash(fs.readFileSync(dir));
					if (checkHash != data.digest) {
						alert('I AM ANGRY!!');
					}
					stream.end();
				});
			});
			let locID = idList[data.fromdevice];
			let msg = 'Got a File.', time = new Date();
			$(`#messageWrapperNo${locID} .deviceMessage`).append(`<li class='messageIn'><p class='messageTime'>${time}</p><p class='messageContent'>${msg}</p></li>`);
		}
		else if (data.message === 'push_clipboard') {
			console.log('get a clipboard push');
			stream.sendjson({success: true});
			clipboard.writeText(data.content);
		}
		else {
			throw new Error('Anyway it goes wrong!');
		}
	}
});

$(document).ready(() => {
	console.log('Ready');
	setInterval(function () {
		if (tmp_clipboard != clipboard.readText()) {
			tmp_clipboard = clipboard.readText();
			console.log('Clipboard changed!');
			sendWeMessage({
				message: 'push_clipboard',
				content_type: 'text/plain',
				content: tmp_clipboard,
				target: clipboardTarget
			}, (data, stream) => {
				console.log(data);
				stream.end();
			})
		}
	}, 1000);
});

function sendWeMessage(message, callback) {
	co(function *() {
		let stream = yield WePush.connect('45.32.32.235', 12345);
		stream.sendjson(message);
		let tmp = yield stream.readjson();
		// console.log(tmp);
		callback(tmp, stream);
	})
}

$('#usrLogin').click(() => {
	sendWeMessage({
		message: "register_device",
		username: $('#username').val(),
		password: $('#password').val(),
		description: $('#description').val()
	}, function (data, stream) {
		sendWeMessage({
			message: "status"
		}, function (data,stream) {
			for (let i = 0; i < data.devices.length; i++) {
				let e = data.devices[i]
				AddDevice(e.description, e.devicekey);
			}
			stream.end();
		});
		stream.end();
	});
});

function emitInput()
{
	document.getElementById('sendFile').click();
}

function myToBuffer(str) {
    let buffer = new Buffer(str);
    return buffer;
}

$('#sendFile').change((e) => {
	let file = e.currentTarget.files[0];
	let reader = new FileReader();
	reader.onload = (ele) => {
		let result = ele.target.result;
		let fileBuffer = myToBuffer(result);
		let digest = getHash(fileBuffer);
		sendWeMessage({
			message: 'push_file',
			content_type: 'text/plain', 
			target: [idList[nowID]],
        	filename: file.name, 
        	length: file.size, 
        	digest: digest
        }, (data, stream) => {
        	if ('get_range' in data) {
        		stream.sendfile(file.path, data.get_range[0], data.get_range[1]-data.get_range[0]);
        		stream.readjson().then(data => {        		
        			console.log(data);
        			stream.end();
        		})
        	} else {
        		stream.end();
        	}
        	
        });
	}
	reader.readAsArrayBuffer(file);
})