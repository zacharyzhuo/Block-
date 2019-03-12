var crypto = require('crypto');
var fs = require('fs');
var ALGORITHM = "sha256"; // Accepted: any result of crypto.getHashes(), check doc dor other options
var SIGNATURE_FORMAT = "hex"; // Accepted: hex, latin1, base64

function getPrivateKeySomehow() {

    var privKey = fs.readFileSync('certs/private.pem', 'utf-8');
    console.log(">>> Private key: \n\n" + privKey);

    return privKey;
}

function getSignatureToVerify(data) {

    var privateKey = getPrivateKeySomehow();
    var sign = crypto.createSign(ALGORITHM);
    sign.update(data);
    var signature = sign.sign(privateKey, SIGNATURE_FORMAT);

    console.log(">>> Signature:\n\n" + signature);

    return signature;
}

var data = "ggininder";
var signature = getSignatureToVerify(data);