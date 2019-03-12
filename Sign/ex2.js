var crypto = require('crypto');
var fs = require('fs');
var ALGORITHM = "sha256"; // Accepted: any result of crypto.getHashes(), check doc dor other options
var SIGNATURE_FORMAT = "hex"; // Accepted: hex, latin1, base64

function getPublicKeySomehow() {

    var pubKey = fs.readFileSync('certs/public.pem', 'utf-8');
    console.log("\nublic key: \n\n" + pubKey);

    return pubKey;
}

var verify = crypto.createVerify(ALGORITHM);
var publicKey = getPublicKeySomehow();
var signature = "3046022100e1c54b7317e81dfc83eb3f708cdf47947e60343abfdb530175052667a47d2c4f022100e3a30ae1dc5dcda9ed2fbc5e3a3415f64ca983cb0f179deaf53fe76e01587b02";
var data = "ggininder";

verify.update(data);

var verification = verify.verify(publicKey, signature, SIGNATURE_FORMAT);

console.log('\nVerification result: ' + verification.toString().toUpperCase());