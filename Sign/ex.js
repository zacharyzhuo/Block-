var crypto = require('crypto');
var fs = require('fs');
var ALGORITHM = "sha256"; // Accepted: any result of crypto.getHashes(), check doc dor other options
var SIGNATURE_FORMAT = "hex"; // Accepted: hex, latin1, base64

function getPublicKeySomehow() {

    var pubKey = fs.readFileSync('certs/public.pem', 'utf-8');
    console.log("\nublic key: \n\n" + pubKey);

    return pubKey;
}

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

var publicKey = getPublicKeySomehow();
var verify = crypto.createVerify(ALGORITHM);
var data = "ggininder";
var signature = getSignatureToVerify(data);

console.log('\nMessage:\n\n' + data);

verify.update(data);

var verification = verify.verify(publicKey, signature, SIGNATURE_FORMAT);

console.log('\nVerification result: ' + verification.toString().toUpperCase());