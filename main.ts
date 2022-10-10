input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    
    if (calibrated == true) {
        radio.sendValue("Start", 1)
        started = true
        repCounter = 1
    } else if (repTotalCount > 0) {
        radio.sendValue("Cali", 1)
    }
    
})
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    let proceedToNextRep: boolean;
    
    let idx = -1
    let sn = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    //  Index ENUM: LH, RH, W, LL, RL,
    if (name == "Reps") {
        repTotalCount = value
    } else if (name == "PR") {
        
    } else if (name == "Ex") {
        exerciseNo = value
    } else if (name == "LH") {
        idx = 0
        init = true
    } else if (name == "RH") {
        idx = 1
        init = true
    } else if (name == "W") {
        idx = 2
        init = true
    } else if (name == "LL") {
        idx = 3
        init = true
    } else if (name == "RL") {
        idx = 4
        init = true
    } else if (name == "RC") {
        basic.showNumber(repCounter)
        basic.showNumber(value)
        if (value <= repTotalCount) {
            idx = -1
            if (sn == Nodes_Register[0]) {
                idx = 0
            } else if (sn == Nodes_Register[1]) {
                idx = 1
            } else if (sn == Nodes_Register[2]) {
                idx = 2
            } else if (sn == Nodes_Register[3]) {
                idx = 3
            } else if (sn == Nodes_Register[4]) {
                idx = 4
            }
            
            Nodes_RepCounter_Register[idx] = value
            nextRepCount = repCounter + 1
            proceedToNextRep = true
            for (let counter of Nodes_RepCounter_Register) {
                if (proceedToNextRep == true && counter == 0) {
                    //  0 meaning no input -> Ignore
                    proceedToNextRep = true
                } else if (proceedToNextRep == true && counter < nextRepCount) {
                    proceedToNextRep = false
                }
                
            }
            //  if all nodes says ok to proceed, go to next rep
            if (proceedToNextRep == true) {
                repCounter = Nodes_RepCounter_Register[0]
                if (nextRepCount <= repTotalCount) {
                    radio.sendValue("RepNo", repCounter)
                }
                
            }
            
        } else {
            radio.sendValue("End", 1)
        }
        
    }
    
    if (init == true) {
        Nodes_Register[idx] = value
        Nodes_RepCounter_Register[idx] = 1
    }
    
})
radio.onReceivedString(function on_received_string(receivedString: string) {
    
    let idx = -1
    let sn = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    //  Index ENUM: LH, RH, W, LL, RL,
    if (sn == Nodes_Register[0]) {
        idx = 0
    } else if (sn == Nodes_Register[1]) {
        idx = 1
    } else if (sn == Nodes_Register[2]) {
        idx = 2
    } else if (sn == Nodes_Register[3]) {
        idx = 3
    } else if (sn == Nodes_Register[4]) {
        idx = 4
    }
    
    if (idx != -1 && started == true) {
        publishMsg(exerciseNo, repCounter, receivedString, Nodes_Topic_Register[idx])
    }
    
})
function publishMsg(recvExNo2: number, recvRepNo2: number, recvMsg: string, topic2: string) {
    
    transmissionMsg = "E=" + ("" + recvExNo2) + "&R=" + ("" + recvRepNo2) + "&" + recvMsg
    if (ESP8266_IoT.isMqttBrokerConnected()) {
        ESP8266_IoT.publishMqttMessage(transmissionMsg, topic2, ESP8266_IoT.QosList.Qos0)
        pause(1000)
        // dont spam encounter 021
        basic.showString("T")
    }
    
}

let transmissionMsg = ""
let started = false
let init = false
let exerciseNo = 0
let nextRepCount = 0
let repTotalCount = 0
let repCounter = 0
let Nodes_RepCounter_Register : number[] = []
let Nodes_Register : number[] = []
let Nodes_Topic_Register : string[] = []
radio.setGroup(98)
let calibrated = false
Nodes_Register = [0, 0, 0, 0, 0]
Nodes_RepCounter_Register = [0, 0, 0, 0, 0]
Nodes_Topic_Register = ["IoTRHB/LH", "IoTRHB/RH", "IoTRHB/W", "IoTRHB/LL", "IoTRHB/RL"]
ESP8266_IoT.initWIFI(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200)
ESP8266_IoT.connectWifi("AlanderC", "@landeR$q")
if (ESP8266_IoT.wifiState(true)) {
    ESP8266_IoT.setMQTT(ESP8266_IoT.SchemeList.TCP, "ACSQ", "", "", "")
    ESP8266_IoT.connectMQTT("broker.hivemq.com", 1883, true)
}

basic.forever(function on_forever() {
    
    //  Index ENUM: LH, RH, W, LL, RL
    if (calibrated == false && Nodes_Register[0] > 0 && Nodes_Register[1] > 0 && Nodes_Register[2] > 0 && Nodes_Register[3] > 0 && Nodes_Register[4] > 0) {
        calibrated = true
        init = false
    }
    
    if (started == true) {
        basic.showNumber(repCounter)
    } else if (calibrated == true) {
        basic.showString("S")
    } else if (repTotalCount > 0) {
        basic.showString("R")
    }
    
    if (ESP8266_IoT.wifiState(true)) {
        if (ESP8266_IoT.isMqttBrokerConnected()) {
            basic.showString("C")
        }
        
    }
    
})
