def connect():
    if ESP8266_IoT.wifi_state(True):
        ESP8266_IoT.set_mqtt(ESP8266_IoT.SchemeList.TCP, "ACSQ", "", "", "")
        ESP8266_IoT.connect_mqtt("broker.hivemq.com", 1883, False)

def on_button_pressed_ab():
    global started, repCounter, startCaliTimer
    if calibrated == True:
        radio.send_value("Start", 1)
        started = True
        repCounter = 1
    elif repTotalCount > 0:
        radio.send_value("Cali", 1)
        startCaliTimer = True
input.on_button_pressed(Button.AB, on_button_pressed_ab)

def on_received_string(receivedString):
    global idx2, sn2, started
    idx2 = -1
    sn2 = radio.received_packet(RadioPacketProperty.SERIAL_NUMBER)
    # Index ENUM: LH, RH, W, LL, RL,
    k = 0
    while k < len(Nodes_Register):
        if Nodes_Register[k] == sn2:
            idx2 = k
        k = k + 1
    Nodes_RepCounter_Register[idx2] = repCounter
    if idx2 != -1:
        transmissionMsg = "E=" + convert_to_text(exerciseNo) + "&" + receivedString
        publishMsg(transmissionMsg, idx2)
radio.on_received_string(on_received_string)

def on_received_value(name, value):
    global idx, sn, repTotalCount, exerciseNo, init, nextRepCount, repCounter
    idx = -1
    # Index ENUM: LH, RH, W, LL, RL,
    if name == "Reps":
        repTotalCount = value
    elif name == "PR":
        pass
    elif name == "Ex":
        exerciseNo = value
    elif name == "LH":
        idx = 0
        init = True
    elif name == "RH":
        idx = 1
        init = True
    elif name == "W":
        idx = 2
        init = True
    elif name == "LL":
        idx = 3
        init = True
    elif name == "RL":
        idx = 4
        init = True
    elif name == "RC":
        idx = -1

    if init == True:
        Nodes_Register[idx] = value
        Nodes_RepCounter_Register[idx] = 1

radio.on_received_value(on_received_value)

def publishMsg(recvMsg: str, topic: number):
    global sendCount
    if sendCount > 15:
        ESP8266_IoT.break_mqtt()
        connect()
        pause(500)
        sendCount = 1
    else:
        sendCount += 1
        pause(500)
        basic.show_number(sendCount)
    pause(500)
    
    if ESP8266_IoT.is_mqtt_broker_connected() == True:
        ESP8266_IoT.publish_mqtt_message(recvMsg,
                Nodes_Topic_Register[topic],
                ESP8266_IoT.QosList.QOS1)
        basic.show_string("t") #Transmit
    else:
        while ESP8266_IoT.is_mqtt_broker_connected() == False:
            if ESP8266_IoT.is_mqtt_broker_connected() == True:
                    ESP8266_IoT.publish_mqtt_message(recvMsg,
                            Nodes_Topic_Register[topic],
                            ESP8266_IoT.QosList.QOS1)
                    basic.show_string("t") #Transmit
                    pause(500)
    
calibrationTimer = 0
sendCount = 0
nextRepCount = 0
init = False
sn = 0


sn2 = 0
idx = 0
idx2 = 0
exerciseNo = 0
startCaliTimer = False
repCounter = 0
started = False
repTotalCount = 0
calibrated = False
Nodes_Topic_Register: List[str] = []
Nodes_RepCounter_Register: List[number] = []
Nodes_Register: List[number] = []

radio.set_group(98)
Nodes_Register = [-1, -1, -1, -1, -1]
Nodes_RepCounter_Register = [0, 0, 0, 0, 0]
Nodes_Topic_Register = ["IoTRHB/LH",
    "IoTRHB/RH",
    "IoTRHB/W",
    "IoTRHB/LL",
    "IoTRHB/RL"]
ESP8266_IoT.init_wifi(SerialPin.P8, SerialPin.P12, BaudRate.BAUD_RATE115200)
#ESP8266_IoT.connect_wifi("AlanderC", "@landeR$q")
ESP8266_IoT.connect_wifi("AoS_Guest", "9ue$$ing-IoT-Net")


def on_forever():
    global sendCount, calibrated, startCaliTimer, init, calibrationTimer
    if sendCount == 0:
        sendCount = 1
        connect()
    if ESP8266_IoT.is_mqtt_broker_connected():
        basic.show_string("C") #Connected

    # Index ENUM: LH, RH, W, LL, RL
    if calibrated == False and Nodes_Register[0] >= 0 and Nodes_Register[1] >= 0 and Nodes_Register[2] >= 0 and Nodes_Register[3] >= 0 and Nodes_Register[4] >= 0:
        calibrated = True
        startCaliTimer = False
        init = False
    elif startCaliTimer == True and calibrated == False:
        pause(1000)
        if calibrationTimer < 10:
            calibrationTimer = calibrationTimer + 1
        else:
            i = 0
            while i < len(Nodes_Register):
                if Nodes_Register[i] == -1:
                    Nodes_Register[i] = 0
                i = i + 1
            calibrated = True
    elif calibrated == True and started == True:
        basic.show_string("S") #Started
    elif calibrated == True and started == False:

        basic.show_string("I") #Initialized
    elif repTotalCount > 0:

        basic.show_string("R") #Rdy to Calibrate
basic.forever(on_forever)
