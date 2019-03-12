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
var fs = require('fs');
var crypto = require('crypto');

//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://120.125.82.1:7051');
channel.addPeer(peer);
var order = fabric_client.newOrderer('grpc://120.125.83.48:7050');
channel.addOrderer(order);

//
var member_user = null;
var pre_store_path = path.join(__dirname, 'hfc-key-store');
var store_path = path.resolve(pre_store_path, "../../hfc-key-store");
console.log('Store path:' + store_path);
var tx_id = null;

//
const express = require('express')
const router = express.Router()
const checkLogin = require('../../middlewares/check').checkLogin

//
var buildFabric = function (StuId, StuName, Card, Prove, ApplyDate, PubKey) {

  return new Promise(function (resolve, reject) {
    console.log('run stuApply----------------------------');
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
        fcn: 'stuApply',
        args: [StuId, StuName, Card, Prove, ApplyDate, PubKey],
        chainId: 'mychannel',
        txId: tx_id
      };

      // send the transaction proposal to the peers
      return channel.sendTransactionProposal(request);
    }).then((results) => {
      var proposalResponses = results[0];
      var proposal = results[1];
      let isProposalGood = false;
	  
	  console.log("1111111111111");
      console.log(proposalResponses);
      console.log(proposalResponses[0].response);
	  
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
      console.log('end stuApply----------------------------');
    }).catch((err) => {
      console.error('Failed to invoke successfully :: ' + err);
      reject(err);
    });
  });
}

router.get('/', checkLogin, function (req, res, next) {
  res.render('student/apply')
})

router.post('/submit', checkLogin, function (req, res, next) {

  const stuId = req.fields.stuId
  const stuName = req.fields.stuName
  const card = req.files.card.path.split(path.sep).pop()
  const prove = req.files.prove.path.split(path.sep).pop()
  const pubKey = req.fields.pubKey

  try {
    if (stuId.length != 8) {
      throw new Error('學號格式輸入錯誤')
    }
    if (!stuName.length) {
      throw new Error('未輸入姓名')
    }
    if (!req.files.card.name) {
      throw new Error('缺少學生證')
    }
    if (!req.files.prove.name) {
      throw new Error('缺少清寒證明')
    }
    if (pubKey.trim().length == 0) {
      throw new Error('請點擊產生公鑰')
    }

    var date = new Date();
    var applyDate = date.getFullYear() + "/" +
      (date.getMonth() + 1) + "/" +
      date.getDate();

    buildFabric(stuId, stuName, card, prove, applyDate, pubKey.trim()).then(() => {
      if (req.headers['mobile']) {
        return res.status(200).json({ status: "ok", message: '申請成功' });
      }
      else {
        req.flash('success', '申請成功')
        return res.redirect('/student/queryApplyStatus')
      }
    }).catch((e) => {

      fs.unlink(req.files.card.path)
      fs.unlink(req.files.prove.path)
      if (req.headers['mobile']) {
        return res.status(400).json({ status: "error", message: e.message });
      }
      else {
        req.flash('error', e.message)
        return res.redirect('/student/apply')
      }
    })

  } catch (e) {

    fs.unlink(req.files.card.path)
    fs.unlink(req.files.prove.path)
    if (req.headers['mobile']) {
      return res.status(400).json({ status: "error", message: e.message });
    }
    else {
      req.flash('error', e.message)
      return res.redirect('/student/apply')
    }
  }
})

module.exports = router
