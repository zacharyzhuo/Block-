'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */
var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var fs = require('fs');

//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://120.125.82.1:7051');
channel.addPeer(peer);

//
var member_user = null;
var pre_store_path = path.join(__dirname, 'hfc-key-store');
var store_path = path.resolve(pre_store_path, "../../hfc-key-store");
console.log('Store path:' + store_path);
var tx_id = null;

//
const express = require('express')
const router = express.Router()
var crypto = require('crypto');
const checkLogin = require('../../middlewares/check').checkLogin


var buildFabric = function (ticketId, publicKey) {
    return new Promise(function (resolve, reject) {
        console.log('run queryTicket----------------------------');
        console.log('TicketKey:' + ticketId);
        // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
        Fabric_Client.newDefaultKeyValueStore({
            path: store_path
        }).then((state_store) => {
            console.log(state_store)
            // assign the store to the fabric client
            fabric_client.setStateStore(state_store);
            var crypto_suite = Fabric_Client.newCryptoSuite();
            // use the same location for the state store (where the users' certificate are kept)
            // and the crypto store (where the users' keys are kept)
            var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);

            // get the enrolled user from persistence, this user will sign all requests
            return fabric_client.getUserContext('user1', true);
        }).then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded user1 from persistence');
                member_user = user_from_store;
            } else {
                throw new Error('Failed to get user1.... run registerUser.js');
            }
            const request = {
                //targets : --- letting this default to the peers assigned to the channel
                chaincodeId: 'mycc',
                fcn: 'queryTicket',
                args: [ticketId]
            };
            //console.log(sortCar);
            // send the query proposal to the peer
            return channel.queryByChaincode(request);
        }).then((query_responses) => {
            console.log("Query has completed, checking results");
            // query_responses could have more than one  results if there multiple peers were used as targets
            if (query_responses && query_responses.length == 1) {
                if (query_responses[0] instanceof Error) {
                    console.error("error from query = ", query_responses[0]);
                } else {

                    var json = JSON.parse(query_responses[0]); //將json做字串處裡
                    console.log(json)
                    //餐券資訊
                    var message =
                        json.Owner +
                        json.Licenser +
                        json.Value +
                        json.IsUsed +
                        json.Restaurant +
                        json.IssuedDate +
                        json.ExpDate;

                    var encryptMsg = message + "%" + json.Owner + "%" + 
                    json.IssuedDate + "%" + json.ExpDate

                    console.log("encryptMsg : " + encryptMsg)

                    var messageBuf = new Buffer(encryptMsg);
                    // RSA encryption with public key
                    var encryptedBuf = crypto.publicEncrypt(publicKey, messageBuf);
                    var encrypted = encryptedBuf.toString('base64');

                    console.log("加密：\n" + encrypted);

                    var ticketArr = [encrypted, json.SchSign]

                    resolve(ticketArr);
                    console.log('end queryTicket----------------------------');
                }
            } else {
                console.log("No payloads were returned from query");
            }
        }).catch((err) => {
            console.error('Failed to query successfully :: ' + err);
            reject(err);
        });
    });
}

// GET /createQrcode/?ticketId=xxx 其中一張餐券
router.post('/', function (req, res, next) {
    const ticketId = req.query.ticketId
    const publicKey = req.fields.publicKey
    console.log("ticketId" + ticketId)
    console.log("publicKey" + publicKey)

    buildFabric(ticketId, publicKey).then((result) => {
        if (req.headers['mobile']) {
            return res.status(200).json({ status: "ok", message: result });
        }
        else {
        }
    })
})

module.exports = router