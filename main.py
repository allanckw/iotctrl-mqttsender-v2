def connect():
    ESP8266_IoT.set_mqtt(ESP8266_IoT.SchemeList.TCP, "ACSQ", "", "", "")
    if ESP8266_IoT.wifi_state(True):
        ESP8266_IoT.connect_mqtt("broker.hivemq.com", 1883, False)

def on_button_pressed_ab():
    global started,  startCaliTimer
    if calibrated == True:
        radio.send_value("Start", 1)
        started = True
    elif repTotalCount > 0:
        radio.send_value("Cali", 1)
        startCaliTimer = True
input.on_button_pressed(Button.AB, on_button_pressed_ab)

def on_received_string(receivedString): 
    global idx2, sn2, Nodes_RepCounter_Register, Nodes_Register
    idx2 = -1
    sn2 = radio.received_packet(RadioPacketProperty.SERIAL_NUMBER)
    # Index ENUM: LH, RH, W, LL, RL,
    k = 0
    while k < 5:
        if Nodes_Register[k] == sn2:
            idx2 = k
        k = k + 1

    if idx2 != -1:
        elapsedTime = convert_to_text(Math.round(radio.received_packet(RadioPacketProperty.TIME) / 1000))
        transmissionMsg = "E=" + convert_to_text(exerciseNo) + "&RT=" + convert_to_text(elapsedTime)  + "&RC=" + Nodes_RepCounter_Register[idx2] + "&" + receivedString

        if receivedString.index_of("T=") >= 0 or receivedString.index_of("b") >= 0:
            publishMsg(transmissionMsg, idx2, ESP8266_IoT.QosList.QOS2)
        else:
            publishMsg(transmissionMsg, idx2, ESP8266_IoT.QosList.QOS0)

radio.on_received_string(on_received_string)

def on_received_value(name, value):
    global idx, sn, repTotalCount, exerciseNo, pulseThreshold, Nodes_RepCounter_Register, Nodes_Register
    sn = radio.received_packet(RadioPacketProperty.SERIAL_NUMBER)
    j = 0
    idx = -1

    while j < 5:
        if Nodes_Register[j] == sn:
            idx = j
        j = j + 1

    # Index ENUM: LH, RH, W, LL, RL,
    if name == "RepC":
        Nodes_RepCounter_Register[idx] = value
        
    elif name == "Reps":
        repTotalCount = value

    elif name == "PR_Out":
        if value > pulseThreshold:
            music.play_tone(880, music.beat(BeatFraction.HALF))
        
        transmissionMsg = "E=" + convert_to_text(exerciseNo) + "&RC=" + Nodes_RepCounter_Register[2] + "&PR=" + convert_to_text(value)
        publishMsg(transmissionMsg, 2, ESP8266_IoT.QosList.QOS0)

    elif name == "Fall":
        transmissionMsg = "E=" + convert_to_text(exerciseNo) + "&RC=" + Nodes_RepCounter_Register[2] + "&Fall=1"
        publishMsg(transmissionMsg, 2, ESP8266_IoT.QosList.QOS2)

    elif name == "PR":
        pulseThreshold = value

    elif name == "Ex":
        exerciseNo = value

    elif name == "LH":
        idx = 0

    elif name == "RH":
        idx = 1

    elif name == "W":
        idx = 2

    elif name == "LL":
        idx = 3
        
    elif name == "RL":
        idx = 4

    if idx >= 0:
        Nodes_Register[idx] = value
        

radio.on_received_value(on_received_value)

def publishMsg(recvMsg: str, topic: number, qos : ESP8266_IoT.QosList):
    global sendCount
    if sendCount > 10:
        ESP8266_IoT.break_mqtt()
        sendCount = 1
        connect()
    else:
        sendCount += 1
        #basic.show_number(sendCount)

    if ESP8266_IoT.is_mqtt_broker_connected() == True:
        basic.show_string("tx") #Transmit
        ESP8266_IoT.publish_mqtt_message(recvMsg,
                Nodes_Topic_Register[topic],
                qos)
calibrationTimer = 0
sendCount = 0
sn = 0
pulseThreshold = 0
sn2 = 0
idx = 0
idx2 = 0
exerciseNo = 0
startCaliTimer = False
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
ESP8266_IoT.connect_wifi("AlanderC", "@land3R$qq")
#ESP8266_IoT.connect_wifi("AoS_Guest", "9ue$$ing-IoT-Net")


def on_forever():
    global sendCount, calibrated, startCaliTimer,  calibrationTimer
   
    if sendCount == 0:
        sendCount = 1
        connect()
        
    if ESP8266_IoT.is_mqtt_broker_connected():
        basic.show_string("C") #Connected
    

    # Index ENUM: LH, RH, W, LL, RL
    if calibrated == False and Nodes_Register[0] >= 0 and Nodes_Register[1] >= 0 and Nodes_Register[2] >= 0 and Nodes_Register[3] >= 0 and Nodes_Register[4] >= 0:
        calibrated = True
        startCaliTimer = False

    elif startCaliTimer == True and calibrated == False:
        pause(1000)
        if calibrationTimer < 10:
            calibrationTimer = calibrationTimer + 1
        else:
            i = 0
            while i < 5:
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
