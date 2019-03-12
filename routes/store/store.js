
const express = require('express')
const router = express.Router()

const checkLogin = require('../../middlewares/check').checkLogin
const PostModel = require('../../models/posts')
const CommentModel = require('../../models/comments')

var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
//
var utf8 = require('utf8');
var ALGORITHM = "sha256"; // Accepted: any result of crypto.getHashes(), check doc dor other options
var SIGNATURE_FORMAT = "hex"; // Accepted: hex, latin1, base64

var queryStoreTickets

var queryStoreTicket = function (storeName) {
  return new Promise(function (resolve, reject) {
    console.log('run queryStoreTicket----------------------------');
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
    var peer = fabric_client.newPeer('grpc://120.125.83.43:7051');
    channel.addPeer(peer);

    //
    var member_user = null;
    var pre_store_path = path.join(__dirname, 'hfc-key-store');
    var store_path = path.resolve(pre_store_path, "../../hfc-key-store");
    console.log('Store path:' + store_path);
    var tx_id = null;
    console.log('storeName:' + storeName);
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
        fcn: 'queryStoreTicket',
        args: [storeName]
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
          console.log(query_responses[0].toString())
          var ticketList = [];

          for (var i = 0; i < json.length; i++) {

            ticketList.push({
              Key: json[i].Key,
              Owner: json[i].Record.Owner,
              Value: json[i].Record.Value,
              Licenser: json[i].Record.Licenser,
              Restaurant: json[i].Record.Restaurant,
              IssuedDate: json[i].Record.IssuedDate,
              ExpDate: json[i].Record.ExpDate,
			  UsedDate: json[i].Record.UsedDate
			  
            });
          }
          resolve(ticketList);
          console.log('end queryStoreTicket----------------------------');
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

var queryTicket = function (ticketId) {
    return new Promise(function (resolve, reject) {

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
        var peer = fabric_client.newPeer('grpc://120.125.83.43:7051');
        channel.addPeer(peer);

        //
        var member_user = null;
        var pre_store_path = path.join(__dirname, 'hfc-key-store');
        var store_path = path.resolve(pre_store_path, "../../hfc-key-store");
        console.log('Store path:' + store_path);
        var tx_id = null;

        console.log('\nstep 1 run queryTicket----------------------------');
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
                    //餐券資訊
                    var message =
                        json.Owner +
                        json.Licenser +
                        json.Value +
                        json.IsUsed +
                        json.Restaurant +
                        json.IssuedDate +
                        json.ExpDate;

                    var result = [message, json.Owner, json.ExpDate]
                    resolve(result);
                    console.log('step 1 end queryTicket----------------------------\n');
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

//查詢學生對餐券簽章公鑰
var queryStuPubKey = function (stuId) {
    return new Promise(function (resolve, reject) {

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
        var peer = fabric_client.newPeer('grpc://120.125.83.43:7051');
        channel.addPeer(peer);

        //
        var member_user = null;
        var pre_store_path = path.join(__dirname, 'hfc-key-store');
        var store_path = path.resolve(pre_store_path, "../../hfc-key-store");
        console.log('Store path:' + store_path);
        var tx_id = null;

        console.log('\nstep 3 run queryStuPubKey----------------------------');
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
                fcn: 'queryPubKeyByStuId',
                args: [stuId]
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
                    var pubKey = json[0].Record.PubKey;
                    resolve(pubKey);
                    console.log('step 3 end queryPubKeyByStuId----------------------------\n');
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

//交易 isUsed=true restaurant=商家
var transaction = function (TicketID, Restaurant, usedDate) {

    return new Promise(function (resolve, reject) {

        'use strict';
        /*
        * Copyright IBM Corp All Rights Reserved
        *
        * SPDX-License-Identifier: Apache-2.0
        */
        /*
         * Chaincode Invoke
         */

        var Fabric_Client = require('fabric-client');
        var path = require('path');
        var util = require('util');
        var os = require('os');

        //
        var fabric_client = new Fabric_Client();

        // setup the fabric network
        var channel = fabric_client.newChannel('mychannel');
        var peer = fabric_client.newPeer('grpc://120.125.83.43:7051');
        channel.addPeer(peer);
        var order = fabric_client.newOrderer('grpc://120.125.83.48:7050');
        channel.addOrderer(order);

        //
        var member_user = null;
        var pre_store_path = path.join(__dirname, 'hfc-key-store');
        var store_path = path.resolve(pre_store_path, "../../hfc-key-store");
        console.log('Store path:' + store_path);
        var tx_id = null;

        console.log('\nstep 5 run transaction----------------------------');
        console.log(TicketID);
        console.log(Restaurant);
        // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
        Fabric_Client.newDefaultKeyValueStore({
            path: store_path
        }).then((state_store) => {
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

            // get a transaction id object based on the current user assigned to fabric client
            tx_id = fabric_client.newTransactionID();
            console.log("Assigning transaction_id: ", tx_id._transaction_id);

            // must send the proposal to endorsing peers
            var request = {
                //targets: let default to the peer assigned to the client
                chaincodeId: 'mycc',
                fcn: 'transaction',
                args: [TicketID, Restaurant, usedDate],
                chainId: 'mychannel',
                txId: tx_id
            };

            // send the transaction proposal to the peers
            return channel.sendTransactionProposal(request);
        }).then((results) => {
            var proposalResponses = results[0];
            var proposal = results[1];
            let isProposalGood = false;
            if (proposalResponses && proposalResponses[0].response &&
                proposalResponses[0].response.status === 200) {
                isProposalGood = true;
                console.log('Transaction proposal was good');
            } else {
                console.error('Transaction proposal was bad');
            }
            if (isProposalGood) {
                console.log(util.format(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                    proposalResponses[0].response.status, proposalResponses[0].response.message));

                // build up the request for the orderer to have the transaction committed
                var request = {
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };

                // set the transaction listener and set a timeout of 30 sec
                // if the transaction did not get committed within the timeout period,
                // report a TIMEOUT status
                var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
                var promises = [];

                var sendPromise = channel.sendTransaction(request);
                promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

                // get an eventhub once the fabric client has a user assigned. The user
                // is required bacause the event registration must be signed
                let event_hub = channel.newChannelEventHub(peer);

                // using resolve the promise so that result status may be processed
                // under the then clause rather than having the catch clause process
                // the status
                let txPromise = new Promise((resolve, reject) => {
                    let handle = setTimeout(() => {
						event_hub.unregisterTxEvent(transaction_id_string);
                        event_hub.disconnect();
                        resolve({ event_status: 'TIMEOUT' }); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
                    }, 3000);
                    event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                        // this is the callback for transaction event status
                        // first some clean up of event listener
                        clearTimeout(handle);

                        // now let the application know what happened
                        var return_status = { event_status: code, tx_id: transaction_id_string };
                        if (code !== 'VALID') {
                            console.error('The transaction was invalid, code = ' + code);
                            resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                        } else {
                            console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
                            resolve(return_status);
                        }
                    }, (err) => {
                        //this is the callback if something goes wrong with the event registration or processing
                        reject(new Error('There was a problem with the eventhub ::' + err));
                    },
					{disconnect: true} //disconnect when complete
				);
				event_hub.connect();
                });
                promises.push(txPromise);

                return Promise.all(promises);
            } else {
                console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
                throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
            }
        }).then((results) => {
            console.log('Send transaction promise and event listener promise have completed');
            // check the results in the order the promises were added to the promise all list
            if (results && results[0] && results[0].status === 'SUCCESS') {
                console.log('Successfully sent transaction to the orderer.');
            } else {
                console.error('Failed to order the transaction. Error code: ' + results[0].status);
            }

            if (results && results[1] && results[1].event_status === 'VALID') {
                console.log('Successfully committed the change to the ledger by the peer');
            } else {
                console.log('Transaction failed to be committed to the ledger due to ::' + results[1].event_status);
            }
            resolve();
            console.log('step 5 end transaction----------------------------\n');
        }).catch((err) => {
            console.error('Failed to transaction successfully :: ' + err);
            reject(err);
        });
    });
}


router.get('/', async function (req, res, next) {
  const storeName = req.session.store.storeName;
  await queryStoreTicket(storeName).then((result) => {
    queryStoreTickets = result
  }).then(function () {
    res.render('store/store', {
      queryStoreTickets: queryStoreTickets
    })
  })
})

// POST /transaction
router.post('/', checkLogin, async function (req, res, next) {

    var readQRcode = utf8.encode(req.fields.transaction);
    var msg = readQRcode.split('$');
    /** msg[0] ticketId
     *  msg[1] msg
     *  msg[2] SchSign
     *  msg[3] stuSign
     */
    var ticketMsg;
    var stuId;
    var expDate;
    console.log(msg)
    try {
        //step 1 比對餐券訊息---------------------------
        await queryTicket(msg[0]).then((result) => {
            if (msg[1] != result[0]) {
                //result 0:餐券資料, 1:學號, 2:使用日期
                throw new Error('餐券資訊不對稱')
            }
            console.log("學生端餐券訊息:" + msg[1])
            console.log("區塊鏈中餐券訊息:" + result[0])
            console.log("訊息比對結果一致")

            ticketMsg = result[0].trim();
            stuId = result[1];
            expDate = result[2];

            console.log("學號 " + stuId)
            console.log("有效日期 " + expDate)
        })
        //step 1 比對餐券訊息---------------------------

        //step 2 驗證學校對餐券簽章---------------------------
        console.log("\nstep 2 -------------------------------------")
        var verify = crypto.createVerify(ALGORITHM);
        const pubKeyPath = path.join(path.dirname(__dirname), '../Sign/certs/public.pem'); //路徑有問題加這行
        var schPubKey = fs.readFileSync(pubKeyPath);
        console.log("學校公鑰" + schPubKey)
        var schSign = msg[2];
        console.log("學校簽章" + schSign)
        verify.update(msg[1]);
        console.log("餐券訊息" + msg[1])
        var schVerification = verify.verify(schPubKey, schSign, SIGNATURE_FORMAT);
        console.log('學校簽章驗證結果: ' + schVerification.toString().toUpperCase());
        if (!schVerification) {
            throw new Error('學校簽章驗證失敗')
        }
        console.log("step 2 end-------------------------------------\n")
        //step 2 驗證學校對餐券簽章---------------------------

        //step 3 驗證學生對餐券簽章---------------------------
        const verifier = crypto.createVerify('RSA-SHA256');
        var stuPubKey;
        await queryStuPubKey(stuId).then((result) => {
            stuPubKey = result;
        }).then(() => {
            console.log("學生公鑰" + stuPubKey)
            var stuSign = msg[3];
            console.log("學生簽章" + stuSign)
            verifier.update(ticketMsg);
            console.log("餐券訊息" + ticketMsg)
            verifier.end();
            const buf = Buffer.from(stuSign, 'base64');
            const verified = verifier.verify(stuPubKey, buf);
            console.log("驗證結果：" + verified); // Prints: true or false
            if (!verified) {
                throw new Error('學生簽章驗證失敗')
            }
        })
        //step 3 驗證學生對餐券簽章---------------------------

        //step 4 確認有效日期---------------------------
        console.log("\nstep 4 -------------------------------------")
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var date = date.getDate();
        var splitDate = expDate.split('/');

        console.log("年 " + parseInt(splitDate[0]))
        console.log("月 " + parseInt(splitDate[1]))
        console.log("日 " + parseInt(splitDate[2]))

        if (parseInt(splitDate[0]) < year) { //ex 2017 < 2018
            throw new Error('餐券已過期')
        }
        if (parseInt(splitDate[0]) == year) { //ex 2018 = 2018
            if (parseInt(splitDate[1]) < month) { // ex 2018/8 < 2018/9
                throw new Error('餐券已過期')
            }
            // ex 2018/9/1 < 2018/9/2
            if (parseInt(splitDate[1]) == year && parseInt(splitDate[2]) < date) {
                throw new Error('餐券已過期')
            }
        }
        console.log("餐券未過期")
        console.log("step 4 end-------------------------------------\n")
        //step 4 確認有效日期---------------------------

        //step 5 交易---------------------------
        const storeName = req.session.store.storeName;
        console.log("商家名稱:" + storeName)
        var date = new Date();
        var usedDate = date.getFullYear() + "/" +
            (date.getMonth() + 1) + "/" +
            date.getDate();
        console.log("使用日期 " + usedDate)
        await transaction(msg[0], storeName, usedDate)
        //step 5 交易---------------------------

        req.flash('success', '驗證完成 交易成功')
        return res.redirect('/store/store')

    } catch (e) {
        req.flash('error', e.message)
        return res.redirect('/store/store')
    }
})

module.exports = router
