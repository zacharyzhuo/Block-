/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * The sample smart contract for documentation topic:
 * Writing Your First Blockchain Application
 */

package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

// Define the Smart Contract structure
type SmartContract struct {
}

// Define the car structure, with 4 properties.  Structure tags are used by encoding/json library

type Ticket struct {
	ObjectType string `json:"docType"`
	TicketId   string `json:"TicketId"`
	Owner      string `json:"Owner"`
	Licenser   string `json:"Licenser"`
	Value      string `json:"Value"`
	IsUsed     bool   `json:"IsUsed"`
	Restaurant string `json:"Restaurant"`
	IssuedDate string `json:"IssuedDate"`
	ExpDate    string `json:"ExpDate"`
	SchSign    string `json:"SchSign"`
	UsedDate   string `json:"UsedDate"`
}

type Student struct {
	ObjectType   string `json:"docType"`
	StuId        string `json:"StuId"`
	StuName      string `json:"StuName"`
	Card         string `json:"Card"`
	Prove        string `json:"Prove"`
	ApplyDate    string `json:"ApplyDate"`
	VerifyResult int    `json:"VerifyResult"`
	VerifyDate   string `json:"VerifyDate"`
	PubKey       string `json:"PubKey"`
	IsIssued     bool   `json:"IsIssued"`
}

type Number struct {
	ObjectType string `json:"docType"`
	TicketNum  int    `json:"TicketNum"`
}

/*
 * The Init method is called when the Smart Contract "fabcar" is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract "fabcar"
 * The calling application program has also specified the particular smart contract function to be called, with arguments
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately

	if function == "initLedger" { //初始化帳本
		return s.initLedger(APIstub)
	} else if function == "issueTicket" { //管理者發餐券
		return s.issueTicket(APIstub, args)
	} else if function == "queryTicket" { //用ticketId查餐券
		return s.queryTicket(APIstub, args)
	} else if function == "queryTicketsByOwner" { //學生用owner(學號)查餐券
		return s.queryTicketsByOwner(APIstub, args)
	} else if function == "queryAllTickets" { //查詢全部餐券
		return s.queryAllTickets(APIstub)
	} else if function == "transaction" { //商家掃描餐券
		return s.transaction(APIstub, args)
	} else if function == "stuApply" { //學生申請餐券
		return s.stuApply(APIstub, args)
	} else if function == "queryStuInfo" { //管理者查詢學生申請資料
		return s.queryStuInfo(APIstub)
	} else if function == "writeVerifyResult" { //管理者寫入學生申請結果
		return s.writeVerifyResult(APIstub, args)
	} else if function == "queryPubKeyByStuId" { //管理者查詢學生對餐券公鑰
		return s.queryPubKeyByStuId(APIstub, args)
	} else if function == "queryApplyStatus" { //學生查詢申請狀態
		return s.queryApplyStatus(APIstub, args)
	} else if function == "querySuccessApplyStatusFalse" { ////管理者查詢申請通過狀態未發放
		return s.querySuccessApplyStatusFalse(APIstub)
	} else if function == "querySuccessApplyStatusTrue" { ////管理者查詢申請通過狀態已發放
		return s.querySuccessApplyStatusTrue(APIstub)
	} else if function == "queryFailedApplyStatus" { //管理者查詢未通過申請狀態
		return s.queryFailedApplyStatus(APIstub)
	} else if function == "queryUsedTicket" { //管理者查詢已使用餐券
		return s.queryUsedTicket(APIstub)
	} else if function == "queryNotUsedTicket" { //管理者查詢未使用餐券
		return s.queryNotUsedTicket(APIstub)
	} else if function == "queryStoreTicket" { //商家查詢已使用餐券
		return s.queryStoreTicket(APIstub, args)
	} else if function == "queryConsumptionRecords" { //學生查詢餐券消費紀錄
		return s.queryConsumptionRecords(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {

	Number := &Number{ObjectType: "number", TicketNum: 0}
	numberJSONasBytes, err := json.Marshal(Number)

	if err != nil {
		return shim.Error(err.Error())
	}

	err = APIstub.PutState("Number", numberJSONasBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

//發餐券
func (s *SmartContract) issueTicket(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	// 0	 1 		  2 	3 		4 			5 			6		7
	// Owner Licenser Value	IsUsed	Restaurant	IssuedDate	ExpDate SchSign

	if len(args) != 8 {
		return shim.Error("Incorrect number of arguments. Expecting 9")
	}

	fmt.Println("- start issueTicket")
	// ==== Input sanitation ====
	if len(args[0]) <= 0 {
		return shim.Error("1st argument must be a non-empty string")
	}
	if len(args[1]) <= 0 {
		return shim.Error("2nd argument must be a non-empty string")
	}
	if len(args[2]) <= 0 {
		return shim.Error("3rd argument must be a non-empty string")
	}
	if len(args[3]) <= 0 {
		return shim.Error("4th argument must be a non-empty string")
	}
	if len(args[4]) <= 0 {
		return shim.Error("5th argument must be a non-empty string")
	}
	if len(args[5]) <= 0 {
		return shim.Error("6th argument must be a non-empty string")
	}
	if len(args[6]) <= 0 {
		return shim.Error("7th argument must be a non-empty string")
	}
	if len(args[7]) <= 0 {
		return shim.Error("8th argument must be a non-empty string")
	}

	// === Number ++ ===
	numberAsBytes, err := APIstub.GetState("Number")

	if err != nil {
		return shim.Error("Failed to get number:" + err.Error())
	} else if numberAsBytes == nil {
		return shim.Error("Number does not exist")
	}

	number := Number{}
	err = json.Unmarshal(numberAsBytes, &number)
	if err != nil {
		return shim.Error(err.Error())
	}

	number.TicketNum = number.TicketNum + 1

	numberAsBytes, _ = json.Marshal(number)
	err = APIstub.PutState("Number", numberAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	ticketId := strconv.Itoa(number.TicketNum)
	owner := args[0]
	licenser := args[1]
	value := args[2]
	isUsed, err := strconv.ParseBool(args[3])
	if err != nil {
		return shim.Error("isUsed must be bool")
	}
	restaurant := args[4]
	issuedDate := args[5]
	expDate := args[6]
	schSign := args[7]
	usedDate := "nil"

	// ==== Check if student already verify ====
	studentAsBytes, err := APIstub.GetState(owner)
	if err != nil {
		return shim.Error("Failed to get student: " + err.Error())
	} else if studentAsBytes == nil {
		fmt.Println("尚未申請餐券: " + owner)
		return shim.Error("尚未申請餐券: " + owner)
	}

	student := Student{}
	err = json.Unmarshal(studentAsBytes, &student)
	if err != nil {
		return shim.Error(err.Error())
	}
	if student.VerifyResult != 1 {
		return shim.Error("未符合發放資格")
	}

	// ==== Check if Ticket already exists ====
	ticketAsBytes, err := APIstub.GetState(ticketId)
	if err != nil {
		return shim.Error("Failed to get ticket: " + err.Error())
	} else if ticketAsBytes != nil {
		fmt.Println("此張餐券已經存在: " + ticketId)
		return shim.Error("此張餐券已經存在: " + ticketId)
	}

	// ==== Create ticketId object and marshal to JSON ====
	objectType := "ticket"
	Ticket := &Ticket{objectType, ticketId, owner, licenser, value,
		isUsed, restaurant, issuedDate, expDate, schSign, usedDate}
	ticketJSONasBytes, err := json.Marshal(Ticket)
	if err != nil {
		return shim.Error(err.Error())
	}

	// === Save Ticket to state ===
	err = APIstub.PutState(ticketId, ticketJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	// === 改變學生發放狀態 ===

	student.IsIssued = true
	studentAsBytes, _ = json.Marshal(student)
	err = APIstub.PutState(owner, studentAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end issueTicket ")
	return shim.Success(nil)
}

func (s *SmartContract) queryTicket(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	//   0
	// "ticketId"
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	ticketId := args[0]
	fmt.Println("- start queryTicket ", ticketId)

	ticketAsBytes, err := APIstub.GetState(ticketId)

	if err != nil {
		return shim.Error("Failed to get ticket:" + err.Error())
	} else if ticketAsBytes == nil {
		return shim.Error("Ticket does not exist")
	}

	return shim.Success(ticketAsBytes)
}

func (s *SmartContract) queryTicketsByOwner(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	//   0
	// "owner"
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	owner := strings.ToLower(args[0])

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"ticket\",\"IsUsed\":false,\"Restaurant\":\"nil\",\"Owner\":\"%s\"}}", owner)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//查詢全部餐券
func (s *SmartContract) queryAllTickets(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "T0"
	endKey := "T899"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllTickets:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

//使用餐券
func (s *SmartContract) transaction(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	// 0		1			2
	// ticketId	restaurant	usedDate
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	ticketId := args[0]
	restaurant := args[1]
	usedDate := args[2]
	fmt.Println("- start transaction ", ticketId, restaurant, usedDate)

	ticketAsBytes, err := APIstub.GetState(ticketId)

	if err != nil {
		return shim.Error("Failed to get ticket:" + err.Error())
	} else if ticketAsBytes == nil {
		return shim.Error("Ticket does not exist")
	}

	ticket := Ticket{}
	err = json.Unmarshal(ticketAsBytes, &ticket)
	if err != nil {
		return shim.Error(err.Error())
	}
	if ticket.IsUsed == true {
		return shim.Error("餐券已使用")
	}
	ticket.IsUsed = true
	ticket.Restaurant = restaurant
	ticket.UsedDate = usedDate

	ticketAsBytes, _ = json.Marshal(ticket)
	err = APIstub.PutState(ticketId, ticketAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end transaction (success)")
	return shim.Success(nil)
}

//學生申請餐券資料
func (s *SmartContract) stuApply(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	// 0	 1		 2		3	  4		 	5
	// StuId StuName Card	Prove ApplyDate PubKey

	if len(args) != 6 {
		return shim.Error("Incorrect number of arguments. Expecting 6")
	}

	fmt.Println("- start stuApply")
	// ==== Input sanitation ====
	if len(args[0]) <= 0 {
		return shim.Error("1st argument must be a non-empty string")
	}
	if len(args[1]) <= 0 {
		return shim.Error("2nd argument must be a non-empty string")
	}
	if len(args[2]) <= 0 {
		return shim.Error("3st argument must be a non-empty string")
	}
	if len(args[3]) <= 0 {
		return shim.Error("4nd argument must be a non-empty string")
	}
	if len(args[4]) <= 0 {
		return shim.Error("5nd argument must be a non-empty string")
	}
	if len(args[5]) <= 0 {
		return shim.Error("6nd argument must be a non-empty string")
	}

	stuId := args[0]
	stuName := args[1]
	card := args[2]
	prove := args[3]
	applyDate := args[4]
	verifyResult := 0
	verifyDate := "nil"
	pubKey := args[5]
	IsIssued := false

	// ==== Check if VerifyResult already exists ====
	studentAsBytes, err := APIstub.GetState(stuId)
	if err != nil {
		return shim.Error("Failed to get student: " + err.Error())
	} else if studentAsBytes != nil {
		fmt.Println("已經申請過餐券: " + stuId)
		return shim.Error("已經申請過餐券: " + stuId)
	}

	// ==== Create VerifyResult object and marshal to JSON ====
	objectType := "student"
	Student := &Student{objectType, stuId, stuName, card, prove, applyDate, verifyResult, verifyDate, pubKey, IsIssued}
	studentJSONasBytes, err := json.Marshal(Student)
	if err != nil {
		return shim.Error(err.Error())
	}

	// === Save Ticket to state ===
	err = APIstub.PutState(stuId, studentJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	fmt.Println("- end stuApply ")
	return shim.Success(nil)
}

//查詢學生申請資料(VerifyResult = 0)申請狀態為審核中
func (s *SmartContract) queryStuInfo(APIstub shim.ChaincodeStubInterface) sc.Response {

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"student\",\"VerifyResult\":0}}")

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//管理者寫入學生申請資格
func (s *SmartContract) writeVerifyResult(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	// 0	 1 		 	  2
	// StuId VerifyResult VerifyDate

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	stuId := args[0]
	verifyResult, err := strconv.Atoi(args[1])
	if err != nil {
		return shim.Error("verifyResult must be int")
	}
	verifyDate := args[2]

	fmt.Println("- start writeVerifyResult ", stuId, verifyResult, verifyDate)

	studentAsBytes, err := APIstub.GetState(stuId)

	if err != nil {
		return shim.Error("Failed to get student:" + err.Error())
	} else if studentAsBytes == nil {
		return shim.Error("此學生未申請餐券")
	}

	student := Student{}
	err = json.Unmarshal(studentAsBytes, &student)
	if err != nil {
		return shim.Error(err.Error())
	}
	student.VerifyResult = verifyResult
	student.VerifyDate = verifyDate

	studentAsBytes, _ = json.Marshal(student)
	err = APIstub.PutState(stuId, studentAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end writeVerifyResult (success)")
	return shim.Success(nil)
}

//查詢學生對餐券簽章公鑰
func (s *SmartContract) queryPubKeyByStuId(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	//   0
	// "stuId"
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	stuId := args[0]

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"student\",\"StuId\":\"%s\"}}", stuId)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//學生查詢申請狀態
func (s *SmartContract) queryApplyStatus(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	//   0
	// "stuId"
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	stuId := strings.ToLower(args[0])

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"student\",\"StuId\":\"%s\"}}", stuId)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//管理者查詢申請通過狀態未發放
func (s *SmartContract) querySuccessApplyStatusFalse(APIstub shim.ChaincodeStubInterface) sc.Response {

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"student\",\"VerifyResult\":1,\"IsIssued\":false}}")

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//管理者查詢申請通過狀態已發放
func (s *SmartContract) querySuccessApplyStatusTrue(APIstub shim.ChaincodeStubInterface) sc.Response {

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"student\",\"VerifyResult\":1,\"IsIssued\":true}}")

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//管理者查詢申請未通過狀態
func (s *SmartContract) queryFailedApplyStatus(APIstub shim.ChaincodeStubInterface) sc.Response {

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"student\",\"VerifyResult\":2}}")

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//管理者查詢已使用餐券
func (s *SmartContract) queryUsedTicket(APIstub shim.ChaincodeStubInterface) sc.Response {

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"ticket\",\"IsUsed\":true}}")

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//管理者查詢未使用餐券
func (s *SmartContract) queryNotUsedTicket(APIstub shim.ChaincodeStubInterface) sc.Response {

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"ticket\",\"IsUsed\":false}}")

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//商家查詢已使用餐券
func (s *SmartContract) queryStoreTicket(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	//   0
	// "storeName"
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	storeName := args[0]
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"ticket\",\"IsUsed\":true,\"Restaurant\":\"%s\"}}", storeName)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

//學生查詢餐券消費紀錄
func (s *SmartContract) queryConsumptionRecords(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	//   0
	// "stuId"
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	stuId := args[0]
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"ticket\",\"IsUsed\":true,\"Owner\":\"%s\"}}", stuId)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

func getQueryResultForQueryString(APIstub shim.ChaincodeStubInterface, queryString string) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, err := APIstub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", buffer.String())

	return buffer.Bytes(), nil
}

//The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
