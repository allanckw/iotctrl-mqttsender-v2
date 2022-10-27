function connect() {
    ESP8266_IoT.setMQTT(ESP8266_IoT.SchemeList.TCP, "ACSQ", "", "", "")
    if (ESP8266_IoT.wifiState(true)) {
        ESP8266_IoT.connectMQTT("broker.hivemq.com", 1883, false)
    }
    
}

input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    
    if (calibrated == true) {
        radio.sendValue("Start", 1)
        started = true
    } else if (repTotalCount > 0) {
        radio.sendValue("Cali", 1)
        startCaliTimer = true
    }
    
})
radio.onReceivedString(function on_received_string(receivedString: string) {
    let elapsedTime: string;
    let transmissionMsg: string;
    
    idx2 = -1
    sn2 = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    //  Index ENUM: LH, RH, W, LL, RL,
    let k = 0
    while (k < 5) {
        if (Nodes_Register[k] == sn2) {
            idx2 = k
        }
        
        k = k + 1
    }
    if (idx2 != -1) {
        elapsedTime = convertToText(Math.round(radio.receivedPacket(RadioPacketProperty.Time) / 1000))
        transmissionMsg = "E=" + convertToText(exerciseNo) + "&RT=" + convertToText(elapsedTime) + "&RC=" + Nodes_RepCounter_Register[idx2] + "&" + receivedString
        if (receivedString.indexOf("T=") >= 0 || receivedString.indexOf("b") >= 0) {
            publishMsg(transmissionMsg, idx2, ESP8266_IoT.QosList.Qos2)
        } else {
            publishMsg(transmissionMsg, idx2, ESP8266_IoT.QosList.Qos0)
        }
        
    }
    
})
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    let transmissionMsg: string;
    
    sn = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    let j = 0
    idx = -1
    init = false
    while (j < 5) {
        if (Nodes_Register[j] == sn) {
            idx = j
        }
        
        j = j + 1
    }
    //  Index ENUM: LH, RH, W, LL, RL,
    if (name == "RepC") {
        Nodes_RepCounter_Register[idx] = value
    } else if (name == "Reps") {
        repTotalCount = value
    } else if (name == "PR_Out") {
        if (value > pulseThreshold) {
            music.playTone(880, music.beat(BeatFraction.Half))
        }
        
        transmissionMsg = "E=" + convertToText(exerciseNo) + "&RC=" + Nodes_RepCounter_Register[2] + "&PR=" + convertToText(value)
        publishMsg(transmissionMsg, 2, ESP8266_IoT.QosList.Qos0)
    } else if (name == "PR") {
        pulseThreshold = value
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
    }
    
    if (init == true) {
        Nodes_Register[idx] = value
    }
    
})
function publishMsg(recvMsg: string, topic: number, qos: number) {
    
    if (sendCount > 10) {
        ESP8266_IoT.breakMQTT()
        sendCount = 1
        connect()
    } else {
        sendCount += 1
        basic.showNumber(sendCount)
    }
    
    if (ESP8266_IoT.isMqttBrokerConnected() == true) {
        basic.showString("t")
        // Transmit
        ESP8266_IoT.publishMqttMessage(recvMsg, Nodes_Topic_Register[topic], qos)
    }
    
}

let calibrationTimer = 0
let sendCount = 0
let init = false
let sn = 0
let pulseThreshold = 0
let sn2 = 0
let idx = 0
let idx2 = 0
let exerciseNo = 0
let startCaliTimer = false
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
ESP8266_IoT.connectWifi("AlanderC", "@land3R$qq")
// ESP8266_IoT.connect_wifi("AoS_Guest", "9ue$$ing-IoT-Net")
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
            while (i < 5) {
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
