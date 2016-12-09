var nowID = 0, tmp_clipboard = '', idList = {}, tmpID = 0, clipboardTarget = [];

$(".wheel-button").wheelmenu({
      trigger: "hover", // Can be "click" or "hover". Default: "click"
      animation: "fly", // Entrance animation. Can be "fade" or "fly". Default: "fade"
      animationSpeed: "fast", // Entrance animation speed. Can be "instant", "fast", "medium", or "slow". Default: "medium"
      angle: "NW", // Angle which the menu will appear. Can be "all", "N", "NE", "E", "SE", "S", "SW", "W", "NW", or even array [0, 360]. Default: "all" or [0, 360]
});

$('#showMyDevices').click(function () {
	$('.myInfo').fadeOut(300, () => {
		$('.myDevices').fadeIn(300);	
	});
});

$('#showMyInfo').click(function () {
	$('.myDevices').fadeOut(300, () => {
		$('.myInfo').fadeIn(300);
	});
});

$('#registerClient').click(() => {
	sendWeMessage({
		message: "register_user",
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
})

function AddDevice(deviceName, deviceID)
{
	clipboardTarget.push(deviceID);
	if (!(deviceID in idList)) {
		idList[deviceID] = tmpID;
		idList[tmpID] = deviceID;
	}
	deviceID = tmpID++;
	$('#addDevice').modal('hide');
	var deviceType = 'customicon-smiley';
	$('#devicesList').append(`<li><button class='oneDevice' onclick='displayWePush(${deviceID})' id='deviceNo${deviceID}'><div class='col-sm-4'><i class='${deviceType}'></i></div><div class='col-sm-8'><p>${deviceName}</p></div></button></li>`);
	$('#messageWrapper').append(`<div id='messageWrapperNo${deviceID}' style='display:none' class='messageWrapperChild'>
		<div class="row-fluid" id='deviceTypeAndName'>
			<h3 style='text-align: center'><i class='customicon-laptop'></i><span>${deviceName}</span></h3>
		</div>
		<hr>
		<ul class='deviceMessage' style='text-align: center'>
		</ul>
	</div>`);
}

function sendPushMessage()
{
	var msg = $('#messageToBeSend').val(), time = new Date();

	$(`#messageWrapperNo${nowID} .deviceMessage`).append(`<li class='messageOut'><p class='messageTime'>${time}</p><p class='messageContent'>${msg}</p></li>`);
	$('textarea').val('');
	$('#sendMessage').modal('hide');
	let options = {
		message: 'push',
		content_type: 'text/plain',
		content: msg,
		target: [String(idList[nowID])]
	};
	console.log('options = ' + JSON.stringify(options));
	sendWeMessage(options, (data, stream) => {
		stream.end();
		// console.log('data = ' + JSON.stringify(data));
	});
}

function displayWePush(id)
{
	nowID = id;
	$(`#devicesList button:not(#deviceNo${id})`).removeClass('deviceActive');
	$(`#deviceNo${id}`).addClass('deviceActive');
	$(`.messageWrapperChild:not(#messageWrapperNo${id})`).fadeOut(200, () => {
		setTimeout(() => {$(`#messageWrapperNo${id}`).fadeIn(200)}, 200);
	});
}
