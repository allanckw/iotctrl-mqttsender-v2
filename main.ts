function connect() {
    if (ESP8266_IoT.wifiState(true)) {
        ESP8266_IoT.setMQTT(ESP8266_IoT.SchemeList.TCP, "ACSQ", "", "", "")
        ESP8266_IoT.connectMQTT("broker.hivemq.com", 1883, false)
    }
    
}

input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    
    if (calibrated == true) {
        radio.sendValue("Start", 1)
        started = true
        repCounter = 1
    } else if (repTotalCount > 0) {
        radio.sendValue("Cali", 1)
        startCaliTimer = true
    }
    
})
radio.onReceivedString(function on_received_string(receivedString: string) {
    let transmissionMsg: string;
    
    idx2 = -1
    sn2 = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    //  Index ENUM: LH, RH, W, LL, RL,
    let k = 0
    while (k < Nodes_Register.length) {
        if (Nodes_Register[k] == sn2) {
            idx2 = k
        }
        
        k = k + 1
    }
    Nodes_RepCounter_Register[idx2] = repCounter
    if (idx2 != -1) {
        transmissionMsg = "E=" + convertToText(exerciseNo) + "&" + receivedString
        publishMsg(transmissionMsg, idx2)
    }
    
})
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    
    idx = -1
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
        idx = -1
    }
    
    if (init == true) {
        Nodes_Register[idx] = value
        Nodes_RepCounter_Register[idx] = 1
    }
    
})
function publishMsg(recvMsg: string, topic: number) {
    
    if (sendCount > 15) {
        ESP8266_IoT.breakMQTT()
        connect()
        pause(500)
        sendCount = 1
    } else {
        sendCount += 1
        pause(500)
        basic.showNumber(sendCount)
    }
    
    pause(500)
    if (ESP8266_IoT.isMqttBrokerConnected() == true) {
        ESP8266_IoT.publishMqttMessage(recvMsg, Nodes_Topic_Register[topic], ESP8266_IoT.QosList.Qos1)
        basic.showString("t")
    } else {
        // Transmit
        while (ESP8266_IoT.isMqttBrokerConnected() == false) {
            if (ESP8266_IoT.isMqttBrokerConnected() == true) {
                ESP8266_IoT.publishMqttMessage(recvMsg, Nodes_Topic_Register[topic], ESP8266_IoT.QosList.Qos1)
                basic.showString("t")
                // Transmit
                pause(500)
            }
            
        }
    }
    
}

let calibrationTimer = 0
let sendCount = 0
let nextRepCount = 0
let init = false
let sn = 0
let sn2 = 0
let idx = 0
let idx2 = 0
let exerciseNo = 0
let startCaliTimer = false
let repCounter = 0
let started = false
let repTotalCount = 0
let calibrated = false
let Nodes_Topic_Register : string[] = []
let Nodes_RepCounter_Register : number[] = []
let Nodes_Register : number[] = []
radio.setGroup(98)
Nodes_Register = [-1, -1, -1, -1, -1]
Nodes_RepCounter_Register = [0, 0, 0, 0, 0]
Nodes_Topic_Register = ["IoTRHB/LH", "IoTRHB/RH", "IoTRHB/W", "IoTRHB/LL", "IoTRHB/RL"]
ESP8266_IoT.initWIFI(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200)
// ESP8266_IoT.connect_wifi("AlanderC", "@landeR$q")
ESP8266_IoT.connectWifi("AoS_Guest", "9ue$$ing-IoT-Net")
// Rdy to Calibrate
basic.forever(function on_forever() {
    let i: number;
    
    if (sendCount == 0) {
        sendCount = 1
        connect()
    }
    
    if (ESP8266_IoT.isMqttBrokerConnected()) {
        basic.showString("C")
    }
    
    // Connected
    //  Index ENUM: LH, RH, W, LL, RL
    if (calibrated == false && Nodes_Register[0] >= 0 && Nodes_Register[1] >= 0 && Nodes_Register[2] >= 0 && Nodes_Register[3] >= 0 && Nodes_Register[4] >= 0) {
        calibrated = true
        startCaliTimer = false
        init = false
    } else if (startCaliTimer == true && calibrated == false) {
        pause(1000)
        if (calibrationTimer < 10) {
            calibrationTimer = calibrationTimer + 1
        } else {
            i = 0
            while (i < Nodes_Register.length) {
                if (Nodes_Register[i] == -1) {
                    Nodes_Register[i] = 0
                }
                
                i = i + 1
            }
            calibrated = true
        }
        
    } else if (calibrated == true && started == true) {
        basic.showString("S")
    } else if (calibrated == true && started == false) {
        // Started
        basic.showString("I")
    } else if (repTotalCount > 0) {
        // Initialized
        basic.showString("R")
    }
    
})
