//HELPERS

function byteStringToByteArray(byteString) {
	var byteArray = new Uint8Array(byteString.length);
	for(var index = 0; index < byteString.length; index++)
		byteArray[index] = byteString.charCodeAt(index);
	byteArray.head = 0;
	return byteArray;
}

function iterate(iterable, monad) {
	if (!iterable)
		return;
	for (var i = 0; i < iterable.length; i++)
		monad(iterable[i]);
}

function byteArrayToByteString(byteArray) {
	var retval = "";
	iterate(byteArray, function(byte) { retval += String.fromCharCode(byte); });
	return retval;
}

function deflate(byteString) {
	return pako.deflateRaw(byteStringToByteArray(byteString), {"level": 9});
}

function inflate(byteString) {
	return byteArrayToByteString(pako.inflateRaw(byteString));
}

function bufferToHex(buffer) {
	var dataView = new DataView(buffer);
	var retval = "";

	for (var i = 0; i < dataView.byteLength; i++)
		retval += (256 | dataView.getUint8(i)).toString(16).slice(-2);

	return retval;
}

function getRandomBits(minBits) {
	var crypto = window.crypto || window.msCrypto;
	return bufferToHex(crypto.getRandomValues(new Uint8Array(minBits + 7 >> 3)).buffer);
}

function streamToString(stream){
	const chunks = []
	return new Promise((resolve, reject) => {
	  	stream.on('data', chunk => chunks.push(chunk))
	  	stream.on('error', reject)
	  	stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
	})
}

//END HELPERS

//CODE GENERATION

let outerHeader = `Vlang\u00001\u0000mathematica\u0000F.code.tio\u0000`
let header = null;
let footer = null;
let outerFooter = "F.input.tio\u00000\u0000Vargs\u00000\u0000R";

function getInnerString(ft, stars, levelExtraExponents){
	return header + ft.toString() + "," + stars.toString() + "," + levelExtraExponents.toString() + footer;
}

function getFinalString(ft, stars, levelExtraExponents){
	let innerString = getInnerString(ft, stars, levelExtraExponents);
	return outerHeader + innerString.length + "\u0000" + innerString + outerFooter;
}

//END CODE GENERATION

//API

let URL_RUN = "https://tio.run/cgi-bin/static/fb67788fd3d1ebf92e66b295525335af-run/";

function processRequest(request, resolve, reject){
	if (request.readyState != XMLHttpRequest.DONE)
		return;
	var statusCode = request.status;
	var response = byteArrayToByteString(new Uint8Array(request.response));
	request = undefined;

	if (statusCode == 204) {
		reject("No content");
        return;
	}

	if (statusCode >= 400) {
		reject("ERROR " + statusCode);
		return;
	}

	try {
		var rawOutput = inflate(response.slice(10));
	} catch(error) {
		reject("BAD RESPONSE");
		return;
	}

	try {
		response = byteStringToText(rawOutput);
	} catch(error) {
		response = rawOutput;
	}

	if (response.length < 32) {
		reject("BAD RESPONSE");
		return;
	}

	var results = response.substr(16).split(response.substr(0, 16));
    resolve(results[0]);
}

async function optimalStars(ft, stars, levelExtraExponents){
    let date1 = new Date();
    if(header === null){
        let calculatordata = await fetch("https://raw.githubusercontent.com/1ekf/ExidleStars/main/Calculator.wls");
        let headerdata = await fetch("https://raw.githubusercontent.com/1ekf/ExidleStars/main/header.txt");
        if (!calculatordata.ok || !headerdata.ok) throw "";
        let calculatortxt = await calculatordata.text();
        let headertxt = await headerdata.text();
        if(calculatortxt === null || headertxt === null) throw "";
        header = calculatortxt.substring(calculatortxt.indexOf("\n") + 1) + headertxt;
    }
    
    if(footer === null){
        let footerdata = await fetch("https://raw.githubusercontent.com/1ekf/ExidleStars/main/footer.txt");
        if (!footerdata.ok) throw "";
        let footertxt = await footerdata.text();
        if (footertxt === null) throw "";
        footer = footertxt;    
    }
    
    let date2 = new Date();
    console.log(date2.getTime() - date1.getTime());
    
    return new Promise(function (resolve, reject) {
        let runRequest = new XMLHttpRequest();
        let token = getRandomBits(128);
        let finalUrl = URL_RUN + token;
        let finalBodyData = deflate(getFinalString(ft, stars, levelExtraExponents));
        runRequest.open("POST", finalUrl, true);
        runRequest.responseType = "arraybuffer";
        runRequest.onreadystatechange = () => { processRequest(runRequest, resolve, reject); };
        runRequest.send(finalBodyData);        
    });
}

//END API